<template>
  <div class="address-truncated">
    <ProtocolIcon
      v-if="showProtocolIcon"
      :protocol="protocol"
      class="protocol-icon"
    />
    <div class="address-truncated-chunks">
      <span class="address-chunk">{{ truncatedAddress[0] }}</span>
      <span class="dots">
        &middot;&middot;&middot;
      </span>
      <span class="address-chunk">{{ truncatedAddress[1] }}</span>
    </div>

    <LinkButton
      v-if="showExplorerLink"
      :to="explorerUrl"
      class="external-link"
    >
      <template #icon>
        <ExternalLinkIcon class="external-link-icon" />
      </template>
    </LinkButton>
  </div>
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

import ExternalLinkIcon from '@/icons/external-link.svg?vue-component';
import ProtocolIcon from './ProtocolIcon.vue';
import LinkButton from './LinkButton.vue';

export default defineComponent({
  components: {
    ProtocolIcon,
    LinkButton,
    ExternalLinkIcon,
  },
  props: {
    address: { type: String, required: true },
    protocol: { type: String as PropType<Protocol>, required: true },
    showExplorerLink: Boolean,
    showProtocolIcon: Boolean,
  },
  setup(props) {
    const truncatedAddress = computed(() => truncateAddress(props.address));
    const explorerUrl = computed(
      () => ProtocolAdapterFactory
        .getAdapter(props.protocol)
        .getExplorer()
        .prepareUrlForHash(props.address),
    );

    return {
      truncatedAddress,
      explorerUrl,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/typography';

.address-truncated {
  display: flex;
  align-items: center;
  user-select: none;

  .protocol-icon {
    margin-right: 4px;
  }

  &-chunks {
    @extend %face-mono-12-medium;

    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 2px;
    letter-spacing: 0.07em;

    .dots {
      @extend %face-mono-16-regular;

      letter-spacing: -0.25em;
      text-align: center;
      margin-left: -1px;
      margin-right: 3px;
    }

    .address-chunk,
    .dots {
      white-space: nowrap;
    }
  }

  .external-link {
    margin-top: -1px; // Compensate alignment with text
    flex-shrink: 0;
    color: inherit;

    .external-link-icon {
      width: 22px;
      height: 22px;
    }
  }
}
</style>
