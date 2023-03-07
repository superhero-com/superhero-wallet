<template>
  <div
    ref="transactionLabelRef"
    class="transaction-label"
  >
    <PendingIcon
      v-if="transaction.pending"
      class="icon"
    />
    <div
      v-else-if="isErrorTransaction"
      class="error"
    >
      <WarningIcon
        v-if="transaction.tx.returnType === ABORT_TX_TYPE"
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
        ref="labelRef"
        class="type"
        :class="{ secondary: showTransactionOwner }"
      >
        {{ label.text }}
        <span
          v-if="label.hasComma && !showTransactionOwner"
          class="secondary"
        >
          ,
        </span>
      </span>
      <span
        v-if="isErrorTransaction"
        class="error-type"
      >
        {{ $t('transaction.returnType')[transaction.tx.returnType] }}
      </span>
      <span
        v-if="transaction.pending"
        :class="{ secondary: !label.customPending || showTransactionOwner }"
      >
        {{ label.customPending || $t('transaction.type.pending') }}...
      </span>
      <span
        v-else-if="!showTransactionOwner"
        class="secondary"
      >
        {{ transactionDate }}
      </span>

      <div
        v-if="showTransactionOwner"
        class="owner"
      >
        <span class="secondary">{{ $t('common.by') }}</span>
        <Truncate
          :key="truncateWidth"
          class="account-name-truncated"
          :str="ownerName"
          :style="{ width: truncateWidth }"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent, onMounted,
  PropType, ref,
} from '@vue/composition-api';
import { SCHEMA } from '@aeternity/aepp-sdk';
import { TranslateResult } from 'vue-i18n';
import { useTransactionTx } from '../../composables';
import { useGetter, useState } from '../../composables/vuex';
import {
  IAccount,
  INetwork,
  ITokenList,
  ITransaction,
  ILabel,
  TxFunction,
  TxFunctionRaw,
  TxType,
} from '../../types';
import {
  ABORT_TX_TYPE,
  FUNCTION_TYPE_DEX,
  getAccountNameToDisplay,
  TX_FUNCTIONS,
  TX_TYPE_MDW,
} from '../utils';
import Truncate from './Truncate.vue';
import PendingIcon from '../../icons/animated-pending.svg?vue-component';
import RevertedIcon from '../../icons/refresh.svg?vue-component';
import WarningIcon from '../../icons/warning.svg?vue-component';

export default defineComponent({
  components: {
    Truncate,
    PendingIcon,
    RevertedIcon,
    WarningIcon,
  },
  props: {
    transaction: { type: Object as PropType<ITransaction>, required: true },
    transactionDate: { type: String, default: '' },
    showTransactionOwner: Boolean,
    dense: Boolean,
  },
  setup(props, { root }) {
    const {
      outerTxType,
      txType,
      isAllowance,
      isDex,
      innerTx,
      isErrorTransaction,
    } = useTransactionTx({ store: root.$store, tx: props.transaction.tx });

    const account = useGetter<IAccount>('account');
    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');
    const getTxDirection = useGetter('getTxDirection');
    const accounts = useGetter('accounts');

    const transactionLabelRef = ref();
    const labelRef = ref();
    const truncateWidth = ref<string | number>('100%');
    const labelWrapper = (text: TranslateResult = ''): ILabel => ({ text });

    const label = computed((): ILabel => {
      const transactionTypes = root.$t('transaction.type') as Record<TxType, TranslateResult>;
      const transactionListTypes = root.$t('transaction.listType') as Record<TxType, TranslateResult>;

      if (txType.value === SCHEMA.TX_TYPE.spend) {
        const isSent = getTxDirection.value(
          innerTx.value,
          props.transaction.transactionOwner,
        ) === 'sent';
        return {
          text: isSent
            ? root.$t('transaction.listType.sentTx')
            : root.$t('transaction.listType.receivedTx'),
          customPending: isSent
            ? root.$t('transaction.type.sentTx')
            : root.$t('transaction.type.receivedTx'),
        };
      }
      if (
        txType.value === TX_TYPE_MDW.GAAttachTx
        && outerTxType.value === TX_TYPE_MDW.PayingForTx
      ) {
        return labelWrapper(root.$t('transaction.type.multisigVaultCreated'));
      }
      if (isAllowance.value) {
        return labelWrapper(root.$t('transaction.dexType.allowToken'));
      }
      if (isDex.value) {
        if (FUNCTION_TYPE_DEX.addLiquidity.includes(innerTx.value?.function as TxFunctionRaw)) {
          return labelWrapper(root.$t('transaction.dexType.provideLiquidity'));
        }
        if (FUNCTION_TYPE_DEX.removeLiquidity.includes(
          innerTx.value?.function as TxFunctionRaw,
        )) {
          return labelWrapper(root.$t('transaction.dexType.removeLiquidity'));
        }
        return { text: root.$t('transaction.dexType.swap'), hasComma: true };
      }
      if (
        (
          innerTx.value.contractId
          && [
            activeNetwork.value.tipContractV1,
            activeNetwork.value.tipContractV2,
          ].includes(innerTx.value.contractId)
          && ([TX_FUNCTIONS.tip, TX_FUNCTIONS.retip] as TxFunction[])
            .includes(innerTx.value?.function!)
        )
        || props.transaction.claim
      ) {
        return labelWrapper(props.transaction.claim
          ? root.$t('transaction.listType.tipReceived')
          : root.$t('transaction.listType.tipSent'));
      }
      if (
        txType.value === SCHEMA.TX_TYPE.contractCall
        && availableTokens.value[innerTx.value.contractId]
        && (innerTx.value.function === TX_FUNCTIONS.transfer
          || props.transaction.incomplete)
      ) {
        const isSent = !props.transaction.transactionOwner
          ? innerTx.value.callerId === account.value.address
          : props.transaction.transactionOwner === innerTx.value.callerId;

        return {
          text: isSent
            ? root.$t('transaction.listType.sentTx')
            : root.$t('transaction.listType.receivedTx'),
          customPending: isSent
            ? root.$t('transaction.type.sentTx')
            : root.$t('transaction.type.receivedTx'),
        };
      }

      const translation = transactionListTypes[txType.value!] || transactionTypes[txType.value!];

      if (txType.value && txType?.value?.includes('name')) {
        return labelWrapper(translation);
      }

      return props.transaction.transactionOwner
        ? labelWrapper(translation)
        : { text: translation, hasComma: true };
    });

    const ownerName = computed(() => getAccountNameToDisplay(
      accounts.value.find((acc: IAccount) => (
        acc.address === props.transaction.transactionOwner
      )),
    ));

    onMounted(() => {
      truncateWidth.value = (
        `${transactionLabelRef.value?.clientWidth - (labelRef.value?.clientWidth || 0) - 25}px`
      );
    });

    return {
      isErrorTransaction,
      ownerName,
      label,
      transactionLabelRef,
      labelRef,
      truncateWidth,
      ABORT_TX_TYPE,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.transaction-label {
  @include mixins.flex(flex-start, center, row);

  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  .label {
    @extend %face-sans-12-medium;

    color: variables.$color-white;

    .type {
      display: flex;
    }

    .error-type {
      text-transform: lowercase;
    }
  }

  .secondary {
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

  .label,
  .owner {
    display: flex;
    gap: 4px;
  }

  .account-name-truncated {
    width: calc(100%);
  }
}
</style>
