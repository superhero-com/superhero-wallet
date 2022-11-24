<template>
  <div class="account-details-names">
    <Transition
      v-if="isMiddlewareReady"
      name="fade-transition"
      mode="out-in"
    >
      <RouterView
        v-if="isOnline && isMiddlewareReady"
      />
      <MessageOffline
        v-else
        class="offline-message"
        :text="$t('modals.accountDetails.namesNotAvailable')"
      />
    </Transition>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import { useConnection, useMiddleware } from '../../composables';
import MessageOffline from '../components/MessageOffline.vue';

export default defineComponent({
  components: {
    MessageOffline,
  },
  setup(props, { root }) {
    const { isOnline } = useConnection();
    const { isMiddlewareReady } = useMiddleware({ store: root.$store });

    return {
      isOnline,
      isMiddlewareReady,
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
