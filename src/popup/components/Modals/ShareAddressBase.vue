<template>
  <Modal
    class="share-address-base"
    has-close-button
    from-bottom
    full-screen
    body-without-padding-bottom
    @close="$emit('close')"
  >
    <div data-cy="top-up-container">
      <h2
        class="text-heading-2 text-center"
        v-text="heading"
      />

      <div class="account-row">
        <AccountItem
          :address="accountAddress"
          :name="accountName"
          :protocol="protocol"
        />
      </div>

      <WrappedQrCode
        :value="[accountAddressToCopy]"
        :size="isReceive ? 180 : 290"
      />

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
              data-cy="qr-code-info"
              :address="accountAddressToDisplay"
            />
          </Scrollable>
        </CopyText>
      </div>

      <div
        v-if="isReceive"
        class="request-specific-amount"
      >
        <Field
          v-slot="{ field, errorMessage }"
          v-model="amount"
          name="amount"
          :rules="{
            min_value_exclusive: 0,
            does_not_exceed_decimals: assetDecimals,
          }"
        >
          <InputAmount
            v-bind="field"
            :model-value="amount"
            name="amount"
            :label="$t('modals.receive.requestAmount')"
            :message="errorMessage"
            :selected-asset="selectedAsset"
            :readonly="disableAssetSelection"
            :protocol="protocol"
            @asset-selected="handleAssetChange"
          />
        </Field>
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
        {{ $t('common.share') }}
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
} from 'vue';
import { useI18n } from 'vue-i18n';
import { Field } from 'vee-validate';
import type {
  AssetContractId,
  AssetList,
  IAsset,
  IToken,
  ResolveCallback,
  Protocol,
} from '@/types';
import {
  IS_MOBILE_DEVICE,
  PROTOCOLS,
} from '@/constants';
import { RouteQueryActionsController } from '@/lib/RouteQueryActionsController';
import { useAccounts, useCopy } from '@/composables';
import { invokeDeviceShare } from '@/utils';
import {
  AE_CONTRACT_ID,
  AE_SYMBOL,
} from '@/protocols/aeternity/config';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import InputAmount from '../InputAmount.vue';
import WrappedQrCode from '../WrappedQrCode.vue';
import Scrollable from '../Scrollable.vue';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AddressFormatted from '../AddressFormatted.vue';
import CopyText from '../CopyText.vue';
import AccountItem from '../AccountItem.vue';

import ShareIcon from '../../../icons/share.svg?vue-component';

export const shareAddressRequiredProps = {
  resolve: { type: Function as PropType<ResolveCallback>, default: () => null },
  tokenContractId: { type: String as PropType<AssetContractId>, default: null },
};

export default defineComponent({
  name: 'ShareAddressBase',
  components: {
    InputAmount,
    Modal,
    WrappedQrCode,
    BtnMain,
    Scrollable,
    AddressFormatted,
    CopyText,
    AccountItem,
    Field,
  },
  props: {
    protocol: { type: String as PropType<Protocol>, required: true },
    tokenContractId: { type: String as PropType<AssetContractId>, default: null },
    tokens: { type: Object as PropType<AssetList>, default: () => ({}) },
    heading: { type: String, default: '' },
    accountAddress: { type: String, default: null },
    accountName: { type: String, default: null },
    disableAssetSelection: Boolean,
    isReceive: Boolean,
  },
  setup(props) {
    const { t } = useI18n();

    const { activeAccount } = useAccounts();
    const { copied, copy } = useCopy();

    const amount = ref<number | string>('');
    const selectedAsset = ref<IAsset | IToken | null>(null);

    function getTokenInfoQuery(account?: string): Record<string, string> {
      if (!amount.value || +amount.value <= 0) {
        return {};
      }
      const token = (selectedAsset.value?.contractId === AE_CONTRACT_ID)
        ? AE_SYMBOL
        : selectedAsset.value?.contractId || AE_SYMBOL;
      const tokenResult = { token, amount: amount.value.toString() };
      return account ? { ...tokenResult, account } : tokenResult;
    }

    function getAccountLink(address: string | undefined) {
      return address
        ? RouteQueryActionsController.createUrl('/account', 'transferSend', getTokenInfoQuery(address))
        : '';
    }

    const assetDecimals = computed(() => (
      selectedAsset.value?.decimals
      ?? ProtocolAdapterFactory.getAdapter(props.protocol).coinPrecision
    ));

    const accountAddressToCopy = computed(
      () => (amount.value && +amount.value > 0)
        ? getAccountLink(props.accountAddress)
        : props.accountAddress,
    );

    const accountAddressToDisplay = computed(
      () => (amount.value && +amount.value > 0)
        ? `${props.accountAddress}?${new URLSearchParams(getTokenInfoQuery()).toString()}`
        : props.accountAddress,
    );

    async function share() {
      const address = accountAddressToDisplay.value;
      const walletLink = getAccountLink(address);
      const { protocolName } = ProtocolAdapterFactory.getAdapter(props.protocol);
      const text = (amount.value && +amount.value > 0)
        ? t(
          'modals.receive.shareTextNoAmount',
          {
            protocolName,
            address,
            walletLink,
          },
        )
        : t(
          'modals.receive.shareTextWithAmount',
          {
            coinSymbol: ProtocolAdapterFactory.getAdapter(props.protocol).coinSymbol,
            protocolName,
            address,
            walletLink,
            amount: amount.value,
          },
        );
      await invokeDeviceShare(text);
    }

    function handleAssetChange(asset: IAsset | IToken) {
      selectedAsset.value = asset;
    }

    function copyAddress() {
      copy(accountAddressToCopy.value);
    }

    (() => {
      if (
        !props.disableAssetSelection
        && props.tokenContractId
        && props.tokens[props.tokenContractId]
      ) {
        handleAssetChange(props.tokens[props.tokenContractId]);
      }
    })();

    return {
      PROTOCOLS,
      IS_MOBILE_DEVICE,
      ShareIcon,
      amount,
      selectedAsset,
      assetDecimals,
      share,
      handleAssetChange,
      copyAddress,
      copied,
      activeAccount,
      accountAddressToDisplay,
      accountAddressToCopy,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/share-info';
@use '@/styles/mixins';

.share-address-base {
  font-weight: 500;
  color: $color-white;

  .title {
    @extend %face-sans-18-medium;

    align-self: center;
    color: $color-white;
  }

  .account-row {
    display: flex;
    justify-content: center;
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
      color: $color-white;
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
