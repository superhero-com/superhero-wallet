<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div
        class="apps-browser"
        :class="{ 'app-selected': selectedApp }"
      >
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
              @keydown.enter.stop="(event) => handleEnter(event, errorMessage)"
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
                  @click="resetField({ value: '' })"
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
                :title="app.title"
                :image="app.image"
                @click="onSelectApp(app)"
              />
            </div>
          </div>
          <AppsBrowserHistory @select-app="onSelectApp" />
        </div>

        <iframe
          v-else
          ref="iframeRef"
          title="selectedApp"
          class="apps-browser-iframe"
          :src="selectedApp.url"
          @load="onAppLoaded()"
        />
      </div>
      <BackToTop v-if="!selectedApp" />
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  BrowserWindowMessageConnection,
  RPC_STATUS,
} from '@aeternity/aepp-sdk';
import { IonPage, IonContent } from '@ionic/vue';
import {
  defineComponent,
  onUnmounted,
  onMounted,
  ref,
  computed,
} from 'vue';
import { Field } from 'vee-validate';
import { MODAL_WARNING_DAPP_BROWSER } from '@/constants';
import { getLocalStorageItem, setLocalStorageItem, handleUnknownError } from '@/utils';
import { useAeSdk, useModals } from '@/composables';
import { useAppsBrowserHistory } from '@/composables/appsBrowserHistory';
import InputField from '@/popup/components/InputField.vue';
import AppsBrowserHeader from '@/popup/components/AppsBrowser/AppsBrowserHeader.vue';
import AppsBrowserListItem from '@/popup/components/AppsBrowser/AppsBrowserListItem.vue';
import AppsBrowserHistory from '@/popup/components/AppsBrowser/AppsBrowserHistory.vue';
import BackToTop from '@/popup/components/BackToTop.vue';
import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';

import CloseIcon from '@/icons/circle-close.svg?vue-component';
import GlobeSmallIcon from '@/icons/globe-small.svg?vue-component';

const DAPPS_LIST = [
  {
    title: 'Aeternity Governance',
    url: 'https://governance.aeternity.com/',
    image: 'Governance.webp',
  },
  {
    title: 'Graffiti Aepp',
    url: 'https://graffiti.aeternity.com',
    image: 'graffiti.svg',
  },
  {
    title: 'Superhero DEX',
    url: 'https://aepp.dex.superhero.com/swap',
    image: 'SuperheroDEX.svg',
  },
];

const LOCAL_STORAGE_ITEM = 'selected-app';

export default defineComponent({
  components: {
    AppsBrowserListItem,
    AppsBrowserHeader,
    AppsBrowserHistory,
    InputField,
    BtnIcon,
    Field,
    IonPage,
    IonContent,
    BackToTop,
  },
  setup() {
    const { addHistoryItem } = useAppsBrowserHistory();

    const selectedApp = ref();
    const iframeRef = ref();
    const customAppURL = ref('');
    const currentClientId = ref('');
    let shareWalletInfoInterval: any;

    const { getAeSdk } = useAeSdk();
    const { openModal, modalsOpen } = useModals();

    const isWarningModalOpened = computed(
      () => !!modalsOpen.value.find((modal) => modal.name === MODAL_WARNING_DAPP_BROWSER),
    );

    async function onAppLoaded() {
      if (!iframeRef.value || !selectedApp.value) return;
      const sdk = await getAeSdk();
      let isAddedToHistory = false;

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
              const rpcClient = sdk._clients.get(currentClientId.value);
              if (rpcClient) {
                sdk.shareWalletInfo(currentClientId.value);

                if (rpcClient.status === RPC_STATUS.CONNECTED && !isAddedToHistory) {
                  isAddedToHistory = true;
                  addHistoryItem(selectedApp.value);
                }
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

    function handleEnter(event: KeyboardEvent, errorMessage?: string) {
      if (
        customAppURL.value.length > 0
        && !errorMessage
        && !isWarningModalOpened.value
      ) {
        (event?.target as HTMLElement).blur();
        onSelectApp({ url: customAppURL.value });
      }
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
      handleEnter,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/typography';
@use '../../styles/mixins';

.apps-browser {
  height: 100%;

  &.app-selected {
    height: 100vh;
    overflow: hidden;

    @include mixins.desktop {
      height: $extension-height;
    }
  }

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
    @extend %face-sans-16-semi-bold;

    margin-left: 12px;
    margin-bottom: 8px;
    opacity: 0.5;
    color: $color-white;
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
