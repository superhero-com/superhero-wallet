<template>
  <div
    class="avatar-with-chain-name"
    :class="{ 'only-name': !showAddress && !hideAvatar }"
    :style="{
      'background-color': color,
    }"
  >
    <Avatar
      v-if="!hideAvatar"
      v-bind="$attrs"
      :size="avatarSize"
      :address="localChainNameAddress || address"
    />

    <div class="address-container">
      <div
        v-if="calculatedName"
        class="address-name"
        :class="{ centered: hideAvatar }"
      >
        {{ calculatedName }}
      </div>
      <AddressFormatted
        v-if="showAddress"
        v-bind="$attrs"
        :address="localChainNameAddress || address"
        class="text-address"
        columns
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { Protocol } from '@/types';
import { getAddressColor } from '@/utils';
import { useAccounts, useAccountSelector, useMultisigAccounts } from '@/composables';

import { tg } from '@/popup/plugins/i18n';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';
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
    protocol: { type: String as PropType<Protocol>, required: true },
  },
  setup(props) {
    const {
      accountsGroupedByProtocol,
    } = useAccounts();
    const { allAccounts } = useAccountSelector();
    const { ownedNames } = useAeNames();
    const { multisigAccounts } = useMultisigAccounts();

    function isOwnAddress(address: string) {
      return accountsGroupedByProtocol.value[props.protocol]?.some(
        (account) => account.address === address,
      ) || multisigAccounts.value.some(
        (account) => account.gaAccountId === address,
      );
    }

    const account = computed(() => (
      allAccounts.value.filter((acc) => acc.address === props.address)[0]
    ));

    const localChainNameAddress = computed(() => {
      const ownedName = ownedNames.value.filter((entry) => (
        entry.name === props.name && entry.pointers.accountPubkey
      ))[0];
      if (ownedName) {
        return ownedName.pointers.accountPubkey;
      }
      return '';
    });

    const calculatedName = computed(() => (
      props.name || localChainNameAddress.value || account.value?.name || tg('modals.send.recipientLabel')
    ));

    const showAddress = computed(() => (
      !isNameValid(props.address) || localChainNameAddress.value
    ));

    const color = computed(() => (
      (props.address && !isNameValid(props.address) && isOwnAddress(props.address))
      || localChainNameAddress.value
        ? getAddressColor(localChainNameAddress.value || props.address)
        : undefined));

    return {
      showAddress,
      localChainNameAddress,
      calculatedName,
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
  @include mixins.flex(flex-start, flex-start);

  width: 100%;
  gap: 8px;
  padding: 8px;

  .avatar {
    background-color: $color-black;
    margin-top: 6px;
  }

  .address-container {
    display: flex;
    flex-direction: column;
  }

  .address-name {
    @extend %face-sans-16-semi-bold;

    text-align: left;
    line-height: 24px;
  }

  .centered {
    @extend %face-sans-15-medium;

    opacity: 1;
    text-align: center;
    color: $color-white;
    width: 100%;
  }

  .text-address {
    @extend %face-mono-14-medium;

    line-height: 24px;
  }

  &.only-name {
    align-items: center;

    .avatar {
      margin-top: 0;
    }
  }
}
</style>
