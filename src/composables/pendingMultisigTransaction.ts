import {
  onMounted,
  ref,
  watch,
  computed,
} from '@vue/composition-api';
import { MULTISIG_VAULT_MIN_NUM_OF_SIGNERS, watchUntilTruthy } from '../popup/utils';
import type { IAccount, IActiveMultisigTx, IDefaultComposableOptions } from '../types';
import { useAccounts } from './accounts';
import { useMultisigAccounts } from './multisigAccounts';
import { useMultisigTransactions } from './multisigTransactions';
import { useTopHeaderData } from './topHeader';

const pendingMultisigTransaction = ref<IActiveMultisigTx | null>();

export function usePendingMultisigTransaction({ store }: IDefaultComposableOptions) {
  const { activeMultisigAccount } = useMultisigAccounts({ store });
  const { fetchActiveMultisigTx } = useMultisigTransactions({ store });
  const { topBlockHeight } = useTopHeaderData({ store });
  const { accounts } = useAccounts({ store });

  async function assignPendingMultisigTx() {
    if (activeMultisigAccount.value) {
      pendingMultisigTransaction.value = await fetchActiveMultisigTx(
        activeMultisigAccount.value.contractId,
      );
    }
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
  const pendingMultisigTxSigners = computed((): string[] => (
    activeMultisigAccount.value?.signers ?? []
  ));

  /**
   * The Signers who approved the current proposal.
   */
  const pendingMultisigTxConfirmedBy = computed((): string[] => (
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
  const pendingMultisigTxRefusedBy = computed((): string[] => (
    activeMultisigAccount.value?.refusedBy ?? []
  ));

  /**
   * Sorted list of signatories, with confirmed signatories appearing first.
   */
  const pendingMultisigTxSortedSigners = computed((): string[] => (
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

  watch(
    () => activeMultisigAccount.value,
    () => {
      assignPendingMultisigTx();
    },
  );

  onMounted(async () => {
    if (!pendingMultisigTransaction.value) {
      await watchUntilTruthy(() => activeMultisigAccount.value);
      assignPendingMultisigTx();
    }
  });

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
  };
}
