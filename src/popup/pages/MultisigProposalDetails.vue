<template>
  <div class="multisig-proposal-details">
    <AnimatedSpinner
      v-if="!activeMultisigAccount || !multisigTx"
      class="spinner"
    />
    <template v-else>
      <div
        class="header"
      >
        <TransactionTokens
          v-if="multisigTx"
          :transaction="{ tx: multisigTx }"
          icon-size="md"
        />
      </div>
      <div class="content">
        <TransactionInfo
          v-if="multisigTx"
          class="transaction-overview"
          :sender="{
            label: $t('multisig.multisigVault'),
            address: activeMultisigAccount.gaAccountId
          }"
          :recipient="{
            label: $t('transaction.overview.smartContract'),
            address: activeMultisigAccount.contractId
          }"
          :transaction="{ tx: multisigTx }"
        />
        <div class="explorer">
          <LinkButton
            :to="getExplorerPath(activeMultisigAccount.contractId)"
            variant="muted"
          >
            {{ $t('pages.transactionDetails.explorer') }}
            <ExternalLink />
          </LinkButton>
        </div>
        <div class="data-grid">
          <DetailsItem
            v-if="multisigTx && multisigTx.recipientId"
            :label="$t('pages.proposalDetails.receivingAddress')"
            small
          >
            <template #value>
              <div class="receiving-address">
                <Avatar
                  :address="multisigTx.recipientId"
                  size="sm"
                />
                <CopyText
                  hide-icon
                  :value="multisigTx.recipientId"
                  :copied-text="$t('hashCopied')"
                >
                  <span class="text-address">{{ splitAddress(multisigTx.recipientId) }}</span>
                </CopyText>
              </div>
            </template>
          </DetailsItem>

          <DetailsItem
            v-if="activeMultisigAccount.proposedBy"
            :label="$t('pages.proposalDetails.proposedBy')"
            small
          >
            <template #value>
              <div class="row">
                <AccountItem :address="activeMultisigAccount.proposedBy" />
                <DialogBox
                  v-if="isLocalAccountAddress(activeMultisigAccount.proposedBy)"
                  dense
                >
                  {{ $t('common.you') }}
                </DialogBox>
              </div>
            </template>
          </DetailsItem>

          <MultisigProposalConsensus :proposal-completed="proposalCompleted" />

          <DetailsItem
            v-if="transaction"
            :label="$t('pages.transactionDetails.hash')"
            data-cy="hash"
            small
          >
            <template #value>
              <CopyText
                hide-icon
                :value="transaction.hash"
                :copied-text="$t('hashCopied')"
              >
                <span class="text-address">{{ splitAddress(transaction.hash) }}</span>
              </CopyText>
            </template>
          </DetailsItem>

          <PayloadDetails
            v-if="multisigTx"
            :payload="getPayload(multisigTx)"
          />

          <div class="span-3-columns">
            <DetailsItem
              v-if="activeMultisigAccount.expirationHeight"
              :value="activeMultisigAccount.expirationHeight"
              :label="$t('pages.proposalDetails.expiresAt')"
              :secondary="expirationHeightToRelativeTime"
            />
            <DetailsItem
              v-else-if="transaction"
              :value="transaction.blockHeight"
              :label="$t('pages.transactionDetails.blockHeight')"
            />
            <DetailsItem
              v-if="activeMultisigAccount.nonce"
              :value="activeMultisigAccount.nonce"
              :label="$t('pages.transactionDetails.nonce')"
              data-cy="nonce"
            />
          </div>
          <DetailsItem
            v-if="multisigTx.gasPrice"
            :label="$t('pages.transactionDetails.gasPrice')"
            data-cy="gas-price"
          >
            <template #value>
              <TokenAmount
                :amount="+(aettosToAe(multisigTx.gasPrice))"
                symbol="AE"
                hide-fiat
              />
            </template>
          </DetailsItem>
          <DetailsItem
            v-if="transaction && transaction.tx"
            :label="$t('pages.transactionDetails.gasPrice')"
          >
            <template #value>
              <TokenAmount
                :amount="+aettosToAe(transaction.tx.gasPrice)"
                :symbol="AETERNITY_SYMBOL"
              />
            </template>
          </DetailsItem>
          <DetailsItem
            v-if="transaction && transaction.tx"
            :value="transaction.tx.gas"
            :label="$t('pages.transactionDetails.gasUsed')"
          />

          <DetailsItem
            v-if="multisigTx"
            :label="$t('modals.multisigTxProposal.fee')"
          >
            <template #value>
              <TokenAmount
                :amount="+aettosToAe(multisigTx.fee)"
                :symbol="AETERNITY_SYMBOL"
              />
            </template>
          </DetailsItem>
          <DetailsItem
            v-if="transaction"
            :label="$t('pages.transactionDetails.fee')"
            data-cy="fee"
          >
            <template #value>
              <TokenAmount
                :amount="+aettosToAe(transaction.tx.fee)"
                :symbol="AETERNITY_SYMBOL"
              />
            </template>
          </DetailsItem>

          <DetailsItem
            v-if="totalSpent"
            :label="$t('total')"
            data-cy="amount"
          >
            <template #value>
              <TokenAmount
                :amount="+aettosToAe(totalSpent)"
                :symbol="AETERNITY_SYMBOL"
                high-precision
              />
            </template>
          </DetailsItem>
        </div>
        <div
          v-if="!proposalCompleted && activeMultisigAccount.txHash"
          class="bottom-buttons"
        >
          <div class="row">
            <BtnMain
              variant="muted"
              nowrap
              extra-padded
              :disabled="processingAction"
              @click="dispatchProposalAction(FUNCTION_TYPE_MULTISIG.refuse)"
            >
              {{ $t('pages.proposalDetails.refuse') }}
            </BtnMain>

            <BtnMain
              v-if="pendingMultisigTxCanBeSent"
              extend
              nowrap
              extra-padded
              :disabled="processingAction || pendingMultisigTxExpired"
              @click="processProposal()"
            >
              {{ $t('pages.proposalDetails.send') }}
            </BtnMain>
            <BtnMain
              v-else
              extend
              nowrap
              extra-padded
              :disabled="
                processingAction
                  || pendingMultisigTxConfirmedByLocalSigners
                  || pendingMultisigTxExpired
              "
              @click="dispatchProposalAction(FUNCTION_TYPE_MULTISIG.confirm)"
            >
              {{ $t('pages.proposalDetails.sign') }}
            </BtnMain>
          </div>
          <BtnMain
            v-if="isLocalAccountAddress(activeMultisigAccount.proposedBy)"
            variant="muted"
            extend
            nowrap
            extra-padded
            :disabled="processingAction"
            @click="dispatchProposalAction(FUNCTION_TYPE_MULTISIG.revoke)"
          >
            {{ $t('pages.proposalDetails.revoke') }}
          </BtnMain>
        </div>
      </div>
      <Loader v-if="processingAction" />
    </template>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  onMounted,
  onBeforeUnmount,
} from '@vue/composition-api';
import { SCHEMA } from '@aeternity/aepp-sdk';
import {
  formatDate,
  formatTime,
  aettosToAe,
  splitAddress,
  AETERNITY_SYMBOL,
  getPayload,
  handleUnknownError,
  MODAL_MULTISIG_PROPOSAL_CONFIRM_ACTION,
  FUNCTION_TYPE_MULTISIG,
  blocksToRelativeTime,
} from '../utils';
import type {
  IGAMetaTx,
  IMultisigFunctionTypes,
  ITransaction,
  ITx,
} from '../../types';
import {
  useAccounts,
  useMultisigAccounts,
  usePendingMultisigTransaction,
  useMultisigTransactions,
} from '../../composables';
import { useGetter } from '../../composables/vuex';

import TransactionInfo from '../components/TransactionInfo.vue';
import TokenAmount from '../components/TokenAmount.vue';
import DetailsItem from '../components/DetailsItem.vue';
import LinkButton from '../components/LinkButton.vue';
import AccountItem from '../components/AccountItem.vue';

import BtnMain from '../components/buttons/BtnMain.vue';
import CopyText from '../components/CopyText.vue';
import PayloadDetails from '../components/PayloadDetails.vue';
import DialogBox from '../components/DialogBox.vue';
import MultisigProposalConsensus from '../components/MultisigProposalConsensus.vue';
import Avatar from '../components/Avatar.vue';
import TransactionTokens from '../components/TransactionTokenRows.vue';

import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';
import ExternalLink from '../../icons/external-link.svg?vue-component';
import { ROUTE_ACCOUNT } from '../router/routeNames';

export default defineComponent({
  components: {
    PayloadDetails,
    TransactionTokens,
    MultisigProposalConsensus,
    TransactionInfo,
    DialogBox,
    Avatar,
    TokenAmount,
    DetailsItem,
    LinkButton,
    AccountItem,
    BtnMain,
    CopyText,
    AnimatedSpinner,
    ExternalLink,
  },
  setup(props, { root }) {
    const {
      activeMultisigAccount,
      updateMultisigAccounts,
      fetchAdditionalInfo,
      stopFetchingAdditionalInfo,
    } = useMultisigAccounts({ store: root.$store });

    const {
      pendingMultisigTxExpired,
      pendingMultisigTxExpiresAt,
      pendingMultisigTxCanBeSent,
      pendingMultisigTxLocalSigners,
      pendingMultisigTxConfirmedByLocalSigners,
    } = usePendingMultisigTransaction({ store: root.$store });

    const {
      fetchActiveMultisigTx,
      fetchTransactionByHash,
      sendTx,
      callContractMethod,
    } = useMultisigTransactions({
      store: root.$store,
    });

    const {
      isLocalAccountAddress,
    } = useAccounts({
      store: root.$store,
    });

    const getExplorerPath = useGetter('getExplorerPath');
    const processingAction = ref<boolean>(false);
    const multisigTx = ref<ITx | null>(null);
    const transaction = ref<ITransaction | null>(null);
    const proposalCompleted = ref<boolean>(false);

    const totalSpent = computed(() => {
      if (!proposalCompleted.value || !transaction.value) {
        return 0;
      }

      const { tx } = transaction.value;
      const multisigTransaction = tx.tx?.tx as IGAMetaTx;
      if (!multisigTransaction) return 0;

      return (
        +(multisigTransaction.amount) + tx.fee + multisigTransaction.fee
      );
    });

    const expirationHeightToRelativeTime = computed(() => (
      pendingMultisigTxExpiresAt.value > 0
        ? `(≈${blocksToRelativeTime(pendingMultisigTxExpiresAt.value)})`
        : null
    ));

    async function getTransactionDetails() {
      const activeMultisigTx = await fetchActiveMultisigTx();

      if (!activeMultisigTx) {
        return;
      }

      multisigTx.value = {
        ...activeMultisigTx.tx,
        type: SCHEMA.TX_TYPE.gaMeta,
        tag: SCHEMA.TX_TYPE.gaMeta,
      } as ITx;
    }

    /**
     * Utilized to open the confirmation modal for approving, disapproving, or revoking the proposal
     */
    async function dispatchProposalAction(action: IMultisigFunctionTypes) {
      if (!activeMultisigAccount.value) {
        return;
      }

      processingAction.value = true;
      try {
        await root.$store.dispatch('modals/open', {
          name: MODAL_MULTISIG_PROPOSAL_CONFIRM_ACTION,
          action,
          signers: pendingMultisigTxLocalSigners.value,
        });

        const { contractId, txHash } = activeMultisigAccount.value;
        await callContractMethod(action, contractId, txHash as string);
        await updateMultisigAccounts();

        if (!activeMultisigAccount.value?.txHash) {
          root.$router.push({ name: ROUTE_ACCOUNT });
        }
      } catch (error: any) {
        handleUnknownError(error);
      }

      processingAction.value = false;
    }

    /**
     * Dispatch the proposal transaction if it has been signed by all necessary signatories.
     */
    async function processProposal() {
      if (!activeMultisigAccount.value || !pendingMultisigTxCanBeSent.value) {
        return;
      }

      processingAction.value = true;
      try {
        const { gaAccountId, txHash, nonce } = activeMultisigAccount.value;
        const rawTx = await fetchTransactionByHash(txHash as string);
        transaction.value = await sendTx(gaAccountId, (rawTx as any).tx, nonce);

        await updateMultisigAccounts();

        proposalCompleted.value = true;
      } catch (error) {
        handleUnknownError(error);
      }
      processingAction.value = false;
    }

    onMounted(async () => {
      if (activeMultisigAccount.value) {
        getTransactionDetails();
        fetchAdditionalInfo();
      }
    });

    onBeforeUnmount(stopFetchingAdditionalInfo);

    return {
      AETERNITY_SYMBOL,
      activeMultisigAccount,
      multisigTx,
      transaction,
      totalSpent,
      getPayload,
      splitAddress,
      aettosToAe,
      formatDate,
      formatTime,
      getExplorerPath,
      isLocalAccountAddress,
      pendingMultisigTxCanBeSent,
      pendingMultisigTxExpired,
      expirationHeightToRelativeTime,
      pendingMultisigTxConfirmedByLocalSigners,
      processingAction,
      proposalCompleted,
      blocksToRelativeTime,
      dispatchProposalAction,
      processProposal,
      FUNCTION_TYPE_MULTISIG,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.multisig-proposal-details {
  display: flex;
  flex-direction: column;

  .spinner {
    align-self: center;
    width: 56px;
    height: 56px;
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .pending-icon {
    width: 16px;
    height: 16px;
  }

  .header {
    @include mixins.flex(center, center, column);

    background-color: variables.$color-bg-app;
    min-height: 42px;
    padding: 14px;
    position: sticky;
    top: 0;
    z-index: 3;

    @include mixins.mobile {
      width: 100%;
    }
  }

  .span-3-columns {
    @include mixins.flex(flex-start, flex-start);

    column-gap: 24px;
  }

  .content {
    background-color: variables.$color-bg-4;
    padding-bottom: 120px;

    .transaction-overview {
      padding: 16px 12px 8px;
    }

    .receiving-address {
      @include mixins.flex(flex-start, center, row);

      gap: 8px;
    }

    .data-grid {
      @include mixins.flex(flex-start, flex-start, column);

      column-gap: 24px;
      row-gap: 8px;
      padding: 8px 16px;

      .tip-url {
        width: 100%;

        .copy-text {
          width: 100%;
        }

        .link-button {
          display: block;
        }
      }
    }

    .explorer {
      height: 38px;
      padding-inline: 16px;
      display: flex;
      align-items: center;
    }
  }

  .details-item::v-deep {
    .label {
      white-space: nowrap;
    }
  }

  .reason::v-deep {
    .value {
      color: variables.$color-warning;
    }
  }

  .row {
    @include mixins.flex(flex-start, center, row);

    gap: 4px;
  }

  .bottom-buttons {
    padding: 24px;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background:
      linear-gradient(
        180deg,
        rgba(variables.$color-bg-4, 0) 0%,
        rgba(variables.$color-bg-4, 0.8) 43.08%,
        rgba(variables.$color-bg-4, 0.9) 90.79%
      );

    .row {
      gap: 8px;
      padding-bottom: 8px;
    }
  }
}
</style>
