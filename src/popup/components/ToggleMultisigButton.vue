<template>
  <BtnPlain
    v-if="multisigAccounts.length"
    class="multisig-button"
    @click="toggleMultisigDashboard"
  >
    <span
      v-if="isMultisigDashboard"
      class="text"
    >
      {{ $t('multisig.backToMainAccounts') }}
    </span>
    <template v-else>
      <PendingIcon
        v-if="hasPendingMultisigTransaction"
        class="animated-pending-icon"
      />
      <span class="text">{{ $t('multisig.showMultisigVaults') }}</span>
    </template>
  </BtnPlain>
</template>

<script lang="ts">
import { computed, defineComponent, watch } from '@vue/composition-api';

import { useMultisigAccounts } from '../../composables';

import PendingIcon from '../../icons/animated-pending.svg?vue-component';
import BtnPlain from './buttons/BtnPlain.vue';

export default defineComponent({
  components: {
    BtnPlain,
    PendingIcon,
  },
  setup(props, { root }) {
    const {
      isMultisigDashboard,
      multisigAccounts,
      toggleMultisigDashboard,
    } = useMultisigAccounts({ store: root.$store });

    const hasPendingMultisigTransaction = computed(
      () => multisigAccounts.value.some((acc) => acc.txHash),
    );

    watch(() => multisigAccounts.value, () => {
      if (!multisigAccounts.value?.length && isMultisigDashboard.value) {
        toggleMultisigDashboard();
      }
    });

    return {
      multisigAccounts,
      hasPendingMultisigTransaction,
      isMultisigDashboard,
      toggleMultisigDashboard,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/typography';
@use '../../styles/mixins';

.multisig-button {
  @include mixins.flex(center, center, row);

  padding: 4px 8px;
  margin-right: var(--screen-padding-x);

  .text {
    @extend %face-sans-14-medium;

    color: rgba($color-white, 0.5);
    transition: $transition-interactive;
  }

  .animated-pending-icon {
    width: 16px;
    height: 16px;
    margin-right: 4px;
  }

  &:hover,
  &:active {
    .text {
      color: $color-white;
    }
  }
}
</style>
