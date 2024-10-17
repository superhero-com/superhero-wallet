<template>
  <LinkButton
    :href="explorerUrl"
    class="account-item"
    variant="muted"
    is-external
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
        icon-size="xs"
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
      :protocol="protocol"
    />
  </LinkButton>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import type { Protocol } from '@/types';

import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import AddressTruncated from './AddressTruncated.vue';
import Avatar from './Avatar.vue';
import LinkButton from './LinkButton.vue';
import Truncate from './Truncate.vue';
import ProtocolIcon from './ProtocolIcon.vue';

const SIZE = ['rg', 'md'] as const;

type SizeType = typeof SIZE[number]

export default defineComponent({
  components: {
    ProtocolIcon,
    Avatar,
    AddressTruncated,
    LinkButton,
    Truncate,
  },
  props: {
    address: { type: String, required: true },
    name: { type: String, default: '' },
    protocol: { type: String as PropType<Protocol>, required: true },
    size: {
      type: String,
      default: 'rg',
      validator: (value: SizeType) => SIZE.includes(value),
    },
  },
  setup(props) {
    const explorerUrl = computed(
      () => ProtocolAdapterFactory
        .getAdapter(props.protocol)
        .getExplorer()
        .prepareUrlForAccount(props.address),
    );

    return {
      explorerUrl,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

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
    line-height: 20px;

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
}
</style>
