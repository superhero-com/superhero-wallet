<template>
  <Loader />
</template>

<script lang="ts">
import { defineComponent, getCurrentInstance, onMounted } from 'vue';
import { TxBuilderHelper } from '@aeternity/aepp-sdk';
import { useStore } from 'vuex';
import { useModals, useSdk } from '../../composables';
import { ROUTE_ACCOUNT } from '../router/routeNames';

export default defineComponent({
  props: {
    secretKey: { type: String, required: true },
  },
  setup(props) {
    const instance = getCurrentInstance();
    const root = instance?.root as any;
    const store = useStore();
    const { getSdk } = useSdk({ store });
    const { openDefaultModal } = useModals();

    onMounted(async () => {
      await getSdk();

      try {
        // sg_ prefix was chosen as a dummy to decode from base58Check
        await root.$store.dispatch('invites/claim', TxBuilderHelper.decode(`sg_${props.secretKey}`, 'sg'));
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
        if (await root.$store.dispatch('invites/handleNotEnoughFoundsError', { error, isInviteError: true })) {
          return;
        }
        throw error;
      } finally {
        await root.$router.push({ name: ROUTE_ACCOUNT });
      }
    });
  },
});
</script>
