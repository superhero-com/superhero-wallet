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
          <RouterLink
            :to="{ name: ROUTE_TERMS }"
            @click="reject()"
          >
            {{ $t('pages.titles.terms') }}
          </RouterLink>
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
        variant="primary"
        @click="confirm"
      >
        {{ $t('common.confirm') }}
      </BtnMain>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { RejectCallback, ResolveCallback } from '@/types';
import { ROUTE_TERMS } from '@/popup/router/routeNames';
import Modal from '@/popup/components/Modal.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import IconBoxed from '@/popup/components/IconBoxed.vue';
import WarningIcon from '@/icons/warning.svg?vue-component';

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
    function confirm() {
      props.resolve();
    }

    return {
      WarningIcon,
      ROUTE_TERMS,
      confirm,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins';
@use '@/styles/typography';

.warning-dapp-browser {
  .icon-wrapper {
    margin: 8px auto 18px;
    color: $color-warning;
  }

  .info {
    .title {
      color: $color-white;
      padding-bottom: 20px;
    }

    .text {
      color: rgba($color-white, 0.85);
      line-height: 20px;
      gap: 10px;

      @include mixins.flex(center, center, column);
    }
  }
}
</style>
