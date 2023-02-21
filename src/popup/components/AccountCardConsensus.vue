<template>
  <div
    v-if="multisigAccount.hasPendingTransaction"
    class="account-card-consensus"
  >
    <div
      class="consensus-row"
    >
      <PendingIcon class="icon pending" />
      {{ $t('multisig.consensus') }}
      <span class="highlighted">
        {{ multisigAccount.confirmedBy.length }}/{{ multisigAccount.confirmationsRequired }}
        {{ $t('common.of') }}
        {{ multisigAccount.signers.length }}
      </span>
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
import { computed, defineComponent, PropType } from '@vue/composition-api';
import { useAccounts } from '../../composables';
import type { IMultisigAccount } from '../../types';

import PendingIcon from '../../icons/animated-pending.svg?vue-component';
import CheckCircleFillIcon from '../../icons/check-circle-fill.svg?vue-component';

export default defineComponent({
  components: {
    PendingIcon,
    CheckCircleFillIcon,
  },
  props: {
    multisigAccount: {
      type: Object as PropType<IMultisigAccount>,
      required: true,
    },
  },
  setup(props, { root }) {
    const { isLocalAccountAddress } = useAccounts({ store: root.$store });

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
        return root.$t('multisig.transactionReady');
      }
      if (isSigned.value) {
        return root.$t('multisig.transactionSigned');
      }
      if (signers.some((signer) => isLocalAccountAddress(signer))) {
        return root.$t('multisig.signatureRequested');
      }
      return null;
    });

    return {
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
