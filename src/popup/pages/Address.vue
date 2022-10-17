<template>
  <Connect
    :app="app"
    :resolve="onResolve"
    :reject="onReject"
    :transaction-access="false"
  />
</template>

<script>

import Connect from './Popups/Connect.vue';
import deeplinkApi from '../../mixins/deeplinkApi';

export default {
  components: { Connect },
  mixins: [deeplinkApi],
  computed: {
    app() {
      const host = (new URL(this.$route.query['x-success']));
      return {
        name: host.hostname,
        url: host.origin,
        host: host.host,
      };
    },
  },
  methods: {
    onResolve() {
      this.openCallbackOrGoHome(true, {
        address: this.$store.getters.account.address,
        networkId: this.$store.getters.activeNetwork.networkId,
      });
    },
    onReject() {
      this.openCallbackOrGoHome(false);
    },
  },
};
</script>
