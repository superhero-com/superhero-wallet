<template>
  <Loader />
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { decode } from '@aeternity/aepp-sdk';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';
import { useModals, useAeSdk } from '../../composables';
import { ROUTE_ACCOUNT } from '../router/routeNames';

export default defineComponent({
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const { getAeSdk } = useAeSdk({ store });
    const { openDefaultModal } = useModals();

    onMounted(async () => {
      await getAeSdk();

      try {
        // nm_ prefix was chosen as a dummy to decode from base58Check
        // The secretKey can be retrieved from the URL in two different ways:
        // current: /invite#${secretKey}
        // legacy: /invite/${secretKey}
        await store.dispatch(
          'invites/claim',
          decode(`nm_${route.hash ? route.hash.replace('#', '') : route.fullPath.split('/').at(-1)}`),
        );
        await openDefaultModal({
          msg: 'You have successfully claimed tokens by the invite link',
        });
      } catch (error: any) {
        if (error.message === 'Invalid checksum') {
          await openDefaultModal({
            msg: 'The invite link is broken',
          });
          return;
        }
        if (await store.dispatch('invites/handleNotEnoughFoundsError', { error, isInviteError: true })) {
          return;
        }
        throw error;
      } finally {
        await router.push({ name: ROUTE_ACCOUNT });
      }
    });
  },
});
</script>
