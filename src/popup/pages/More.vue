<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
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

        <template v-if="isNodeMainnet || isNodeTestnet">
          <PanelItem
            :to="{ name: 'tips-claim' }"
            :title="$t('pages.claimTips.title')"
            :disabled="!isAccountAe"
            data-cy="tips-claim"
          >
            <template #icon>
              <ClaimTips />
            </template>
          </PanelItem>
          <PanelItem
            :to="{ name: 'invite' }"
            :title="$t('pages.titles.giftCards')"
            :disabled="!isAccountAe"
            data-cy="invite"
          >
            <template #icon>
              <Invites />
            </template>
          </PanelItem>
        </template>

        <PanelItem
          :href="BUG_REPORT_URL"
          :title="$t('pages.about.reportBug')"
        >
          <template #icon>
            <BugReport />
          </template>
        </PanelItem>

        <PanelItem
          v-if="isNodeMainnet && UNFINISHED_FEATURES"
          :href="AE_SIMPLEX_URL"
          :title="$t('pages.fungible-tokens.buyAe')"
        >
          <template #icon>
            <BuyIcon />
          </template>
        </PanelItem>
        <PanelItem
          v-else-if="isNodeTestnet"
          :disabled="!isActiveAccountAe"
          :href="activeAccountFaucetUrl"
          :title="$t('common.faucet')"
        >
          <template #icon>
            <FaucetIcon />
          </template>
        </PanelItem>
        <PanelItem
          :href="AE_DEX_URL"
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
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';
import { IonContent, IonPage } from '@ionic/vue';
import { BUG_REPORT_URL, PROTOCOL_AETERNITY, UNFINISHED_FEATURES } from '@/constants';
import { AE_DEX_URL, AE_SIMPLEX_URL } from '@/protocols/aeternity/config';
import { useAccounts, useAeSdk } from '@/composables';

import PanelItem from '../components/PanelItem.vue';
import Invites from '../../icons/invites.svg?vue-component';
import Settings from '../../icons/settings.svg?vue-component';
import BugReport from '../../icons/bug-report.svg?vue-component';
import About from '../../icons/about.svg?vue-component';
import BuyIcon from '../../icons/credit-card.svg?vue-component';
import Dex from '../../icons/dex.svg?vue-component';
import ClaimTips from '../../icons/claim-tips.svg?vue-component';
import FaucetIcon from '../../icons/faucet.svg?vue-component';

export default defineComponent({
  name: 'More',
  components: {
    PanelItem,
    Invites,
    Settings,
    About,
    BuyIcon,
    Dex,
    BugReport,
    ClaimTips,
    FaucetIcon,
    IonPage,
    IonContent,
  },
  setup() {
    const store = useStore();

    const { activeAccount, activeAccountFaucetUrl, isActiveAccountAe } = useAccounts({ store });
    const { isNodeMainnet, isNodeTestnet } = useAeSdk({ store });

    const isAccountAe = computed(() => activeAccount.value.protocol === PROTOCOL_AETERNITY);

    return {
      AE_DEX_URL,
      AE_SIMPLEX_URL,
      BUG_REPORT_URL,
      UNFINISHED_FEATURES,
      activeAccountFaucetUrl,
      isActiveAccountAe,
      isNodeMainnet,
      isNodeTestnet,
      isAccountAe,
    };
  },
});
</script>

<style lang="scss" scoped>
.more {
  --screen-padding-x: 8px;

  overflow: hidden;
  padding-inline: var(--screen-padding-x);
}
</style>
