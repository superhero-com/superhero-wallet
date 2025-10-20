<template>
  <Modal
    class="browser-actions"
    from-bottom
    centered
    @close="resolve"
  >
    <div class="info">
      <BtnSubheader
        :header="$t('dappActionBrowser.refresh.title')"
        :subheader="$t('dappActionBrowser.refresh.description')"
        :icon="RefreshIcon"
        @click="refreshIframeContent"
      />
      <!--
      <BtnSubheader
        v-if="UNFINISHED_FEATURES"
        :header="$t('dappActionBrowser.bookmark.title')"
        :subheader="$t('dappActionBrowser.bookmark.description')"
        :icon="FavoriteIcon"
      />
      -->
      <BtnSubheader
        v-if="IS_MOBILE_DEVICE"
        :header="$t('dappActionBrowser.share.title')"
        :subheader="$t('dappActionBrowser.share.description')"
        :icon="ShareIcon"
        @click="shareIframeContent"
      />
    </div>

    <BtnMain
      variant="muted"
      extend
      :text="$t('common.cancel')"
      @click="reject"
    />
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ObjectValues, RejectCallback, ResolveCallback } from '@/types';
import { BROWSER_ACTIONS, IS_MOBILE_DEVICE } from '@/constants';
import { invokeDeviceShare } from '@/utils';

import RefreshIcon from '@/icons/dapp/dapp-refresh.svg?vue-component';
import ShareIcon from '@/icons/dapp/dapp-share.svg?vue-component';
import FavoriteIcon from '@/icons/dapp/dapp-favorite.svg?vue-component';

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import BtnSubheader from '../buttons/BtnSubheader.vue';

export type BrowserActionsResolvedVal = {
  action: ObjectValues<typeof BROWSER_ACTIONS>;
}

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    BtnSubheader,
  },
  props: {
    resolve: {
      type: Function as PropType<ResolveCallback<BrowserActionsResolvedVal>>,
      required: true,
    },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    selectedApp: { type: Object, default: () => null },
  },
  setup(props) {
    async function refreshIframeContent() {
      props.resolve({ action: BROWSER_ACTIONS.refresh });
    }

    async function shareIframeContent() {
      if (props.selectedApp?.url) await invokeDeviceShare(props.selectedApp.url);
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
