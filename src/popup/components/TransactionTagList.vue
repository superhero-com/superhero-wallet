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
import { useFungibleTokens, useTippingContracts, useTransactionTx } from '@/composables';
import type { ITransaction } from '@/types';
import { excludeFalsy, includes } from '@/utils';
import {
  AENS,
  DEX,
  TX_DIRECTION,
} from '@/constants';
import { TX_FUNCTIONS, TX_TAGS_AENS } from '@/protocols/aeternity/config';
import { isTxFunctionDexPool } from '@/protocols/aeternity/helpers';

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
      tx: props.transaction?.tx,
      externalAddress: props.transaction?.transactionOwner,
    });

    const { tippingContractAddresses } = useTippingContracts();

    const { availableTokens } = useFungibleTokens();

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

      const { tippingV1, tippingV2 } = tippingContractAddresses.value;

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
      } else if (props.transaction.claim) {
        arr.push(
          t('pages.token-details.tip'),
          t('transaction.spendType.in'),
        );
      } else if (
        innerTx.value?.contractId
        && [tippingV1, tippingV2].includes(innerTx.value.contractId)
        && includes([TX_FUNCTIONS.tip, TX_FUNCTIONS.retip], innerTx.value.function)
      ) {
        arr.push(
          t('pages.token-details.tip'),
          t('transaction.spendType.out'),
        );
      } else if (
        outerTxTag.value === Tag.PayingForTx
        && innerTxTag.value === Tag.GaAttachTx
      ) {
        arr.push(t('transaction.type.createMultisigVault'));
      } else if (
        outerTxTag.value === Tag.ContractCallTx
        && availableTokens.value[innerTx.value?.contractId]
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
      } else if (txTypeLabel.value !== arr?.[0]) {
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
