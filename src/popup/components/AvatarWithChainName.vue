<template>
  <div
    class="avatar-with-chain-name"
    :class="{ 'only-name': (name || !showAddress) && !hideAvatar }"
    :style="{
      'background-color': color,
    }"
  >
    <Avatar
      v-if="!hideAvatar"
      v-bind="$attrs"
      :size="avatarSize"
      :address="address"
    />

    <div
      v-if="name || !showAddress"
      class="chain-name"
      :class="{ centered: hideAvatar }"
    >
      {{ name }}
    </div>
    <AddressFormatted
      v-else
      v-bind="$attrs"
      :address="address"
      columns
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { IAccount, Protocol } from '@/types';
import { getAddressColor } from '@/utils';
import { useAccounts } from '@/composables';

import { isNameValid } from '@aeternity/aepp-sdk';

import Avatar from './Avatar.vue';
import AddressFormatted from './AddressFormatted.vue';

export default defineComponent({
  components: {
    AddressFormatted,
    Avatar,
  },
  props: {
    address: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: '',
    },
    hideAvatar: Boolean,
    avatarSize: {
      type: String,
      default: 'md',
    },
    showAddress: Boolean,
    protocol: { type: String as PropType<Protocol>, required: true },
  },
  setup(props) {
    const {
      accountsGroupedByProtocol,
    } = useAccounts();

    function isOwnAddress(address: string) {
      return accountsGroupedByProtocol.value[props.protocol]?.some(
        (account: IAccount) => account.address === address,
      );
    }

    const color = computed(() => (
      props.address && !isNameValid(props.address) && isOwnAddress(props.address)
        ? getAddressColor(props.address)
        : undefined));

    return {
      color,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/mixins';
@use '@/styles/variables' as *;
@use '@/styles/typography';

.avatar-with-chain-name {
  @include mixins.flex(flex-start, center);

  width: 100%;
  gap: 8px;
  padding: 8px;

  .avatar {
    background-color: $color-black;
  }

  .chain-name {
    @extend %face-sans-15-medium;

    text-align: left;
    opacity: 0.75;
  }

  .centered {
    @extend %face-sans-15-medium;

    opacity: 1;
    text-align: center;
    color: $color-white;
    width: 100%;
  }

  &.only-name {
    align-items: center;

    .avatar {
      margin-top: 0;
    }
  }
}
</style>
