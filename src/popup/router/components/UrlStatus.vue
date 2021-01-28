<template>
  <Component :is="Icon" class="url-status" @click="showModal" :class="{ modal, info }" />
</template>

<script>
import Verified from '../../../icons/badges/verified.svg?vue-component';
import Blacklisted from '../../../icons/badges/blacklisted.svg?vue-component';
import NotSecure from '../../../icons/badges/not-secure.svg?vue-component';
import NotVerified from '../../../icons/badges/not-verified.svg?vue-component';
import Default from '../../../icons/badges/default.svg?vue-component';

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
          return Verified;
        case 'blacklisted':
          return Blacklisted;
        case 'not-secure':
          return NotSecure;
        case 'not-verified':
          return NotVerified;
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

  &.info {
    width: 18px;
    height: 18px;
  }

  &.modal {
    width: 26px;
    height: 26px;
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
