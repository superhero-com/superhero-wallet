<template>
  <div class="more">
    <PanelItem
      :to="{ name: 'settings' }"
      :title="$t('pages.titles.settings')"
      data-cy="settings"
    >
      <template #icon>
        <Settings />
      </template>
    </PanelItem>
    <PanelItem
      :to="{ name: 'tips-claim' }"
      :title="$t('pages.titles.claim-tips')"
      data-cy="tips-claim"
    >
      <template #icon>
        <ClaimTips />
      </template>
    </PanelItem>
    <PanelItem
      :to="{ name: 'invite' }"
      :title="$t('pages.titles.invite')"
      data-cy="invite"
    >
      <template #icon>
        <Invites />
      </template>
    </PanelItem>
    <PanelItem
      :href="BUG_REPORT_URL"
      :title="$t('pages.about.reportBug')"
    >
      <template #icon>
        <BugReport />
      </template>
    </PanelItem>
    <PanelItem
      :href="SIMPLEX_URL"
      :title="$t('pages.fungible-tokens.buyAe')"
    >
      <template #icon>
        <Buy />
      </template>
    </PanelItem>
    <PanelItem
      :href="DEX_URL"
      :title="$t('pages.more.dex')"
    >
      <template #icon>
        <Dex />
      </template>
    </PanelItem>
    <PanelItem
      :to="{ name: 'about' }"
      :title="$t('pages.titles.about')"
      data-cy="about"
    >
      <template #icon>
        <About />
      </template>
    </PanelItem>
  </div>
</template>

<script>
import PanelItem from '../components/PanelItem.vue';
import Invites from '../../../icons/invites.svg?vue-component';
import Settings from '../../../icons/settings.svg?vue-component';
import BugReport from '../../../icons/bug-report.svg?vue-component';
import About from '../../../icons/about.svg?vue-component';
import Buy from '../../../icons/buy.svg?vue-component';
import Dex from '../../../icons/dex.svg?vue-component';
import ClaimTips from '../../../icons/claim-tips.svg?vue-component';
import { DEX_URL, SIMPLEX_URL, BUG_REPORT_URL } from '../../utils/constants';

export default {
  components: {
    PanelItem,
    Invites,
    Settings,
    About,
    Buy,
    Dex,
    BugReport,
    ClaimTips,
  },
  data: () => ({
    SIMPLEX_URL,
    DEX_URL,
    BUG_REPORT_URL,
  }),
};
</script>
