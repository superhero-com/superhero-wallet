<template>
  <div
    v-if="currentAccount.txHash"
    class="account-card-consensus"
  >
    <div
      class="consensus-row"
    >
      <PendingIcon class="icon pending" />
      {{ $t('multisig.consensus') }}
      <span class="highlighted">
        {{ currentAccount.confirmedBy.length }}/{{ currentAccount.confirmationsRequired }}
        {{ $t('of') }}
        {{ totalSignatures }}
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
import PendingIcon from '../../icons/animated-pending.svg?vue-component';
import CheckCircleFillIcon from '../../icons/check-circle-fill.svg?vue-component';
import { useGetter } from '../../composables/vuex';
import { IAccount, IMultisigAccount } from '../../types';

export default defineComponent({
  components: { PendingIcon, CheckCircleFillIcon },
  props: {
    currentAccount: {
      type: Object as PropType<IMultisigAccount>,
      required: true,
    },
  },
  setup(props, { root }) {
    const accounts = useGetter('accounts');

    const accountsAddressArray = computed(() => accounts.value.map((acc: IAccount) => acc.address));

    const isSigned = computed(
      () => {
        const mySignerAddressArray = props.currentAccount.signers.filter(
          (signer) => accountsAddressArray.value.includes(signer),
        );
        return mySignerAddressArray.every(
          (address) => props.currentAccount.confirmedBy.includes(address),
        );
      },
    );

    const totalSignatures = computed(() => props.currentAccount.signers.length);

    const transactionMessage = computed(() => {
      if (props.currentAccount.confirmedBy.length === props.currentAccount.confirmationsRequired) {
        return root.$t('multisig.transactionReady');
      }
      if (isSigned.value) {
        return root.$t('multisig.transactionSigned');
      }
      if (props.currentAccount.signers.some(
        (signer) => accountsAddressArray.value.includes(signer),
      )) {
        return root.$t('multisig.signatureRequested');
      }
      return null;
    });

    return {
      totalSignatures,
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

  margin-top: auto;
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
