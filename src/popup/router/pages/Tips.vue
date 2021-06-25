<template>
  <div class="tips">
    <AccountSwitcher />
    <Tabs>
      <RouterLink
        :to="{ name: 'tips-send' }"
        exact-path
      >
        <TipIcon /> {{ $t('pages.titles.send-tip') }}
      </RouterLink>
      <RouterLink :to="{ name: 'tips-claim' }">
        <ClaimTipsIcon /> {{ $t('pages.titles.claim-tips') }}
      </RouterLink>
    </Tabs>
    <RouterView />
  </div>
</template>

<script>
import AccountSwitcher from '../components/AccountSwitcher';
import Tabs from '../components/Tabs';
import TipIcon from '../../../icons/tip.svg?vue-component';
import ClaimTipsIcon from '../../../icons/claim-tips.svg?vue-component';

export default {
  components: {
    AccountSwitcher,
    Tabs,
    TipIcon,
    ClaimTipsIcon,
  },
};
</script>
