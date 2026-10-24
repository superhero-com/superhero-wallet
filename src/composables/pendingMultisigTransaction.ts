import {
  ref,
  watch,
  computed,
  effectScope,
} from 'vue';
import { isEqual } from 'lodash-es';
import type {
  AccountAddress,
  IAccount,
  IActiveMultisigTransaction,
  ITransaction,
} from '@/types';
import { handleUnknownError } from '@/utils';
import {
  MULTISIG_VAULT_MIN_NUM_OF_SIGNERS,
  TX_FUNCTIONS_MULTISIG,
} from '@/protocols/aeternity/config';
import { useAeMiddleware } from '@/protocols/aeternity/composables';
import { useAccounts } from './accounts';
import { useMultisigAccounts } from './multisigAccounts';
import { useMultisigTransactions } from './multisigTransactions';
import { useTopHeaderData } from './topHeader';

let composableInitialized = false;

const pendingMultisigTransaction = ref<IActiveMultisigTransaction | null>(null);

/** Used only to establish the multisig transaction function */
const activeMultisigTransactionData = ref<ITransaction | null>(null);

const isLoading = ref(false);

/** An unverified proposal of an unchanged vault is loaded again at most this often */
const UNVERIFIED_RETRY_INTERVAL = 60000;
let lastLoadedAt = 0;

export function usePendingMultisigTransaction() {
  const { getMiddleware } = useAeMiddleware();
  const { activeMultisigAccount } = useMultisigAccounts();
  const { fetchActiveMultisigTx } = useMultisigTransactions();
  const { topBlockHeight } = useTopHeaderData();
  const { aeAccounts } = useAccounts();

  /**
   * The minimum required number of confirmations to process the current proposal.
   */
  const pendingMultisigTxRequiredConfirmations = computed((): number => (
    activeMultisigAccount.value?.confirmationsRequired ?? MULTISIG_VAULT_MIN_NUM_OF_SIGNERS
  ));

  /**
   * Current proposal signers.
   */
  const pendingMultisigTxSigners = computed((): AccountAddress[] => (
    activeMultisigAccount.value?.signers ?? []
  ));

  /**
   * The Signers who approved the current proposal.
   */
  const pendingMultisigTxConfirmedBy = computed((): AccountAddress[] => (
    activeMultisigAccount.value?.confirmedBy ?? []
  ));

  /**
   * The minimum required number of confirmations to process the current proposal.
   */
  const pendingMultisigTxPendingConfirmationsCount = computed((): number => (
    pendingMultisigTxRequiredConfirmations.value - pendingMultisigTxConfirmedBy.value.length
  ));

  /**
   * The Signers who refused the current proposal.
   */
  const pendingMultisigTxRefusedBy = computed((): AccountAddress[] => (
    activeMultisigAccount.value?.refusedBy ?? []
  ));

  /**
   * Sorted list of signatories, with confirmed signatories appearing first.
   */
  const pendingMultisigTxSortedSigners = computed((): AccountAddress[] => (
    [...pendingMultisigTxSigners.value].sort(
      (a) => activeMultisigAccount.value?.confirmedBy.includes(a) ? -1 : 1,
    )
  ));

  /**
   * Verify if the current proposal has been confirmed and is ready for dispatch.
   */
  const pendingMultisigTxConfirmed = computed((): boolean => (
    pendingMultisigTxConfirmedBy.value.length >= pendingMultisigTxRequiredConfirmations.value
  ));

  /**
   * Verify if the current proposal has been revoked.
   */
  const pendingMultisigTxRevoked = computed((): boolean => (
    pendingMultisigTxRequiredConfirmations.value === pendingMultisigTxRefusedBy.value.length
  ));

  /**
   * Determine if the proposing account for the current proposal has revoked it.
   */
  const pendingMultisigTxProposingAccountRevoked = computed((): boolean => (
    !!activeMultisigAccount.value?.proposedBy
    && pendingMultisigTxRevoked.value
    && activeMultisigTransactionData.value?.tx?.callerId === activeMultisigAccount.value.proposedBy
  ));

  /**
   * Check if the proposal has not yet expired.
   */
  const pendingMultisigTxExpired = computed((): boolean => (
    !!activeMultisigAccount.value?.expirationHeight
    && topBlockHeight.value >= activeMultisigAccount.value.expirationHeight
  ));

  /**
   * Determine the number of pending blocks until the proposal expires.
   */
  const pendingMultisigTxExpiresAt = computed((): number => (
    activeMultisigAccount.value
      ? activeMultisigAccount.value.expirationHeight - topBlockHeight.value
      : 0
  ));

  /**
   * Verify if the proposal has not expired and has the minimum number of required confirmations,
   * allowing it to be dispatched.
   */
  const pendingMultisigTxCanBeSent = computed((): boolean => (
    !pendingMultisigTxExpired.value && pendingMultisigTxConfirmed.value
  ));

  /**
   * Retrieve the addresses of proposal signatories that are present in the local wallet.
   */
  const pendingMultisigTxLocalSigners = computed((): IAccount[] => (
    aeAccounts.value.filter(
      ({ address }) => pendingMultisigTxSigners.value.includes(address),
    )
  ));

  /**
   * Verify if the proposal has been confirmed by all signatories present in
   * the local wallet addresses.
   */
  const pendingMultisigTxConfirmedByLocalSigners = computed((): boolean => (
    pendingMultisigTxLocalSigners.value.filter(
      ({ address }) => activeMultisigAccount.value?.confirmedBy
        ?.includes(address),
    ).length === pendingMultisigTxLocalSigners.value.length
  ));

  /**
   * Check if the pending proposal is still open.
   */
  const isPendingMultisigTxCompleted = computed((): boolean => (
    !activeMultisigAccount.value?.txHash
  ));

  /**
   * Check if the latest proposal action is revoked.
   */
  const isPendingMultisigTxCompletedAndRevoked = computed((): boolean => (
    !activeMultisigAccount.value?.txHash
    && activeMultisigTransactionData.value?.tx?.function === TX_FUNCTIONS_MULTISIG.revoke
  ));

  /**
   * Check if the latest proposal action is confirmed.
   */
  const isPendingMultisigTxCompletedAndConfirmed = computed((): boolean => (
    !activeMultisigAccount.value?.txHash
    && activeMultisigTransactionData.value?.tx?.function === TX_FUNCTIONS_MULTISIG.confirm
  ));

  /**
   * Load latest multisig account action.
   */
  async function fetchLatestMultisigAccountTransaction() {
    try {
      const contractId = activeMultisigAccount.value?.contractId;
      const middleware = await getMiddleware();
      const { data: [latestTransaction] } = await middleware.getTxs({
        direction: 'backward', limit: 1, contract: contractId,
      });
      return latestTransaction;
    } catch (error) {
      handleUnknownError(error);
      return null;
    }
  }

  if (!composableInitialized) {
    composableInitialized = true;

    // Create persistent effect scope to avoid watcher being disposed
    effectScope(true).run(() => {
      const { activeMultisigAccount: scopedActiveMultisigAccount } = useMultisigAccounts();

      watch(
        scopedActiveMultisigAccount,
        async (newValue, oldValue) => {
          const pending = pendingMultisigTransaction.value;
          // Loaded again while unverified, a failed load can succeed next time. Not with every
          // poll of the vault though, unless its data changed: it would keep hitting the backend.
          const isRetry = !!newValue?.txHash
            && pending?.hash === newValue.txHash
            && !pending.isTxVerified
            && (
              !isEqual(newValue, oldValue)
              || Date.now() - lastLoadedAt >= UNVERIFIED_RETRY_INTERVAL
            );
          if (newValue && (!isEqual(newValue, oldValue) || isRetry)) {
            if (!newValue?.txHash) {
              activeMultisigTransactionData.value = null;
              pendingMultisigTransaction.value = null;
              isLoading.value = false;
            } else if (newValue.txHash !== oldValue?.txHash || isRetry) {
              const { txHash } = newValue;
              // As it starts, so that the polls while a slow one runs don't start more
              lastLoadedAt = Date.now();
              if (!isRetry) {
                isLoading.value = true;
              }
              const [latestTransaction, activeMultisigTx] = await Promise.all([
                isRetry
                  ? activeMultisigTransactionData.value
                  : fetchLatestMultisigAccountTransaction(),
                fetchActiveMultisigTx(),
              ]);
              // Loaded for a proposal the vault has moved on from
              if (scopedActiveMultisigAccount.value?.txHash !== txHash) {
                return;
              }
              activeMultisigTransactionData.value = latestTransaction;
              pendingMultisigTransaction.value = activeMultisigTx;
              isLoading.value = false;
            } else if (
              !isEqual(newValue.confirmedBy, oldValue.confirmedBy)
              && pendingMultisigTransaction.value
            ) {
              pendingMultisigTransaction.value = {
                ...pendingMultisigTransaction.value,
                ...newValue,
                totalConfirmations: newValue.confirmedBy.length,
              };
            }
          }
        },
        { immediate: true },
      );
    });
  }

  return {
    pendingMultisigTransaction,
    pendingMultisigTxSigners,
    pendingMultisigTxConfirmedBy,
    pendingMultisigTxRefusedBy,
    pendingMultisigTxSortedSigners,
    pendingMultisigTxConfirmed,
    pendingMultisigTxRevoked,
    pendingMultisigTxProposingAccountRevoked,
    pendingMultisigTxRequiredConfirmations,
    pendingMultisigTxPendingConfirmationsCount,
    pendingMultisigTxExpired,
    pendingMultisigTxExpiresAt,
    pendingMultisigTxCanBeSent,
    pendingMultisigTxLocalSigners,
    pendingMultisigTxConfirmedByLocalSigners,
    isLoading,
    isPendingMultisigTxCompleted,
    isPendingMultisigTxCompletedAndRevoked,
    isPendingMultisigTxCompletedAndConfirmed,
  };
}
