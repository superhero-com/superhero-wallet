<template>
  <Loader />
</template>

<script>
import { Crypto } from '@aeternity/aepp-sdk/es';

export default {
  props: {
    secretKey: { type: String, required: true },
  },
  async mounted() {
    await this.$watchUntilTruly(() => this.$store.state.sdk);
    try {
      await this.$store.dispatch('invites/claim', Crypto.decodeBase58Check(this.secretKey));
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
      if (await this.$store.dispatch('invites/handleNotEnoughFoundsError', error)) return;
      throw error;
    } finally {
      await this.$router.push({ name: 'account' });
    }
  },
};
</script>
