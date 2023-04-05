import { computed, ref } from '@vue/composition-api';
import { uniqBy } from 'lodash-es';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import { DryRunError } from '@aeternity/aepp-sdk';
// aeternity/ga-multisig-contract#02831f1fe0818d4b5c6edb342aea252479df028b
import SimpleGAMultiSigAci from '../lib/contracts/SimpleGAMultiSigACI.json';
import {
  MAGNITUDE,
  SUPPORTED_MULTISIG_CONTRACT_VERSION,
  fetchJson,
  handleUnknownError,
  convertToken,
  getLocalStorageItem,
  setLocalStorageItem,
} from '../popup/utils';
import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import type {
  IAccount,
  IDefaultComposableOptions,
  INetwork,
  IMultisigAccount,
  IMultisigConsensus,
  IMultisigAccountResponse,
} from '../types';
import { useSdk } from './sdk';

const POLLING_INTERVAL = 7000;

const LOCAL_STORAGE_MULTISIG_KEY = 'multisig';
const LOCAL_STORAGE_MULTISIG_PENDING_KEY = 'multisig-pending';

function storeMultisigAccounts(
  multisigAccounts: IMultisigAccount[],
  networkId: string,
  isPending = false,
) {
  return setLocalStorageItem(
    [isPending ? LOCAL_STORAGE_MULTISIG_PENDING_KEY : LOCAL_STORAGE_MULTISIG_KEY, networkId],
    multisigAccounts,
  );
}

function getStoredMultisigAccounts(networkId: string, isPending = false): IMultisigAccount[] {
  return getLocalStorageItem(
    [isPending ? LOCAL_STORAGE_MULTISIG_PENDING_KEY : LOCAL_STORAGE_MULTISIG_KEY, networkId],
  ) || [];
}

const multisigAccounts = ref<IMultisigAccount[]>([]);
const pendingMultisigAccounts = ref<IMultisigAccount[]>([]);
const activeMultisigAccountId = ref('');
const activeMultisigNetworkId = ref('');
const isAdditionalInfoNeeded = ref(false);

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

export function useMultisigAccounts({ store }: IDefaultComposableOptions) {
  const { getSdk } = useSdk({ store });

  const accounts = computed<IAccount[]>(() => store.getters.accounts);
  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);
  const allMultisigAccounts = computed<IMultisigAccount[]>(
    () => [...multisigAccounts.value, ...pendingMultisigAccounts.value],
  );

  const activeMultisigAccount = computed<IMultisigAccount | undefined>(
    () => allMultisigAccounts.value
      .find((account) => account.gaAccountId === activeMultisigAccountId.value),
  );

  if (
    !multisigAccounts.value.length
    || activeMultisigNetworkId.value !== activeNetwork.value.networkId
  ) {
    multisigAccounts.value = getStoredMultisigAccounts(activeNetwork.value.networkId);
    pendingMultisigAccounts.value = getStoredMultisigAccounts(activeNetwork.value.networkId, true);
  }

  if (
    !activeMultisigAccountId.value
    || activeMultisigNetworkId.value !== activeNetwork.value.networkId
  ) {
    activeMultisigAccountId.value = getLocalStorageItem<string>([
      LOCAL_STORAGE_MULTISIG_KEY,
      'active',
      activeNetwork.value.networkId,
    ]) || '';
    activeMultisigNetworkId.value = activeNetwork.value.networkId;
  }

  function setActiveMultisigAccountId(gaAccountId: string) {
    if (gaAccountId && allMultisigAccounts.value.some((acc) => acc.gaAccountId === gaAccountId)) {
      activeMultisigAccountId.value = gaAccountId;
      activeMultisigNetworkId.value = activeNetwork.value.networkId;

      setLocalStorageItem([
        LOCAL_STORAGE_MULTISIG_KEY,
        'active',
        activeNetwork.value.networkId,
      ], gaAccountId);
    }
  }

  function addPendingMultisigAccount(multisigAccount: IMultisigAccount) {
    pendingMultisigAccounts.value.push(multisigAccount);
    storeMultisigAccounts(pendingMultisigAccounts.value, activeNetwork.value.networkId, true);
  }

  function addTransactionToPendingMultisigAccount(txHash: string, gaAccountId: string) {
    pendingMultisigAccounts.value = pendingMultisigAccounts.value.map(
      (account) => account.gaAccountId === gaAccountId
        ? {
          ...account,
          txHash,
          hasPendingTransaction: true,
        }
        : account,
    );
    storeMultisigAccounts(pendingMultisigAccounts.value, activeNetwork.value.networkId, true);
  }

  function removeDuplicatesFromPendingAccounts() {
    if (pendingMultisigAccounts.value?.length) {
      const newPendingMultisigAccounts = pendingMultisigAccounts.value.filter(
        (pendingAccount) => !multisigAccounts.value.find(
          (account) => account.gaAccountId === pendingAccount.gaAccountId,
        ),
      );
      pendingMultisigAccounts.value = newPendingMultisigAccounts;
      storeMultisigAccounts(newPendingMultisigAccounts, activeNetwork.value.networkId, true);
    }
  }

  /**
   * Refresh the list of the multisig accounts.
   */
  async function updateMultisigAccounts() {
    const sdk = await getSdk();

    /**
     * Establish the list of multisig accounts used by the regular accounts
     */
    let rawMultisigData: IMultisigAccountResponse[] = [];
    try {
      await Promise.all(accounts.value.map(async ({ address }) => rawMultisigData.push(
        ...(await fetchJson(`${activeNetwork.value.multisigBackendUrl}/${address}`)),
      )));
    } catch {
      // TODO: handle failure in multisig loading
      // eslint-disable-next-line no-console
      console.log('failed to fetch multisigAccounts');
    }

    rawMultisigData = uniqBy(rawMultisigData, 'contractId');

    function isSignatureRequested(account: IMultisigAccount) {
      return (
        account.hasPendingTransaction
        && account.signers.some((signer: string) => (
          accounts.value.map(({ address }) => address).includes(signer)
          && !account.confirmedBy.includes(signer)
        ))
      );
    }

    /**
     * Get extended data for all multisig accounts
     */
    const result: IMultisigAccount[] = (await Promise.all(
      rawMultisigData
        .filter(({ version }) => version === SUPPORTED_MULTISIG_CONTRACT_VERSION)
        .map(async ({
          contractId,
          gaAccountId,
          ...otherMultisigData
        }): Promise<IMultisigAccount> => {
          try {
            const contractInstance = await sdk.getContractInstance({
              aci: SimpleGAMultiSigAci,
              contractAddress: contractId,
            });

            const currentAccount = multisigAccounts.value
              .find((account) => account.contractId === contractId);

            const [
              nonce,
              signers,
              consensusResult,
              balance,
            ] = await Promise.all([
              (
                (isAdditionalInfoNeeded.value && gaAccountId === activeMultisigAccountId.value)
                || currentAccount?.nonce == null
              )
                ? contractInstance.methods.get_nonce()
                : { decodedResult: currentAccount.nonce },
              currentAccount?.signers
                ? { decodedResult: currentAccount.signers }
                : contractInstance.methods.get_signers(),
              contractInstance.methods.get_consensus_info(),
              gaAccountId ? sdk.balance(gaAccountId) : 0,
            ]);

            const decodedConsensus = consensusResult.decodedResult;
            const txHash = decodedConsensus.tx_hash as Uint8Array;
            const consensus: IMultisigConsensus = camelCaseKeysDeep(decodedConsensus);

            consensus.expirationHeight = Number(consensus.expirationHeight);
            consensus.confirmationsRequired = Number(consensus.confirmationsRequired);

            const hasPendingTransaction = !!txHash && !consensus.expired;

            return {
              ...consensus,
              ...otherMultisigData,
              contractId,
              gaAccountId,
              nonce: Number(nonce.decodedResult),
              signers: signers.decodedResult,
              balance: convertToken(balance, -MAGNITUDE),
              hasPendingTransaction,
              txHash: txHash ? Buffer.from(txHash).toString('hex') : undefined,
            };
          } catch (error) {
            /**
             * Node might throw nonce mismatch error, skip the current account update
             * return the existing data and account details will be updated in the next poll.
             */
            if (!(error instanceof DryRunError)) {
              handleUnknownError(error);
            }
            return multisigAccounts.value.find(
              (account) => account.contractId === contractId,
            ) as IMultisigAccount;
          }
        }),
    ))
      .filter(Boolean)
      .sort((a, b) => {
        if (a.hasPendingTransaction && !b.hasPendingTransaction) return -1;
        if (!a.hasPendingTransaction && b.hasPendingTransaction) return 1;
        if (isSignatureRequested(a) && !isSignatureRequested(b)) return -1;
        if (!isSignatureRequested(a) && isSignatureRequested(b)) return 1;
        if (
          b.confirmedBy.length
          && a.confirmedBy.length
          && b.confirmedBy.length !== a.confirmedBy.length
        ) {
          return b.confirmedBy.length - a.confirmedBy.length;
        }
        if (!b.balance.minus(a.balance).isZero()) {
          return b.balance.minus(a.balance).toNumber();
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    multisigAccounts.value = result;

    if (
      !activeMultisigAccountId.value
      || activeMultisigNetworkId.value !== activeNetwork.value.networkId
    ) {
      setActiveMultisigAccountId(result[0]?.gaAccountId);
    }

    storeMultisigAccounts(result, activeNetwork.value.networkId);
    removeDuplicatesFromPendingAccounts();
  }

  function fetchAdditionalInfo() {
    isAdditionalInfoNeeded.value = true;
    updateMultisigAccounts();
  }

  function stopFetchingAdditionalInfo() {
    isAdditionalInfoNeeded.value = false;
  }

  function getMultisigAccountByContractId(contractId: string) {
    return allMultisigAccounts.value.find((acc) => acc.contractId === contractId);
  }

  initPollingWatcher(() => updateMultisigAccounts());

  return {
    multisigAccounts: allMultisigAccounts,
    pendingMultisigAccounts,
    isAdditionalInfoNeeded,
    activeMultisigAccountId,
    activeMultisigAccount,
    addTransactionToPendingMultisigAccount,
    fetchAdditionalInfo,
    setActiveMultisigAccountId,
    stopFetchingAdditionalInfo,
    updateMultisigAccounts,
    getMultisigAccountByContractId,
    addPendingMultisigAccount,
  };
}
