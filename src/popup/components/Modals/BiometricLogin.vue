<template>
  <Modal
    class="secure-login"
    from-bottom
    full-screen
    no-padding
    centered
    transparent
    :has-close-button="isCancelable"
    @close="handleClose"
    @click="initAuthenticate()"
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
          {{ isAuthCanceled
            ? $t('pages.secureLogin.authFailed')
            : (isCancelable)
              ? $t('pages.secureLogin.confirmIdentity')
              : $t('pages.secureLogin.walletLocked')
          }}
        </h3>

        <div class="text">
          {{ isAuthCanceled
            ? $t('pages.secureLogin.authFailedSubtitle')
            : (isCancelable)
              ? $t('pages.secureLogin.confirmIdentitySubtitle')
              : $t('pages.secureLogin.walletLockedSubtitle')
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
  onMounted,
  PropType,
} from 'vue';
import type { RejectCallback, ResolveCallback } from '@/types';
import { useAuth, useUi } from '@/composables';
import { RejectedByUserError } from '@/lib/errors';

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
    reject: { type: Function as PropType<RejectCallback>, required: true },
    force: Boolean,
    deferAuthStateUpdate: Boolean,
    /**
     * Opened by `checkUserAuth`, so it may prompt without a tap, see
     * `claimLockScreenAutoPrompt`.
     */
    isLockScreen: Boolean,
    /** Asked to confirm an action, not to unlock: it may be dismissed */
    isCancelable: Boolean,
  },
  setup(props) {
    const isAuthCanceled = ref(false);
    const isAuthenticating = ref(false);
    // The tap on the close button also reaches the modal's click
    let isClosed = false;

    const { authenticateWithBiometry, claimLockScreenAutoPrompt, isAuthenticated } = useAuth();
    const { isAppActive } = useUi();

    async function initAuthenticate({ isAutoPrompt = false } = {}) {
      if (isClosed || isAuthenticating.value || (isAuthenticated.value && !props.force)) {
        return;
      }
      isAuthenticating.value = true;
      try {
        await authenticateWithBiometry(
          props.force,
          { setAuthenticated: !props.deferAuthStateUpdate },
        );
        props.resolve();
      } catch {
        // Android 11+ reports a prompt the system closed, e.g. as the app leaves, as a cancel.
        if (!isAutoPrompt) {
          isAuthCanceled.value = true;
        }
      } finally {
        isAuthenticating.value = false;
      }
    }

    function autoPrompt() {
      if (props.isLockScreen && claimLockScreenAutoPrompt()) {
        initAuthenticate({ isAutoPrompt: true });
      }
    }

    function handleClose() {
      isClosed = true;
      if (isAuthenticated.value && !props.force) {
        props.resolve();
        return;
      }
      props.reject(new RejectedByUserError());
    }

    watch(isAuthenticated, (value) => {
      if (value && !props.force) {
        props.resolve();
      }
    }, { immediate: true });

    watch(isAppActive, (isActive) => {
      if (isActive) {
        autoPrompt();
      }
    });

    onMounted(autoPrompt);

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
