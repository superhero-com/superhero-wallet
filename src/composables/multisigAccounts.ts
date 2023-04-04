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
} from '../popup/utils';
import { createNetworkWatcher, createPollingBasedOnMountedComponents, createStorageRef } from './composablesHelpers';
import type {
  IDefaultComposableOptions,
  INetwork,
  IMultisigAccount,
  IMultisigConsensus,
  IMultisigAccountResponse,
} from '../types';
import { useSdk } from './sdk';
import { useAccounts } from './accounts';

const POLLING_INTERVAL = 7000;

const LOCAL_STORAGE_MULTISIG_KEY = 'multisig';
const LOCAL_STORAGE_MULTISIG_PENDING_KEY = 'multisig-pending';

const { useStorageRef: useMultisigAccountsRef } = createStorageRef<IMultisigAccount[]>(
  [],
  LOCAL_STORAGE_MULTISIG_KEY,
  { scopedToNetwork: true },
);
const { useStorageRef: useMultisigPendingAccountsRef } = createStorageRef<IMultisigAccount[]>(
  [],
  LOCAL_STORAGE_MULTISIG_PENDING_KEY,
  { scopedToNetwork: true },
);
const { useStorageRef: useMultisigAccountIdRef } = createStorageRef<string>(
  '',
  [LOCAL_STORAGE_MULTISIG_KEY, 'active'],
  { scopedToNetwork: true },
);

const isAdditionalInfoNeeded = ref(false);

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);
const { onNetworkChange } = createNetworkWatcher();

export function useMultisigAccounts({ store }: IDefaultComposableOptions) {
  const { getSdk } = useSdk({ store });
  const { accounts } = useAccounts({ store });

  const multisigAccounts = useMultisigAccountsRef(store);
  const pendingMultisigAccounts = useMultisigPendingAccountsRef(store);
  const activeMultisigAccountId = useMultisigAccountIdRef(store);

  const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);
  const allMultisigAccounts = computed<IMultisigAccount[]>(
    () => [...multisigAccounts.value, ...pendingMultisigAccounts.value],
  );

  const activeMultisigAccount = computed<IMultisigAccount | undefined>(
    () => allMultisigAccounts.value
      .find((account) => account.gaAccountId === activeMultisigAccountId.value),
  );

  function setActiveMultisigAccountId(gaAccountId: string) {
    if (gaAccountId && allMultisigAccounts.value.some((acc) => acc.gaAccountId === gaAccountId)) {
      activeMultisigAccountId.value = gaAccountId;
    }
  }

  function addPendingMultisigAccount(multisigAccount: IMultisigAccount) {
    pendingMultisigAccounts.value.push(multisigAccount);
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
  }

  function removeDuplicatesFromPendingAccounts() {
    if (pendingMultisigAccounts.value?.length) {
      const newPendingMultisigAccounts = pendingMultisigAccounts.value.filter(
        (pendingAccount) => !multisigAccounts.value.find(
          (account) => account.gaAccountId === pendingAccount.gaAccountId,
        ),
      );
      pendingMultisigAccounts.value = newPendingMultisigAccounts;
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

    if (!activeMultisigAccountId.value) {
      setActiveMultisigAccountId(result[0]?.gaAccountId);
    }

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

  onNetworkChange(store, () => {
    updateMultisigAccounts();
  });

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
