<template>
  <LinkButton
    :to="explorerUrl"
    target="_blank"
    class="account-item"
    variant="muted"
  >
    <div
      class="avatar-wrapper"
      :class="{ 'has-protocol-icon': protocol }"
    >
      <Avatar
        :address="address"
        :name="name"
        :class="{ avatar: protocol }"
        size="sm"
      />
      <ProtocolIcon
        v-if="protocol"
        :protocol="protocol"
        icon-size="sm"
        class="protocol-icon"
      />
    </div>
    <span
      v-if="name"
      class="name"
    >
      <Truncate
        :class="[size]"
        :str="name"
      />
    </span>
    <AddressTruncated
      v-else
      class="address"
      :address="address"
    />

    <template #icon>
      <ExternalLinkIcon class="external-link-icon" />
    </template>
  </LinkButton>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import type { Protocol } from '@/types';
import { AeScan } from '@/protocols/aeternity/libs/AeScan';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';

import AddressTruncated from './AddressTruncated.vue';
import Avatar from './Avatar.vue';
import LinkButton from './LinkButton.vue';
import Truncate from './Truncate.vue';
import ProtocolIcon from './ProtocolIcon.vue';

import ExternalLinkIcon from '../../icons/external-link.svg?vue-component';

const SIZE = ['rg', 'md'] as const;

type SizeType = typeof SIZE[number]

export default defineComponent({
  components: {
    ProtocolIcon,
    Avatar,
    AddressTruncated,
    ExternalLinkIcon,
    LinkButton,
    Truncate,
  },
  props: {
    address: { type: String, required: true },
    name: { type: String, default: '' },
    protocol: { type: String as PropType<Protocol>, default: null },
    size: {
      type: String,
      default: 'rg',
      validator: (value: SizeType) => SIZE.includes(value),
    },
  },
  setup(props) {
    const { aeActiveNetworkPredefinedSettings } = useAeNetworkSettings();

    const explorerUrl = computed(
      () => (new AeScan(aeActiveNetworkPredefinedSettings.value.explorerUrl!))
        .prepareUrlForAccount(props.address),
    );

    return {
      explorerUrl,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.account-item {
  display: flex;
  align-items: center;

  .avatar-wrapper {
    position: relative;
    display: flex;
    margin-right: 4px;

    &.has-protocol-icon {
      margin-right: 8px;
    }

    .protocol-icon {
      position: absolute;
      bottom: 0;
      right: -4px;
    }
  }

  .name,
  .address {
    text-align: left;
    word-break: break-all;

    &.rg {
      @extend %face-mono-10-medium;
    }

    &.md {
      @extend %face-sans-16-medium;
    }
  }

  .name {
    max-width: 230px;
  }

  .external-link-icon {
    flex-shrink: 0;
    margin-top: -4px; // Compensate the icon position
    margin-left: -4px;
    width: 22px;
    height: 22px;
  }
}
</style>
