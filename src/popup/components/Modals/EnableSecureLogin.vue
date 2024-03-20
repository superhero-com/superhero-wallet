<template>
  <Modal
    class="enable-secure-login"
    from-bottom
    full-screen
    centered
    @close="resolve"
  >
    <div class="icon-wrapper">
      <IconBoxed
        :icon="FingerprintIcon"
        small-icon
      />
    </div>
    <div class="info">
      <h3 class="title">
        {{ $t('pages.titles.secureLogin') }}
      </h3>

      <div class="text">
        <span>{{ isAvailable
          ? $t('pages.secureLogin.available.part1')
          : $t('pages.secureLogin.unavailable.part1')
        }}</span>
        <span>{{ isAvailable
          ? $t('pages.secureLogin.available.part2')
          : $t('pages.secureLogin.unavailable.part2')
        }}</span>
      </div>

      <div class="buttons">
        <BtnMain
          variant="primary"
          extend
          :text="isAvailable
            ? $t('pages.secureLogin.enableSecureLogin')
            : $t('pages.secureLogin.enableDeviceSecureLogin')
          "
          @click="onEnable"
        />
        <BtnMain
          variant="muted"
          extend
          :text="$t('common.notNow')"
          @click="resolve"
        />
      </div>
    </div>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { RejectCallback, ResolveCallback } from '@/types';
import { useBiometricAuth, useUi } from '@/composables';

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import IconBoxed from '../IconBoxed.vue';

import FingerprintIcon from '../../../icons/fingerprint.svg?vue-component';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    IconBoxed,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
  },
  setup(props) {
    const { isAvailable, openAuthModal } = useBiometricAuth();
    const { setSecureLoginEnabled } = useUi();

    function onEnable() {
      if (!isAvailable.value) {
        // TODO HEREREREEEE
        // TODO If is not available, go to device settings
        props.resolve();
        return;
      }

      setSecureLoginEnabled(true);
      openAuthModal();
      props.resolve();
    }

    return {
      FingerprintIcon,
      isAvailable,
      onEnable,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables' as *;
@use '../../../styles/mixins';
@use '../../../styles/typography';

.enable-secure-login {
  background-color: $color-bg-app;

  .icon-wrapper {
    margin-top: 44px;
    opacity: 0.5;
  }

  .info {
    .title {
      color: $color-white;
      padding:16px 0;

      @extend %face-sans-18-medium;
    }

    .text {
      color: rgba($color-white, 0.85);
      line-height: 20px;
      gap: 10px;

      @extend %face-sans-14-light;

      @include mixins.flex(center, center, column);
    }

    .buttons {
      @include mixins.flex(center, center, column);

      margin-top: 32px;
      gap: 16px;
    }
  }
}
</style>
