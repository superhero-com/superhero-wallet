<template>
  <div
    v-if="data"
    class="url-status"
    :class="status"
  >
    <span class="title">{{ $rt(data.content.title) }}</span>
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
import { MODAL_RECIPIENT_HELPER } from '@/constants';
import { useModals } from '@/composables';

import Default from '@/icons/badges/default.svg?vue-component';
import QuestionCircleIcon from '@/icons/question-circle-border.svg?vue-component';

export default {
  components: {
    Default,
    QuestionCircleIcon,
  },
  props: {
    status: {
      type: String,
      required: true,
      validator: (value) => [
        'verified',
        'blacklisted',
        'not-secure',
        'not-verified',
        'default',
      ].includes(value),
    },
  },
  computed: {
    data() {
      switch (this.status) {
        case 'verified':
          return { icon: 'success', content: this.$tm('modals.verified') };
        case 'blacklisted':
          return { icon: 'alert', content: this.$tm('modals.blacklisted') };
        case 'not-secure':
          return { icon: 'not-secure', content: this.$tm('modals.not-secure') };
        case 'not-verified':
          return { icon: 'warning', content: this.$tm('modals.not-verified') };
        case 'default':
          return null;
        default:
          throw new Error(`Unknown url status: ${this.status}`);
      }
    },
  },
  methods: {
    showModal() {
      const { openModal } = useModals();
      openModal(MODAL_RECIPIENT_HELPER, {
        title: this.$rt(this.data.content.title),
        msg: this.$rt(this.data.content.msg),
        icon: this.data.icon,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.url-status,
.icon-link {
  @extend %face-sans-14-regular;

  &.blacklisted,
  &.alert,
  &.critical {
    color: variables.$color-danger;
  }

  &.warning,
  &.not-verified,
  &.not-secure {
    color: variables.$color-warning;
  }

  &.info,
  &.help {
    color: variables.$color-primary;
  }

  &.verified,
  &.success {
    color: variables.$color-success-dark;
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
