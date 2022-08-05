<template>
  <Modal
    class="transfer-receive-modal"
    has-close-button
    from-bottom
    :header="$t('modals.receive.title')"
    @close="closeModal"
  >
    <div
      class="transfer-receive"
      data-cy="top-up-container"
    >
      <div class="account-info">
        <Avatar
          class="avatar"
          :address="accounts[idx].address"
          :name="accounts[idx].name"
        />
        <Truncate
          v-if="accounts[idx].name"
          :str="accounts[idx].name"
        />
        <span
          v-else
          data-cy="account-name"
          class="account-name"
        >
          {{ $t('pages.account.heading') }} {{ accountIdx + 1 }}
        </span>
      </div>

      <div class="address-info">
        <div class="qrcode-cover">
          <qrcode-vue
            :value="getQRdata(accounts[idx].address)"
            size="112"
            class="qrcode"
          />
        </div>
        <a
          class="address"
          :href="explorerUrl()"
          target="_blank"
        >
          {{ formatAddress(accounts[idx].address) }}
        </a>
      </div>

      <div class="request-specific-amount">
        <RequestAmount
          v-model="amount"
          own-validation
          :validation="{ min_value_exclusive: 0 }"
          :label="$t('modals.receive.requestAmount')"
          @handleAssetSelection="handleAssetSelection"
        />
      </div>

      <div class="actions">
        <Button
          v-clipboard:copy="getTextToCopy()"
          v-clipboard:success="copy"
          class="copy"
          :class="[IS_MOBILE_DEVICE ? 'mobile-copy': 'web-copy']"
          data-cy="copy"
          :bold="false"
          fill="secondary"
        >
          {{ copied ? $t('modals.receive.copied') : $t('modals.receive.copy') }}
        </Button>

        <Button
          v-if="IS_MOBILE_DEVICE"
          class="share"
          @click="share"
        >
          <Share class="share-icon" />
          <span class="share-text"> {{ $t('modals.receive.share') }} </span>
        </Button>
      </div>
    </div>
  </Modal>
</template>

<script>
import QrcodeVue from 'qrcode.vue';
import { mapGetters, mapState } from 'vuex';
import CopyMixin from '../../../../mixins/copy';
import RequestAmount from '../RequestAmount.vue';
import Share from '../../../../icons/naked-share.svg?vue-component';
import { APP_LINK_WEB } from '../../../utils/constants';
import Modal from '../Modal.vue';
import Avatar from '../Avatar.vue';
import Truncate from '../Truncate.vue';
import Button from '../Button.vue';

export default {
  name: 'TransferReceive',
  components: {
    RequestAmount,
    Share,
    Modal,
    Avatar,
    Truncate,
    QrcodeVue,
    Button,
  },
  mixins: [CopyMixin],
  props: {
    accountIdx: { type: Number, default: -1 },
  },
  data() {
    return {
      amount: '',
      IS_MOBILE_DEVICE: window.IS_MOBILE_DEVICE,
      selectedAsset: null,
    };
  },
  computed: {
    ...mapState('accounts', ['activeIdx']),
    ...mapGetters(['accounts', 'activeNetwork']),
    idx() {
      return this.accountIdx === -1 ? this.activeIdx : this.accountIdx;
    },
  },
  methods: {
    getTokenInfo(link = false) {
      if (this.amount <= 0) return '';
      const token = this.selectedAsset && (this.selectedAsset.symbol === 'AE'
        ? 'AE'
        : this.selectedAsset.contractId);
      const firstChar = link ? '&' : '?';
      const separator = link ? '&' : '&amp;';
      return `${firstChar}token=${token}${separator}amount=${this.amount}`;
    },
    getLink(value) {
      return `${APP_LINK_WEB}/transfer?account=${value}${this.getTokenInfo(true)}`;
    },
    async share() {
      const { address } = this.accounts[this.idx];
      const walletLink = this.getLink(address);
      let msg = `My aeternity address ${address} or use the following
                link ${walletLink} to send it with Superhero Wallet`;
      if (this.amount > 0) {
        msg = `Please send ${this.amount} AE to my aeternity address \
              ${address} or use the following link ${walletLink} to \
              send it with Superhero Wallet`;
      }
      await this.$store.dispatch('share', { text: msg });
    },
    getQRdata(address) {
      return this.amount > 0
        ? `${this.getLink(address)}`
        : address;
    },
    truncateAddress(address) {
      return address.match(/.{1,3}/g).reduce((acc, current) => `${acc} ${current}`);
    },
    formatAddress(address) {
      return this.amount > 0
        ? `${address}?${this.getTokenInfo(true).substring(1)}`
        : this.truncateAddress(address);
    },
    getTextToCopy() {
      return this.amount > 0
        ? this.getLink(this.accounts[this.idx].address)
        : this.accounts[this.idx].address;
    },
    explorerUrl() {
      const { address } = this.accounts[this.idx];
      return `${this.activeNetwork.explorerUrl}/account/transactions/${address}`;
    },
    handleAssetSelection(newToken) {
      this.selectedAsset = newToken;
    },
    closeModal() {
      this.$store.commit('modals/closeByKey', 'transfer-receive');
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables.scss';
@use '../../../../styles/typography.scss';
@use '../../../../styles/share-info.scss';
@use '../../../../styles/mixins';

.transfer-receive-modal {
  font-weight: 500;
  color: variables.$color-white;

  ::v-deep .container {
    padding: 0;
    width: 360px;
    overflow: hidden;
    overflow-y: auto;
  }

  .transfer-receive {
    display: flex;
    align-content: center;
    justify-content: center;
    flex-direction: column;
    padding: 16px;
    margin-left: 8px;

    .close {
      align-self: flex-end;
      width: 16px;
      height: 16px;
    }

    .title {
      align-self: center;
      color: variables.$color-white;

      @extend %face-sans-18-bold;
    }

    .account-info {
      margin-top: 4px;
      display: flex;
      justify-content: center;
      align-content: center;

      .avatar {
        width: 16.62px;
        height: 16.62px;
      }

      .account-name {
        @extend %face-sans-16-medium;

      padding-left: 7.69px;
    }
  }

  .transfer-receive {
    display: flex;
    align-content: center;
    justify-content: center;
    flex-direction: column;

    .title {
      align-self: center;
      color: variables.$color-white;

      @extend %face-sans-18-bold;
    }

    .address-info {
      display: flex;
      justify-content: flex-start;
      margin-top: 24px;
      height: 128px;
      top: calc(50% - 128px / 2);

      .qrcode-cover {
        background-color: variables.$color-white;
        border-radius: 12px;

        .qrcode {
          padding: 8px;
        }
      }

      .address {
        display: flex;
        flex-direction: column-reverse;
        cursor: pointer;
        overflow: scroll;
        margin-left: 16px;
        height: 128px;
        width: 174px;
        padding-right: 6px;
        color: variables.$color-white;
        font-style: normal;
        text-align: left;
        line-height: 24px;
        letter-spacing: 0.15em;
        text-decoration: none;
        word-break: break-all;

        @extend %face-mono-14-medium;

        &::-webkit-scrollbar {
          display: block;
          width: 7px;
          height: 0;
        }

        &::-webkit-scrollbar-thumb {
          display: block;
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }

        -ms-overflow-style: auto;
      }
    }

    .request-specific-amount {
      margin-top: 32px;
      height: 100px;
    }

    .actions {
      display: flex;
      align-content: center;
      column-gap: 8px;
      flex: none;
      align-self: stretch;
      flex-grow: 0;
      margin-top: 24px;

      .copy,
      .share {
        gap: 4px;
        order: 0;
        flex-grow: 0;
        cursor: pointer;
        border-radius: 10px;
        width: 100%;
        color: variables.$color-white;

        @extend %face-sans-16-regular;
      }

      .web-copy {
        background-color: variables.$color-blue;
      }

      .mobile-copy {
        background-color: variables.$color-medium-grey;
      }

      .share {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        order: 1;
        flex-grow: 1;
        cursor: pointer;
        width: 145%;
        border-radius: 10px;
        padding: 8px 16px;

        .share-icon {
          align-self: center;
        }

        .share-text {
          color: variables.$color-white;

          @extend %face-sans-16-regular;
        }
      }
    }
  }
}
</style>
