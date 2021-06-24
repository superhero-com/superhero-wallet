<template>
  <Component
    :is="data.Icon"
    class="url-status"
    :class="data.icon"
    @click="showModal"
  />
</template>

<script>
import Alert from '../../../icons/alert.svg?vue-component';
import Warning from '../../../icons/warning.svg?vue-component';
import CheckCircle from '../../../icons/check-circle.svg?vue-component';
import NotSecure from '../../../icons/not-secure.svg?vue-component';
import Default from '../../../icons/badges/default.svg?vue-component';

export default {
  props: {
    status: { type: String, required: true },
  },
  computed: {
    data() {
      switch (this.status) {
        case 'verified':
          return {
            Icon: CheckCircle,
            icon: 'success',
            content: this.$t('modals.verified'),
          };
        case 'blacklisted':
          return {
            Icon: Alert,
            icon: 'alert',
            content: this.$t('modals.blacklisted'),
          };
        case 'not-secure':
          return {
            Icon: NotSecure,
            icon: 'not-secure',
            content: this.$t('modals.not-secure'),
          };
        case 'not-verified':
          return {
            Icon: Warning,
            icon: 'warning',
            content: this.$t('modals.not-verified'),
          };
        case 'default':
          return { Icon: Default };
        default:
          throw new Error(`Unknown url status: ${this.status}`);
      }
    },
  },
  methods: {
    showModal() {
      if (this.status !== 'default') {
        this.$store.dispatch('modals/open', {
          name: 'default',
          title: this.data.content.title,
          msg: this.data.content.msg,
          icon: this.data.icon,
        });
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.url-status {
  width: 18px;
  height: 18px;
  cursor: pointer;

  &.alert {
    color: variables.$color-error;
  }

  &.warning,
  &.not-secure {
    color: variables.$color-warning;
  }

  &.success {
    color: variables.$color-green;
  }
}
</style>
