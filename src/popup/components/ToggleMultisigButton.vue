<template>
  <BtnPlain
    v-if="multisigAccounts.length"
    class="multisig-button"
    @click="toggleMultisigDashboard(!isMultisig)"
  >
    <template v-if="isMultisig">
      <ArrowBackIcon
        class="icon-back"
      />
      <span class="text">
        {{ $t('multisig.backToMainAccounts') }}
      </span>
    </template>

    <template v-else>
      <div
        v-if="hasPendingMultisigTransaction"
        class="has-pending"
      >
        <PendingIcon
          class="icon-pending"
        />
        <span>{{ $t('common.tx') }}</span>
      </div>

      <span class="text">{{ $t('multisig.showMultisigVaults') }}</span>
    </template>
  </BtnPlain>
</template>

<script lang="ts">
import { computed, defineComponent, watch } from 'vue';

import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useMultisigAccounts } from '../../composables';
import { ROUTE_ACCOUNT, ROUTE_MULTISIG_ACCOUNT } from '../router/routeNames';

import BtnPlain from './buttons/BtnPlain.vue';
import PendingIcon from '../../icons/animated-pending.svg?vue-component';
import ArrowBackIcon from '../../icons/back.svg?vue-component';

export default defineComponent({
  components: {
    BtnPlain,
    PendingIcon,
    ArrowBackIcon,
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

    function toggleMultisigDashboard(showMultisigDashboard: boolean) {
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
  background: $color-bg-app;
  border-radius: 12px;
  gap: 1px;

  .icon-back,
  .icon-pending {
    width: 16px;
    height: 16px;
  }

  .icon-back {
    color: $color-white;
    opacity: 75%;
  }

  .text {
    @extend %face-sans-14-medium;

    color: rgba($color-white, 0.5);
    line-height: 16px;
    transition: $transition-interactive;
  }

  .has-pending {
    @include mixins.flex(flex-start, center, row);

    @extend %face-sans-12-medium;

    color: rgba($color-warning, 0.75);
    line-height: 16px;
    margin-right: 5px;

    .icon-pending {
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
