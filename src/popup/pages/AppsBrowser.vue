<template>
  <div class="apps-browser">
    <div v-if="!selectedApp">
      <div
        v-for="(app, index) in apps"
        :key="index"
        class="apps-browser-card"
      >
        <Card
          :text="app.title"
          :description="app.description"
          :icon="GlobeSmallIcon"
          btn-text="Browse"
          variant="primary"
        >
          <BtnMain
            class="card-button"
            text="Browse"
            variant="primary"
            inline
            @click="onSelectApp(app)"
          />
        </Card>
      </div>
    </div>
    <iframe
      v-else
      ref="iframeRef"
      :src="selectedApp.url"
      @load="onAppLoaded()"
    />
  </div>
</template>

<script lang="ts">
import {
  BrowserWindowMessageConnection,
} from '@aeternity/aepp-sdk';
import {
  defineComponent,
  onUnmounted,
  ref,
} from 'vue';

import { useStore } from 'vuex';
import { MODAL_WARNING_DAPP_BROWSER } from '@/constants';
import { useAeSdk, useModals } from '../../composables';
import { handleUnknownError } from '../utils';

import Card from '../components/Card.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import GlobeSmallIcon from '../../icons/globe-small.svg?vue-component';

export default defineComponent({
  components: {
    Card,
    BtnMain,
  },
  setup() {
    // TODO replace with new UI
    const store = useStore();

    const apps = [
      {
        title: 'Aepp Example',
        description: 'This is an example of an aepp that uses the SDK to interact with the blockchain.',
        url: 'https://docs.aeternity.com/aepp-sdk-js/develop/examples/browser/aepp/',
      },
      {
        title: 'Graffiti',
        description: 'This new creative medium, enables the global community to create a graffiti, built on the decentralised, uncensored, transparent blockchain where the work will remain indefinitely, uncensored and open to all.',
        url: 'https://graffiti.aeternity.com',
      },
      // {
      //   title: 'Dex',
      //   url: 'https://dex.prd.aepps.com/swap',
      // },
    ];
    const selectedApp = ref();
    const iframeRef = ref();
    let shareWalletInfoInterval : any;

    const { getAeSdk } = useAeSdk({ store });
    const { openModal } = useModals();

    async function onAppLoaded() {
      if (!iframeRef.value || !selectedApp.value) return;
      const sdk = await getAeSdk();

      const target = iframeRef.value.contentWindow;

      try {
        const connection = new BrowserWindowMessageConnection({
          target,
          origin: undefined,
          debug: true,
        });
        const clientId = sdk.addRpcClient(connection);

        sdk.shareWalletInfo(clientId);

        shareWalletInfoInterval = setInterval(
          () => {
            try {
              sdk.shareWalletInfo(clientId);
            } catch (e) {
              handleUnknownError(e);
            }
          },
          3000,
        );
      } catch (error) {
        handleUnknownError(error);
      }
    }

    function onSelectApp(app: any) {
      openModal(MODAL_WARNING_DAPP_BROWSER).then(() => {
        selectedApp.value = app;
      }, () => { });
    }

    onUnmounted(() => {
      if (shareWalletInfoInterval) {
        clearInterval(shareWalletInfoInterval);
      }
    });

    return {
      iframeRef,

      apps,
      selectedApp,
      onSelectApp,
      onAppLoaded,

      GlobeSmallIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
.apps-browser {
  --screen-padding-x: 8px;

  padding-inline: var(--screen-padding-x);
  height: 100%;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }

  .apps-browser-card {
    margin-bottom: 12px;

    .card-button {
      margin-top: 12px;
    }
  }
}
</style>
