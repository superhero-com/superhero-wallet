<template>
  <Modal
    class="warning-dapp-browser"
    from-bottom
    has-close-button
    centered
    @close="reject"
  >
    <div class="icon-wrapper">
      <IconBoxed :icon="WarningIcon" />
    </div>
    <div class="info">
      <h3 class="title">
        {{ $t('pages.warningDappBrowser.title') }}
      </h3>
      <div class="text">
        <i18n-t
          keypath="pages.warningDappBrowser.warning"
          tag="span"
          scope="global"
        >
          <a
            @click="goToTerms"
          >
            {{ $t('pages.titles.terms') }}
          </a>
        </i18n-t>
        <span>{{ $t('pages.warningDappBrowser.warning2') }}</span>
      </div>
    </div>
    <template #footer>
      <BtnMain
        variant="muted"
        @click="reject"
      >
        {{ $t('pages.warningDappBrowser.decline') }}
      </BtnMain>
      <BtnMain
        variant="light"
        @click="confirm"
      >
        {{ $t('common.confirm') }}
      </BtnMain>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { useRouter } from 'vue-router';
import type { RejectCallback, ResolveCallback } from '../../../types';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import IconBoxed from '../IconBoxed.vue';
import WarningIcon from '../../../icons/warning.svg?vue-component';
import { ROUTE_TERMS } from '../../router/routeNames';

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
    const router = useRouter();

    function confirm() {
      props.resolve();
    }
    function goToTerms() {
      props.reject();
      router.push({ name: ROUTE_TERMS });
    }

    return {
      goToTerms,
      WarningIcon,
      confirm,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables';
@use '@/styles/mixins';
@use '@/styles/typography';

.warning-dapp-browser {
  .icon-wrapper {
    margin: 8px auto 18px;
    color: variables.$color-warning;
  }

  .info {
    .title {
      color: variables.$color-white;
      padding-bottom: 20px;
    }

    .text {
      color: rgba(variables.$color-white, 0.85);
      line-height: 20px;
      gap: 10px;

      @include mixins.flex(center, center, column);
    }
  }
}
</style>
