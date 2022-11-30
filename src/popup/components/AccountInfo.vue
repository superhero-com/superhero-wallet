<template>
  <div
    class="account-info"
    :class="{ 'can-copy-address': canCopyAddress }"
  >
    <Avatar
      class="avatar"
      :address="activeAccount.address"
      :name="activeAccount.name"
    />
    <div class="account-details">
      <Truncate
        v-if="activeAccount.name"
        class="account-name-truncated"
        :str="activeAccount.name"
        :gradient-color="color"
      />
      <div
        v-else
        data-cy="account-name-number"
        class="account-name"
      >
        {{ $t('pages.account.heading') }} {{ accountIdx + 1 }}
      </div>
      <div
        v-if="truncatedAddress && truncatedAddress.length"
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

<script>
import { mapGetters } from 'vuex';
import { truncateAddress } from '../utils';
import Avatar from './Avatar.vue';
import CopyText from './CopyText.vue';
import Truncate from './Truncate.vue';
import AddressTruncated from './AddressTruncated.vue';

export default {
  components: {
    AddressTruncated,
    Avatar,
    Truncate,
    CopyText,
  },
  props: {
    color: { type: String, default: '#212121' },
    canCopyAddress: Boolean,
    accountIdx: { type: Number, required: true },
  },
  computed: {
    ...mapGetters(['accounts', 'activeNetwork']),
    activeAccount() {
      return this.accounts[this.accountIdx];
    },
    explorerUrl() {
      const { address } = this.activeAccount;
      return `${this.activeNetwork.explorerUrl}/account/transactions/${address}`;
    },
    address() {
      return this.activeAccount?.address;
    },
    truncatedAddress() {
      return truncateAddress(this.address);
    },
  },
};
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
    overflow: visible;
    width: 48px;
    height: 48px;
    background-color: variables.$color-black;
  }

  .account-details {
    max-width: 230px;
    font-weight: 500;

    .account-name-truncated,
    .account-name-number {
      @extend %face-sans-16-medium;

      margin-top: 4px;
      margin-bottom: 2px;
      line-height: 20px;
    }

    .ae-address {
      @extend %face-mono-12-medium;

      display: flex;
      align-items: center;
      gap: 2px;
      padding: 4px 0;
      color: rgba(variables.$color-white, 0.85);
      opacity: 0.85;
      letter-spacing: 0.07em;

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
