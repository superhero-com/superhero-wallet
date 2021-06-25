<template>
  <StatusIcon
    v-if="data"
    :status="data.icon"
    @click="showModal"
  />
  <Default v-else />
</template>

<script>
import StatusIcon from './StatusIcon';
import Default from '../../../icons/badges/default.svg?vue-component';

export default {
  components: { StatusIcon, Default },
  props: {
    status: { type: String, required: true },
  },
  computed: {
    data() {
      switch (this.status) {
        case 'verified':
          return { icon: 'success', content: this.$t('modals.verified') };
        case 'blacklisted':
          return { icon: 'alert', content: this.$t('modals.blacklisted') };
        case 'not-secure':
          return { icon: 'not-secure', content: this.$t('modals.not-secure') };
        case 'not-verified':
          return { icon: 'warning', content: this.$t('modals.not-verified') };
        case 'default':
          return null;
        default:
          throw new Error(`Unknown url status: ${this.status}`);
      }
    },
  },
  methods: {
    showModal() {
      this.$store.dispatch('modals/open', {
        name: 'default',
        title: this.data.content.title,
        msg: this.data.content.msg,
        icon: this.data.icon,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.status-icon {
  cursor: pointer;
}
</style>
