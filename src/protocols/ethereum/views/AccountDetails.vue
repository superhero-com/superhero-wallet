<template>
  <AccountDetailsBase
    class="account-details-ethereum"
  >
    <template #navigation>
      <AccountDetailsNavigation
        :route-names="[
          ROUTE_ACCOUNT_DETAILS,
          ROUTE_ACCOUNT_DETAILS_ASSETS,
        ]"
      />
    </template>
  </AccountDetailsBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { PROTOCOL_VIEW_ACCOUNT_DETAILS } from '@/constants';
import { ROUTE_ACCOUNT_DETAILS, ROUTE_ACCOUNT_DETAILS_ASSETS } from '@/popup/router/routeNames';

import AccountDetailsBase from '@/popup/components/AccountDetailsBase.vue';
import AccountDetailsNavigation from '@/popup/components/AccountDetailsNavigation.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_ACCOUNT_DETAILS,
  components: {
    AccountDetailsBase,
    AccountDetailsNavigation,
  },
  setup() {
    return {
      ROUTE_ACCOUNT_DETAILS,
      ROUTE_ACCOUNT_DETAILS_ASSETS,
    };
  },
});
</script>
