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

      <AccountRow />

      <div class="qrcode-wrapper">
        <QrCode
          :value="accountAddressToCopy"
          :size="180"
          class="qrcode"
        />
      </div>

      <div class="address">
        <CopyText
          class="address-copy"
          hide-icon
          disabled
          :copied="copied"
          @click="copyAddress()"
        >
          <Scrollable class="address-scrollable-area">
            <AddressFormatted
              :address="accountAddressToDisplay"
            />
          </Scrollable>
        </CopyText>
      </div>

      <div class="request-specific-amount">
        <InputAmount
          v-model.number="amount"
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
      <BtnMain
        data-cy="copy"
        :variant="IS_MOBILE_DEVICE ? 'muted' : 'primary'"
        class="btn-copy"
        :text="copied ? $t('modals.receive.copied') : $t('modals.receive.copy')"
        @click="copyAddress()"
      />

      <BtnMain
        v-if="IS_MOBILE_DEVICE"
        class="btn-share"
        :icon="ShareIcon"
        @click="share"
      >
        {{ $t('modals.receive.share') }}
      </BtnMain>
    </template>
  </Modal>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import type {
  IAccount,
  IAsset,
  IToken,
  ITokenList,
} from '../../../types';
import { i18n } from '../../../store/plugins/languages';
import { IS_MOBILE_DEVICE } from '../../../lib/environment';
import { useCopy } from '../../../composables';
import {
  AETERNITY_SYMBOL,
  AETERNITY_CONTRACT_ID,
  APP_LINK_WEB,
  MODAL_TRANSFER_RECEIVE,
} from '../../utils';

import InputAmount from '../InputAmountV2.vue';
import QrCode from '../QrCode.vue';
import Scrollable from '../Scrollable.vue';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AccountRow from '../AccountRow.vue';
import AddressFormatted from '../AddressFormatted.vue';
import CopyText from '../CopyText.vue';
import ShareIcon from '../../../icons/share-2.svg?vue-component';

export default defineComponent({
  name: 'TransferReceive',
  components: {
    InputAmount,
    Modal,
    QrCode,
    BtnMain,
    AccountRow,
    Scrollable,
    AddressFormatted,
    CopyText,
  },
  props: {
    defaultAmount: { type: [String, Number], default: null },
    tokenContractId: { type: [String, Number], default: null },
  },
  setup(props, { root }) {
    const amount = ref<number | null>(props.defaultAmount ? Number(props.defaultAmount) : null);
    const account = computed<IAccount>(() => root.$store.getters.account);
    const availableTokens = computed<ITokenList>(
      () => root.$store.state.fungibleTokens.availableTokens,
    );

    const selectedAsset = ref<IAsset | IToken | null>(null);

    const { copied, copy } = useCopy();

    function getTokenInfoQuery() {
      if (!amount.value || amount.value <= 0) return '';
      const token = selectedAsset.value && selectedAsset.value.contractId === AETERNITY_CONTRACT_ID
        ? AETERNITY_SYMBOL
        : selectedAsset.value?.contractId;
      return `token=${token}&amount=${amount.value}`;
    }

    function getAccountLink(value: string) {
      return `${APP_LINK_WEB}/account?account=${value}&${getTokenInfoQuery()}`;
    }

    const accountAddressToCopy = computed(
      () => (amount.value && amount.value > 0)
        ? getAccountLink(account.value.address)
        : account.value.address,
    );

    const accountAddressToDisplay = computed(
      () => (amount.value && amount.value > 0)
        ? `${account.value.address}?${getTokenInfoQuery()}`
        : account.value.address,
    );

    async function share() {
      const { address } = account.value;
      const walletLink = getAccountLink(address);
      const text = (amount.value && amount.value > 0)
        ? i18n.t('modals.receive.shareTextNoAmount', { address, walletLink })
        : i18n.t('modals.receive.shareTextWithAmount', { address, walletLink, amount: amount.value });
      await root.$store.dispatch('share', { text });
    }

    function handleAssetChange(asset: IAsset | IToken) {
      selectedAsset.value = asset;
    }

    function closeModal() {
      root.$store.commit('modals/closeByKey', MODAL_TRANSFER_RECEIVE);
    }

    function copyAddress() {
      copy(accountAddressToCopy.value);
    }

    (() => {
      if (props.tokenContractId && availableTokens.value[props.tokenContractId]) {
        handleAssetChange(availableTokens.value[props.tokenContractId]);
      }
    })();

    return {
      IS_MOBILE_DEVICE,
      ShareIcon,
      amount,
      selectedAsset,
      share,
      closeModal,
      handleAssetChange,
      copyAddress,
      copied,
      accountAddressToDisplay,
      accountAddressToCopy,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/share-info';
@use '../../../styles/mixins';

.transfer-receive-modal {
  font-weight: 500;
  color: variables.$color-white;

  .title {
    @extend %face-sans-18-bold;

    align-self: center;
    color: variables.$color-white;
  }

  .qrcode-wrapper {
    margin-top: 10px;
    text-align: center;

    .qrcode {
      display: inline-flex;
      padding: 8px;
      background-color: variables.$color-white;
      border-radius: 12px;
    }
  }

  .address {
    max-width: 260px;
    margin: 14px auto 0;

    &-copy {
      display: block;
    }

    &-scrollable-area {
      @extend %face-mono-14-medium;

      width: 100%;
      height: 74px;
      color: variables.$color-white;
      font-style: normal;
      text-align: left;
      line-height: 24px;
    }
  }

  .btn-share {
    min-width: 60%;
  }
}
</style>
