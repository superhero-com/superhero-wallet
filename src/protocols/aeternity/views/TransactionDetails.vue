<template>
  <div class="transaction-details">
    <AnimatedSpinner
      v-if="!transaction || transaction.incomplete"
      class="spinner"
    />
    <template v-else>
      <div
        v-if="!isDexAllowance || isErrorTransaction"
        class="header"
      >
        <TransactionErrorStatus
          v-if="isErrorTransaction"
          :return-type="transaction.tx.returnType"
        />
        <TransactionTokens
          :transaction="transaction"
          :direction="direction"
          :is-allowance="isDexAllowance"
          :error="isErrorTransaction"
          :class="{ reverse: isPool }"
          icon-size="md"
        />
      </div>
      <div class="content">
        <TransactionOverview :transaction="transaction" />
        <div class="explorer">
          <LinkButton :to="explorerUrl">
            {{ $t('pages.transactionDetails.explorer') }}
            <template #icon>
              <ExternalLink />
            </template>
          </LinkButton>
        </div>
        <div class="data-grid">
          <template v-if="isSwap && !isErrorTransaction">
            <SwapRates :transaction="transaction" />
            <SwapRoute :transaction="transaction" />
          </template>
          <DetailsItem
            v-if="isErrorTransaction"
            :label="$t('pages.transactionDetails.reason')"
            :value="transaction.tx.return"
            class="reason"
            data-cy="reason"
          />
          <TransactionDetailsPoolTokens
            v-if="(isPool || isDexAllowance)"
            :transaction="transaction"
            :direction="direction"
            :tx-function="transaction.tx.function"
            :is-allowance="isDexAllowance"
            :class="{ reverse: isPool }"
          />

          <DetailsItem
            v-if="tipUrl"
            :label="$t('pages.transactionDetails.tipUrl')"
            class="tip-url"
            data-cy="tip-url"
          >
            <template #value>
              <CopyText :value="tipUrl">
                <LinkButton :to="tipLink">
                  <Truncate
                    :str="tipUrl"
                    fixed
                  />
                </LinkButton>
              </CopyText>
            </template>
          </DetailsItem>

          <DetailsItem
            v-if="contractId"
            :label="$t('common.smartContract')"
            small
          >
            <template #value>
              <CopyText
                hide-icon
                :value="hash"
                :copied-text="$t('common.hashCopied')"
              >
                <span class="text-address">{{ splitAddress(contractId) }}</span>
              </CopyText>
            </template>
          </DetailsItem>

          <DetailsItem
            :label="$t('pages.transactionDetails.hash')"
            data-cy="hash"
            small
          >
            <template #value>
              <CopyText
                hide-icon
                :value="hash"
                :copied-text="$t('common.hashCopied')"
              >
                <span class="text-address">{{ splitAddress(hash) }}</span>
              </CopyText>
            </template>
          </DetailsItem>

          <DetailsItem
            v-if="multisigTransactionFeePaidBy"
            :label="$t('pages.transactionDetails.feePaidBy')"
            small
          >
            <div class="row payer-id">
              <Avatar
                :address="multisigTransactionFeePaidBy"
                size="sm"
              />
              <div>
                <DialogBox
                  v-if="isLocalAccountAddress(multisigTransactionFeePaidBy)"
                  class="dialog-box"
                  dense
                  position="bottom"
                >
                  {{ $t('common.you') }}
                </DialogBox>
                <CopyText
                  hide-icon
                  :value="multisigTransactionFeePaidBy"
                  :copied-text="$t('common.addressCopied')"
                >
                  <span class="text-address">
                    {{ splitAddress(multisigTransactionFeePaidBy) }}
                  </span>
                </CopyText>
              </div>
            </div>
          </DetailsItem>

          <DetailsItem
            v-if="multisigContractId"
            :label="$t('pages.transactionDetails.vaultContractId')"
            small
          >
            <div class="row">
              <Avatar
                :address="multisigContractId"
                size="sm"
              />
              <CopyText
                hide-icon
                :value="multisigContractId"
                :copied-text="$t('common.addressCopied')"
              >
                <span class="text-address">
                  {{ splitAddress(multisigContractId) }}
                </span>
              </CopyText>
            </div>
          </DetailsItem>

          <PayloadDetails :payload="getTransactionPayload(transaction)" />

          <div class="span-3-columns">
            <DetailsItem
              v-if="transaction.microTime && !transaction.pending"
              :value="formatDate(transaction.microTime)"
              :secondary="formatTime(transaction.microTime)"
              :label="$t('pages.transactionDetails.timestamp')"
              data-cy="timestamp"
            />
            <DetailsItem
              v-else-if="transaction.pending"
              :label="$t('pages.transactionDetails.timestamp')"
              data-cy="timestamp"
            >
              <template #value>
                <AnimatedPending
                  class="pending-icon"
                />
                {{ $t('common.pending') }}...
              </template>
            </DetailsItem>
            <DetailsItem
              v-if="transaction.blockHeight && transaction.blockHeight > 0"
              :value="transaction.blockHeight"
              :label="$t('pages.transactionDetails.blockHeight')"
              data-cy="block-height"
            />
            <DetailsItem
              v-if="transaction.tx.nonce"
              :value="transaction.tx.nonce"
              :label="$t('pages.transactionDetails.nonce')"
              data-cy="nonce"
            />
          </div>
          <DetailsItem
            v-if="!(isDex || isDexAllowance || isMultisig)"
            :label="$t('common.amount')"
            data-cy="amount"
          >
            <template #value>
              <TokenAmount
                :amount="getTxAmountTotal(transaction, direction)"
                :symbol="getTxSymbol(transaction)"
                :hide-fiat="isTransactionAex9(transaction)"
              />
            </template>
          </DetailsItem>
          <DetailsItem
            v-if="gasPrice"
            :label="$t('pages.transactionDetails.gasPrice')"
            data-cy="gas-price"
          >
            <template #value>
              <TokenAmount
                :amount="+(aettosToAe(gasPrice))"
                symbol="AE"
                hide-fiat
              />
            </template>
          </DetailsItem>
          <DetailsItem
            v-if="gasUsed"
            :value="gasUsed"
            :label="$t('pages.transactionDetails.gasUsed')"
            data-cy="gas"
          />
          <DetailsItem
            v-if="transactionFee"
            :label="$t('transaction.fee')"
            data-cy="fee"
          >
            <template #value>
              <TokenAmount
                :amount="+aettosToAe(transactionFee)"
                :symbol="AE_SYMBOL"
              />
            </template>
          </DetailsItem>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  onMounted,
} from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { Encoded, Tag } from '@aeternity/aepp-sdk';
import type { INetwork, ITransaction, TxFunctionRaw } from '@/types';
import {
  fetchJson,
  formatDate,
  formatTime,
  handleUnknownError,
  splitAddress,
  watchUntilTruthy,
} from '@/utils';
import { ROUTE_NOT_FOUND } from '@/popup/router/routeNames';
import { AE_SYMBOL } from '@/protocols/aeternity/config';
import { AeScan } from '@/protocols/aeternity/libs/AeScan';

import {
  useAccounts,
  useMiddleware,
  useMultisigAccounts,
  useTransactionTx,
} from '@/composables';
import {
  aettosToAe,
  getTransactionPayload,
  getTransactionTipUrl,
  isTransactionAex9,
  isTxFunctionDexSwap,
  isTxFunctionDexPool,
} from '@/protocols/aeternity/helpers';

import TransactionOverview from '@/popup/components/TransactionOverview.vue';
import SwapRoute from '@/popup/components/SwapRoute.vue';
import SwapRates from '@/popup/components/SwapRates.vue';
import TokenAmount from '@/popup/components/TokenAmount.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import LinkButton from '@/popup/components/LinkButton.vue';
import Truncate from '@/popup/components/Truncate.vue';
import TransactionTokens from '@/popup/components/TransactionTokenRows.vue';
import CopyText from '@/popup/components/CopyText.vue';
import TransactionDetailsPoolTokens from '@/popup/components/TransactionDetailsPoolTokens.vue';
import PayloadDetails from '@/popup/components/PayloadDetails.vue';
import TransactionErrorStatus from '@/popup/components/TransactionErrorStatus.vue';
import Avatar from '@/popup/components/Avatar.vue';
import DialogBox from '@/popup/components/DialogBox.vue';

import AnimatedPending from '@/icons/animated-pending.svg?vue-component';
import AnimatedSpinner from '@/icons/animated-spinner.svg?skip-optimize';
import ExternalLink from '@/icons/external-link.svg?vue-component';

export default defineComponent({
  components: {
    PayloadDetails,
    TransactionErrorStatus,
    TransactionDetailsPoolTokens,
    TransactionTokens,
    TransactionOverview,
    TokenAmount,
    DetailsItem,
    LinkButton,
    Truncate,
    CopyText,
    SwapRoute,
    SwapRates,
    AnimatedPending,
    AnimatedSpinner,
    ExternalLink,
    Avatar,
    DialogBox,
  },
  props: {
    multisigDashboard: { type: Boolean },
  },
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

    const hash = route.params.hash as string;
    const transactionOwner = route.params.transactionOwner as Encoded.AccountAddress;

    const { getMiddleware } = useMiddleware({ store });
    const { activeMultisigAccountId } = useMultisigAccounts({ store, pollOnce: true });
    const { activeAccount } = useAccounts({ store });

    const externalAddress = computed((): Encoded.AccountAddress => (
      transactionOwner
      || (
        props.multisigDashboard
          ? activeMultisigAccountId.value
          : activeAccount.value.address
      )));

    const {
      setExternalAddress,
      setTransactionTx,
      direction,
      isErrorTransaction,
      isDex,
      isDexAllowance,
      isMultisig,
      outerTxTag,
    } = useTransactionTx({
      store,
      externalAddress: externalAddress.value,
    });

    const { isLocalAccountAddress } = useAccounts({
      store,
    });

    const transaction = ref<ITransaction>();
    const multisigContractId = ref<string>();

    const getTx = computed(() => store.getters.getTx);
    const getTxSymbol = computed(() => store.getters.getTxSymbol);
    const getTxAmountTotal = computed(() => store.getters.getTxAmountTotal);
    const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);

    const tipUrl = computed(() => transaction.value ? getTransactionTipUrl(transaction.value) : '');
    const contractId = computed(() => transaction.value?.tx.contractId);
    const txFunction = computed(() => transaction.value?.tx?.function as TxFunctionRaw | undefined);
    const isSwap = computed(() => isTxFunctionDexSwap(txFunction.value));
    const isPool = computed(() => isTxFunctionDexPool(txFunction.value));
    const tipLink = computed(() => /^http[s]*:\/\//.test(tipUrl.value) ? tipUrl.value : `http://${tipUrl.value}`);
    const explorerUrl = computed(
      () => (new AeScan(activeNetwork.value.explorerUrl)).prepareUrlByHash(hash),
    );

    const gasPrice = computed(() => {
      if (transaction.value?.tx?.tx?.tx && 'gasPrice' in transaction.value?.tx?.tx?.tx) {
        return transaction.value.tx.tx.tx.gasPrice;
      }
      return transaction.value?.tx?.gasPrice;
    });

    const gasUsed = computed(() => {
      if (transaction.value?.tx?.tx?.tx && 'gasUsed' in transaction.value.tx.tx.tx) {
        return transaction.value.tx.tx.tx.gasUsed;
      }
      return transaction.value?.tx?.gasUsed;
    });

    const multisigTransactionFeePaidBy = computed((): string | null => {
      if (outerTxTag.value !== Tag.PayingForTx) return null;
      return transaction.value?.tx?.payerId ?? null;
    });

    /**
     * Computes the total transaction fee, which is the sum of the fee of the main transaction
     * and any additional fee from nested transactions.
     * @returns {number} The total transaction fee.
     */
    const transactionFee = computed((): number => {
      const { tx } = transaction.value ?? {};
      const fee = tx?.fee ?? 0;
      const extraFee = tx?.tx?.tx?.fee ?? 0;
      return fee + extraFee;
    });

    onMounted(async () => {
      let rawTransaction = getTx.value(hash);
      if (!rawTransaction || rawTransaction.incomplete) {
        const middleware = await getMiddleware();
        try {
          rawTransaction = await middleware.getTx(hash);
        } catch (e) {
          router.push({ name: ROUTE_NOT_FOUND });
        }

        if (rawTransaction?.tx) {
          if (props.multisigDashboard) {
            await watchUntilTruthy(() => activeMultisigAccountId.value);
          } else {
            await watchUntilTruthy(() => activeAccount.value);
          }
          setExternalAddress(externalAddress.value);
          transaction.value = {
            ...rawTransaction,
            transactionOwner: externalAddress.value,
          };
          store.commit('setTransactionByHash', transaction.value);
        }
      } else {
        transaction.value = rawTransaction;
      }
      if (transaction.value?.tx) {
        setTransactionTx(transaction.value.tx);
      }

      if (outerTxTag.value === Tag.GaMetaTx) {
        try {
          const { contract_id: contractIdForMultisig = null } = await fetchJson(
            `${activeNetwork.value.url}/v3/accounts/${transaction.value?.tx?.gaId}`,
          );
          multisigContractId.value = contractIdForMultisig;
        } catch (e) {
          handleUnknownError(e);
        }
      }
    });

    return {
      AE_SYMBOL,
      transaction,
      isSwap,
      isPool,
      getTxSymbol,
      getTxAmountTotal,
      isErrorTransaction,
      isDexAllowance,
      isDex,
      isTransactionAex9,
      getTransactionPayload,
      isMultisig,
      tipUrl,
      tipLink,
      direction,
      explorerUrl,
      hash,
      splitAddress,
      aettosToAe,
      formatDate,
      formatTime,
      isLocalAccountAddress,
      gasPrice,
      gasUsed,
      contractId,
      multisigTransactionFeePaidBy,
      multisigContractId,
      transactionFee,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables';
@use '@/styles/typography';
@use '@/styles/mixins';

.transaction-details {
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

  .row {
    @include mixins.flex(flex-start, center, row);

    gap: 8px;
  }

  .header {
    @include mixins.flex(center, center, column);

    min-height: 73px;
    position: initial;

    @include mixins.mobile {
      width: 100%;
    }

    .transaction-token-rows {
      &.reverse {
        display: flex;
        flex-direction: column-reverse;
      }

      :deep(.token-row) {
        margin-bottom: 12px;
        padding-inline: 16px;

        .amount {
          @extend %face-sans-18-regular;
        }

        .tokens {
          @extend %face-sans-18-medium;

          color: rgba(variables.$color-white, 0.75);
        }
      }
    }
  }

  .span-3-columns {
    @include mixins.flex(flex-start, flex-start);

    column-gap: 24px;
  }

  .content {
    background-color: variables.$color-bg-4;

    .transaction-overview {
      padding: 16px 12px 8px;
    }

    .pool-tokens.reverse {
      flex-direction: column-reverse;
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

      .link-button {
        @extend %face-sans-14-medium;

        text-decoration: none;
        color: rgba(variables.$color-white, 0.75);

        svg {
          opacity: 1;
          color: rgba(variables.$color-white, 0.75);
          width: 24px;
          height: 24px;
        }

        &:hover {
          color: variables.$color-white;
          text-decoration: underline;

          svg {
            color: variables.$color-white;
          }
        }
      }
    }

    .payer-id {
      position: relative;

      .dialog-box {
        width: 30px;
        height: 20px;
        position: absolute;
        right: 15px;
        top: -28px;
      }
    }
  }

  .details-item:deep() {
    .label {
      white-space: nowrap;
    }
  }

  .reason:deep() {
    .value {
      word-break: break-all;
      color: variables.$color-warning;
    }
  }
}
</style>