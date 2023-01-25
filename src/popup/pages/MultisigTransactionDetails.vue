<template>
  <div class="transaction-details">
    <AnimatedSpinner
      v-if="!transaction || transaction.incomplete"
      class="spinner"
    />
    <template v-else>
      <div
        v-if="!isAllowance || isErrorTransaction"
        class="header"
      >
        <TransactionErrorStatus
          v-if="isErrorTransaction"
          :return-type="transaction.tx.returnType"
        />
        <TransactionTokens
          :tokens="tokens"
          :error="isErrorTransaction"
          :class="{ reverse: isPool }"
          icon-size="md"
        />
      </div>
      <div class="content">
        <TransactionOverview :tx="transaction.tx" />
        <div class="explorer">
          <LinkButton :to="explorerPath">
            {{ $t('pages.transactionDetails.explorer') }}
            <ExternalLink />
          </LinkButton>
        </div>
        <div class="data-grid">
          <DetailsItem
            v-if="isErrorTransaction"
            :label="$t('pages.transactionDetails.reason')"
            :value="transaction.tx.return"
            class="reason"
            data-cy="reason"
          />

          <DetailsItem
            label="Receiving address"
            small
          >
            <template #value>
              <CopyText
                hide-icon
                :value="receivingAddress"
                :copied-text="$t('hashCopied')"
              >
                <span class="text-address">{{ splitAddress(receivingAddress) }}</span>
              </CopyText>
            </template>
          </DetailsItem>

          <DetailsItem
            label="Proposed by"
            small
          >
            <template #value>
              <LinkButton :to="explorerPath">
                <Avatar
                  :address="proposedBy"
                  size="sm"
                />
                <AddressTruncated
                  :address="proposedBy"
                  class="ae-address"
                />
                <ExternalLink />
              </LinkButton>
            </template>
          </DetailsItem>

          <TransactionMultisigConsensus
            v-if="consensus"
            :consensus="consensus"
            :signers="signers"
          />

          <DetailsItem
            :label="$t('pages.transactionDetails.hash')"
            data-cy="hash"
            small
          >
            <template #value>
              <CopyText
                hide-icon
                :value="hash"
                :copied-text="$t('hashCopied')"
              >
                <span class="text-address">{{ splitAddress(hash) }}</span>
              </CopyText>
            </template>
          </DetailsItem>

          <PayloadDetails :payload="getPayload(transaction)" />

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
                {{ $t('pages.transactionDetails.pending') }}...
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
            v-if="!(isDex || isAllowance)"
            :label="$t('pages.transactionDetails.amount')"
            data-cy="amount"
          >
            <template #value>
              <TokenAmount
                :amount="getTxAmountTotal(transaction)"
                :symbol="getTxSymbol(transaction)"
                :hide-fiat="isTxAex9(transaction)"
              />
            </template>
          </DetailsItem>
          <DetailsItem
            v-if="transaction.tx.gasPrice"
            :label="$t('pages.transactionDetails.gasPrice')"
            data-cy="gas-price"
          >
            <template #value>
              <TokenAmount
                :amount="+(aettosToAe(transaction.tx.gasPrice))"
                symbol="AE"
                hide-fiat
              />
            </template>
          </DetailsItem>
          <DetailsItem
            v-if="transaction.tx.gasUsed"
            :value="transaction.tx.gasUsed"
            :label="$t('pages.transactionDetails.gasUsed')"
            data-cy="gas"
          />
          <DetailsItem
            v-if="transaction.tx.fee"
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
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import {
  computed, defineComponent, ref, onMounted,
} from '@vue/composition-api';
import {
  FUNCTION_TYPE_DEX,
  formatDate,
  formatTime,
  aettosToAe,
  watchUntilTruthy,
  splitAddress,
  AETERNITY_SYMBOL,
  getPayload,
} from '../utils';
import { ROUTE_NOT_FOUND } from '../router/routeNames';
import type { ITransaction } from '../../types';
import { useTransaction } from '../../composables';
import { useMultisigContract } from '../../composables/multisigContract';
import TransactionOverview from '../components/TransactionOverview.vue';
import TokenAmount from '../components/TokenAmount.vue';
import DetailsItem from '../components/DetailsItem.vue';
import LinkButton from '../components/LinkButton.vue';
import Avatar from '../components/Avatar.vue';
import AddressTruncated from '../components/AddressTruncated.vue';
import TransactionMultisigConsensus from '../components/TransactionMultisigConsensus.vue';
import TransactionTokens from '../components/TransactionTokenRows.vue';
import CopyText from '../components/CopyText.vue';
import PayloadDetails from '../components/PayloadDetails.vue';
import TransactionErrorStatus from '../components/TransactionErrorStatus.vue';

import AnimatedPending from '../../icons/animated-pending.svg?vue-component';
import AnimatedSpinner from '../../icons/animated-spinner.svg?skip-optimize';
import ExternalLink from '../../icons/external-link.svg?vue-component';

export default defineComponent({
  name: 'MultisigTransactionDetails',
  components: {
    TransactionMultisigConsensus,
    PayloadDetails,
    TransactionErrorStatus,
    TransactionTokens,
    TransactionOverview,
    TokenAmount,
    DetailsItem,
    LinkButton,
    Avatar,
    AddressTruncated,
    CopyText,
    AnimatedPending,
    AnimatedSpinner,
    ExternalLink,
  },
  props: {
    hash: { type: String, required: true },
  },
  setup(props, { root }) {
    const {
      setTransaction,
      isErrorTransaction,
      isAllowance,
      tokens,
      isDex,
    } = useTransaction({
      store: root.$store,
      showDetailedAllowanceInfo: true,
    });
    const {
      loadMultisigContract,
      receivingAddress,
      proposedBy,
      signers,
      confirmedBy,
      confirmationsRequired,
      consensus,
    } = useMultisigContract({
      store: root.$store,
    });

    const transaction = ref<ITransaction>();

    const getTx = computed(() => root.$store.getters.getTx);
    const getTxTipUrl = computed(() => root.$store.getters.getTxTipUrl);
    const getExplorerPath = computed(() => root.$store.getters.getExplorerPath);
    const isTxAex9 = computed(() => root.$store.getters.isTxAex9);
    const getTxSymbol = computed(() => root.$store.getters.getTxSymbol);
    const getTxAmountTotal = computed(() => root.$store.getters.getTxAmountTotal);

    const tipUrl = computed(() => getTxTipUrl.value(transaction.value));
    const isSwap = computed(() => FUNCTION_TYPE_DEX.swap.includes(transaction.value?.tx?.function || ''));
    const isPool = computed(() => FUNCTION_TYPE_DEX.pool.includes(transaction.value?.tx?.function || ''));
    const tipLink = computed(() => /^http[s]*:\/\//.test(tipUrl.value) ? tipUrl.value : `http://${tipUrl.value}`);
    const explorerPath = computed(() => getExplorerPath.value(props.hash));

    onMounted(async () => {
      transaction.value = getTx.value(props.hash);
      if (!transaction.value || transaction.value.incomplete) {
        await watchUntilTruthy(() => root.$store.state.middleware);
        try {
          transaction.value = await root.$store.state?.middleware.getTxByHash(props.hash);
        } catch (e) {
          root.$router.push({ name: ROUTE_NOT_FOUND });
        }

        root.$store.commit('setTransactionByHash', transaction.value);
      }
      if (transaction.value) {
        setTransaction(transaction.value);
        loadMultisigContract(transaction.value);
      }
    });

    return {
      AETERNITY_SYMBOL,
      transaction,
      isSwap,
      isPool,
      getTxSymbol,
      getTxAmountTotal,
      isErrorTransaction,
      isAllowance,
      tokens,
      isDex,
      isTxAex9,
      tipUrl,
      tipLink,
      explorerPath,
      getPayload,
      splitAddress,
      aettosToAe,
      formatDate,
      formatTime,

      //
      receivingAddress,
      proposedBy,
      signers,
      confirmedBy,
      confirmationsRequired,
      consensus,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

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

      ::v-deep .token-row {
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

    .ae-address {
      @extend %face-mono-12-medium;

      display: flex;
      align-items: center;
      gap: 2px;
      padding: 4px;
      color: rgba(variables.$color-white, 0.85);
      letter-spacing: 0.07em;

      .icon {
        width: 22px;
        height: 22px;
        margin-left: 2px;
        color: rgba(variables.$color-white, 0.85);
      }
    }

    .consensus {
      .signer {
        display: flex;
        align-items: center;
        padding: 4px 0;
      }
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
}
</style>
