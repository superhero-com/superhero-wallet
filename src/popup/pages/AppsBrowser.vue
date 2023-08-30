<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="apps-browser">
        <AppsBrowserHeader
          :selected-app="selectedApp"
          :iframe="iframeRef"
          @back="back()"
          @refresh="refresh()"
        />
        <div v-if="!selectedApp">
          <Field
            v-slot="{ field, errorMessage, resetField }"
            v-model="customAppURL"
            name="customAppURL"
            :rules="{
              url: customAppURL.length > 0,
            }"
          >
            <InputField
              v-bind="field"
              :model-value="customAppURL"
              class="input-url"
              type="url"
              show-message-help
              :placeholder="$t('pages.appsBrowser.inputPlaceholder')"
              :message="errorMessage"
              @keydown.enter.stop="
                customAppURL.length > 0 &&
                  !errorMessage &&
                  !isWarningModalOpened &&
                  onSelectApp({ url: customAppURL })
              "
            >
              <template #after>
                <Component
                  :is="GlobeSmallIcon"
                  v-if="!customAppURL.length"
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
              v-for="app in DAPPS_LIST"
              :key="app.title"
              class="apps-browser-card"
            >
              <AppsBrowserListItem
                :app-title="app.title"
                :app-icon="app.icon"
                :app-image="app.image"
                @click="onSelectApp(app)"
              />
            </div>
          </div>
        </div>
        <iframe
          v-else
          ref="iframeRef"
          class="apps-browser-iframe"
          :src="selectedApp.url"
          @load="onAppLoaded()"
        />
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  BrowserWindowMessageConnection,
} from '@aeternity/aepp-sdk';
import { IonPage, IonContent } from '@ionic/vue';
import {
  defineComponent,
  onUnmounted,
  onMounted,
  ref,
  computed,
} from 'vue';
import { useStore } from 'vuex';
import { MODAL_WARNING_DAPP_BROWSER } from '@/constants';
import { Field } from 'vee-validate';
import { getLocalStorageItem, setLocalStorageItem, handleUnknownError } from '@/utils';
import { useAeSdk, useModals } from '@/composables';
import InputField from '@/popup/components/InputField.vue';
import AppsBrowserHeader from '@/popup/components/AppsBrowserHeader.vue';
import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';
import AppsBrowserListItem from '@/popup/components/AppsBrowserListItem.vue';

import CloseIcon from '@/icons/circle-close.svg?vue-component';
import GlobeSmallIcon from '@/icons/globe-small.svg?vue-component';
import GraffitiIcon from '@/icons/dapp/graffiti.svg?vue-component';
import DEXIcon from '@/icons/dapp/SuperheroDEX.svg?vue-component';

const DAPPS_LIST = [
  {
    title: 'Aeternity Governance',
    url: 'https://governance.aeternity.com/',
    image: 'Governance.png',
  },
  {
    title: 'Graffiti Aepp',
    url: 'https://graffiti.aeternity.com',
    icon: GraffitiIcon,
  },
  {
    title: 'Superhero DEX',
    url: 'https://aepp.dex.superhero.com/swap',
    icon: DEXIcon,
  },
];

const LOCAL_STORAGE_ITEM = 'selected-app';

export default defineComponent({
  components: {
    AppsBrowserListItem,
    AppsBrowserHeader,
    InputField,
    BtnIcon,
    Field,
    IonPage,
    IonContent,
  },
  setup() {
    const store = useStore();

    const selectedApp = ref();
    const iframeRef = ref();
    const customAppURL = ref('');
    const currentClientId = ref('');
    let shareWalletInfoInterval: any;

    const { getAeSdk } = useAeSdk({ store });
    const { openModal, modalsOpen } = useModals();

    const isWarningModalOpened = computed(
      () => !!modalsOpen.value.find((modal) => modal.name === MODAL_WARNING_DAPP_BROWSER),
    );

    async function onAppLoaded() {
      if (!iframeRef.value || !selectedApp.value) return;
      const sdk = await getAeSdk();

      const target = iframeRef.value.contentWindow;

      try {
        const connection = new BrowserWindowMessageConnection({
          target,
          origin: undefined,
        });
        currentClientId.value = sdk.addRpcClient(connection);

        sdk.shareWalletInfo(currentClientId.value);

        shareWalletInfoInterval = setInterval(
          () => {
            try {
              if (sdk._clients.get(currentClientId.value)) {
                sdk.shareWalletInfo(currentClientId.value);
              }
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
      if (iframeRef.value && selectedApp.value) {
        setLocalStorageItem([LOCAL_STORAGE_ITEM], selectedApp.value);
        window.location.reload();
      }
    }

    function onSelectApp(app: any) {
      openModal(MODAL_WARNING_DAPP_BROWSER).then(() => {
        const sanitizedUrl = app.url.startsWith('http://') || app.url.startsWith('https://')
          ? app.url
          : `https://${app.url}`;

        selectedApp.value = { ...app, url: sanitizedUrl };
      }, () => { });
    }

    /**
     * Clean up after the iframe is closed
     */
    async function onAppDisconnected() {
      selectedApp.value = null;
      customAppURL.value = '';

      if (shareWalletInfoInterval) {
        clearInterval(shareWalletInfoInterval);
      }
      if (currentClientId.value) {
        const sdk = await getAeSdk();
        if (sdk._clients.get(currentClientId.value)) {
          sdk.removeRpcClient(currentClientId.value);
        }
      }
    }

    function back() {
      onAppDisconnected();
    }

    onMounted(() => {
      const isAppSelected = getLocalStorageItem([LOCAL_STORAGE_ITEM]);
      if (isAppSelected) {
        selectedApp.value = isAppSelected;
        setLocalStorageItem([LOCAL_STORAGE_ITEM], null);
      }
    });

    onUnmounted(() => {
      onAppDisconnected();
    });

    return {
      refresh,
      iframeRef,
      customAppURL,
      DAPPS_LIST,
      selectedApp,
      onSelectApp,
      onAppLoaded,
      CloseIcon,
      GlobeSmallIcon,
      back,
      isWarningModalOpened,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/typography';

.apps-browser {
  height: 100vh;
  overflow: hidden;

  .input-url {
    margin: 16px 8px;

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

  .apps-browser-iframe {
    --header-height: 40px;

    width: 100%;
    height: 100%;
    overflow: hidden;
    border: none;
    margin-top: calc(-1 * (var(--header-height) + env(safe-area-inset-top)));
    padding-top: calc(var(--header-height) + env(safe-area-inset-top));
  }
}
</style>
