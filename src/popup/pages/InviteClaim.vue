<template>
  <Loader />
</template>

<script lang="ts">
import { defineComponent, onMounted } from '@vue/composition-api';
import { TxBuilderHelper } from '@aeternity/aepp-sdk';
import { useModals, useSdk } from '../../composables';

export default defineComponent({
  props: {
    secretKey: { type: String, required: true },
  },
  setup(props, { root }) {
    const { getSdk } = useSdk({ store: root.$store });
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
        await root.$router.push({ name: 'account' });
      }
    });
  },
});
</script>
