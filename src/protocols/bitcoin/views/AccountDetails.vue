<template>
  <AccountDetailsBase class="account-details">
    <template #balance>
      <div class="text-center">
        <h3>BTC</h3>
        <p>This is a temporary component that uses the account base boilerplate.</p>
      </div>
    </template>

    <template #buttons>
      <BtnBox
        text="Example button 1"
      />
      <BtnBox
        text="Example button 2"
      />
    </template>

    <template #navigation>
      <!-- Create BTC navigation component and insert it here -->
    </template>
  </AccountDetailsBase>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { PROTOCOL_VIEW_ACCOUNT_DETAILS } from '@/constants';

import AccountDetailsBase from '@/popup/components/AccountDetailsBase.vue';
import BtnBox from '@/popup/components/buttons/BtnBox.vue';

export default defineComponent({
  name: PROTOCOL_VIEW_ACCOUNT_DETAILS,
  components: {
    AccountDetailsBase,
    BtnBox,
  },
  setup() {
    return {
    };
  },
});
</script>
