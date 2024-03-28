<template>
  <div
    v-if="isOnline && multisigAccount.hasPendingTransaction"
    class="account-card-consensus"
  >
    <div
      class="consensus-row"
    >
      <PendingIcon class="icon pending" />
      {{ $t('multisig.consensus') }}
      <ConsensusLabel
        :confirmations-required="multisigAccount.confirmationsRequired"
        :has-pending-transaction="multisigAccount.hasPendingTransaction"
        :confirmed-by="multisigAccount.confirmedBy"
        :signers="multisigAccount.signers"
        class="highlighted"
      />
    </div>
    <div
      v-if="transactionMessage"
      class="consensus-row"
    >
      <CheckCircleFillIcon class="icon check-circle" />
      {{ transactionMessage }}
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAccounts, useConnection } from '../../composables';
import type { IMultisigAccount } from '../../types';

import ConsensusLabel from './ConsensusLabel.vue';

import PendingIcon from '../../icons/animated-pending.svg?vue-component';
import CheckCircleFillIcon from '../../icons/check-circle-fill.svg?vue-component';

export default defineComponent({
  components: {
    ConsensusLabel,
    PendingIcon,
    CheckCircleFillIcon,
  },
  props: {
    multisigAccount: {
      type: Object as PropType<IMultisigAccount>,
      required: true,
    },
  },
  setup(props) {
    const { t } = useI18n();

    const { isOnline } = useConnection();
    const { isLocalAccountAddress } = useAccounts();

    const isSigned = computed(
      () => {
        const mySignerAddressArray = props.multisigAccount.signers.filter(
          (signer) => isLocalAccountAddress(signer),
        );
        return mySignerAddressArray.every(
          (address) => props.multisigAccount.confirmedBy.includes(address),
        );
      },
    );

    const transactionMessage = computed(() => {
      const { confirmedBy, confirmationsRequired, signers } = props.multisigAccount;

      if (confirmedBy.length === confirmationsRequired) {
        return t('multisig.transactionReady');
      }
      if (isSigned.value) {
        return t('multisig.transactionSigned');
      }
      if (signers.some((signer) => isLocalAccountAddress(signer))) {
        return t('multisig.signatureRequested');
      }
      return null;
    });

    return {
      isOnline,
      transactionMessage,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/typography';
@use '../../styles/mixins';

.account-card-consensus {
  @include mixins.flex(flex-start, flex-start, column);

  gap: 6px;

  .consensus-row {
    @extend %face-sans-14-medium;

    @include mixins.flex(flex-start, center, row);

    color: rgba($color-white, 0.85);
    line-height: 16px;

    .highlighted {
      color: $color-white;
      margin-left: 4px;
    }

    .icon {
      height: 16px;
      width: 16px;
      margin-right: 4px;
      color: $color-white;
    }

    .check-circle {
      opacity: 0.5;
    }
  }
}
</style>
