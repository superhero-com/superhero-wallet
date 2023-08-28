<template>
  <Modal
    class="browser-actions"
    from-bottom
    centered
    body-without-padding-bottom
    no-padding-top
    @close="resolve"
  >
    <div class="info">
      <BrowserActionItem
        :title="$t('dappActionBrowser.refresh.title')"
        :info="$t('dappActionBrowser.refresh.description')"
        :icon="RefreshIcon"
        @click="refreshIframeContent"
      />
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
        :text="$t('common.cancel')"
        @click="reject"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { RejectCallback, ResolveCallback } from '@/types';
import { BROWSER_ACTIONS, IS_MOBILE_DEVICE } from '@/constants';
import { invokeDeviceShare } from '@/utils';
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
    iframe: { type: Object, required: true },
  },
  setup(props) {
    async function refreshIframeContent() {
      props.resolve({ action: BROWSER_ACTIONS.refresh });
    }
    async function shareIframeContent() {
      await invokeDeviceShare(props.selectedApp.url);
      props.resolve();
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
