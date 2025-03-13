<template>
  <div
    class="account-info"
    :class="{ dense }"
  >
    <Avatar
      class="avatar"
      :address="address"
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
      <div class="account-with-icons">
        <Component
          :is="type && getAccountIcon(type)"
          class="account-type-icon"
        />
        <div
          v-if="isMultisig"
          class="account-name"
          v-text="$t('multisig.multisigVault')"
        />
        <template
          v-else-if="name"
        >
          <ion-skeleton-text v-if="!IS_TRANSITIONS_DISABLED && isLoading" animated />
          <Truncate v-if="!isLoading" class="account-name" :str="name" />
        </template>
        <template
          v-else
        >
          <Truncate
            data-cy="account-name-number"
            class="account-name"
            :str="getDefaultAccountLabel(account)"
          />
        </template>
        <div>
          <slot name="after-address" />
        </div>
      </div>
      <slot name="address">
        <CopyText
          v-if="address?.length"
          :disabled="!canCopyAddress || showExplorerLink"
          :value="address"
          class="account-address"
        >
          <AddressTruncated
            :address="address"
            :protocol="account.protocol"
            :show-protocol-icon="showProtocolIcon"
            :show-explorer-link="showExplorerLink"
            :hide-address="!!nameAddress"
          />
        </CopyText>
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import { IonSkeletonText } from '@ionic/vue';
import {
  computed,
  defineComponent,
  PropType,
  ref,
  watch,
} from 'vue';
import { Encoded } from '@aeternity/aepp-sdk';

import type { IAccount } from '@/types';
import { getDefaultAccountLabel } from '@/utils';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';
import { useAccounts } from '@/composables';
import { IS_TRANSITIONS_DISABLED } from '@/constants';

import Avatar, { type AvatarSize } from '@/popup/components/Avatar.vue';
import CopyText from '@/popup/components/CopyText.vue';
import Truncate from '@/popup/components/Truncate.vue';
import AddressTruncated from '@/popup/components/AddressTruncated.vue';

export default defineComponent({
  components: {
    AddressTruncated,
    Avatar,
    Truncate,
    CopyText,
    IonSkeletonText,
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
    nameAddress: { type: String as PropType<Encoded.Name>, default: undefined },
  },
  setup(props) {
    const { getName, getNameByNameHash } = useAeNames();
    const { getAccountIcon, getAccountByAddress } = useAccounts();

    const isLoading = ref(true);
    const resolvedChainName = ref('');
    const address = computed(() => props.nameAddress || props.account.address!);
    const name = computed(() => (
      resolvedChainName.value
      || props.customName
      || getName(address.value).value
    ));
    const type = computed(() => getAccountByAddress(props.account.address!)?.type);

    const explorerUrl = computed(
      () => (props.account.protocol)
        ? ProtocolAdapterFactory
          .getAdapter(props.account.protocol)
          .getExplorer()
          .prepareUrlForAccount(address.value)
        : '',
    );

    watch(
      () => [props.nameAddress],
      async ([nameAddress]) => {
        if (nameAddress) {
          resolvedChainName.value = await getNameByNameHash(nameAddress);
        } else {
          resolvedChainName.value = '';
        }
        isLoading.value = false;
      },
      { immediate: true },
    );

    return {
      IS_TRANSITIONS_DISABLED,
      name: resolvedChainName.value || name,
      type,
      address,
      explorerUrl,
      getAccountIcon,
      getDefaultAccountLabel,
      isLoading,
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

    .account-with-icons {
      display: flex;
      align-items: center;
      max-width: 100%;
    }

    .account-name {
      @extend %face-sans-16-medium;

      line-height: 20px; // Avoid cutting off bottom part of some letters, e.g.: "g"
      max-width: 100%;
      flex: 1;
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

  ion-skeleton-text {
    --border-radius: 16px;
    --background: rgba(#{$color-white-rgb}, 0.1);
    --background-rgb: #{$color-white-rgb};
    width: 150px;
    height: 16px;
    margin: 0 0 4px 0;
  }

  .account-type-icon {
    width: 18px;
    height: 18px;
    margin-right: 4px;
  }
}
</style>
