<template>
  <div
    v-if="statusData"
    class="url-status"
    :class="status"
  >
    <span class="title">{{ statusData.title }}</span>
    <a
      class="icon-link"
      :class="status"
      @click="showModal()"
    >
      <QuestionCircleIcon class="icon" />
    </a>
  </div>
  <Default v-else />
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { useI18n } from 'vue-i18n';
import type { StatusIconType, UrlStatus } from '@/types';
import { MODAL_RECIPIENT_HELPER } from '@/constants';
import { useModals } from '@/composables';

import Default from '@/icons/badges/default.svg?vue-component';
import QuestionCircleIcon from '@/icons/question-circle-border.svg?vue-component';

export default defineComponent({
  components: {
    Default,
    QuestionCircleIcon,
  },
  props: {
    status: {
      type: String as PropType<UrlStatus>,
      required: true,
      validator: (value: UrlStatus) => [
        'verified',
        'blacklisted',
        'not-secure',
        'not-verified',
        'default',
      ].includes(value),
    },
  },
  setup(props) {
    const { t } = useI18n();
    const { openModal } = useModals();

    const statusData = computed((): { icon: StatusIconType, title: string, msg: string } | null => {
      switch (props.status) {
        case 'verified':
          return {
            icon: 'success',
            title: t('modals.verified.title'),
            msg: t('modals.verified.msg'),
          };
        case 'blacklisted':
          return {
            icon: 'alert',
            title: t('modals.blacklisted.title'),
            msg: t('modals.blacklisted.msg'),
          };
        case 'not-secure':
          return {
            icon: 'not-secure',
            title: t('modals.not-secure.title'),
            msg: t('modals.not-secure.msg'),
          };
        case 'not-verified':
          return {
            icon: 'warning',
            title: t('modals.not-verified.title'),
            msg: t('modals.not-verified.msg'),
          };
        case 'default':
          return null;
        default:
          throw new Error(`Unknown url status: ${props.status}`);
      }
    });

    function showModal() {
      openModal(MODAL_RECIPIENT_HELPER, {
        title: statusData.value?.title,
        msg: statusData.value?.msg,
        icon: statusData.value?.icon,
      });
    }

    return {
      statusData,
      showModal,
    };
  },
});
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
