<template>
  <Modal
    class="browser-actions"
    from-bottom
    centered
    body-without-padding-bottom
    @close="resolve"
  >
    <div class="info">
      <BrowserActionItem
        :title="$t('dappActionBrowser.refresh.title')"
        :info="$t('dappActionBrowser.refresh.description')"
        :icon="RefreshIcon"
        @click="refreshIframeContent"
      />
      <!-- TODO: define share action -->
      <BrowserActionItem
        v-if="false"
        :title="$t('dappActionBrowser.bookmark.title')"
        :info="$t('dappActionBrowser.bookmark.description')"
        :icon="FavoriteIcon"
      />
      <BrowserActionItem
        v-if="IS_MOBILE_DEVICE"
        :title="$t('dappActionBrowser.share.title')"
        :info="$t('dappActionBrowser.share.description')"
        :icon="ShareIcon"
        @click="shareIframeContent"
      />
    </div>
    <template #footer>
      <BtnMain
        variant="muted"
        @click="reject"
      >
        {{ $t('common.cancel') }}
      </BtnMain>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { useStore } from 'vuex';
import type { RejectCallback, ResolveCallback } from '@/types';
import { IS_MOBILE_DEVICE } from '@/constants';
import RefreshIcon from '@/icons/dapp/dapp-refresh.svg?vue-component';
import ShareIcon from '@/icons/dapp/dapp-share.svg?vue-component';
import FavoriteIcon from '@/icons/dapp/dapp-favorite.svg?vue-component';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import BrowserActionItem from '../BrowserActionItem.vue';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    BrowserActionItem,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    selectedApp: { type: Object, required: true },
    iFrame: { type: Object, required: true },
  },
  setup(props) {
    const store = useStore();

    async function refreshIframeContent() {
      await props.resolve({ action: 'refresh' });
    }
    async function shareIframeContent() {
      await store.dispatch('share', { text: props.selectedApp.url });
      await props.resolve({ action: 'share' });
    }

    // TODO: bookmark function

    return {
      refreshIframeContent,
      shareIframeContent,
      RefreshIcon,
      ShareIcon,
      FavoriteIcon,
      IS_MOBILE_DEVICE,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables';
@use '@/styles/mixins';
@use '@/styles/typography';

.browser-actions {
  :deep(.fixed-screen-footer) {
    padding-top: 0;
  }
}
</style>
