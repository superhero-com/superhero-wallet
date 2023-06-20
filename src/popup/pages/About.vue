<template>
  <ion-page>
    <ion-content class="ion-padding">
      <div class="about">
        <div class="table">
          <div class="table-item">
            <div class="name">
              {{ $t('pages.about.name') }}
            </div>
            <div class="value">
              Superhero Wallet
            </div>
          </div>
          <a
            class="table-item link"
            :href="`${COMMIT_URL}${commitHash}`"
            target="_blank"
          >
            <div class="name">
              {{ $t('pages.about.commit') }}
            </div>
            <div class="value">
              {{ commitHash.slice(0, 7) }}
              <Github />
            </div>
          </a>
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
          <template v-if="activeNetwork && mdwStatus">
            <a
              class="table-item link"
              target="_blank"
              :href="`${activeNetwork.middlewareUrl}/status`"
            >
              <div class="name">
                {{ $t('pages.about.middleware-version') }}
              </div>
              <div class="value">
                {{ mdwStatus.mdwVersion }}
                <ExternalLink class="compensate-icon-margin" />
              </div>
            </a>
            <a
              class="table-item link"
              target="_blank"
              :href="`${activeNetwork.middlewareUrl}/status`"
            >
              <div class="name">
                {{ $t('pages.about.node-version') }}
              </div>
              <div class="value">
                {{ mdwStatus.nodeVersion }}
                <ExternalLink class="compensate-icon-margin" />
              </div>
            </a>
          </template>
        </div>

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
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { IonPage, IonContent } from '@ionic/vue';
import type { IMiddlewareStatus, INetwork } from '../../types';
import { BUG_REPORT_URL, AGGREGATOR_URL, COMMIT_URL } from '../utils/constants';
import { useMiddleware } from '../../composables';
import { useGetter } from '../../composables/vuex';

import PanelItem from '../components/PanelItem.vue';
import Terms from '../../icons/terms.svg?vue-component';
import Github from '../../icons/github.svg?vue-component';
import ExternalLink from '../../icons/external-link.svg?vue-component';

const extPackageJson = require('../../../package.json');

export default defineComponent({
  components: {
    PanelItem,
    Terms,
    Github,
    ExternalLink,
    IonPage,
    IonContent,
  },
  setup() {
    const store = useStore();
    const { fetchMiddlewareStatus } = useMiddleware({ store });
    const sdkVersion = String(extPackageJson.dependencies['@aeternity/aepp-sdk']).replace('^', '');
    const mdwStatus = ref<IMiddlewareStatus>();
    const activeNetwork = useGetter<INetwork>('activeNetwork');

    onMounted(async () => {
      mdwStatus.value = await fetchMiddlewareStatus();
    });

    return {
      BUG_REPORT_URL,
      AGGREGATOR_URL,
      COMMIT_URL,
      extensionVersion: process.env.npm_package_version,
      commitHash: process.env.COMMIT_HASH,
      sdkVersion,
      mdwStatus,
      activeNetwork,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.about {
  --screen-padding-x: 8px;

  padding-top: 16px;
  padding-inline: var(--screen-padding-x);

  .table {
    border-radius: variables.$border-radius-interactive;
    overflow: hidden;

    .table-item {
      width: 100%;
      height: 48px;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 4px 16px;
      background: rgba(variables.$color-white, 0.08);

      &:nth-child(even) {
        background-color: rgba(variables.$color-white, 0.06);
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
        text-decoration: none;
        cursor: pointer;
        transition: variables.$transition-interactive;

        &:hover {
          background: rgba(variables.$color-white, 0.05);

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
          background: rgba(variables.$color-white, 0.04);
        }
      }
    }
  }

  .additional-links {
    margin-top: 24px;
  }
}
</style>
