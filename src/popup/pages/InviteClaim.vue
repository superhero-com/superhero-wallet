<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { decode } from '@aeternity/aepp-sdk';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

import { MODAL_CLAIM_GIFT_CARD } from '@/constants';
import { useModals } from '../../composables';
import { ROUTE_ACCOUNT } from '../router/routeNames';

export default defineComponent({
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const { openDefaultModal, openModal } = useModals();

    onMounted(async () => {
      router.push({ name: ROUTE_ACCOUNT });

      try {
        // nm_ prefix was chosen as a dummy to decode from base58Check
        // The secretKey can be retrieved from the URL in two different ways:
        // current: /invite#${secretKey}
        // legacy: /invite/${secretKey}
        await openModal(MODAL_CLAIM_GIFT_CARD, {
          secretKey: decode(`nm_${route.hash ? route.hash.replace('#', '') : route.fullPath.split('/').at(-1)}`),
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
      }
    });
  },
  render() {
    return null as any;
  },
});
</script>
