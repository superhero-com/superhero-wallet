<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="about">
        <Panel>
          <div class="table-item">
            <div class="name">
              {{ $t('pages.about.name') }}
            </div>
            <div class="value">
              Superhero Wallet
            </div>
          </div>
          <LinkButton
            class="table-item link"
            :to="`${AE_COMMIT_URL}${commitHash}`"
          >
            <div class="name">
              {{ $t('pages.about.commit') }}
            </div>
            <div class="value">
              {{ commitHash?.slice(0, 7) }}
              <Github />
            </div>
          </LinkButton>
          <div class="table-item">
            <div class="name">
              {{ $t('pages.about.software-version') }}
            </div>
            <div class="value">
              v.{{ extensionVersion }}
            </div>
          </div>
          <div class="table-item">
            <div class="name">
              {{ $t('pages.about.sdk-version') }}
            </div>
            <div class="value">
              {{ sdkVersion }}
            </div>
          </div>
          <template v-if="aeActiveNetworkSettings && middlewareStatus">
            <LinkButton
              class="table-item link"
              :to="`${middlewareUrl}/status`"
            >
              <div class="name">
                {{ $t('pages.about.middleware-version') }}
              </div>
              <div class="value">
                {{ middlewareStatus.mdwVersion }}
                <ExternalLink class="compensate-icon-margin" />
              </div>
            </LinkButton>
            <LinkButton
              class="table-item link"
              :to="`${nodeUrl}/v3/status`"
            >
              <div class="name">
                {{ $t('pages.about.node-version') }}
              </div>
              <div class="value">
                {{ nodeStatus.node_version }}
                <ExternalLink class="compensate-icon-margin" />
              </div>
            </LinkButton>
          </template>
        </Panel>

        <div class="additional-links">
          <PanelItem
            :to="{ name: 'about-terms' }"
            :title="$t('pages.about.terms')"
          >
            <template #icon>
              <Terms />
            </template>
          </PanelItem>
          <PanelItem
            :to="{ name: 'about-privacy' }"
            :title="$t('pages.about.privacyPolicy')"
          >
            <template #icon>
              <Terms />
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
import { BUG_REPORT_URL, AGGREGATOR_URL } from '@/constants';
import { AE_COMMIT_URL } from '@/protocols/aeternity/config';
import { useAeMiddleware, useAeNetworkSettings } from '@/protocols/aeternity/composables';
import { fetchJson } from '@/utils';

import LinkButton from '@/popup/components/LinkButton.vue';
import PanelItem from '@/popup/components/PanelItem.vue';
import Panel from '@/popup/components/Panel.vue';

import Terms from '@/icons/terms.svg?vue-component';
import Github from '@/icons/github.svg?vue-component';
import ExternalLink from '@/icons/external-link.svg?vue-component';

export default defineComponent({
  components: {
    LinkButton,
    PanelItem,
    Panel,
    Terms,
    Github,
    ExternalLink,
    IonPage,
    IonContent,
  },
  setup() {
    const { aeActiveNetworkSettings } = useAeNetworkSettings();
    const { fetchMiddlewareStatus } = useAeMiddleware();

    const middlewareStatus = ref<IMiddlewareStatus>();
    const nodeStatus = ref(null);

    const middlewareUrl = computed(() => aeActiveNetworkSettings.value.middlewareUrl);
    const nodeUrl = computed(() => aeActiveNetworkSettings.value.nodeUrl);

    onMounted(async () => {
      [middlewareStatus.value, nodeStatus.value] = await Promise.all([
        fetchMiddlewareStatus(),
        fetchJson(`${nodeUrl.value}/v3/status`),
      ]);
    });

    return {
      BUG_REPORT_URL,
      AGGREGATOR_URL,
      AE_COMMIT_URL,
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
@use '@/styles/variables';
@use '@/styles/typography';

.about {
  --screen-padding-x: 8px;

  padding-top: 16px;
  padding-inline: var(--screen-padding-x);

  .table-item {
    width: 100%;
    height: 48px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 4px 16px;
    transition: variables.$transition-interactive;

    &:nth-child(even) {
      background-color: rgba(variables.$color-black, 0.1);
    }

    .name,
    .value,
    .value .icon {
      transition: inherit;
    }

    .name {
      @extend %face-sans-15-regular;

      color: rgba(variables.$color-white, 0.75);
      font-weight: 400;
    }

    .value {
      @extend %face-sans-14-light;

      display: inline-flex;
      align-items: center;
      color: rgba(variables.$color-white, 1);

      .icon {
        width: 24px;
        height: 24px;
        opacity: 0.5;
        margin-left: 4px;
        margin-right: -4px;
      }
    }

    &.link {
      position: relative;
      text-decoration: none;
      cursor: pointer;

      &:hover {
        background-color: rgba(variables.$color-black, 0.16);

        .name {
          color: variables.$color-white;
        }

        .value {
          text-decoration: underline;

          .icon {
            opacity: 1;
          }
        }
      }

      &:active {
        background-color: rgba(variables.$color-black, 0.4);
      }
    }
  }

  .additional-links {
    margin-top: 24px;
  }
}
</style>
