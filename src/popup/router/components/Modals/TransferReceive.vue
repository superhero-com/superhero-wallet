<template>
  <Modal
    class="transfer-receive-modal"
    has-close-button
    from-bottom
    @close="closeModal"
  >
    <div
      class="transfer-receive"
      data-cy="top-up-container"
    >
      <h2 class="text-heading-2 text-center">
        {{ $t('modals.receive.title') }}
      </h2>

      <div class="account-info">
        <Avatar
          size="sm"
          class="account-avatar"
          :address="account.address"
          :name="account.name"
        />
        <Truncate
          v-if="account.name"
          :str="account.name"
        />
        <span
          v-else
          data-cy="account-name"
          class="account-name"
        >
          {{ $t('pages.account.heading') }} {{ account.idx + 1 }}
        </span>

        <a
          :href="explorerUrl"
          target="_blank"
          class="account-explorer-link"
        >
          <ExternalLinkIcon />
        </a>
      </div>

      <div class="address-info">
        <QrcodeVue
          :value="getQRdata(account.address)"
          size="112"
          class="qrcode"
        />

        <a
          class="address"
          target="_blank"
          :href="explorerUrl"
          :class="{ copied }"
        >
          <Scrollable>
            <AddressFormatted
              :address="computedAddress"
              :columns="!amount"
            />
          </Scrollable>
        </a>
      </div>

      <div class="request-specific-amount">
        <InputAmount
          v-model="amount"
          v-validate="{
            min_value_exclusive: 0,
          }"
          name="amount"
          :label="$t('modals.receive.requestAmount')"
          :message="errors.first('amount')"
          :selected-asset="selectedAsset"
          @asset-selected="handleAssetChange"
        />
      </div>
    </div>
    <template #footer>
      <Button
        v-clipboard:copy="getTextToCopy()"
        v-clipboard:success="copy"
        data-cy="copy"
        :fill="IS_MOBILE_DEVICE ? 'secondary' : 'primary'"
        class="btn-copy"
        new-ui
        :text="copied ? $t('modals.receive.copied') : $t('modals.receive.copy')"
      />

      <Button
        v-if="IS_MOBILE_DEVICE"
        class="btn-share"
        new-ui
        has-icon
        @click="share"
      >
        <ShareIcon />
        {{ $t('modals.receive.share') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
import QrcodeVue from 'qrcode.vue';
import { mapGetters, mapState } from 'vuex';
import { pick } from 'lodash-es';
import CopyMixin from '../../../../mixins/copy';
import InputAmount from '../InputAmountV2.vue';
import Scrollable from '../Scrollable.vue';
import { APP_LINK_WEB, MODAL_TRANSFER_RECEIVE } from '../../../utils/constants';
import Modal from '../Modal.vue';
import Avatar from '../Avatar.vue';
import Truncate from '../Truncate.vue';
import Button from '../Button.vue';
import AddressFormatted from '../AddressFormatted.vue';
import ExternalLinkIcon from '../../../../icons/external-link.svg?vue-component';
import ShareIcon from '../../../../icons/share-2.svg?vue-component';

export default {
  name: 'TransferReceive',
  components: {
    InputAmount,
    Modal,
    Avatar,
    Truncate,
    QrcodeVue,
    Button,
    Scrollable,
    AddressFormatted,
    ExternalLinkIcon,
    ShareIcon,
  },
  mixins: [CopyMixin],
  props: {
    defaultAmount: { type: [String, Number], default: null },
    tokenContractId: { type: [String, Number], default: null },
  },
  subscriptions() {
    return pick(this.$store.state.observables, [
      'balance',
      'balanceCurrency',
    ]);
  },
  data() {
    return {
      amount: null,
      IS_MOBILE_DEVICE: window.IS_MOBILE_DEVICE,
      selectedAsset: null,
    };
  },
  computed: {
    ...mapGetters('fungibleTokens', [
      'getAeternityToken',
    ]),
    ...mapGetters([
      'account',
      'activeNetwork',
    ]),
    ...mapState('fungibleTokens', [
      'availableTokens',
    ]),
    computedAddress() {
      return (this.amount > 0)
        ? `${this.account.address}?${this.getTokenInfo(true).substring(1)}`
        : this.account.address;
    },
    explorerUrl() {
      return `${this.activeNetwork.explorerUrl}/account/transactions/${this.account.address}`;
    },
  },
  created() {
    this.amount = this.defaultAmount;
    if (this.tokenContractId && this.availableTokens[this.tokenContractId]) {
      this.selectedAsset = this.availableTokens[this.tokenContractId];
    } else {
      this.selectedAsset = this.getAeternityToken({
        tokenBalance: this.balance,
        balanceCurrency: this.balanceCurrency,
      });
    }
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
      const { address } = this.account;
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
    getTextToCopy() {
      return this.amount > 0
        ? this.getLink(this.account.address)
        : this.account.address;
    },
    handleAssetChange(asset) {
      this.selectedAsset = asset;
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

      .truncate {
        display: block;
      }

      .account-avatar {
        margin-right: 8px;
      }

      .account-name {
        @extend %face-sans-16-medium;

        display: inline-block;
      }

      .account-explorer-link {
        display: inline-block;
        width: 22px;
        height: 22px;
        color: inherit;

        &:hover {
          color: variables.$color-primary;
        }
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
        padding-left: 6px;
        border-radius: 12px;
        border-width: 1px;
        border-style: dashed;
        border-color: transparent;
        color: variables.$color-white;
        font-style: normal;
        text-align: left;
        line-height: 24px;
        text-decoration: none;
        transition: 0.2s;

        &.copied {
          background: rgba(variables.$color-primary, 0.1);
          border-color: rgba(variables.$color-primary, 0.5);
        }
      }
    }

    .request-specific-amount {
      margin-top: 32px;
    }
  }

  .btn-share {
    min-width: 60%;
  }
}
</style>
