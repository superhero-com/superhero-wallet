<template>
  <div
    class="account-info"
    :class="{ 'can-copy-address': canCopyAddress }"
  >
    <Avatar
      class="avatar"
      :address="account.address"
      :name="name"
      :size="avatarSize"
      :borderless="avatarBorderless"
      :is-placeholder="isPlaceholder"
    />
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
        class="account-name-truncated"
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
        <div
          v-if="account.address?.length"
          class="account-address"
        >
          <CopyText
            data-cy="copy"
            :value="account.address"
            :disabled="!canCopyAddress"
          >
            <AddressTruncated
              :address="account.address"
              :protocol="account.protocol"
              :show-protocol-icon="showProtocolIcon"
              class="ae-address"
            />
          </CopyText>
        </div>
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

import Avatar from './Avatar.vue';
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
    avatarSize: { type: String, default: 'lg' },
    canCopyAddress: Boolean,
    isMultisig: Boolean,
    avatarBorderless: Boolean,
    isListName: Boolean,
    isPlaceholder: Boolean,
    showProtocolIcon: Boolean,
  },
  setup(props) {
    const { getName } = useAeNames();

    const name = computed(() => getName(props.account.address!).value);

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
      opacity: 0.85;

      &:hover {
        opacity: 1;
      }
    }
  }
}
</style>
