<template>
  <Loader />
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { decode } from '@aeternity/aepp-sdk';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useModals, useSdk } from '../../composables';
import { ROUTE_ACCOUNT } from '../router/routeNames';

export default defineComponent({
  props: {
    secretKey: { type: String, required: true },
  },
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const { getSdk } = useSdk({ store });
    const { openDefaultModal } = useModals();

    onMounted(async () => {
      await getSdk();

      try {
        // sg_ prefix was chosen as a dummy to decode from base58Check
        await store.dispatch('invites/claim', decode(`sg_${props.secretKey}`));
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
