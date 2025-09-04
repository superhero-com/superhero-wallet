<template>
  <ConnectBase
    class="connect-popup"
    :access="access"
    :icon="icon"
    :protocol="protocol"
    :supports-protocol="supportsProtocol"
    :supported-protocols="supportedProtocols"
  />
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';

import type { ConnectPermission } from '@/types';
import { CONNECT_PERMISSIONS } from '@/constants';
import { usePopupProps } from '@/composables';

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
    const { popupProps } = usePopupProps();

    const protocol = computed(() => popupProps.value?.protocol);
    const supportsProtocol = computed(() => (popupProps.value as any)?.supportsProtocol);
    const supportedProtocols = computed(() => (popupProps.value as any)?.supportedProtocols);

    return {
      protocol,
      supportsProtocol,
      supportedProtocols,
    };
  },
});
</script>
