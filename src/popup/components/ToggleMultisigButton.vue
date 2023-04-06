<template>
  <BtnPlain
    v-if="multisigAccounts.length"
    class="multisig-button"
    @click="toggleMultisigDashboard(!isMultisig)"
  >
    <span
      v-if="isMultisig"
      class="text"
    >
      {{ $t('multisig.backToMainAccounts') }}
    </span>
    <template v-else>
      <div
        v-if="hasPendingMultisigTransaction"
        class="icon-wrapper"
      >
        <PendingIcon
          class="animated-pending-icon"
        />
        <span class="tx-text">{{ $t('tx') }}</span>
      </div>
      <span class="text">{{ $t('multisig.showMultisigVaults') }}</span>
    </template>
  </BtnPlain>
</template>

<script lang="ts">
import {
  computed, defineComponent, watch,
} from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useMultisigAccounts } from '../../composables';
import { ROUTE_ACCOUNT, ROUTE_MULTISIG_ACCOUNT } from '../router/routeNames';

import BtnPlain from './buttons/BtnPlain.vue';
import PendingIcon from '../../icons/animated-pending.svg?vue-component';

export default defineComponent({
  components: {
    BtnPlain,
    PendingIcon,
  },
  props: {
    isMultisig: Boolean,
  },
  setup(props) {
    const store = useStore();
    const router = useRouter();

    const { multisigAccounts } = useMultisigAccounts({ store });

    const hasPendingMultisigTransaction = computed(
      () => multisigAccounts.value.some((acc) => acc.hasPendingTransaction),
    );

    function toggleMultisigDashboard(showMultisigDashboard: false) {
      store.commit('initTransactions');
      router.push({ name: showMultisigDashboard ? ROUTE_MULTISIG_ACCOUNT : ROUTE_ACCOUNT });
    }

    watch(() => multisigAccounts.value, () => {
      if (!multisigAccounts.value?.length && props.isMultisig) {
        toggleMultisigDashboard(false);
      }
    });

    return {
      multisigAccounts,
      hasPendingMultisigTransaction,
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
  background: $color-bg-app;
  border-radius: 12px;

  .text {
    @extend %face-sans-14-medium;

    color: rgba($color-white, 0.5);
    line-height: 16px;
    transition: $transition-interactive;
  }

  .icon-wrapper {
    @include mixins.flex(flex-start, center, row);

    margin-right: 6px;

    .tx-text {
      @extend %face-sans-12-medium;

      color: rgba($color-warning, 0.75);
      line-height: 16px;
    }

    .animated-pending-icon {
      width: 16px;
      height: 16px;
      color: $color-warning;
    }
  }

  &:hover,
  &:active {
    .text {
      color: $color-white;
    }
  }

  &:hover {
    background: $color-bg-6;
  }

  &:active {
    background: $color-disabled;
  }
}
</style>
