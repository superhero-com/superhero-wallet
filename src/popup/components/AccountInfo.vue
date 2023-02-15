<template>
  <div
    class="account-info"
    :class="{ 'can-copy-address': canCopyAddress }"
  >
    <Avatar
      class="avatar"
      :address="account.address"
      :name="account.name"
    />
    <div class="account-details">
      <div
        v-if="isMultisigDashboard"
        class="account-name"
      >
        {{ $t('multisig.multisigVault') }}
      </div>
      <Truncate
        v-else-if="account.name"
        class="account-name-truncated"
        :str="account.name"
        :gradient-color="color"
      />
      <div
        v-else
        data-cy="account-name-number"
        class="account-name"
      >
        {{ $t('pages.account.heading') }} {{ account.idx + 1 }}
      </div>
      <div
        v-if="address && address.length"
        class="account-address"
      >
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
import { computed, defineComponent, PropType } from '@vue/composition-api';
import { IAccount, IMultisigAccount } from '../../types';
import { useGetter } from '../../composables/vuex';
import { useMultisigAccounts } from '../../composables';

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
    color: { type: String, default: '#212121' },
    canCopyAddress: Boolean,
    account: { type: Object as PropType<IAccount | IMultisigAccount>, required: true },
  },
  setup(props, { root }) {
    const { isMultisigDashboard } = useMultisigAccounts({ store: root.$store });

    const activeNetwork = useGetter('activeNetwork');

    // TODO update this code when working on the multisig navigation
    const address = computed(() => isMultisigDashboard.value
      ? (props.account as IMultisigAccount).gaAccountId
      : (props.account as IAccount).address);

    const explorerUrl = computed(() => `${activeNetwork.value.explorerUrl}/account/transactions/${address.value}`);

    return {
      address,
      explorerUrl,
      isMultisigDashboard,
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
    width: 48px;
    height: 48px;
    background-color: variables.$color-black;
  }

  .account-details {
    max-width: 230px;
    font-weight: 500;

    .account-name-truncated,
    .account-name {
      @extend %face-sans-16-medium;

      margin-top: 4px;
      margin-bottom: 2px;
      line-height: 20px;
    }

    .ae-address {
      padding: 4px 0;
      color: rgba(variables.$color-white, 0.85);
      opacity: 0.85;

      .icon {
        width: 22px;
        height: 22px;
        margin-left: 2px;
      }
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
