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
        <QrcodeVue
          :value="getQRdata(accounts[idx].address)"
          size="112"
          class="qrcode"
        />

        <a
          class="address"
          target="_blank"
          :href="explorerUrl()"
          :class="{ copied }"
        >
          <Scrollable>
            {{ formatAddress(accounts[idx].address) }}
          </Scrollable>
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
          data-cy="copy"
          fill="secondary"
          class="copy"
          new-design
          :text="copied ? $t('modals.receive.copied') : $t('modals.receive.copy')"
        />

        <Button
          v-if="!IS_MOBILE_DEVICE"
          class="share"
          new-design
          :text="$t('modals.receive.share')"
          :icon="shareIcon"
          @click="share"
        />
      </div>
    </div>
  </Modal>
</template>

<script>
import QrcodeVue from 'qrcode.vue';
import { mapGetters, mapState } from 'vuex';
import CopyMixin from '../../../../mixins/copy';
import RequestAmount from '../RequestAmount.vue';
import Scrollable from '../Scrollable.vue';
import shareIcon from '../../../../icons/naked-share.svg';
import { APP_LINK_WEB } from '../../../utils/constants';
import Modal from '../Modal.vue';
import Avatar from '../Avatar.vue';
import Truncate from '../Truncate.vue';
import Button from '../Button.vue';
import { MODAL_TRANSFER_RECEIVE } from '../../../constants';

export default {
  name: 'TransferReceive',
  components: {
    RequestAmount,
    Modal,
    Avatar,
    Truncate,
    QrcodeVue,
    Button,
    Scrollable,
  },
  mixins: [
    CopyMixin,
  ],
  props: {
    accountIdx: { type: Number, default: -1 },
  },
  data() {
    return {
      shareIcon,
      amount: null,
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
      const text = (this.amount > 0)
        ? this.$t('modals.receive.shareTextNoAmount', { address, walletLink })
        : this.$t('modals.receive.shareTextWithAmount', { address, walletLink, amount: this.amount });
      await this.$store.dispatch('share', { text });
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
      this.$store.commit('modals/closeByKey', MODAL_TRANSFER_RECEIVE);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/typography';
@use '../../../../styles/share-info';
@use '../../../../styles/mixins';

.transfer-receive-modal {
  font-weight: 500;
  color: variables.$color-white;

  .transfer-receive {
    display: flex;
    align-content: center;
    justify-content: center;
    flex-direction: column;

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
      @include mixins.flex(center, center, row);

      margin-top: 4px;

      .avatar {
        width: 24px;
        height: 24px;
      }

      .truncate {
        display: block;
      }

      .account-name {
        @extend %face-sans-16-medium;

        padding-left: 7.69px;
      }
    }

    .address-info {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-top: 24px;

      .qrcode {
        display: flex;
        align-self: flex-start;
        padding: 8px;
        background-color: variables.$color-white;
        border-radius: 12px;
      }

      .address {
        @extend %face-mono-14-medium;

        display: block;
        width: 100%;
        cursor: pointer;
        padding-left: 6px;
        border-radius: 12px;
        border-width: 1px;
        border-style: dashed;
        border-color: transparent;
        color: variables.$color-white;
        font-style: normal;
        text-align: left;
        line-height: 24px;
        letter-spacing: 0.15em;
        text-decoration: none;
        word-break: break-all;
        transition: .2s;

        &.copied {
          background: rgba(variables.$color-primary, 0.1);
          border-color: rgba(variables.$color-primary, 0.5);
        }
      }
    }

    .request-specific-amount {
      margin-top: 32px;
    }

    .actions {
      display: flex;
      gap: 8px;
      margin-top: 32px;

      .copy {
        flex: 1 1 0;
      }

      .share {
        flex: 1 1 0;
        min-width: 60%;
      }
    }
  }
}
</style>
