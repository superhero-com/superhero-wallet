import { computed, ref } from 'vue';
import { chunk, uniqBy } from 'lodash-es';
import camelCaseKeysDeep from 'camelcase-keys-deep';
import { Contract, DryRunError, Encoded } from '@aeternity/aepp-sdk';
import BigNumber from 'bignumber.js';

import type {
  IMultisigAccount,
  IMultisigConsensus,
  IMultisigAccountResponse,
  AccountAddress,
  Dictionary,
} from '@/types';
import { STORAGE_KEYS } from '@/constants';
import {
  fetchJson,
  handleUnknownError,
  toShiftedBigNumber,
} from '@/utils';

// aeternity/ga-multisig-contract#02831f1fe0818d4b5c6edb342aea252479df028b
import SimpleGAMultiSigAci from '@/protocols/aeternity/aci/SimpleGAMultiSigACI.json';
import {
  AE_COIN_PRECISION,
  MULTISIG_SUPPORTED_CONTRACT_VERSION,
} from '@/protocols/aeternity/config';
import { SimpleGAMultiSigContractApi } from '@/protocols/aeternity/types';
import { AeScan } from '@/protocols/aeternity/libs/AeScan';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';

import { createPollingBasedOnMountedComponents } from './composablesHelpers';
import { useAeSdk } from './aeSdk';
import { useAccounts } from './accounts';
import { useNetworks } from './networks';
import { useStorageRef } from './storageRef';

export interface MultisigAccountsOptions {
  pollOnce?: boolean;
  pollingDisabled?: boolean;
}

let multisigContractInstances: Dictionary<Contract<SimpleGAMultiSigContractApi>> = {};
let composableInitialized = false;
const isMultisigBackendUnavailable = ref(false);

const POLLING_INTERVAL = 12000;

const multisigAccounts = useStorageRef<IMultisigAccount[]>(
  [],
  STORAGE_KEYS.multisigAccounts,
);

const pendingMultisigAccounts = useStorageRef<IMultisigAccount[]>(
  [],
  STORAGE_KEYS.multisigAccountsPending,
);

const activeMultisigAccountId = useStorageRef<AccountAddress>(
  '',
  STORAGE_KEYS.activeMultisigAccount,
);

const isAdditionalInfoNeeded = ref(false);

const initPollingWatcher = createPollingBasedOnMountedComponents(POLLING_INTERVAL);

export function useMultisigAccounts({
  pollOnce = false,
  pollingDisabled = false,
}: MultisigAccountsOptions = {}) {
  const { activeNetwork, onNetworkChange } = useNetworks();
  const { aeActiveNetworkPredefinedSettings } = useAeNetworkSettings();
  const { getDryAeSdk } = useAeSdk();
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
      : undefined,
  );

  const isActiveMultisigAccountPending = computed(
    (): boolean => (
      !!activeMultisigAccount.value?.gaAccountId
      && !!pendingMultisigAccounts.value.find(
        ({ gaAccountId }) => gaAccountId === activeMultisigAccount.value!.gaAccountId,
      )
    ),
  );

  function setActiveMultisigAccountId(gaAccountId: AccountAddress) {
    if (gaAccountId && allMultisigAccounts.value.some((acc) => acc.gaAccountId === gaAccountId)) {
      activeMultisigAccountId.value = gaAccountId;
    }
  }

  function addPendingMultisigAccount(multisigAccount: IMultisigAccount) {
    pendingMultisigAccounts.value.push(multisigAccount);
  }

  // TODO the account details should not store the transaction data
  function addTransactionToPendingMultisigAccount(
    txHash: string,
    gaAccountId: AccountAddress,
    proposedBy: AccountAddress,
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
  }

  function removeDuplicatesFromPendingAccounts() {
    if (pendingMultisigAccounts.value?.length) {
      pendingMultisigAccounts.value = pendingMultisigAccounts.value.filter(
        (pendingAccount) => !multisigAccounts.value.find(
          (account) => account.gaAccountId === pendingAccount.gaAccountId,
        ),
      );
    }
  }

  /**
   * Get extended data for a multisig account
   */
  async function getMultisigAccountInfo({
    contractId,
    gaAccountId,
    ...otherMultisigData
  }: IMultisigAccountResponse): Promise<IMultisigAccount> {
    const dryAeSdk = await getDryAeSdk();
    try {
      if (!multisigContractInstances[contractId]) {
        multisigContractInstances[contractId] = await Contract
          .initialize<SimpleGAMultiSigContractApi>({
            ...dryAeSdk.getContext(),
            aci: SimpleGAMultiSigAci,
            address: contractId,
          });
      }

      const contractInstance = multisigContractInstances[contractId];

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
        gaAccountId ? dryAeSdk.getBalance(gaAccountId as Encoded.AccountAddress) : 0,
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
      )!;
    }
  }

  async function getAllMultisigAccountsInfo(rawMultisigData: IMultisigAccountResponse[]) {
    const currentNetworkName = activeNetwork.value.name;
    /**
     * Splitting the rawMultisigData is required to not overload the node
     * with amount of parallel dry-runs
     */
    const splittedMultisig = chunk(rawMultisigData
      .filter(({ version }) => version === MULTISIG_SUPPORTED_CONTRACT_VERSION), 5);
    const results: IMultisigAccount[] = [];
    /* eslint-disable-next-line no-restricted-syntax */
    for (const nestedArray of splittedMultisig) {
      if (currentNetworkName !== activeNetwork.value.name) {
        return [];
      }
      // Process each nested array sequentially
      const promises = nestedArray.map(
        (rawData: IMultisigAccountResponse) => getMultisigAccountInfo(rawData),
      );
      /* eslint-disable no-await-in-loop */
      const arrayResults = await Promise.all(promises) as IMultisigAccount[];
      results.push(...arrayResults);
    }
    return results;
  }

  function getMultisigAccountByAccountId(accountId: AccountAddress) {
    return allMultisigAccounts.value.find(({ gaAccountId }) => gaAccountId === accountId);
  }

  function getMultisigAccountByContractId(contractId: Encoded.ContractAddress) {
    return allMultisigAccounts.value.find((acc) => acc.contractId === contractId);
  }

  /**
   * Refresh the list of the multisig accounts.
   */
  async function updateMultisigAccounts() {
    /**
     * Establish the list of multisig accounts used by the regular accounts
     */
    let rawMultisigData: IMultisigAccountResponse[] = [];
    try {
      await Promise.all(aeAccounts.value.map(async ({ address }) => rawMultisigData.push(
        ...(await fetchJson(`${aeActiveNetworkPredefinedSettings.value.multisigBackendUrl}/${address}`)),
      )));
      isMultisigBackendUnavailable.value = false;
    } catch {
      isMultisigBackendUnavailable.value = true;
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

    const allMultisigAccountsInfo = await getAllMultisigAccountsInfo(rawMultisigData);

    const result: IMultisigAccount[] = allMultisigAccountsInfo
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
      || !getMultisigAccountByAccountId(activeMultisigAccountId.value)
    ) {
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

  if (!pollingDisabled) {
    if (pollOnce && !multisigAccounts.value.length) {
      updateMultisigAccounts();
    } else if (!pollOnce) {
      initPollingWatcher(() => updateMultisigAccounts());
    }
  }

  if (!composableInitialized) {
    composableInitialized = true;

    onNetworkChange(() => {
      multisigAccounts.value = [];
      activeMultisigAccountId.value = '';
      updateMultisigAccounts();
      multisigContractInstances = {};
    });
  }

  return {
    activeMultisigAccountId,
    activeMultisigAccount,
    activeMultisigAccountExplorerUrl,
    isAdditionalInfoNeeded,
    isActiveMultisigAccountPending,
    isMultisigBackendUnavailable,
    multisigAccounts: allMultisigAccounts,
    pendingMultisigAccounts,
    addPendingMultisigAccount,
    addTransactionToPendingMultisigAccount,
    fetchAdditionalInfo,
    getMultisigAccountByContractId,
    setActiveMultisigAccountId,
    stopFetchingAdditionalInfo,
    updateMultisigAccounts,
  };
}
