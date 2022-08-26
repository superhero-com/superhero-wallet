<template>
  <div class="account-info">
    <div class="title">
      <Avatar
        class="avatar"
        :address="accounts[idx].address"
        :name="accounts[idx].name"
      />
      <div class="account-details">
        <Truncate
          v-if="accounts[idx].name"
          :str="accounts[idx].name"
          :gradiant-color="color"
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
          v-clipboard:copy="accounts[idx].address"
          v-clipboard:success="copy"
          class="ae-address"
          data-cy="copy"
        >
          <span>{{ truncatedAddress[0] }}</span>
          <span class="more">...</span>
          <span>{{ truncatedAddress[1] }}</span>

          <CopyOutlined v-if="showCopyIcon" />
        </ButtonPlain>
        <div
          v-if="copied"
          class="copied"
        >
          {{ $t('addressCopied') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex';
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
    accountIdx: { type: Number, default: -1 },
    color: { type: String, default: 'black' },
    showCopyIcon: { type: Boolean, default: false },
  },
  computed: {
    ...mapState('accounts', ['activeIdx']),
    ...mapGetters(['accounts', 'activeNetwork']),
    idx() {
      return this.accountIdx === -1 ? this.activeIdx : this.accountIdx;
    },
    explorerUrl() {
      const { address } = this.accounts[this.idx];
      return `${this.activeNetwork.explorerUrl}/account/transactions/${address}`;
    },
    truncatedAddress() {
      return truncateAddress(this.accounts[this.idx]);
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
    justify-content: center;
    line-height: 16px;
    color: variables.$color-white;

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

        .more {
          letter-spacing: -1px;
          margin-right: 2px;
          margin-top: -5px;
        }

        &:hover {
          opacity: 1;
        }

        svg {
          width: 22px;
          height: 22px;
          margin-left: 2px;
        }
      }

      .copied {
        border: 2px dashed rgba(variables.$color-white, 0.4);
        border-radius: 4px;
        background-color: variables.$color-bg-4;
        width: 117px;
        text-align: center;
        padding: 0;
        position: absolute;
        top: 36px;

        @extend %face-sans-14-regular;
      }
    }
  }
}
</style>
