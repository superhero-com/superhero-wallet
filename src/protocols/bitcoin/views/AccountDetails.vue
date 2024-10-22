<template>
  <AccountDetailsBase
    class="account-details-bitcoin"
  />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { PROTOCOL_VIEW_ACCOUNT_DETAILS } from '@/constants';

import AccountDetailsBase from '@/popup/components/AccountDetailsBase.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_ACCOUNT_DETAILS,
  components: {
    AccountDetailsBase,
  },
});
</script>
