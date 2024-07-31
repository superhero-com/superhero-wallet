<template>
  <Modal
    class="password-login"
    from-bottom
    centered
  >
    <div class="content-wrapper">
      <div class="icon-wrapper">
        <IconBoxed
          :icon="LockIcon"
          bg-colored
          bg-more-transparent
          icon-padded
        />
      </div>
      <div class="info">
        <h3 class="title">
          {{ $t('pages.secureLogin.walletLocked') }}
        </h3>

        <div class="text">
          {{ $t('pages.secureLogin.walletLockedSubtitle') }}
        </div>
      </div>
      <Login @unlock="login" />
    </div>
  </Modal>
</template>

<script lang="ts">
import {
  ref,
  defineComponent,
  PropType,
} from 'vue';

import type { ResolveCallback } from '@/types';
import { useAuth } from '@/composables';

import Modal from '@/popup/components/Modal.vue';
import IconBoxed from '@/popup/components/IconBoxed.vue';
import Login from '@/popup/components/Login.vue';

import FingerprintIcon from '@/icons/fingerprint.svg?vue-component';
import LockIcon from '@/icons/lock.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    Login,
    IconBoxed,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
  },
  setup(props) {
    // TODO pin: do something with this
    const isAuthFailed = ref(false);
    const isAuthenticating = ref(false);

    const { authenticate, isAuthenticated } = useAuth();

    async function login(password?: string) {
      if (isAuthenticating.value || isAuthenticated.value) {
        return;
      }
      isAuthenticating.value = true;
      try {
        await authenticate(password);
        props.resolve(password);
      } catch (error) {
        isAuthFailed.value = true;
      } finally {
        isAuthenticating.value = false;
      }
    }

    return {
      LockIcon,
      FingerprintIcon,
      isAuthFailed,
      login,
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
