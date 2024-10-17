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

        <PanelItem
          :to="{ name: ROUTE_ADDRESS_BOOK }"
          :title="$t('pages.titles.addressBook')"
          :info="addressBookCount"
          data-cy="address-book"
        >
          <template #icon>
            <MenuCardIcon />
          </template>
        </PanelItem>

        <template v-if="isNodeMainnet || isNodeTestnet">
          <PanelItem
            :to="{ name: 'tips-claim' }"
            :title="$t('pages.claimTips.title')"
            :disabled="!isActiveAccountAe"
            data-cy="tips-claim"
          >
            <template #icon>
              <ClaimTips />
            </template>
          </PanelItem>

          <PanelItem
            :to="{ name: ROUTE_INVITE }"
            :title="$t('pages.titles.giftCards')"
            :disabled="!isActiveAccountAe"
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
            <AboutIcon />
          </template>
        </PanelItem>

        <PanelItem
          v-if="isMnemonicEncrypted || isBiometricLoginEnabled"
          :title="$t('pages.secureLogin.lockWallet')"
          :disabled="isUsingDefaultPassword || (!isMnemonicEncrypted && !isBiometricLoginEnabled)"
          data-cy="lock-wallet"
          @click="lockWallet()"
        >
          <template #icon>
            <SecureIcon />
          </template>
        </PanelItem>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';

import { BUG_REPORT_URL, PROTOCOLS, UNFINISHED_FEATURES } from '@/constants';
import {
  useAccounts,
  useAddressBook,
  useAeSdk,
  useAuth,
  useUi,
} from '@/composables';
import { AE_DEX_URL, AE_SIMPLEX_URL } from '@/protocols/aeternity/config';
import { buildAeFaucetUrl } from '@/protocols/aeternity/helpers';
import { ROUTE_ADDRESS_BOOK, ROUTE_INVITE } from '@/popup/router/routeNames';

import PanelItem from '@/popup/components/PanelItem.vue';

import Invites from '@/icons/invites.svg?vue-component';
import Settings from '@/icons/settings.svg?vue-component';
import BugReport from '@/icons/bug-report.svg?vue-component';
import AboutIcon from '@/icons/about.svg?vue-component';
import BuyIcon from '@/icons/credit-card.svg?vue-component';
import Dex from '@/icons/dex.svg?vue-component';
import ClaimTips from '@/icons/claim-tips.svg?vue-component';
import FaucetIcon from '@/icons/faucet.svg?vue-component';
import MenuCardIcon from '@/icons/menu-card-fill.svg?vue-component';
import SecureIcon from '@/icons/secure-lock.svg?vue-component';

export default defineComponent({
  name: 'More',
  components: {
    PanelItem,
    IonPage,
    IonContent,
    Invites,
    Settings,
    AboutIcon,
    Dex,
    BugReport,
    ClaimTips,
    BuyIcon,
    FaucetIcon,
    MenuCardIcon,
    SecureIcon,
  },
  setup() {
    const { activeAccount } = useAccounts();
    const { isNodeMainnet, isNodeTestnet } = useAeSdk();
    const { addressBook } = useAddressBook();
    const { isMnemonicEncrypted, isUsingDefaultPassword, lockWallet } = useAuth();
    const { isBiometricLoginEnabled } = useUi();

    const isActiveAccountAe = computed(() => activeAccount.value.protocol === PROTOCOLS.aeternity);
    const activeAccountFaucetUrl = computed(
      () => (isActiveAccountAe.value) ? buildAeFaucetUrl(activeAccount.value.address) : null,
    );
    const addressBookCount = computed(() => Object.keys(addressBook.value).length.toString());

    return {
      AE_DEX_URL,
      AE_SIMPLEX_URL,
      BUG_REPORT_URL,
      UNFINISHED_FEATURES,
      ROUTE_ADDRESS_BOOK,
      ROUTE_INVITE,
      lockWallet,
      activeAccountFaucetUrl,
      addressBookCount,
      isActiveAccountAe,
      isNodeMainnet,
      isNodeTestnet,
      isMnemonicEncrypted,
      isBiometricLoginEnabled,
      isUsingDefaultPassword,
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
