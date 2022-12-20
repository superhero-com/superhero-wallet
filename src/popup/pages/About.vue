<template>
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
          {{ extensionVersion }}
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
      <a
        v-if="activeNetwork"
        class="table-item link"
        target="_blank"
        :href="`${activeNetwork.middlewareUrl}/status`"
      >
        <div class="name">
          {{ $t('pages.about.middleware-version') }}
        </div>
        <div class="value">
          {{ mdw.mdw_version }}
          <ExternalLink class="compensate-icon-margin" />
        </div>
      </a>
      <a
        v-if="activeNetwork"
        class="table-item link"
        target="_blank"
        :href="`${activeNetwork.middlewareUrl}/status`"
      >
        <div class="name">
          {{ $t('pages.about.node-version') }}
        </div>
        <div class="value">
          {{ mdw.node_version }}
          <ExternalLink class="compensate-icon-margin" />
        </div>
      </a>
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
</template>

<script>
import { mapGetters } from 'vuex';
import PanelItem from '../components/PanelItem.vue';
import Terms from '../../icons/terms.svg?vue-component';
import Github from '../../icons/github.svg?vue-component';
import ExternalLink from '../../icons/external-link.svg?vue-component';
import { BUG_REPORT_URL, AGGREGATOR_URL, COMMIT_URL } from '../utils/constants';
import { fetchJson } from '../utils/helper';

const extPackageJson = require('../../../package.json');

export default {
  components: {
    PanelItem,
    Terms,
    Github,
    ExternalLink,
  },
  data() {
    return {
      extensionVersion: `v.${process.env.npm_package_version}`,
      commitHash: process.env.COMMIT_HASH,
      BUG_REPORT_URL,
      AGGREGATOR_URL,
      COMMIT_URL,
      mdw: {},
      sdkVersion: null,
    };
  },
  computed: mapGetters(['activeNetwork']),
  mounted() {
    this.fetchMiddlewareVersion();
    this.sdkVersion = String(extPackageJson.dependencies['@aeternity/aepp-sdk']).replace('^', '');
  },
  methods: {
    async fetchMiddlewareVersion() {
      try {
        this.mdw = await fetchJson(`${this.activeNetwork.middlewareUrl}/status`);
      } catch (error) {
        //
      }
    },
  },
};
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
