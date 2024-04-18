<template>
  <Modal
    class="enable-secure-login"
    from-bottom
    full-screen
    centered
    @close="resolve"
  >
    <div class="icon-wrapper">
      <IconBoxed :icon="FingerprintIcon" />
    </div>
    <div class="info">
      <h3 class="title">
        {{ $t('pages.titles.secureLogin') }}
      </h3>

      <div class="text">
        <span>{{ isSecureLoginAvailable
          ? $t('pages.secureLogin.available.part1')
          : $t('pages.secureLogin.unavailable.part1')
        }}</span>
        <span>{{ isSecureLoginAvailable
          ? $t('pages.secureLogin.available.part2')
          : $t('pages.secureLogin.unavailable.part2')
        }}</span>
      </div>

      <div class="buttons">
        <BtnMain
          variant="primary"
          extend
          :text="isSecureLoginAvailable
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
import {
  defineComponent,
  onBeforeMount,
  PropType,
  ref,
} from 'vue';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import type { RejectCallback, ResolveCallback } from '@/types';
import { useAuth, useUi } from '@/composables';

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
    const isSecureLoginAvailable = ref(false);
    const { checkSecureLoginAvailability, openSecureLoginModal } = useAuth();
    const { setSecureLoginEnabled } = useUi();

    function onEnable() {
      if (!isSecureLoginAvailable.value) {
        NativeSettings.open({
          optionAndroid: AndroidSettings.Security,
          optionIOS: IOSSettings.TouchIdPasscode,
        });
        props.resolve();
        return;
      }

      setSecureLoginEnabled(true);
      openSecureLoginModal();
      props.resolve();
    }

    onBeforeMount(async () => {
      isSecureLoginAvailable.value = await checkSecureLoginAvailability();
    });

    return {
      FingerprintIcon,
      isSecureLoginAvailable,
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
      @extend %face-sans-18-medium;
      color: $color-white;
      padding: 16px 0;
    }

    .text {
      @extend %face-sans-14-light;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-flow: column;
      line-height: 20px;
      color: rgba($color-white, 0.85);
      gap: 10px;
    }

    .buttons {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-flow: column;
      margin-top: 32px;
      gap: 16px;
    }
  }
}
</style>
