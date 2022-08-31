<template>
  <div class="more">
    <div class="navigation">
      <BoxButton
        :to="{name: 'settings'}"
        data-cy="settings"
        fill="light"
      >
        <div class="box">
          <Settings class="setting-icon" />
          <span>{{ $t('pages.titles.settings') }}</span>
        </div>
        <ArrowRight class="arrow-right" />
      </BoxButton>
      <BoxButton
        :to="{name: 'invite'}"
        fill="light"
      >
        <div class="box">
          <Invites class="invite-icon" />
          <span>{{ $t('pages.titles.invite') }}</span>
        </div>
        <ArrowRight class="arrow-right" />
      </BoxButton>
      <BoxButton
        :to="BUG_REPORT_URL"
        fill="light"
        is-external-link
      >
        <div class="box">
          <BugReport class="report-icon" />
          <span>{{ $t('pages.about.reportBug') }}</span>
        </div>
        <ExternalLink class="external-link" />
      </BoxButton>
      <BoxButton
        :to="SIMPLEX_URL"
        fill="light"
        is-external-link
      >
        <div class="box">
          <Buy class="buy-icon" />
          <span>{{ $t('pages.fungible-tokens.buyAe') }}</span>
        </div>
        <ExternalLink class="external-link" />
      </BoxButton>
      <BoxButton
        :to="DEX_URL"
        is-external-link
      >
        <div class="box">
          <Dex class="dex-icon" />
          <span>{{ $t('pages.more.dex') }}</span>
        </div>
        <ExternalLink class="external-link" />
      </BoxButton>
      <BoxButton
        :to="{name: 'about'}"
        data-cy="about"
        fill="light"
      >
        <div class="box">
          <About class="about-icon" />
          <span>{{ $t('pages.titles.about') }}</span>
        </div>
        <ArrowRight class="arrow-right" />
      </BoxButton>
    </div>
  </div>
</template>

<script>
import BoxButton from '../components/BoxButton.vue';
import Invites from '../../../icons/invites.svg?vue-component';
import Settings from '../../../icons/settings.svg?vue-component';
import ArrowRight from '../../../icons/arrow-right.svg?vue-component';
import ExternalLink from '../../../icons/external-link.svg?vue-component';
import BugReport from '../../../icons/bug-report.svg?vue-component';
import About from '../../../icons/circle-i.svg?vue-component';
import Buy from '../../../icons/buy.svg?vue-component';
import Dex from '../../../icons/dex.svg?vue-component';
import { DEX_URL, SIMPLEX_URL, BUG_REPORT_URL } from '../../utils/constants';

export default {
  components: {
    BoxButton, Invites, Settings, About, Buy, Dex, ArrowRight, ExternalLink, BugReport,
  },
  data: () => ({
    SIMPLEX_URL,
    DEX_URL,
    BUG_REPORT_URL,
  }),
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.more {
  width: variables.$extension-width;
  margin: 0 auto;

  .navigation {
    width: 100%;

    .box-button {
      margin: 8px;
      padding: 8px 12px;
      width: auto;
      height: 48px;
      border-radius: 10px;
      justify-content: space-between;
      flex-direction: row;
      color: rgba(variables.$color-white, 0.85);
      font-weight: 400;
      -webkit-transition: 0.4s;
      transition: 0.4s;
      opacity: 0.75;

      &:hover {
        color: rgba(variables.$color-white, 1);
      }

      .box {
        display: inline-flex;
        align-items: center;

        svg {
          color: variables.$color-white;
        }

        .setting-icon {
          margin-right: 8px;
          width: 24px;
          height: 24px;
        }

        .invite-icon {
          margin-right: 10px;
          width: 22px;
          height: 22px;
        }

        .report-icon {
          margin-left: 3px;
          margin-right: 13px;
          width: 16px;
          height: 22px;
        }

        .buy-icon {
          margin-left: 1px;
          margin-right: 11px;
          width: 20px;
          height: 20px;
        }

        .dex-icon {
          margin-right: 10px;
          width: 22px;
          height: 22px;
        }

        .about-icon {
          margin-left: 1px;
          margin-right: 11px;
          width: 20px;
          height: 20px;
        }
      }

      .arrow-right {
        margin-right: 4px;
        width: 12px;
        height: 16px;
      }

      .external-link {
        width: 24px;
        height: 24px;
      }
    }
  }
}
</style>
