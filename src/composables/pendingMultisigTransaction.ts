import {
  ref,
  watch,
  computed,
} from 'vue';
import { Encoded } from '@aeternity/aepp-sdk';
import { isEqual } from 'lodash-es';
import {
  TX_FUNCTIONS_MULTISIG,
  MULTISIG_VAULT_MIN_NUM_OF_SIGNERS,
  handleUnknownError,
} from '../popup/utils';
import type {
  IAccount,
  IActiveMultisigTransaction,
  IDefaultComposableOptions,
  ITransaction,
} from '../types';
import { useAccounts } from './accounts';
import { useMiddleware } from './middleware';
import { useMultisigAccounts } from './multisigAccounts';
import { useMultisigTransactions } from './multisigTransactions';
import { useTopHeaderData } from './topHeader';

const pendingMultisigTransaction = ref<IActiveMultisigTransaction | null>();

export function usePendingMultisigTransaction({ store }: IDefaultComposableOptions) {
  const { getMiddleware } = useMiddleware({ store });
  const { activeMultisigAccount } = useMultisigAccounts({ store });
  const { fetchActiveMultisigTx } = useMultisigTransactions({ store });
  const { topBlockHeight } = useTopHeaderData({ store });
  const { accounts } = useAccounts({ store });

  const latestMultisigAccountTransaction = ref<ITransaction | null>(null);

  async function assignPendingMultisigTx() {
    pendingMultisigTransaction.value = await fetchActiveMultisigTx();
  }

  /**
   * The minimum required number of confirmations to process the current proposal.
   */
  const pendingMultisigTxRequiredConfirmations = computed((): number => (
    activeMultisigAccount.value?.confirmationsRequired ?? MULTISIG_VAULT_MIN_NUM_OF_SIGNERS
  ));

  /**
   * Current proposal signers.
   */
  const pendingMultisigTxSigners = computed((): Encoded.AccountAddress[] => (
    activeMultisigAccount.value?.signers ?? []
  ));

  /**
   * The Signers who approved the current proposal.
   */
  const pendingMultisigTxConfirmedBy = computed((): Encoded.AccountAddress[] => (
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
  const pendingMultisigTxRefusedBy = computed((): Encoded.AccountAddress[] => (
    activeMultisigAccount.value?.refusedBy ?? []
  ));

  /**
   * Sorted list of signatories, with confirmed signatories appearing first.
   */
  const pendingMultisigTxSortedSigners = computed((): Encoded.AccountAddress[] => (
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
    (pendingMultisigTxSigners.value.length - pendingMultisigTxRefusedBy.value.length)
    < pendingMultisigTxRequiredConfirmations.value
  ));

  /**
   * Determine if the proposing account for the current proposal has revoked it.
   */
  const pendingMultisigTxProposingAccountRevoked = computed((): boolean => (
    !!activeMultisigAccount.value?.proposedBy
    && pendingMultisigTxRefusedBy.value.includes(activeMultisigAccount.value.proposedBy)
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
    accounts.value.filter(
      (_account) => pendingMultisigTxSigners.value.includes(_account.address),
    )
  ));

  /**
   * Verify if the proposal has been confirmed by all signatories present in
   * the local wallet addresses.
   */
  const pendingMultisigTxConfirmedByLocalSigners = computed((): boolean => (
    pendingMultisigTxLocalSigners.value.filter(
      (acc) => activeMultisigAccount.value?.confirmedBy?.includes(acc.address),
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
    && latestMultisigAccountTransaction.value?.tx.function === TX_FUNCTIONS_MULTISIG.revoke
  ));

  /**
   * Check if the latest proposal action is confirmed.
   */
  const isPendingMultisigTxCompletedAndConfirmed = computed((): boolean => (
    !activeMultisigAccount.value?.txHash
    && latestMultisigAccountTransaction.value?.tx.function === TX_FUNCTIONS_MULTISIG.confirm
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
      latestMultisigAccountTransaction.value = latestTransaction;
    } catch (error) {
      handleUnknownError(error);
    }
  }

  watch(
    () => activeMultisigAccount.value,
    (newValue, oldValue) => {
      if (!isEqual(newValue, oldValue)) {
        assignPendingMultisigTx();

        if (!activeMultisigAccount.value?.txHash && !latestMultisigAccountTransaction.value) {
          fetchLatestMultisigAccountTransaction();
        }
      }
    },
    { immediate: true },
  );

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
    isPendingMultisigTxCompleted,
    isPendingMultisigTxCompletedAndRevoked,
    isPendingMultisigTxCompletedAndConfirmed,
  };
}
