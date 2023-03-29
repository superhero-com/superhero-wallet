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
        {{ $t(`transaction.returnType.${transaction.tx.returnType}`) }}
      </span>
      <span
        v-if="transaction.pending"
        :class="{ secondary: !label.customPending || showTransactionOwner }"
      >
        {{ label.customPending || $t('common.pending') }}...
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
        <Truncate :str="ownerName" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import { Tag } from '@aeternity/aepp-sdk-13';
import { TranslateResult, useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { camelCase } from 'lodash-es';

import { useAccounts, useTransactionTx } from '../../composables';
import { useGetter, useState } from '../../composables/vuex';
import {
  INetwork,
  ITokenList,
  ITransaction,
  ILabel,
  TxFunction,
  TxFunctionRaw,
} from '../../types';
import {
  ABORT_TX_TYPE,
  FUNCTION_TYPE_DEX,
  getAccountNameToDisplay,
  NAME_TAGS,
  TX_FUNCTIONS,
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
  setup(props) {
    const store = useStore();
    const { accounts, activeAccount } = useAccounts({ store });
    const { t } = useI18n();

    const {
      outerTxType,
      innerTxType,
      isAllowance,
      isDex,
      innerTx,
      isErrorTransaction,
    } = useTransactionTx({ store, tx: props.transaction.tx });

    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const availableTokens = useState<ITokenList>('fungibleTokens', 'availableTokens');
    const getTxDirection = useGetter('getTxDirection');
    const labelWrapper = (text: TranslateResult = ''): ILabel => ({ text });

    const label = computed((): ILabel => {
      if (
        outerTxType.value === Tag.SpendTx
        || (outerTxType.value === Tag.GaMetaTx && innerTxType.value === Tag.SpendTx)
      ) {
        const isSent = getTxDirection.value(
          innerTx.value,
          props.transaction.transactionOwner,
        ) === 'sent';
        return {
          text: isSent
            ? t('transaction.listType.sentTx')
            : t('transaction.listType.receivedTx'),
          customPending: isSent
            ? t('transaction.type.sentTx')
            : t('transaction.type.receivedTx'),
        };
      }
      if (outerTxType.value === Tag.PayingForTx && innerTxType.value === Tag.GaAttachTx) {
        return labelWrapper(t('transaction.type.multisigVaultCreated'));
      }
      if (isAllowance.value) {
        return labelWrapper(t('transaction.dexType.allowToken'));
      }
      if (isDex.value) {
        if (FUNCTION_TYPE_DEX.addLiquidity.includes(innerTx.value?.function as TxFunctionRaw)) {
          return labelWrapper(t('transaction.dexType.provideLiquidity'));
        }
        if (FUNCTION_TYPE_DEX.removeLiquidity.includes(
          innerTx.value?.function as TxFunctionRaw,
        )) {
          return labelWrapper(t('transaction.dexType.removeLiquidity'));
        }
        return { text: t('common.swap'), hasComma: true };
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
          ? t('transaction.listType.tipReceived')
          : t('transaction.listType.tipSent'));
      }
      if (
        outerTxType.value === Tag.ContractCallTx
        && availableTokens.value[innerTx.value.contractId]
        && (innerTx.value.function === TX_FUNCTIONS.transfer
          || props.transaction.incomplete)
      ) {
        const isSent = !props.transaction.transactionOwner
          ? innerTx.value.callerId === activeAccount.value.address
          : props.transaction.transactionOwner === innerTx.value.callerId;

        return {
          text: isSent
            ? t('transaction.listType.sentTx')
            : t('transaction.listType.receivedTx'),
          customPending: isSent
            ? t('transaction.type.sentTx')
            : t('transaction.type.receivedTx'),
        };
      }
      // TODO refactor from dynamic translation keys to map of translations
      const translation = !t(`transaction.listType.${camelCase(Tag[outerTxType.value!])}`).includes('listType')
        ? t(`transaction.listType.${camelCase(Tag[outerTxType.value!])}`)
        : t(`transaction.type.${camelCase(Tag[outerTxType.value!])}`);

      if (outerTxType.value && NAME_TAGS.has(outerTxType?.value)) {
        return labelWrapper(translation);
      }

      return props.transaction.transactionOwner
        ? labelWrapper(translation)
        : { text: translation, hasComma: true };
    });

    const ownerName = computed(() => getAccountNameToDisplay(
      accounts.value.find((acc) => acc.address === props.transaction.transactionOwner),
    ));

    return {
      isErrorTransaction,
      ownerName,
      label,
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
  flex: 1 1 50%;
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
    min-width: 16px;
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
    width: 100%;
    display: flex;
    gap: 4px;
  }

  .owner {
    min-width: 0;
  }
}
</style>
