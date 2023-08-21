<template>
  <div
    class="transaction-tag-list"
    :class="{ dense }"
  >
    <TransactionTag
      v-for="label in labels"
      :key="label"
      :tx-type="label"
      class="title-tag"
      data-cy="label"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { Tag } from '@aeternity/aepp-sdk';
import { useStore } from 'vuex';
import { useTransactionTx } from '../../composables';
import {
  INetwork,
  ITokenList,
  ITransaction,
} from '../../types';
import {
  AENS,
  DEX,
  TX_DIRECTION,
  TX_FUNCTIONS,
  TX_TAGS_AENS,
  excludeFalsy,
  includes,
  isTxFunctionDexPool,
} from '../utils';

import TransactionTag from './TransactionTag.vue';

export default defineComponent({
  components: {
    TransactionTag,
  },
  props: {
    customTitle: { type: String, default: null },
    transaction: { type: Object as PropType<ITransaction>, default: null },
    dense: Boolean,
  },
  setup(props) {
    const store = useStore();
    const { t } = useI18n();
    const {
      direction,
      innerTx,
      innerTxTag,
      outerTxTag,
      txTypeLabel,
      txFunctionLabel,
      isDex,
      isDexAllowance,
    } = useTransactionTx({
      store,
      tx: props.transaction?.tx,
      externalAddress: props.transaction?.transactionOwner,
    });

    const activeNetwork = computed<INetwork>(() => store.getters.activeNetwork);
    const availableTokens = computed<ITokenList>(
      () => store.state.fungibleTokens.availableTokens,
    );

    const labels = computed((): string[] => {
      if (props.customTitle) {
        return [props.customTitle];
      }
      if (
        !props.transaction?.tx
        || props.transaction.pending
        || outerTxTag.value === Tag.NameTransferTx // Unsupported type
      ) {
        return [];
      }

      const { tipContractV1, tipContractV2 } = activeNetwork.value;
      const arr: string[] = [];

      if (outerTxTag.value === Tag.GaMetaTx) {
        arr.push(t('transaction.type.gaMetaTx'));
      } else if (outerTxTag.value === Tag.PayingForTx) {
        arr.push(t('transaction.type.payingForTx'));
      }

      if (TX_TAGS_AENS.has(outerTxTag.value!)) {
        arr.push(AENS, txTypeLabel.value);
      } else if (innerTxTag.value === Tag.GaMetaTx) {
        arr.push(
          t('transaction.type.contractCallTx'),
          t('transaction.type.multisigProposal'),
        );
      } else if (innerTxTag.value === Tag.SpendTx) {
        arr.push(
          t('transaction.type.spendTx'),
          direction.value === TX_DIRECTION.received
            ? t('transaction.spendType.in')
            : t('transaction.spendType.out'),
        );
      } else if (isDexAllowance.value) {
        arr.push(t('transaction.dexType.allowToken'));
      } else if (isDex.value) {
        arr.push(
          DEX,
          isTxFunctionDexPool(innerTx.value.function)
            ? t('transaction.dexType.pool')
            : t('common.swap'),
        );
      } else if (
        (
          innerTx.value.contractId
          && [tipContractV1, tipContractV2].includes(innerTx.value.contractId)
          && includes([TX_FUNCTIONS.tip, TX_FUNCTIONS.retip], innerTx.value.function)
        ) || props.transaction.claim
      ) {
        arr.push(
          t('pages.token-details.tip'),
          props.transaction.claim
            ? t('transaction.spendType.in')
            : t('transaction.spendType.out'),
        );
      } else if (
        outerTxTag.value === Tag.PayingForTx
        && innerTxTag.value === Tag.GaAttachTx
      ) {
        arr.push(t('transaction.type.createMultisigVault'));
      } else if (
        outerTxTag.value === Tag.ContractCallTx
        && availableTokens.value[innerTx.value.contractId]
        && (
          innerTx.value.function === TX_FUNCTIONS.transfer
          || props.transaction.incomplete
        )
      ) {
        arr.push(
          t('transaction.type.spendTx'),
          (
            innerTx.value.callerId === props.transaction.transactionOwner
            || !props.transaction.transactionOwner
          )
            ? t('transaction.spendType.out')
            : t('transaction.spendType.in'),
        );
      } else if (props.transaction.tx.function) {
        arr.push(
          txFunctionLabel.value,
          txTypeLabel.value,
        );
      } else {
        arr.push(txTypeLabel.value);
      }

      // Remove empty strings and other falsy values
      return arr.filter(excludeFalsy);
    });

    return {
      labels,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/mixins';

.transaction-tag-list {
  @include mixins.flex(center, center);

  gap: 8px;
  margin-bottom: -8px;

  &.dense {
    gap: 4px;
    margin-bottom: 0;
  }
}
</style>
