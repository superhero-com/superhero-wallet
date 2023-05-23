<template>
  <Modal
    class="transfer-receive-modal"
    has-close-button
    from-bottom
    @close="resolve()"
  >
    <div
      class="transfer-receive"
      data-cy="top-up-container"
    >
      <h2 class="text-heading-2 text-center">
        {{ isMultisig ? $t('modals.receiveMultisig.title') : $t('modals.receive.title') }}
      </h2>

      <div class="account-row">
        <AccountItem
          :address="activeAccountAddress"
          :name="isMultisig ? null : activeAccount.name"
        />
      </div>

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
          v-model="amount"
          v-validate="{
            min_value_exclusive: 0,
          }"
          name="amount"
          :label="$t('modals.receive.requestAmount')"
          :message="errors.first('amount')"
          :selected-asset="selectedAsset"
          :ae-only="isMultisig"
          @asset-selected="handleAssetChange"
        />
      </div>
    </div>
    <template #footer>
      <BtnMain
        data-cy="copy"
        :variant="IS_MOBILE_DEVICE ? 'muted' : 'primary'"
        class="btn-copy"
        :text="copied ? $t('modals.receive.copied') : $t('common.copy')"
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
import {
  computed,
  defineComponent,
  PropType,
  ref,
} from '@vue/composition-api';
import type {
  IAsset,
  IToken,
  ITokenList,
  ResolveRejectCallback,
} from '../../../types';
import { i18n } from '../../../store/plugins/languages';
import { IS_MOBILE_DEVICE } from '../../../lib/environment';
import { useAccounts, useCopy, useMultisigAccounts } from '../../../composables';
import {
  AETERNITY_SYMBOL,
  AETERNITY_CONTRACT_ID,
  APP_LINK_WEB,
} from '../../utils';

import InputAmount from '../InputAmountV2.vue';
import QrCode from '../QrCode.vue';
import Scrollable from '../Scrollable.vue';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AddressFormatted from '../AddressFormatted.vue';
import CopyText from '../CopyText.vue';
import ShareIcon from '../../../icons/share-2.svg?vue-component';
import AccountItem from '../AccountItem.vue';

export default defineComponent({
  name: 'TransferReceive',
  components: {
    InputAmount,
    Modal,
    QrCode,
    BtnMain,
    Scrollable,
    AddressFormatted,
    CopyText,
    AccountItem,
  },
  props: {
    resolve: { type: Function as PropType<ResolveRejectCallback>, default: () => null },
    defaultAmount: { type: [String, Number], default: null },
    tokenContractId: { type: [String, Number], default: null },
    isMultisig: Boolean,
  },
  setup(props, { root }) {
    const { activeAccount } = useAccounts({ store: root.$store });
    const { activeMultisigAccountId } = useMultisigAccounts({ store: root.$store, pollOnce: true });
    const { copied, copy } = useCopy();

    const amount = ref<number | null>(props.defaultAmount ? Number(props.defaultAmount) : null);
    const selectedAsset = ref<IAsset | IToken | null>(null);

    const activeAccountAddress = computed(() => props.isMultisig
      ? activeMultisigAccountId.value
      : activeAccount.value.address);

    const availableTokens = computed<ITokenList>(
      () => root.$store.state.fungibleTokens.availableTokens,
    );

    function getTokenInfoQuery() {
      if (!amount.value || amount.value <= 0) return '';
      const token = selectedAsset.value && selectedAsset.value.contractId === AETERNITY_CONTRACT_ID
        ? AETERNITY_SYMBOL
        : selectedAsset.value?.contractId;
      return `token=${token}&amount=${amount.value}`;
    }

    function getAccountLink(value: string | undefined) {
      return value
        ? `${APP_LINK_WEB}/account?account=${value}&${getTokenInfoQuery()}`
        : '';
    }

    const accountAddressToCopy = computed(
      () => (amount.value && amount.value > 0)
        ? getAccountLink(activeAccountAddress.value)
        : activeAccountAddress.value,
    );

    const accountAddressToDisplay = computed(
      () => (amount.value && amount.value > 0)
        ? `${activeAccountAddress.value}?${getTokenInfoQuery()}`
        : activeAccountAddress.value,
    );

    async function share() {
      const { address } = activeAccount.value;
      const walletLink = getAccountLink(address);
      const text = (amount.value && amount.value > 0)
        ? i18n.t('modals.receive.shareTextNoAmount', { address, walletLink })
        : i18n.t('modals.receive.shareTextWithAmount', { address, walletLink, amount: amount.value });
      await root.$store.dispatch('share', { text });
    }

    function handleAssetChange(asset: IAsset | IToken) {
      selectedAsset.value = asset;
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
      handleAssetChange,
      copyAddress,
      copied,
      activeAccount,
      activeAccountAddress,
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

  .account-row {
    display: flex;
    justify-content: center;
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
