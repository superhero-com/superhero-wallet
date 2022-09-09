<template>
  <div
    class="account-info"
    :class="{ 'can-copy-address': canCopyAddress }"
  >
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
        <div
          v-if="truncatedAddress && truncatedAddress.length"
        >
          <ButtonPlain
            v-if="canCopyAddress"
            v-clipboard:copy="activeAccount.address"
            v-clipboard:success="copy"
            class="ae-address"
            data-cy="copy"
          >
            <span>{{ truncatedAddress[0] }}</span>
            <span>&middot;&middot;&middot;</span>
            <span>{{ truncatedAddress[1] }}</span>

            <CopyOutlinedIcon />

            <div
              v-if="copied"
              class="copied"
            >
              <CopyOutlinedIcon />
              {{ $t('addressCopied') }}
            </div>
          </ButtonPlain>
          <div
            v-else
            class="ae-address"
          >
            <span>{{ truncatedAddress[0] }}</span>
            <span>&middot;&middot;&middot;</span>
            <span>{{ truncatedAddress[1] }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import CopyMixin from '../../../mixins/copy';
import { truncateAddress } from '../../utils/helper';
import Avatar from './Avatar.vue';
import ButtonPlain from './ButtonPlain.vue';
import Truncate from './Truncate.vue';
import CopyOutlinedIcon from '../../../icons/copy-outlined.svg?vue-component';

export default {
  components: {
    Avatar,
    ButtonPlain,
    Truncate,
    CopyOutlinedIcon,
  },
  mixins: [
    CopyMixin,
  ],
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

        position: relative;
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 2px 0 0;
        color: rgba(variables.$color-white, 0.85);
        opacity: 0.85;
        letter-spacing: 0.07em;

        .icon {
          width: 22px;
          height: 22px;
          margin-left: 2px;
        }

        .copied {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px dashed rgba(variables.$color-white, 0.4);
          border-radius: 5px;
          font-size: 12px;
          background-color: variables.$color-bg-4;
          text-transform: uppercase;

          @extend %face-sans-14-regular;
        }
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
