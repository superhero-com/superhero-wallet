<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="about">
        <Panel>
          <PanelTableItem :name="$t('pages.about.name')">
            {{ APP_NAME }}
          </PanelTableItem>

          <PanelTableItem
            :name="$t('pages.about.commit')"
            :href="`${AE_COMMIT_URL}${commitHash}`"
          >
            {{ commitHash?.slice(0, 7) }}
            <GithubIcon class="icon-github" />
          </PanelTableItem>

          <PanelTableItem :name="$t('pages.about.software-version')">
            v.{{ extensionVersion }}
          </PanelTableItem>

          <PanelTableItem :name="$t('pages.about.sdk-version')">
            {{ sdkVersion }}
          </PanelTableItem>

          <template v-if="aeActiveNetworkSettings && middlewareStatus">
            <PanelTableItem
              :name="$t('pages.about.middleware-version')"
              :href="`${middlewareUrl}/status`"
              is-external-link
            >
              {{ middlewareStatus.mdwVersion }}
            </PanelTableItem>

            <PanelTableItem
              v-if="nodeStatus"
              :name="$t('pages.about.node-version')"
              :href="`${nodeUrl}/v3/status`"
              is-external-link
            >
              {{ nodeStatus.node_version }}
            </PanelTableItem>
          </template>
        </Panel>

        <div class="additional-links">
          <PanelItem
            :to="{ name: 'about-terms' }"
            :title="$t('pages.about.terms')"
          >
            <template #icon>
              <TermsIcon />
            </template>
          </PanelItem>
          <PanelItem
            :to="{ name: 'about-privacy' }"
            :title="$t('pages.about.privacyPolicy')"
          >
            <template #icon>
              <TermsIcon />
            </template>
          </PanelItem>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
} from 'vue';
import { IonPage, IonContent } from '@ionic/vue';

import type { IMiddlewareStatus } from '@/types';
import { AGGREGATOR_URL, APP_NAME, BUG_REPORT_URL } from '@/constants';
import { fetchJson } from '@/utils';

import { AE_COMMIT_URL } from '@/protocols/aeternity/config';
import { useAeMiddleware, useAeNetworkSettings } from '@/protocols/aeternity/composables';

import Panel from '@/popup/components/Panel.vue';
import PanelItem from '@/popup/components/PanelItem.vue';
import PanelTableItem from '@/popup/components/PanelTableItem.vue';

import TermsIcon from '@/icons/terms.svg?vue-component';
import GithubIcon from '@/icons/github.svg?vue-component';

export default defineComponent({
  components: {
    Panel,
    PanelItem,
    PanelTableItem,
    TermsIcon,
    GithubIcon,
    IonPage,
    IonContent,
  },
  setup() {
    const { aeActiveNetworkSettings } = useAeNetworkSettings();
    const { fetchMiddlewareStatus } = useAeMiddleware();

    const middlewareStatus = ref<IMiddlewareStatus>();
    const nodeStatus = ref();

    const middlewareUrl = computed(() => aeActiveNetworkSettings.value.middlewareUrl);
    const nodeUrl = computed(() => aeActiveNetworkSettings.value.nodeUrl);

    onMounted(async () => {
      [middlewareStatus.value, nodeStatus.value] = await Promise.all([
        fetchMiddlewareStatus(),
        fetchJson(`${nodeUrl.value}/v3/status`),
      ]);
    });

    return {
      APP_NAME,
      AGGREGATOR_URL,
      AE_COMMIT_URL,
      BUG_REPORT_URL,
      aeActiveNetworkSettings,
      extensionVersion: process.env.npm_package_version,
      commitHash: process.env.COMMIT_HASH,
      sdkVersion: process.env.SDK_VERSION,
      middlewareStatus,
      middlewareUrl,
      nodeStatus,
      nodeUrl,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.about {
  --screen-padding-x: 8px;

  padding-top: 16px;
  padding-inline: var(--screen-padding-x);

  .icon-github {
    width: 24px;
    height: 24px;
    opacity: 0.5;
    margin-left: 4px;
    margin-right: -4px;
  }

  .additional-links {
    margin-top: 24px;
  }
}
</style>
