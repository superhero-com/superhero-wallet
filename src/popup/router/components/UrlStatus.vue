<template>
  <div
    v-if="data"
    class="url-status"
    :class="status"
  >
    <span class="title">{{ data.content.title }}</span>
    <a
      class="icon-link"
      :class="status"
      @click="showModal"
    >
      <QuestionCircleIcon class="icon" />
    </a>
  </div>
  <Default v-else />
</template>

<script>
import Default from '../../../icons/badges/default.svg?vue-component';
import { MODAL_RECIPIENT_HELPER } from '../../utils/constants';
import QuestionCircleIcon from '../../../icons/question-circle-border.svg?vue-component';

export default {
  components: {
    Default,
    QuestionCircleIcon,
  },
  props: {
    status: {
      type: String,
      required: true,
      validator(value) {
        return [
          'verified',
          'blacklisted',
          'not-secure',
          'not-verified',
          'default',
        ].includes(value);
      },
    },
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
        name: MODAL_RECIPIENT_HELPER,
        title: this.data.content.title,
        msg: this.data.content.msg,
        icon: this.data.icon,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.url-status,
.icon-link {
  @extend %face-sans-14-regular;

  &.blacklisted,
  &.alert,
  &.critical {
    color: variables.$color-error;
  }

  &.warning,
  &.not-verified,
  &.not-secure {
    color: variables.$color-warning;
  }

  &.info,
  &.help {
    color: variables.$color-blue;
  }

  &.verified,
  &.success {
    color: variables.$color-green-dark;
  }

  .title {
    padding-right: 10px;
  }

  .icon {
    width: 22px;
    height: 22px;
    vertical-align: text-bottom;
    cursor: pointer;
  }
}
</style>
