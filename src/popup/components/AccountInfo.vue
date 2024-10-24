<template>
  <div
    class="account-info"
    :class="{ dense }"
  >
    <Avatar
      class="avatar"
      :address="account.address"
      :name="name"
      :size="avatarSize"
      :borderless="avatarBorderless"
      :is-placeholder="isPlaceholder"
    >
      <slot name="avatar" />
    </Avatar>

    <div
      class="account-details"
      :class="{ 'list-name': isListName }"
    >
      <div
        v-if="isMultisig"
        class="account-name"
        v-text="$t('multisig.multisigVault')"
      />
      <div
        v-else-if="name"
        class="account-name"
      >
        <Truncate :str="name" />
      </div>
      <div
        v-else
        data-cy="account-name-number"
        class="account-name"
        v-text="getDefaultAccountLabel(account)"
      />

      <slot name="address">
        <CopyText
          v-if="account.address?.length"
          :disabled="!canCopyAddress || showExplorerLink"
          :value="account.address"
          class="account-address"
        >
          <AddressTruncated
            :address="account.address"
            :protocol="account.protocol"
            :show-protocol-icon="showProtocolIcon"
            :show-explorer-link="showExplorerLink"
          />
        </CopyText>
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
} from 'vue';
import type { IAccount } from '@/types';
import { getDefaultAccountLabel } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';

import Avatar, { type AvatarSize } from './Avatar.vue';
import CopyText from './CopyText.vue';
import Truncate from './Truncate.vue';
import AddressTruncated from './AddressTruncated.vue';

export default defineComponent({
  components: {
    AddressTruncated,
    Avatar,
    Truncate,
    CopyText,
  },
  props: {
    account: { type: Object as PropType<Partial<IAccount>>, required: true },
    avatarSize: { type: String as PropType<AvatarSize>, default: 'lg' },
    customName: { type: String, default: null },
    canCopyAddress: Boolean,
    isMultisig: Boolean,
    avatarBorderless: Boolean,
    isListName: Boolean,
    isPlaceholder: Boolean,
    showProtocolIcon: Boolean,
    dense: Boolean,
    showExplorerLink: Boolean,
  },
  setup(props) {
    const { getName } = useAeNames();

    const name = computed(() => props.customName || getName(props.account.address!).value);

    const explorerUrl = computed(
      () => (props.account.protocol)
        ? ProtocolAdapterFactory
          .getAdapter(props.account.protocol)
          .getExplorer()
          .prepareUrlForAccount(props.account.address!)
        : '',
    );

    return {
      name,
      explorerUrl,
      getDefaultAccountLabel,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.account-info {
  --maxWidth: 250px;

  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
  color: $color-white;

  .avatar {
    margin-right: 8px;
  }

  .account-details {
    display: flex;
    align-items: start;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    max-width: var(--maxWidth);
    font-weight: 500;

    .account-name {
      @extend %face-sans-16-medium;

      line-height: 20px; // Avoid cutting off bottom part of some letters, e.g.: "g"
      max-width: 100%;
    }

    &.list-name {
      width: 100%;
      min-width: 0;

      .account-name {
        @extend %face-sans-15-semi-bold;

        margin: 0;
      }
    }
  }

  .account-address {
    margin-top: -2px;
    color: rgba($color-white, 0.85);

    &:hover {
      color: $color-white;
    }
  }

  &.dense {
    .account-name {
      font-size: 15px;
    }
  }
}
</style>
