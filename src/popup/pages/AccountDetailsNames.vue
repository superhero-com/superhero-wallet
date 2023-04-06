<template>
  <div class="account-details-names">
    <transition
      name="fade-transition"
      mode="out-in"
    >
      <RouterView
        v-if="isOnline"
      />
      <MessageOffline
        v-else
        class="offline-message"
        :text="$t('modals.accountDetails.namesNotAvailable')"
      />
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useConnection } from '../../composables';
import MessageOffline from '../components/MessageOffline.vue';

export default defineComponent({
  components: {
    MessageOffline,
  },
  setup() {
    const { isOnline } = useConnection();

    return {
      isOnline,
    };
  },
});
</script>

<style lang="scss" scoped>
.account-details-names {
  .offline-message {
    margin-top: 40px;
  }
}
</style>
