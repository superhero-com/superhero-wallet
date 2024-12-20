<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div
        class="apps-browser"
        :class="{ 'app-selected': selectedApp }"
      >
        <AppsBrowserHeader
          :selected-app="selectedApp"
          :iframe="iframeEl"
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
              @keydown.enter.stop="(event: any) => handleEnter(event, errorMessage)"
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

          <div
            class="apps-browser-popular-apps"
            v-text="$t('pages.appsBrowser.popularApps')"
          />

          <div class="apps-browser-list">
            <div
              v-for="app in featuredDapps"
              :key="app.name"
              class="apps-browser-card"
            >
              <AppsBrowserListItem
                :name="app.name"
                :image="app.image"
                @click="onSelectApp(app)"
              />
            </div>
          </div>
          <AppsBrowserHistory @select-app="onSelectApp" />
        </div>

        <iframe
          v-else
          ref="iframeEl"
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
import { IS_SAFARI, MODAL_WARNING_DAPP_BROWSER, TRUSTED_DAPPS } from '@/constants';
import {
  getLocalStorageItem,
  setLocalStorageItem,
  handleUnknownError,
  executeAndSetInterval,
  toURL,
} from '@/utils';
import { useAeSdk, useAppsBrowserHistory, useModals } from '@/composables';

import InputField from '@/popup/components/InputField.vue';
import AppsBrowserHeader from '@/popup/components/AppsBrowser/AppsBrowserHeader.vue';
import AppsBrowserListItem from '@/popup/components/AppsBrowser/AppsBrowserListItem.vue';
import AppsBrowserHistory from '@/popup/components/AppsBrowser/AppsBrowserHistory.vue';
import BackToTop from '@/popup/components/BackToTop.vue';
import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';

import CloseIcon from '@/icons/circle-close.svg?vue-component';
import GlobeSmallIcon from '@/icons/globe-small.svg?vue-component';

interface App {
  title?: string;
  url: string;
  image?: string;
}

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

    const selectedApp = ref<App>();
    const iframeEl = ref<HTMLIFrameElement>();
    const customAppURL = ref('');
    const currentClientId = ref('');
    const featuredDapps = TRUSTED_DAPPS.filter(({ isFeatured }) => isFeatured);
    let shareWalletInfoInterval: any;
    let lastUrlAddedToHistory = '';

    const { getAeSdk } = useAeSdk();
    const { openModal, modalsOpen } = useModals();

    const isWarningModalOpened = computed(
      () => !!modalsOpen.value.find((modal) => modal.name === MODAL_WARNING_DAPP_BROWSER),
    );

    async function removeRpcClientIfAny() {
      if (!currentClientId.value) return;
      clearInterval(shareWalletInfoInterval);
      const sdk = await getAeSdk();
      sdk.removeRpcClient(currentClientId.value);
      currentClientId.value = '';
    }

    async function onAppLoaded() {
      if (!iframeEl.value || !selectedApp.value) return;
      // Don't recreate RpcClient in Safari desktop and iOS webview
      // because on these platforms `load` event triggers on anchor navigation
      if (IS_SAFARI && currentClientId.value) return;
      await removeRpcClientIfAny();
      const sdk = await getAeSdk();
      const target = iframeEl.value.contentWindow!;
      const connection = new BrowserWindowMessageConnection({ target });
      currentClientId.value = sdk.addRpcClient(connection);
      const app = selectedApp.value;
      shareWalletInfoInterval = executeAndSetInterval(
        () => {
          const rpcClient = sdk._getClient(currentClientId.value);
          if (rpcClient.status === RPC_STATUS.CONNECTED && lastUrlAddedToHistory !== app.url) {
            lastUrlAddedToHistory = app.url;
            addHistoryItem(app);
          }
          try {
            if (rpcClient.status === RPC_STATUS.WAITING_FOR_CONNECTION_REQUEST) {
              sdk.shareWalletInfo(currentClientId.value);
            } else {
              clearInterval(shareWalletInfoInterval);
            }
          } catch (e) {
            handleUnknownError(e);
          }
        },
        3000,
      );
    }

    function refresh() {
      if (iframeEl.value && selectedApp.value) {
        setLocalStorageItem([LOCAL_STORAGE_ITEM], selectedApp.value);
        window.location.reload();
      }
    }

    function onSelectApp(app: App) {
      openModal(MODAL_WARNING_DAPP_BROWSER).then(() => {
        selectedApp.value = { ...app, url: toURL(app.url).toString() };
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
      selectedApp.value = undefined;
      customAppURL.value = '';
      await removeRpcClientIfAny();
    }

    function back() {
      onAppDisconnected();
    }

    onMounted(() => {
      const isAppSelected = getLocalStorageItem<App>([LOCAL_STORAGE_ITEM]);
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
      iframeEl,
      customAppURL,
      featuredDapps,
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
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

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
    padding-bottom: 15px;
  }
}
</style>
