<template>
  <div class="account-info">
    <div class="title">
      <Avatar
        class="avatar"
        :address="activeAccount.address"
        :name="activeAccount.name"
      />
      <div class="account-details">
        <Truncate
          v-if="activeAccount.name"
          :str="activeAccount.name"
          :gradient-color="color"
        />
        <div
          v-else
          data-cy="account-name"
          class="account-name"
        >
          {{ $t('pages.account.heading') }} {{ accountIdx + 1 }}
        </div>
        <ButtonPlain
          v-if="truncatedAddress && truncatedAddress.length"
          v-clipboard:copy="activeAccount.address"
          v-clipboard:success="copy"
          class="ae-address"
          data-cy="copy"
        >
          <span>{{ truncatedAddress[0] }}</span>
          <span class="more">...</span>
          <span>{{ truncatedAddress[1] }}</span>

          <CopyOutlined v-if="canCopyAddress" />

          <div
            v-if="copied"
            class="copied"
          >
            {{ $t('addressCopied') }}
          </div>
        </ButtonPlain>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import CopyMixin from '../../../mixins/copy';
import Avatar from './Avatar.vue';
import ButtonPlain from './ButtonPlain.vue';
import CopyOutlined from '../../../icons/copy-outlined.svg?vue-component';
import Truncate from './Truncate.vue';
import { truncateAddress } from '../../utils/helper';

export default {
  components: {
    Avatar,
    ButtonPlain,
    Truncate,
    CopyOutlined,
  },
  mixins: [CopyMixin],
  props: {
    color: { type: String, default: 'black' },
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
    truncatedAddress() {
      return truncateAddress(this.activeAccount);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.account-info {
  text-align: left;

  .title {
    display: flex;
    align-items: center;
    line-height: 16px;
    color: variables.$color-white;
    justify-content: flex-start;

    .avatar {
      margin-right: 8px;
      overflow: visible;
      width: 48px;
      height: 48px;
      background-color: variables.$color-black;
    }

    .account-details {
      display: flex;
      flex-wrap: nowrap;
      justify-content: center;
      flex-direction: column;
      width: 227px;
      height: 48px;
      padding-left: 2px;

      .truncate,
      .account-name {
        @extend %face-sans-16-medium;

        line-height: 16px;
      }

      .account-name {
        padding-bottom: 2px;
        padding-top: 3px;
      }

      .ae-address {
        @extend %face-mono-12-medium;

        color: rgba(variables.$color-white, 0.85);
        display: flex;
        opacity: 0.85;
        margin-top: 2px;
        letter-spacing: 0.07em;
        align-items: center;
        width: 150px;
        position: relative;

        .more {
          letter-spacing: -1px;
          margin-right: 2px;
          margin-top: -5px;
        }

        &:hover {
          opacity: 1;
        }

        .icon {
          width: 22px;
          height: 22px;
          margin-left: 2px;
        }

        .copied {
          border: 2px dashed rgba(variables.$color-white, 0.4);
          border-radius: 4px;
          background-color: variables.$color-bg-4;
          width: 117px;
          text-align: center;
          padding: 0;
          position: absolute;
          top: 1px;

          @extend %face-sans-14-regular;
        }
      }
    }
  }
}
</style>
