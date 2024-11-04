<template>
  <ConnectBase
    class="connect-account-list-popup"
    :access="access"
  />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { ConnectPermission } from '@/types';
import { CONNECT_PERMISSIONS } from '@/constants';

import ConnectBase from './ConnectBase.vue';

export default defineComponent({
  components: {
    ConnectBase,
  },
  props: {
    access: {
      type: Array as PropType<ConnectPermission[]>,
      default: () => ([
        CONNECT_PERMISSIONS.addressList,
      ]),
    },
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.account-list {
  .transaction-info {
    margin-bottom: 16px;
  }

  .subtitle {
    @extend %face-sans-15-medium;

    margin-top: 24px;
    margin-bottom: 16px;
    color: $color-grey-light;
    text-align: center;

    .app-name {
      color: $color-white;
    }
  }

  .permissions {
    margin: 16px 0;

    .title {
      @extend %face-sans-15-medium;

      display: flex;
      align-items: center;
      padding-bottom: 4px;
      color: $color-grey-dark;

      .icon {
        width: 24px;
        height: 24px;
        color: $color-success;
        padding-right: 4px;
      }
    }

    .description {
      @extend %face-sans-15-regular;

      display: block;
      padding-bottom: 16px;
      color: $color-white;
      text-align: left;
    }
  }
}
</style>
