<template>
  <div
    class="account-info"
    :class="{ 'can-copy-address': canCopyAddress }"
  >
    <Avatar
      class="avatar"
      :address="address"
      :name="name"
      :size="avatarSize"
      :borderless="avatarBorderless"
    />
    <div
      class="account-details"
      :class="{ 'list-name': isListName }"
    >
      <div
        v-if="isMultisig"
        class="account-name"
      >
        {{ $t('multisig.multisigVault') }}
      </div>
      <div
        v-else-if="name"
        class="account-name-truncated"
      >
        <Truncate :str="name" />
      </div>
      <div
        v-else
        data-cy="account-name-number"
        class="account-name"
      >
        {{ getDefaultAccountLabel({ protocol: protocolName, protocolIdx: idx }) }}
      </div>
      <div
        v-if="address && address.length"
        class="account-address"
      >
        <IconWrapper
          v-if="withProtocolIcon"
          :protocol-icon="protocol"
          class="protocol-icon"
        />
        <CopyText
          data-cy="copy"
          :value="address"
          :disabled="!canCopyAddress"
        >
          <AddressTruncated
            :address="address"
            class="ae-address"
          />
        </CopyText>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import type { Protocol } from '@/types';
import { getDefaultAccountLabel } from '@/utils';
import { AeScan } from '@/protocols/aeternity/libs/AeScan';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { PROTOCOL_AETERNITY } from '@/constants';

import Avatar from './Avatar.vue';
import CopyText from './CopyText.vue';
import Truncate from './Truncate.vue';
import AddressTruncated from './AddressTruncated.vue';
import IconWrapper from './IconWrapper.vue';

export default defineComponent({
  components: {
    IconWrapper,
    AddressTruncated,
    Avatar,
    Truncate,
    CopyText,
  },
  props: {
    address: { type: String, required: true },
    name: { type: String, default: '' },
    protocol: { type: String as PropType<Protocol>, default: PROTOCOL_AETERNITY },
    avatarSize: { type: String, default: 'lg' },
    idx: { type: Number, default: 0 },
    canCopyAddress: Boolean,
    isMultisig: Boolean,
    avatarBorderless: Boolean,
    isListName: Boolean,
    withProtocolIcon: Boolean,
  },
  setup(props) {
    const { aeActiveNetworkPredefinedSettings } = useAeNetworkSettings();

    const explorerUrl = computed(
      () => (new AeScan(aeActiveNetworkPredefinedSettings.value.explorerUrl!))
        .prepareUrlForAccount(props.address),
    );

    const protocolName = computed(
      () => ProtocolAdapterFactory.getAdapter(props.protocol).protocolName,
    );

    return {
      explorerUrl,
      protocolName,
      getDefaultAccountLabel,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.account-info {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
  color: variables.$color-white;

  .avatar {
    margin-right: 8px;
    background-color: variables.$color-black;
  }

  .account-details {
    max-width: 250px;
    font-weight: 500;

    .account-name-truncated,
    .account-name {
      @extend %face-sans-16-medium;

      margin: 4px 0;
    }

    &.list-name {
      width: 100%;
      min-width: 0;

      .account-name-truncated,
      .account-name {
        @extend %face-sans-15-bold;

        margin: 0;
      }
    }

    .ae-address {
      color: rgba(variables.$color-white, 0.85);
      opacity: 0.85;
      user-select: none;

      .icon {
        width: 22px;
        height: 22px;
        margin-left: 2px;
      }
    }
  }

  .account-address {
    display: flex;
    align-items: center;
    justify-content: flex-start;

    .protocol-icon {
      margin-right: 6px;
    }
  }

  &.can-copy-address {
    .ae-address {
      &:hover {
        opacity: 1;
      }
    }
  }
}
</style>
