<template>
  <Loader />
</template>

<script>
import { decode } from '@aeternity/aepp-sdk';
import { watchUntilTruthy } from '../utils/helper';

export default {
  props: {
    secretKey: { type: String, required: true },
  },
  async mounted() {
    await watchUntilTruthy(() => this.$store.state.sdk);
    try {
      // sg_ prefix was chosen as a dummy to decode from base58Check
      await this.$store.dispatch('invites/claim', decode(`sg_${this.secretKey}`, 'sg'));
      await this.$store.dispatch('modals/open', {
        name: 'default',
        msg: 'You have successfully claimed tokens by the invite link',
      });
    } catch (error) {
      if (error.message === 'Invalid checksum') {
        await this.$store.dispatch('modals/open', {
          name: 'default',
          msg: 'The invite link is broken',
        });
        return;
      }
      if (await this.$store.dispatch('invites/handleNotEnoughFoundsError', { error, isInviteError: true })) return;
      throw error;
    } finally {
      await this.$router.push({ name: 'account' });
    }
  },
};
</script>
