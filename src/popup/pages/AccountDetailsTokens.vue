<template>
  <div class="account-details-tokens">
    <TokensList
      v-if="isOnline"
      class="tokens-list"
      :search-term="searchPhrase"
    />
    <MessageOffline
      v-else
      class="offline-message"
      :text="$t('modals.accountDetails.assetsNotAvailable')"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useConnection, useTransactionAndTokenFilter } from '../../composables';
import TokensList from '../components/FungibleTokens/TokensList.vue';
import MessageOffline from '../components/MessageOffline.vue';

export default defineComponent({
  components: {
    TokensList,
    MessageOffline,
  },
  props: {
    showFilters: Boolean,
  },
  setup() {
    const { isOnline } = useConnection();
    const { searchPhrase } = useTransactionAndTokenFilter();

    return {
      isOnline,
      searchPhrase,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-details-tokens {
  position: relative;

  .tokens-list {
    padding-top: 4px;
  }

  .offline-message {
    margin-top: 40px;
  }
}
</style>
