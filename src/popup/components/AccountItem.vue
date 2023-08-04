<template>
  <LinkButton
    :to="explorerUrl"
    target="_blank"
    class="account-item"
    variant="muted"
  >
    <Avatar
      :address="address"
      :name="name"
      size="sm"
    />

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

    <ExternalLinkIcon class="external-link-icon" />
  </LinkButton>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import type { INetwork } from '@/types';
import { AeScan } from '@/protocols/aeternity/libs/AeScan';
import { useGetter } from '@/composables/vuex';

import AddressTruncated from './AddressTruncated.vue';
import Avatar from './Avatar.vue';
import LinkButton from './LinkButton.vue';
import Truncate from './Truncate.vue';

import ExternalLinkIcon from '../../icons/external-link.svg?vue-component';

const SIZE = ['rg', 'md'] as const;

type SizeType = typeof SIZE[number]

export default defineComponent({
  components: {
    Avatar,
    AddressTruncated,
    ExternalLinkIcon,
    LinkButton,
    Truncate,
  },
  props: {
    address: { type: String, required: true },
    name: { type: String, default: '' },
    size: {
      type: String,
      default: 'rg',
      validator: (value: SizeType) => SIZE.includes(value),
    },
  },
  setup(props) {
    const activeNetwork = useGetter<INetwork>('activeNetwork');

    const explorerUrl = computed(() => {
      const aeScan = new AeScan(activeNetwork.value.explorerUrl);
      return aeScan.prepareUrlForAccount(props.address);
    });

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

  .avatar {
    margin-right: 4px;
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
    margin-top: -2px; // Compensate the icon position
    width: 22px;
    height: 22px;
  }
}
</style>
