<template>
  <div class="apps-browser">
    <AppsBrowserHeader
      :selected-app="selectedApp"
      :i-frame="iframeRef"
      @back="selectedApp = null"
      @refresh="refresh()"
    />
    <div v-if="!selectedApp">
      <Field
        v-slot="{ field, errorMessage, resetField }"
        v-model="customAppURL"
        name="customAppURL"
        :rules="{
          url: customAppURL.length > 0 ? true : false,
        }"
      >
        <InputField
          v-bind="field"
          :model-value="customAppURL"
          class="input-url"
          type="url"
          :placeholder="$t('pages.appsBrowser.inputPlaceholder')"
          :message="errorMessage"
          @keydown.enter="onSelectApp({ url: customAppURL })"
        >
          <template #after="{ focused }">
            <Component
              :is="GlobeSmallIcon"
              v-if="!focused && customAppURL.length === 0"
            />
            <BtnIcon
              v-else
              size="sm"
              :icon="CloseIcon"
              @click="resetField({value: ''})"
            />
          </template>
        </InputField>
      </Field>

      <div class="apps-browser-popular-apps">
        {{ $t('pages.appsBrowser.popularApps') }}
      </div>

      <div class="apps-browser-list">
        <div
          v-for="(app, index) in apps"
          :key="index"
          class="apps-browser-card"
        >
          <AppsBrowserListItem
            :app-title="app.title"
            :app-icon="app.icon"
            @click="onSelectApp(app)"
          />
        </div>
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
  onMounted,
  ref,
} from 'vue';
import { useStore } from 'vuex';
import { MODAL_WARNING_DAPP_BROWSER } from '@/constants';
import { Field } from 'vee-validate';
import { getLocalStorageItem, setLocalStorageItem, handleUnknownError } from '@/utils';
import { useAeSdk, useModals } from '../../composables';
import InputField from '../components/InputField.vue';
import AppsBrowserHeader from '../components/AppsBrowserHeader.vue';
import BtnIcon from '../components/buttons/BtnIcon.vue';
import AppsBrowserListItem from '../components/AppsBrowserListItem.vue';

import CloseIcon from '../../icons/circle-close.svg?vue-component';
import GlobeSmallIcon from '../../icons/globe-small.svg?vue-component';
import GraffitiIcon from '../../icons/dapp/graffiti.svg?vue-component';
import DEXIcon from '../../icons/dapp/SuperheroDEX.svg?vue-component';
import SuperheroIcon from '../../icons/dapp/superhero.svg?vue-component';

export default defineComponent({
  components: {
    AppsBrowserListItem,
    AppsBrowserHeader,
    InputField,
    BtnIcon,
    Field,
  },
  setup() {
    const store = useStore();

    const apps = [
      {
        title: 'Graffiti',
        url: 'https://graffiti.aeternity.com',
        icon: GraffitiIcon,
      },
      {
        title: 'Superhero Social',
        url: 'https://superhero.com',
        icon: SuperheroIcon,
      },
      {
        title: 'Dex',
        url: 'https://dex.prd.aepps.com/swap',
        icon: DEXIcon,
      },
    ];

    const selectedApp = ref();
    const iframeRef = ref();
    const customAppURL = ref('');
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

    function refresh() {
      if (!iframeRef.value || !selectedApp.value) return;
      setLocalStorageItem(['selectedApp'], selectedApp.value);
      window.location.reload();
    }

    function onSelectApp(app: any) {
      openModal(MODAL_WARNING_DAPP_BROWSER).then(() => {
        selectedApp.value = app;
      }, () => { });
    }

    onMounted(() => {
      const isAppSelected = getLocalStorageItem(['selectedApp']);
      if (isAppSelected) {
        selectedApp.value = isAppSelected;
        setLocalStorageItem(['selectedApp'], null);
      }
    });
    onUnmounted(() => {
      if (shareWalletInfoInterval) {
        clearInterval(shareWalletInfoInterval);
      }
    });

    return {
      refresh,
      iframeRef,
      customAppURL,
      apps,
      selectedApp,
      onSelectApp,
      onAppLoaded,
      CloseIcon,
      GlobeSmallIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/typography';

.apps-browser {
  --screen-padding-x: 8px;

  padding-inline: var(--screen-padding-x);
  height: 100%;

  .input-url {
    padding: 16px 8px;

    .icon {
      width: 20px !important;
      height: 20px !important;
      margin: 4px;
    }
  }

  .apps-browser-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 8px;
    align-items: flex-start;
    padding-top: 8px;
  }

  .apps-browser-popular-apps {
    margin-left: 12px;
    margin-bottom: 8px;
    opacity: 0.5;
    color: $color-white;
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
  }

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
}
</style>
