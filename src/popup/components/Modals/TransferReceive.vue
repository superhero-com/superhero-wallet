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
        {{ isMultisig ? $t('modals.receiveMultisig.title') : $t('modals.receive.title') }}
      </h2>

      <div class="account-row">
        <AccountItem
          :address="activeAccountAddress"
          :name="isMultisig ? null : account.name"
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
          name="amount"
          :rules="{
            min_value_exclusive: 0,
          }"
        >
          <InputAmount
            v-bind="field"
            v-model="amount"
            name="amount"
            :label="$t('modals.receive.requestAmount')"
            :message="errorMessage"
            :selected-asset="selectedAsset"
            :ae-only="isMultisig"
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
import {
  computed, defineComponent, ref,
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { Field } from 'vee-validate';
import type {
  IAccount,
  IAsset,
  IToken,
  ITokenList,
} from '../../../types';
import { IS_MOBILE_DEVICE } from '../../../lib/environment';
import { useCopy, useMultisigAccounts } from '../../../composables';
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
    Field,
  },
  props: {
    defaultAmount: { type: [String, Number], default: null },
    tokenContractId: { type: [String, Number], default: null },
    isMultisig: Boolean,
  },
  setup(props) {
    const store = useStore();
    const { t } = useI18n();

    const { activeMultisigAccount } = useMultisigAccounts({ store });

    const amount = ref<number | null>(props.defaultAmount ? Number(props.defaultAmount) : null);
    const account = computed<IAccount>(() => store.getters.account);
    const activeAccountAddress = computed(() => props.isMultisig
      ? activeMultisigAccount.value?.gaAccountId
      : account.value.address);
    const availableTokens = computed<ITokenList>(
      () => store.state.fungibleTokens.availableTokens,
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
      const { address } = account.value;
      const walletLink = getAccountLink(address);
      const text = (amount.value && amount.value > 0)
        ? t('modals.receive.shareTextNoAmount', { address, walletLink })
        : t('modals.receive.shareTextWithAmount', { address, walletLink, amount: amount.value });
      await store.dispatch('share', { text });
    }

    function handleAssetChange(asset: IAsset | IToken) {
      selectedAsset.value = asset;
    }

    function closeModal() {
      store.commit('modals/closeByKey', MODAL_TRANSFER_RECEIVE);
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
      activeAccountAddress,
      account,
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
