<template>
  <Modal
    class="transfer-receive-base"
    has-close-button
    from-bottom
    @close="resolve()"
  >
    <div
      class="transfer-receive"
      data-cy="top-up-container"
    >
      <h2
        class="text-heading-2 text-center"
        v-text="heading"
      />

      <div class="account-row">
        <AccountItem
          :address="accountAddress"
          :name="accountName"
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
        <Field
          v-slot="{ field, errorMessage }"
          v-model="amount"
          name="amount"
          :rules="{
            min_value_exclusive: 0,
          }"
        >
          <InputAmount
            v-bind="field"
            :model-value="amount"
            name="amount"
            :label="$t('modals.receive.requestAmount')"
            :message="errorMessage"
            :selected-asset="selectedAsset"
            :ae-only="disableAssetSelection"
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
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { Field } from 'vee-validate';
import type {
  IAsset,
  IToken,
  ITokenList,
  ResolveCallback,
} from '@/types';
import { IS_MOBILE_DEVICE } from '@/config';
import { RouteQueryActionsController } from '@/lib/RouteQueryActionsController';
import { useAccounts, useCopy } from '@/composables';
import {
  AE_CONTRACT_ID,
  AE_SYMBOL,
} from '@/protocols/aeternity/config';

import InputAmount from '../InputAmount.vue';
import QrCode from '../QrCode.vue';
import Scrollable from '../Scrollable.vue';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AddressFormatted from '../AddressFormatted.vue';
import CopyText from '../CopyText.vue';
import AccountItem from '../AccountItem.vue';

import ShareIcon from '../../../icons/share.svg?vue-component';

export default defineComponent({
  name: 'TransferReceiveBase',
  components: {
    InputAmount,
    Modal,
    QrCode,
    BtnMain,
    Scrollable,
    AddressFormatted,
    CopyText,
    AccountItem,
    Field,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, default: () => null },
    tokenContractId: { type: [String, Number], default: null },
    heading: { type: String, default: '' },
    accountAddress: { type: String, default: null },
    accountName: { type: String, default: null },
    tokens: { type: Object as PropType<ITokenList>, default: () => ({}) },
    disableAssetSelection: Boolean,
  },
  setup(props) {
    const store = useStore();
    const { t } = useI18n();

    const { activeAccount } = useAccounts({ store });
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
      const { address } = activeAccount.value;
      const walletLink = getAccountLink(address);
      const text = (amount.value && +amount.value > 0)
        ? t('modals.receive.shareTextNoAmount', { address, walletLink })
        : t('modals.receive.shareTextWithAmount', { address, walletLink, amount: amount.value });
      await store.dispatch('share', { text });
    }

    function handleAssetChange(asset: IAsset | IToken) {
      selectedAsset.value = asset;
    }

    function copyAddress() {
      copy(accountAddressToCopy.value);
    }

    (() => {
      if (props.tokenContractId && props.tokens[props.tokenContractId]) {
        handleAssetChange(props.tokens[props.tokenContractId]);
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

.transfer-receive-base {
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
