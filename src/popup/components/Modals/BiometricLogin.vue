<template>
  <Modal
    class="secure-login"
    from-bottom
    full-screen
    no-padding
    centered
    transparent
    @close="handleClose"
    @click="initAuthenticate"
  >
    <div class="content-wrapper">
      <div class="icon-wrapper">
        <IconBoxed
          :icon="isAuthCanceled ? FingerprintIcon : LockIcon"
          :class="isAuthCanceled ? 'color-danger' : 'color-success'"
          bg-colored
          outline-colored
          transparent
          :icon-padded="!isAuthCanceled"
        />
      </div>
      <div class="info">
        <h3 class="title">
          {{ !isAuthCanceled
            ? $t('pages.secureLogin.walletLocked')
            : $t('pages.secureLogin.authFailed')
          }}
        </h3>

        <div class="text">
          {{ !isAuthCanceled
            ? $t('pages.secureLogin.walletLockedSubtitle')
            : $t('pages.secureLogin.authFailedSubtitle')
          }}
        </div>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import {
  ref,
  watch,
  defineComponent,
  PropType,
} from 'vue';
import type { ResolveCallback } from '@/types';
import { useAuth } from '@/composables';

import Modal from '../Modal.vue';
import IconBoxed from '../IconBoxed.vue';

import FingerprintIcon from '../../../icons/fingerprint.svg?vue-component';
import LockIcon from '../../../icons/secure-lock-outline.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    IconBoxed,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    force: Boolean,
  },
  setup(props) {
    const isAuthCanceled = ref(false);
    const isAuthenticating = ref(false);

    const { authenticateWithBiometry, isAuthenticated } = useAuth();

    async function initAuthenticate() {
      if (isAuthenticating.value || (isAuthenticated.value && !props.force)) {
        return;
      }
      isAuthenticating.value = true;
      try {
        await authenticateWithBiometry(props.force);
        props.resolve();
      } catch (error) {
        isAuthCanceled.value = true;
      } finally {
        isAuthenticating.value = false;
      }
    }

    function handleClose() {
      if (isAuthenticated.value) {
        props.resolve();
      }
    }

    watch(isAuthenticated, (value) => {
      if (value && !props.force) {
        props.resolve();
      }
    }, { immediate: true });

    return {
      LockIcon,
      FingerprintIcon,
      isAuthCanceled,
      handleClose,
      initAuthenticate,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.secure-login {
  .content-wrapper {
    margin-top: 168px;
    padding: 0 16px 32px;
  }

  .info {
    margin-top: 8px;

    .title {
      @extend %face-sans-18-medium;
      color: $color-white;
      margin-bottom: 4px;
    }

    .text {
      @extend %text-body;
      line-height: 24px;
      color: rgba($color-white, 0.85);
    }
  }
}
</style>
