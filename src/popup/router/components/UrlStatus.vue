<template>
  <Component :is="Icon" class="url-status" @click="showModal" :class="{ modal }" />
</template>

<script>
import Verified from '../../../icons/badges/verified.svg?vue-component';
import Blacklisted from '../../../icons/badges/blacklisted.svg?vue-component';
import NotVerified from '../../../icons/badges/not-verified.svg?vue-component';
import Default from '../../../icons/badges/default.svg?vue-component';
import VerifiedBig from '../../../icons/badges/verified-big.svg?vue-component';
import BlacklistedBig from '../../../icons/badges/blacklisted-big.svg?vue-component';
import NotVerifieddBig from '../../../icons/badges/not-verified-big.svg?vue-component';

export default {
  props: {
    status: {
      type: String,
      required: true,
    },
    info: {
      type: Boolean,
      required: false,
      default: false,
    },
    modal: Boolean,
  },
  computed: {
    Icon() {
      switch (this.status) {
        case 'verified':
          return this.info ? Verified : VerifiedBig;
        case 'blacklisted':
          return this.info ? Blacklisted : BlacklistedBig;
        case 'not-verified':
          return this.info ? NotVerified : NotVerifieddBig;
        case 'default':
          return Default;
        default:
          throw new Error(`Unknown url status: ${this.status}`);
      }
    },
  },
  methods: {
    showModal() {
      if (this.info && this.status !== 'default') {
        this.$store.dispatch('modals/open', {
          name: 'tip-url-status',
          status: this.status,
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.url-status {
  cursor: pointer;

  &.modal {
    cursor: unset;
    position: absolute;
    left: 50%;
    top: 22px;
    transform: translateX(-50%);
    -ms-transform: translateX(-50%);
    -webkit-transform: translateX(-50%);
  }
}
</style>
