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
      <div
        v-if="account.address?.length"
        class="account-address"
      >
        <IconWrapper
          v-if="withProtocolIcon"
          :protocol-icon="account.protocol"
          class="protocol-icon"
        />
        <CopyText
          data-cy="copy"
          :value="account.address"
          :disabled="!canCopyAddress"
        >
          <AddressTruncated
            :address="account.address"
            :protocol="account.protocol"
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
import { useStore } from 'vuex';
import type { IAccount } from '@/types';
import { getDefaultAccountLabel } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

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
    account: { type: Object as PropType<Partial<IAccount>>, required: true },
    avatarSize: { type: String, default: 'lg' },
    canCopyAddress: Boolean,
    isMultisig: Boolean,
    avatarBorderless: Boolean,
    isListName: Boolean,
    withProtocolIcon: Boolean,
  },
  setup(props) {
    const store = useStore();
    const getDefaultName = store.getters['names/getDefault'] as (a?: string) => string;

    const name = computed(() => getDefaultName(props.account.address));

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
