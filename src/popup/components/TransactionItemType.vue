<template>
  <div class="transaction-item-type">
    <PendingIcon
      v-if="transaction.pending"
      class="icon"
    />
    <div
      v-else-if="isErrorTransaction"
      class="error"
    >
      <WarningIcon
        v-if="transaction.tx.returnType === 'abort'"
        class="icon"
      />
      <RevertedIcon
        v-else
        class="icon"
      />
    </div>
    <div class="label">
      <span v-if="label.customPending && isErrorTransaction">
        {{ label.customPending }}
      </span>
      <span
        v-else-if="!transaction.pending"
        class="type"
        :class="{ gray: transaction.transactionOwner }"
      >
        {{ label.text || label }}
      </span>
      <span
        v-if="isErrorTransaction"
        class="error-type"
      >
        {{ $t('transaction.returnType')[transaction.tx.returnType] }}
      </span>
      <span
        v-if="transaction.pending"
        :class="{ gray: !label.customPending || transaction.transactionOwner }"
      >
        {{ label.customPending || $t('transaction.type.pending') }}...
      </span>
      <span
        v-else-if="!transaction.transactionOwner"
        class="gray"
      >{{ transactionDate }}</span>
      <span v-if="transaction.transactionOwner">
        {{ $t('by') }} {{ ownerName }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed, defineComponent, PropType,
} from '@vue/composition-api';
import { SCHEMA } from '@aeternity/aepp-sdk';
import PendingIcon from '../../icons/animated-pending.svg?vue-component';
import RevertedIcon from '../../icons/refresh.svg?vue-component';
import WarningIcon from '../../icons/warning.svg?vue-component';
import type { TransactionType, IDashboardTransaction, IAccount } from '../../types';
import { FUNCTION_TYPE_DEX } from '../utils';

import { useGetter } from '../../composables/vuex';
import { useTransactionToken } from '../../composables';

export default defineComponent({
  components: {
    PendingIcon,
    RevertedIcon,
    WarningIcon,
  },
  props: {
    transaction: { type: Object as PropType<IDashboardTransaction>, required: true },
    transactionDate: { type: String, default: '' },
  },
  setup(props, { root }) {
    const activeNetwork = useGetter('activeNetwork');
    const account = useGetter('account');
    const accounts = useGetter('accounts');

    const {
      txType,
      getTxDirection,
      isAllowance,
      isDex,
      availableTokens,
      isErrorTransaction,
    } = useTransactionToken({ store: root.$store, initTransaction: props.transaction });

    const label = computed(() => {
      const transactionTypes = root.$t('transaction.type') as Record<TransactionType, any>;
      const transactionListTypes = root.$t('transaction.listType') as Record<TransactionType, any>;

      if (txType.value === SCHEMA.TX_TYPE.spend) {
        const isSent = getTxDirection.value(props.transaction, props.transaction.transactionOwner) === 'sent';
        return {
          text: isSent
            ? root.$t('transaction.listType.sentTx')
            : root.$t('transaction.listType.receivedTx'),
          customPending: isSent
            ? root.$t('transaction.type.sentTx')
            : root.$t('transaction.type.receivedTx'),
        };
      }
      if (isAllowance.value) {
        return root.$t('transaction.dexType.allow_token');
      }
      if (isDex.value) {
        return FUNCTION_TYPE_DEX.pool.includes(props.transaction.tx.function)
          ? root.$t('transaction.dexType.pool')
          : root.$t('transaction.dexType.swap');
      }
      if (
        (
          props.transaction.tx.contractId
          && [
            activeNetwork.value.tipContractV1,
            activeNetwork.value.tipContractV2,
          ].includes(props.transaction.tx.contractId)
          && ['tip', 'retip'].includes(props.transaction.tx.function)
        )
          || props.transaction.claim
      ) {
        return props.transaction.claim
          ? root.$t('transaction.listType.tipReceived')
          : root.$t('transaction.listType.tipSent');
      }
      if (
        txType.value === SCHEMA.TX_TYPE.contractCall
          && availableTokens.value[props.transaction.tx.contractId]
          && (props.transaction.tx.function === 'transfer' || props.transaction.incomplete)
      ) {
        const isSent = !props.transaction.transactionOwner
          ? props.transaction.tx.callerId === account.value.address
          : props.transaction.transactionOwner === props.transaction.tx.callerId;
        return {
          text: isSent
            ? root.$t('transaction.listType.sentTx')
            : root.$t('transaction.listType.receivedTx'),
          customPending: isSent
            ? root.$t('transaction.type.sentTx')
            : root.$t('transaction.type.receivedTx'),
        };
      }

      return transactionListTypes[txType.value] || transactionTypes[txType.value];
    });

    const ownerName = computed(() => {
      const resultIndex = accounts.value.findIndex((acc: IAccount) => (
        acc.address === props.transaction.transactionOwner
      ));

      return accounts.value[resultIndex]?.name || `${root.$t('pages.account.heading')} ${resultIndex + 1}`;
    });

    return {
      PendingIcon,
      RevertedIcon,
      WarningIcon,
      label,
      ownerName,
      isErrorTransaction,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.transaction-item-type {
  @include mixins.flex(flex-start, center, row);

  .label {
    @extend %face-sans-12-medium;

    color: variables.$color-white;

    .type {
      text-transform: capitalize;
    }

    .error-type {
      text-transform: lowercase;
    }
  }

  .gray {
    @extend %face-sans-12-regular;

    color: rgba(variables.$color-white, 0.75);
  }

  .icon {
    width: 16px;
    height: 16px;
    color: variables.$color-white;
    margin-left: 1px;
    margin-right: 2px;
  }

  .error {
    display: flex;
    color: variables.$color-warning;

    .icon {
      color: variables.$color-warning;
    }
  }
}
</style>
