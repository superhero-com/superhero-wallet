<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div
        class="apps-browser"
      >
        <AppsBrowserHeader
          @back="back()"
          @refresh="refresh()"
        />
        <div>
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
              @keydown.enter.stop="handleEnter($event, errorMessage)"
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
      </div>
      <BackToTop />
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import {
  defineComponent,
  onMounted,
  ref,
  computed,
} from 'vue';
import { Field } from 'vee-validate';
import {
  IS_MOBILE_APP,
  MODAL_WARNING_DAPP_BROWSER,
  TRUSTED_DAPPS,
} from '@/constants';
import {
  openInNewWindow,
  toURL,
} from '@/utils';
import {
  useAppsBrowserHistory,
  useModals,
  useInAppBrowser,
} from '@/composables';

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
    const { open: iabOpen, refresh: iabRefresh } = useInAppBrowser();

    const customAppURL = ref('');
    const featuredDapps = TRUSTED_DAPPS.filter(({ isFeatured }) => isFeatured);
    const { openModal, modalsOpen } = useModals();

    const isWarningModalOpened = computed(
      () => !!modalsOpen.value.find((modal) => modal.name === MODAL_WARNING_DAPP_BROWSER),
    );

    function openInAppBrowser(url: string) { iabOpen(url); }

    function refresh() {
      if (IS_MOBILE_APP) {
        iabRefresh();
      }
    }

    function onSelectApp(app: App) {
      openModal(MODAL_WARNING_DAPP_BROWSER).then(() => {
        const url = toURL(app.url).toString();
        if (IS_MOBILE_APP) {
          openInAppBrowser(url);
        } else {
          openInNewWindow(url);
        }
        addHistoryItem({ ...app, url });
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

    function back() { /* noop for simplified flow */ }

    onMounted(() => { /* noop */ });

    return {
      refresh,
      customAppURL,
      featuredDapps,
      onSelectApp,
      CloseIcon,
      GlobeSmallIcon,
      back,
      isWarningModalOpened,
      handleEnter,
      IS_MOBILE_APP,
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
}
</style>
