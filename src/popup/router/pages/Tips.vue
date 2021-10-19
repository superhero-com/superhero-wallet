<template>
  <div class="tips">
    <Plate>
      <AccountSwitcher />
      <Tabs slot="bottom">
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
    </Plate>
    <RouterView />
  </div>
</template>

<script>
import Plate from '../components/Plate.vue';
import AccountSwitcher from '../components/AccountSwitcher.vue';
import Tabs from '../components/Tabs.vue';
import TipIcon from '../../../icons/tip.svg?vue-component';
import ClaimTipsIcon from '../../../icons/claim-tips.svg?vue-component';

export default {
  components: {
    Plate,
    AccountSwitcher,
    Tabs,
    TipIcon,
    ClaimTipsIcon,
  },
};
</script>
