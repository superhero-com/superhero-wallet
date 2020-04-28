<template>
  <Component :is="Icon" class="url-status" />
</template>

<script>
import Verified from '../../../icons/badges/verified.svg?vue-component';
import Blacklisted from '../../../icons/badges/blacklisted.svg?vue-component';
import NotSupported from '../../../icons/badges/not-supported.svg?vue-component';

export default {
  props: {
    type: {
      type: String,
      required: true,
    },
  },
  computed: {
    Icon() {
      switch(this.type) {
      case 'verified': return Verified;
      case 'blacklisted': return Blacklisted;
      case 'not-supported': return NotSupported;
      default: throw new Error(`Unknown url status: ${this.type}`);
      }
    },
  },
};
</script>

<style>
.url-status {
  cursor: pointer;
}
</style>
