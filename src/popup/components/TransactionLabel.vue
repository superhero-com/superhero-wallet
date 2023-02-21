<template>
  <div
    ref="transactionLabelRef"
    class="transaction-label"
  >
    <PendingIcon
      v-if="isPending"
      class="icon"
    />
    <div
      v-else-if="isErrorTransaction"
      class="error"
    >
      <WarningIcon
        v-if="tx.returnType === ABORT_TX_TYPE"
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
        v-else-if="!isPending"
        ref="labelRef"
        class="type"
        :class="{ secondary: transactionOwner }"
      >
        <span
          v-if="externalLabel.length"
        >
          {{ externalLabel }}
          &nbsp;
        </span>
        {{ label.text }}
      </span>
      <span
        v-if="isErrorTransaction"
        class="error-type"
      >
        {{ $t('transaction.returnType')[tx.returnType] }}
      </span>
      <span
        v-if="isPending"
        :class="{ secondary: !label.customPending || transactionOwner }"
      >
        {{ label.customPending || $t('transaction.type.pending') }}...
      </span>
      <span
        v-else-if="!transactionOwner"
        class="secondary"
      >{{ transactionDate }}</span>

      <div
        v-if="transactionOwner"
        class="owner"
      >
        <span class="secondary">{{ $t('common.by') }}</span>
        <Truncate
          :key="truncateWidth"
          class="account-name-truncated"
          :str="ownerName"
          gradient-color="transparent"
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
  ITx,
  ILabel,
  TxFunction,
  TxFunctionRaw,
  TxType,
} from '../../types';
import {
  ABORT_TX_TYPE,
  FUNCTION_TYPE_DEX,
  getAccountNameToDisplay,
  getInnerTransaction,
  getTxType,
  TX_FUNCTIONS, TX_TYPE_MDW,
} from '../utils';
import Truncate from './Truncate.vue';
import PendingIcon from '../../icons/animated-pending.svg?vue-component';
import RevertedIcon from '../../icons/refresh.svg?vue-component';
import WarningIcon from '../../icons/warning.svg?vue-component';
import { i18n } from '../../store/plugins/languages';

export default defineComponent({
  components: {
    Truncate,
    PendingIcon,
    RevertedIcon,
    WarningIcon,
  },
  props: {
    tx: { type: Object as PropType<ITx>, required: true },
    transactionDate: { type: String, default: '' },
    transactionOwner: { type: String, default: null },
    consensus: { type: String, default: null },
    isErrorTransaction: Boolean,
    isIncomplete: Boolean,
    isPending: Boolean,
    isClaim: Boolean,
    dense: Boolean,
  },
  setup(props, { root }) {
    const lastNestedInnerTx = getInnerTransaction(props.tx);

    const {
      txType,
      isAllowance,
      isDex,
    } = useTransactionTx({ store: root.$store, tx: lastNestedInnerTx });

    const account = useGetter<IAccount>('account');
    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');
    const getTxDirection = useGetter('getTxDirection');
    const accounts = useGetter('accounts');
    const externalTxType = getTxType(props.tx);

    const transactionLabelRef = ref();
    const labelRef = ref();
    const truncateWidth = ref<string | number>('auto');
    const addComma = (text: TranslateResult) => text ? `${text},` : '';
    const labelWrapper = (text: TranslateResult = ''): ILabel => ({ text });

    const externalLabel = computed(() => {
      if (externalTxType === TX_TYPE_MDW.GAMetaTx) {
        return i18n.t('transaction.type.gaMetaTx');
      }
      if (externalTxType === TX_TYPE_MDW.PayingForTx) {
        return i18n.t('transaction.type.payingForTx');
      }
      return '';
    });

    const label = computed((): ILabel => {
      const transactionTypes = root.$t('transaction.type') as Record<TxType, TranslateResult>;
      const transactionListTypes = root.$t('transaction.listType') as Record<TxType, TranslateResult>;

      if (txType.value === SCHEMA.TX_TYPE.spend) {
        const isSent = getTxDirection.value(props.tx, props.transactionOwner) === 'sent';
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
        return labelWrapper(root.$t('transaction.dexType.allowToken'));
      }
      if (isDex.value) {
        if (FUNCTION_TYPE_DEX.addLiquidity.includes(lastNestedInnerTx?.function as TxFunctionRaw)) {
          return labelWrapper(root.$t('transaction.dexType.provideLiquidity'));
        }
        if (FUNCTION_TYPE_DEX.removeLiquidity.includes(
          lastNestedInnerTx?.function as TxFunctionRaw,
        )) {
          return labelWrapper(root.$t('transaction.dexType.removeLiquidity'));
        }
        return labelWrapper(addComma(root.$t('transaction.dexType.swap')));
      }
      if (
        (
          lastNestedInnerTx.contractId
          && [
            activeNetwork.value.tipContractV1,
            activeNetwork.value.tipContractV2,
          ].includes(lastNestedInnerTx.contractId)
          && ([TX_FUNCTIONS.tip, TX_FUNCTIONS.retip] as TxFunction[])
            .includes(lastNestedInnerTx?.function!)
        )
        || props.isClaim
      ) {
        return labelWrapper(props.isClaim
          ? root.$t('transaction.listType.tipReceived')
          : root.$t('transaction.listType.tipSent'));
      }
      if (
        txType.value === SCHEMA.TX_TYPE.contractCall
        && availableTokens.value[lastNestedInnerTx.contractId]
        && (lastNestedInnerTx.function === TX_FUNCTIONS.transfer
          || props.isIncomplete)
      ) {
        const isSent = !props.transactionOwner
          ? lastNestedInnerTx.callerId === account.value.address
          : props.transactionOwner === props.tx.callerId;

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

      if (txType.value?.includes('name')) {
        return labelWrapper(translation);
      }

      return labelWrapper(
        props.transactionOwner ? translation : addComma(translation),
      );
    });

    const ownerName = computed(() => getAccountNameToDisplay(
      accounts.value.find((acc: IAccount) => (
        acc.address === props.transactionOwner
      )),
    ));

    onMounted(() => {
      truncateWidth.value = `${transactionLabelRef.value.clientWidth - labelRef.value.clientWidth - 25}px`;
    });

    return {
      ownerName,
      label,
      externalLabel,
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

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  .label {
    @extend %face-sans-12-medium;

    color: variables.$color-white;

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
    gap: 5px;
  }

  .account-name-truncated {
    width: calc(100%);
  }
}
</style>
