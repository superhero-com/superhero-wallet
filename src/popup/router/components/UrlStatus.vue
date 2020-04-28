<template>
  <Blacklisted v-if="type === 'blacklisted'" class="url-status" />
  <Verified v-else-if="type === 'verified'" class="url-status" />
  <NotSupported v-else-if="type === 'not-supported'" class="url-status" />
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
  components: {
    Verified,
    Blacklisted,
    NotSupported,
  },
};
</script>

<style>
.url-status {
  cursor: pointer;
}
</style>
