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
        v-if="transaction.tx.returnType === TX_RETURN_TYPE_ABORT"
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
        v-text="errorTypeName"
      />
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
  toRef,
} from 'vue';
import { Tag } from '@aeternity/aepp-sdk';
import { useI18n } from 'vue-i18n';

import type { ITransaction } from '@/types';
import { PROTOCOLS, TX_DIRECTION } from '@/constants';
import { getDefaultAccountLabel } from '@/utils';
import { useAccounts, useFungibleTokens, useTransactionData } from '@/composables';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';
import {
  TX_FUNCTIONS,
  TX_RETURN_TYPE_ABORT,
  TX_RETURN_TYPE_REVERT,
} from '@/protocols/aeternity/config';

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
    const { activeAccount, getAccountByAddress } = useAccounts();
    const { t } = useI18n();
    const { getName } = useAeNames();

    const {
      outerTxTag,
      innerTxTag,
      direction,
      innerTx,
      isDex,
      isDexAllowance,
      isDexLiquidityAdd,
      isDexLiquidityRemove,
      isErrorTransaction,
      isTip,
      txTypeListLabel,
    } = useTransactionData({
      transaction: toRef(() => props.transaction),
    });

    const { getProtocolAvailableTokens } = useFungibleTokens();

    const label = computed((): {
      text: string;
      customPending?: string;
      hasComma?: boolean;
    } => {
      let customPending;
      let hasComma = !props.transaction.transactionOwner;
      let text = txTypeListLabel.value; // Default value

      if (
        outerTxTag.value === Tag.SpendTx
        || (outerTxTag.value === Tag.GaMetaTx && innerTxTag.value === Tag.SpendTx)
      ) {
        const isSent = direction.value === TX_DIRECTION.sent;
        text = (isSent)
          ? t('transaction.listType.sentTx')
          : t('transaction.listType.receivedTx');
        customPending = (isSent)
          ? t('transaction.type.sentTx')
          : t('transaction.type.receivedTx');
      } else if (outerTxTag.value === Tag.PayingForTx && innerTxTag.value === Tag.GaAttachTx) {
        text = t('transaction.type.multisigVaultCreated');
      } else if (outerTxTag.value === Tag.PayingForTx) {
        text = props.showTransactionOwner
          ? t('transaction.type.transactionFeePaidBy')
          : t('transaction.type.transactionFeePaid');
      } else if (isDexAllowance.value) {
        text = t('transaction.dexType.allowToken');
      } else if (isDexLiquidityAdd.value) {
        text = t('transaction.dexType.provideLiquidity');
      } else if (isDexLiquidityRemove.value) {
        text = t('transaction.dexType.removeLiquidity');
      } else if (isDex.value) {
        text = t('common.swap');
        hasComma = true;
      } else if (isTip.value && props.transaction.claim) {
        text = t('transaction.listType.tipReceived');
      } else if (isTip.value) {
        text = t('transaction.listType.tipSent');
      } else if (
        outerTxTag.value === Tag.ContractCallTx
        && getProtocolAvailableTokens(PROTOCOLS.aeternity)[innerTx.value.contractId]
        && (
          innerTx.value.function === TX_FUNCTIONS.transfer
          || props.transaction.incomplete
        )
      ) {
        const isSent = (props.transaction.transactionOwner)
          ? props.transaction.transactionOwner === innerTx.value.callerId
          : innerTx.value.callerId === activeAccount.value.address;
        text = (isSent)
          ? t('transaction.listType.sentTx')
          : t('transaction.listType.receivedTx');
        customPending = (isSent)
          ? t('transaction.type.sentTx')
          : t('transaction.type.receivedTx');
      } else if (outerTxTag.value === Tag.ContractCreateTx) {
        text = t('transaction.type.contractCreateTx');
      } else if (outerTxTag.value === Tag.ContractCallTx) {
        text = t('transaction.type.contractCallTx');
      }

      return { text, customPending, hasComma };
    });

    const ownerName = computed(() => {
      const accountFound = getAccountByAddress(props.transaction.transactionOwner!);
      return getName(accountFound?.address).value || getDefaultAccountLabel(accountFound);
    });

    const errorTypeName = computed((): string | null => {
      switch (props.transaction.tx.returnType) {
        case TX_RETURN_TYPE_ABORT: return t('transaction.returnType.abort');
        case TX_RETURN_TYPE_REVERT: return t('transaction.returnType.revert');
        default: return null;
      }
    });

    return {
      TX_RETURN_TYPE_ABORT,
      isErrorTransaction,
      ownerName,
      label,
      errorTypeName,
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
