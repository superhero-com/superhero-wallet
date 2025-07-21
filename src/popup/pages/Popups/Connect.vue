<template>
  <ConnectBase
    class="connect-popup"
    :access="access"
    :icon="icon"
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
        CONNECT_PERMISSIONS.address,
        CONNECT_PERMISSIONS.transactions,
      ]),
    },
    icon: { type: String, default: undefined },
  },
  setup() {
    return {};
  },
});
</script>
