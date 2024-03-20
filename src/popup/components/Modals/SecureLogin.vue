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
    <div
      v-if="!isAuthenticated"
      class="content-wrapper"
    >
      <div class="icon-wrapper">
        <IconBoxed
          :icon="!wasAuthCanceled ? LockIcon : FingerprintIcon"
          :variant="!wasAuthCanceled ? 'success' : 'danger'"
          small-icon
        />
      </div>
      <div class="info">
        <h3 class="title">
          {{ !wasAuthCanceled
            ? $t('pages.secureLogin.walletLocked')
            : $t('pages.secureLogin.authFailed')
          }}
        </h3>

        <div class="text">
          {{ !wasAuthCanceled
            ? $t('pages.secureLogin.walletLockedSubtitle')
            : $t('pages.secureLogin.authFailedSubtitle')
          }}
        </div>
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import { ref, defineComponent, PropType } from 'vue';
import type { ResolveCallback } from '@/types';
import { useBiometricAuth } from '@/composables';

import Modal from '../Modal.vue';
import IconBoxed from '../IconBoxed.vue';

import FingerprintIcon from '../../../icons/fingerprint.svg?vue-component';
import LockIcon from '../../../icons/lock.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    IconBoxed,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
  },
  setup(props) {
    const wasAuthCanceled = ref(false);
    const isAuthenticating = ref(false);

    const { authenticate, isAuthenticated } = useBiometricAuth();

    async function initAuthenticate() {
      if (isAuthenticating.value) {
        return;
      }
      isAuthenticating.value = true;
      try {
        await authenticate();
        props.resolve();
      } catch (error) {
        wasAuthCanceled.value = true;
      } finally {
        isAuthenticating.value = false;
      }
    }

    function handleClose() {
      if (isAuthenticated.value) {
        props.resolve();
      }
    }

    return {
      LockIcon,
      FingerprintIcon,
      isAuthenticated,
      wasAuthCanceled,
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
      @extend %face-sans-18-semi-bold;
      color: $color-white;
      margin-bottom: 4px;
    }

    .text {
      @extend %face-sans-16-regular;
      line-height: 24px;
      color: rgba($color-white, 0.85);
    }
  }

}
</style>
