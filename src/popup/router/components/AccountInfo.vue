<template>
  <div class="account-info">
    <div class="title">
      <Avatar
        class="avatar"
        :address="accounts[idx].address"
        :name="accounts[idx].name"
      />
      <div class="account-details">
        <template v-if="!copied">
          <Truncate
            v-if="accounts[idx].name"
            :str="accounts[idx].name"
            :gradiant-color="color"
          />
          <span
            v-else
            data-cy="account-name"
            class="account-name"
          >
            {{ $t('pages.account.heading') }} {{ accountIdx + 1 }}
          </span>
          <ButtonPlain
            v-clipboard:copy="accounts[idx].address"
            v-clipboard:success="copy"
            class="ae-address"
            data-cy="copy"
          >
            {{ truncateAdrress(accounts[idx].address) }}
          </ButtonPlain>
        </template>
        <div
          v-else
          class="copied"
        >
          <CheckedCircleIcon />
          <span class="text">{{ $t('addressCopied') }}</span>
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
import CheckedCircleIcon from '../../../icons/account-card/checked-circle.svg?vue-component';
import Truncate from './Truncate.vue';

export default {
  components: {
    Avatar,
    ButtonPlain,
    CheckedCircleIcon,
    Truncate,
  },
  mixins: [CopyMixin],
  props: {
    accountIdx: { type: Number, default: -1 },
    color: { type: String, default: 'black' },
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
  },
  methods: {
    truncateAdrress() {
      const { address } = this.accounts[this.idx];
      const addressLength = address.length;
      const firstPart = address.slice(0, addressLength / 2).match(/.{3}/g);
      const secondPart = address.slice(addressLength / 2, addressLength).match(/.{3}/g);

      return `${firstPart.slice(0, 3).reduce((acc, current) => `${acc} ${current}`)} ···
      ${secondPart.slice(-3).reduce((acc, current) => `${acc} ${current}`)}`;
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
      width: 203px;
      height: 48px;

      .truncate {
        @extend %face-sans-16-bold;

        line-height: 16px;
      }

      .ae-address {
        @extend %face-mono-14-medium;

        color: variables.$color-white;
        display: flex;
        opacity: 0.85;
        margin-top: 8px;
        letter-spacing: -1px;

        &:hover {
          opacity: 1;
        }
      }

      .copied {
        align-items: center;
        justify-content: center;
        display: flex;
        flex: 0.9;
        border: dashed 1px rgba(255, 255, 255, 0.75);
        border-radius: 5px;

        svg {
          margin-right: 6px;
          width: 24px;
          height: 24px;
        }

        .text {
          @extend %face-sans-16-medium;

          white-space: nowrap;
        }
      }
    }
  }
}
</style>
