import { computed, ref } from 'vue';
import { uniqBy } from 'lodash-es';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import { DryRunError, Encoded } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';
// aeternity/ga-multisig-contract#02831f1fe0818d4b5c6edb342aea252479df028b
import type {
  IMultisigAccount,
  IMultisigConsensus,
  IMultisigAccountResponse,
} from '@/types';
import {
  fetchJson,
  getLocalStorageItem,
  handleUnknownError,
  setLocalStorageItem,
  toShiftedBigNumber,
} from '@/utils';

import SimpleGAMultiSigAci from '@/protocols/aeternity/aci/SimpleGAMultiSigACI.json';
import {
  AE_COIN_PRECISION,
  MULTISIG_SUPPORTED_CONTRACT_VERSION,
} from '@/protocols/aeternity/config';
import { AeScan } from '@/protocols/aeternity/libs/AeScan';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';

import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useAeSdk } from './aeSdk';
import { useAccounts } from './accounts';

export interface MultisigAccountsOptions {
  pollOnce?: boolean;
  pollingDisabled?: boolean;
}

let initialized = false;

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
const activeMultisigAccountId = ref<Encoded.AccountAddress>();
const activeMultisigNetworkId = ref('');
const isAdditionalInfoNeeded = ref(false);

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

export function useMultisigAccounts({
  pollOnce = false,
  pollingDisabled = false,
}: MultisigAccountsOptions = {}) {
  const { aeActiveNetworkPredefinedSettings, onNetworkChange } = useAeNetworkSettings();
  const { nodeNetworkId, getAeSdk } = useAeSdk();
  const { aeAccounts } = useAccounts();

  const allMultisigAccounts = computed<IMultisigAccount[]>(() => [
    ...multisigAccounts.value,
    ...pendingMultisigAccounts.value,
  ]);

  const activeMultisigAccount = computed<IMultisigAccount | undefined>(
    () => allMultisigAccounts.value
      .find((account) => account.gaAccountId === activeMultisigAccountId.value),
  );

  const activeMultisigAccountExplorerUrl = computed(
    () => (activeMultisigAccount.value)
      ? (new AeScan(aeActiveNetworkPredefinedSettings.value.explorerUrl!))
        .prepareUrlForHash(activeMultisigAccount.value.contractId)
      : null,
  );

  // Get initial data for currently used network
  (async () => {
    await getAeSdk(); // Ensure we are connected
    if (
      !multisigAccounts.value.length
      || activeMultisigNetworkId.value !== nodeNetworkId.value
    ) {
      multisigAccounts.value = getStoredMultisigAccounts(nodeNetworkId.value!);
      pendingMultisigAccounts.value = getStoredMultisigAccounts(nodeNetworkId.value!, true);
    }

    if (
      !activeMultisigAccountId.value
      || activeMultisigNetworkId.value !== nodeNetworkId.value
    ) {
      activeMultisigAccountId.value = getLocalStorageItem<Encoded.AccountAddress>([
        LOCAL_STORAGE_MULTISIG_KEY,
        'active',
        nodeNetworkId.value!,
      ]) || undefined;
      activeMultisigNetworkId.value = nodeNetworkId.value!;
    }
  })();

  function setActiveMultisigAccountId(gaAccountId: Encoded.AccountAddress) {
    if (gaAccountId && allMultisigAccounts.value.some((acc) => acc.gaAccountId === gaAccountId)) {
      activeMultisigAccountId.value = gaAccountId;
      activeMultisigNetworkId.value = nodeNetworkId.value!;

      setLocalStorageItem([
        LOCAL_STORAGE_MULTISIG_KEY,
        'active',
        nodeNetworkId.value!,
      ], gaAccountId);
    }
  }

  function addPendingMultisigAccount(multisigAccount: IMultisigAccount) {
    pendingMultisigAccounts.value.push(multisigAccount);
    storeMultisigAccounts(pendingMultisigAccounts.value, nodeNetworkId.value!, true);
  }

  function addTransactionToPendingMultisigAccount(
    txHash: string,
    gaAccountId: Encoded.AccountAddress,
    proposedBy: Encoded.AccountAddress,
  ) {
    pendingMultisigAccounts.value = pendingMultisigAccounts.value.map(
      (account) => account.gaAccountId === gaAccountId
        ? {
          ...account,
          txHash,
          hasPendingTransaction: true,
          proposedBy,
        }
        : account,
    );
    storeMultisigAccounts(pendingMultisigAccounts.value, nodeNetworkId.value!, true);
  }

  function removeDuplicatesFromPendingAccounts() {
    if (pendingMultisigAccounts.value?.length) {
      const newPendingMultisigAccounts = pendingMultisigAccounts.value.filter(
        (pendingAccount) => !multisigAccounts.value.find(
          (account) => account.gaAccountId === pendingAccount.gaAccountId,
        ),
      );
      pendingMultisigAccounts.value = newPendingMultisigAccounts;
      storeMultisigAccounts(newPendingMultisigAccounts, nodeNetworkId.value!, true);
    }
  }

  /**
   * Refresh the list of the multisig accounts.
   */
  async function updateMultisigAccounts() {
    const aeSdk = await getAeSdk();

    /**
     * Establish the list of multisig accounts used by the regular accounts
     */
    let rawMultisigData: IMultisigAccountResponse[] = [];
    try {
      await Promise.all(aeAccounts.value.map(async ({ address }) => rawMultisigData.push(
        ...(await fetchJson(`${aeActiveNetworkPredefinedSettings.value.multisigBackendUrl}/${address}`)),
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
        && account.signers.some((signer) => (
          aeAccounts.value.map(({ address }) => address).includes(signer)
          && !account.confirmedBy.includes(signer)
        ))
      );
    }

    /**
     * Get extended data for all multisig accounts
     */
    const result: IMultisigAccount[] = (await Promise.all(
      rawMultisigData
        .filter(({ version }) => version === MULTISIG_SUPPORTED_CONTRACT_VERSION)
        .map(async ({
          contractId,
          gaAccountId,
          ...otherMultisigData
        }): Promise<IMultisigAccount> => {
          try {
            const contractInstance = await aeSdk.initializeContract({
              aci: SimpleGAMultiSigAci,
              address: contractId,
            });

            const currentAccount = multisigAccounts.value
              .find((account) => account.contractId === contractId);

            const [
              nonce,
              signers,
              consensusResult,
              balance,
            ] = (await Promise.all([
              (
                (isAdditionalInfoNeeded.value && gaAccountId === activeMultisigAccountId.value)
                || currentAccount?.nonce == null
              )
                ? contractInstance.get_nonce()
                : { decodedResult: currentAccount.nonce },
              currentAccount?.signers
                ? { decodedResult: currentAccount.signers }
                : contractInstance.get_signers(),
              contractInstance.get_consensus_info(),
              gaAccountId ? aeSdk.getBalance(gaAccountId) : 0,
            ]));

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
              balance: toShiftedBigNumber(balance, -AE_COIN_PRECISION),
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

        if ((BigNumber.isBigNumber(a.balance) && BigNumber.isBigNumber(b.balance))
          && !b.balance?.minus(a.balance).isZero()
        ) {
          return b.balance.minus(a.balance).toNumber();
        }
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

    multisigAccounts.value = result;

    if (
      !activeMultisigAccountId.value
      || activeMultisigNetworkId.value !== nodeNetworkId.value
    ) {
      setActiveMultisigAccountId(result[0]?.gaAccountId);
    }

    storeMultisigAccounts(result, nodeNetworkId.value!);
    removeDuplicatesFromPendingAccounts();
  }

  function fetchAdditionalInfo() {
    isAdditionalInfoNeeded.value = true;
    updateMultisigAccounts();
  }

  function stopFetchingAdditionalInfo() {
    isAdditionalInfoNeeded.value = false;
  }

  function getMultisigAccountByContractId(contractId: Encoded.ContractAddress) {
    return allMultisigAccounts.value.find((acc) => acc.contractId === contractId);
  }

  if (!pollingDisabled) {
    if (pollOnce && !getStoredMultisigAccounts(nodeNetworkId.value!).length) {
      updateMultisigAccounts();
    } else if (!pollOnce) {
      initPollingWatcher(() => updateMultisigAccounts());
    }
  }

  if (!initialized) {
    initialized = true;

    onNetworkChange(() => {
      updateMultisigAccounts();
    });
  }

  return {
    multisigAccounts: allMultisigAccounts,
    pendingMultisigAccounts,
    isAdditionalInfoNeeded,
    activeMultisigAccountId,
    activeMultisigAccount,
    activeMultisigAccountExplorerUrl,
    addTransactionToPendingMultisigAccount,
    fetchAdditionalInfo,
    setActiveMultisigAccountId,
    stopFetchingAdditionalInfo,
    updateMultisigAccounts,
    getMultisigAccountByContractId,
    addPendingMultisigAccount,
  };
}
