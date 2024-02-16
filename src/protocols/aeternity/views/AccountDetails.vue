<template>
  <IonPage>
    <IonContent class="account-ion-content">
      <AccountDetailsBase
        v-if="isPageActive"
        class="account-details"
      >
        <template #buttons>
          <BtnBox
            v-if="isNodeMainnet && UNFINISHED_FEATURES"
            :icon="CreditCardIcon"
            :text="$t('common.buy')"
            :href="activeAccountSimplexLink"
            :disabled="!isOnline"
          />
          <BtnBox
            v-if="isNodeTestnet"
            :icon="FaucetIcon"
            :text="$t('common.faucet')"
            :href="activeAccountFaucetUrl"
          />
          <BtnBox
            v-if="IS_MOBILE_APP && (isNodeMainnet || isNodeTestnet) || UNFINISHED_FEATURES"
            :icon="GlobeSmallIcon"
            :text="$t('common.browser')"
            :to="{ name: ROUTE_APPS_BROWSER }"
          />
        </template>

        <template #navigation>
          <AccountDetailsNavigation />
        </template>
      </AccountDetailsBase>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  PropType,
  computed,
  defineComponent,
  ref,
  watch,
} from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { IonicLifecycleStatus } from '@/types';
import {
  IS_MOBILE_APP,
  IS_IOS,
  PROTOCOL_VIEW_ACCOUNT_DETAILS,
  UNFINISHED_FEATURES,
} from '@/constants';
import {
  useAccounts,
  useConnection,
  useAeSdk,
} from '@/composables';
import { ROUTE_APPS_BROWSER } from '@/popup/router/routeNames';
import { AE_DEX_URL } from '@/protocols/aeternity/config';
import { buildAeFaucetUrl, buildSimplexLink } from '@/protocols/aeternity/helpers';

import AccountDetailsBase from '@/popup/components/AccountDetailsBase.vue';
import AccountDetailsNavigation from '@/popup/components/AccountDetailsNavigation.vue';
import BtnBox from '@/popup/components/buttons/BtnBox.vue';

import CreditCardIcon from '@/icons/credit-card.svg?vue-component';
import SwapIcon from '@/icons/swap.svg?vue-component';
import FaucetIcon from '@/icons/faucet.svg?vue-component';
import GlobeSmallIcon from '@/icons/globe-small.svg?vue-component';

export default defineComponent({
  name: PROTOCOL_VIEW_ACCOUNT_DETAILS,
  components: {
    BtnBox,
    AccountDetailsNavigation,
    AccountDetailsBase,
    IonPage,
    IonContent,
  },
  props: {
    ionicLifecycleStatus: { type: String as PropType<IonicLifecycleStatus>, default: null },
  },
  setup(props) {
    const isPageActive = ref(false);

    const { isOnline } = useConnection();
    const { isNodeMainnet, isNodeTestnet } = useAeSdk();
    const { activeAccount } = useAccounts();

    const activeAccountFaucetUrl = computed(() => buildAeFaucetUrl(activeAccount.value.address));
    const activeAccountSimplexLink = computed(() => buildSimplexLink(activeAccount.value.address));

    watch(() => props.ionicLifecycleStatus, (status) => {
      if (status === 'didEnter') {
        isPageActive.value = true;
      } else if (status === 'didLeave') {
        isPageActive.value = false;
      }
    });

    return {
      UNFINISHED_FEATURES,
      ROUTE_APPS_BROWSER,
      AE_DEX_URL,
      IS_MOBILE_APP,
      IS_IOS,
      CreditCardIcon,
      SwapIcon,
      FaucetIcon,
      GlobeSmallIcon,
      isOnline,
      isNodeMainnet,
      isNodeTestnet,
      activeAccount,
      activeAccountSimplexLink,
      activeAccountFaucetUrl,
      isPageActive,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables';

.account-ion-content {
  overflow: hidden;
  background-color: variables.$color-bg-4;
}
</style>
