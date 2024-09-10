<template>
  <Component
    :is="(showExplorerLink) ? 'LinkButton' : 'div'"
    :is-external="(showExplorerLink) ? true : null"
    :href="(showExplorerLink) ? explorerUrl : null"
    :class="{ 'is-link': showExplorerLink }"
    class="address-truncated"
  >
    <ProtocolIcon
      v-if="showProtocolIcon && protocol"
      :protocol="protocol"
      class="address-truncated-protocol"
    />
    <div class="address-truncated-chunks">
      <span class="address-chunk">{{ truncatedAddress[0] }}</span>
      <span class="dots">&middot;&middot;&middot;</span>
      <span class="address-chunk">{{ truncatedAddress[1] }}</span>
    </div>
  </Component>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import type { Protocol } from '@/types';
import { truncateAddress } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import ProtocolIcon from './ProtocolIcon.vue';
import LinkButton from './LinkButton.vue';

export default defineComponent({
  components: {
    ProtocolIcon,
    LinkButton,
  },
  props: {
    address: { type: String, required: true },
    protocol: { type: String as PropType<Protocol>, default: undefined },
    showExplorerLink: Boolean,
    showProtocolIcon: Boolean,
  },
  setup(props) {
    const truncatedAddress = computed(() => truncateAddress(props.address));
    const explorerUrl = computed(
      () => {
        if (!props.protocol) {
          return '';
        }
        return ProtocolAdapterFactory
          .getAdapter(props.protocol)
          .getExplorer()
          .prepareUrlForAccount(props.address);
      },
    );

    return {
      truncatedAddress,
      explorerUrl,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/typography';
@use '@/styles/variables' as *;

.address-truncated {
  $this: &;

  display: flex;
  align-items: center;
  user-select: none;
  color: inherit;

  &.is-link {
    #{$this}-chunks {
      color: rgba($color-white, 0.85);
    }

    &:hover {
      #{$this}-chunks {
        color: $color-white;
      }
    }
  }

  &-protocol {
    margin-right: 4px;
  }

  &-chunks {
    @extend %face-mono-12-medium;

    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 2px;
    letter-spacing: 0.07em;
    transition: inherit;

    .dots {
      font-size: 16px;
      letter-spacing: -0.25em;
      margin-left: -1px;
      margin-right: 3px;
    }

    .address-chunk,
    .dots {
      white-space: nowrap;
    }
  }
}
</style>
