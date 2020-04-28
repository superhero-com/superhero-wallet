<template>
  <Component :is="Icon" class="url-status" @click="showModal" />
</template>

<script>
import Verified from '../../../icons/badges/verified.svg?vue-component';
import Blacklisted from '../../../icons/badges/blacklisted.svg?vue-component';
import NotSupported from '../../../icons/badges/not-supported.svg?vue-component';

export default {
  props: {
    status: {
      type: String,
      required: true,
    },
  },
  computed: {
    Icon() {
      switch (this.status) {
        case 'verified':
          return Verified;
        case 'blacklisted':
          return Blacklisted;
        case 'not-supported':
          return NotSupported;
        default:
          throw new Error(`Unknown url status: ${this.status}`);
      }
    },
  },
  methods: {
    showModal() {
      this.$store.dispatch('modals/open', {
        name: 'tip-badge',
        status: this.status,
      });
    },
  },
};
</script>

<style scoped>
.url-status {
  cursor: pointer;
}
</style>
