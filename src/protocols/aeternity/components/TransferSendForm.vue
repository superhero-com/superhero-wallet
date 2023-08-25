<template>
  <TransferSendFormBase
    v-bind="$attrs"
    :transfer-data="transferData"
    :fee="+fee.toFixed()"
    :fee-symbol="AE_SYMBOL"
    :protocol="PROTOCOL_AETERNITY"
    class="transfer-send-form"
  >
    <template
      v-if="isMultisig"
      #header
    >
      <ModalHeader :title="$t('modals.multisigTxProposal.title')" />
      <InfoBox
        v-if="hasMultisigTokenWarning"
        :type="INFO_BOX_TYPES.warning"
        :text="$t('modals.multisigTxProposal.tokenWarning')"
      />
      <div class="multisig-addresses-row">
        <DetailsItem class="multisig-address-item">
          <template #label>
            <FormSelect
              v-if="multisigVaultOwnedByManyAccounts"
              :options="accountsAllowedToProposeTxSelectOptions"
              :default-text="$t('modals.multisigTxProposal.signingAccount')"
              :value="activeAccount.address"
              class="account-selector"
              persistent-default-text
              unstyled
              account-select
              @select="selectAccount($event)"
            />
            <template v-else>
              {{ $t('modals.multisigTxProposal.signingAccount') }}
            </template>
          </template>
          <template #value>
            <AccountItem
              :address="activeAccount.address"
              :protocol="activeAccount.protocol"
            />
          </template>
        </DetailsItem>

        <DetailsItem
          class="multisig-address-item"
          :label="$t('modals.multisigTxProposal.multisigVault')"
        >
          <template #value>
            <AccountItem
              :address="multisigVaultAddress"
              protocol="aeternity"
            />
          </template>
        </DetailsItem>
      </div>
    </template>

    <template #recipient>
      <TransferSendRecipient
        v-model.trim="formModel.address"
        :errors="errors"
        :is-tip-url="isTipUrl"
        :is-url-tipping-enabled="isUrlTippingEnabled"
        :placeholder="(isUrlTippingEnabled)
          ? $t('modals.send.recipientPlaceholderUrl')
          : $t('modals.send.recipientPlaceholder')"
        :validation-rules="{
          ...(isMultisig ? { not_same_as: multisigVaultAddress } : {}),
          token_to_an_address: [!isAe],
        }"
        @openQrModal="openScanQrModal"
      />
    </template>

    <template #amount>
      <TransferSendAmount
        v-model="formModel.amount"
        :custom-label="isMultisig ? $t('modals.multisigTxProposal.amount') : ''"
        :errors="errors"
        :selected-asset="formModel.selectedAsset"
        :readonly="isMultisig"
        :protocol="PROTOCOL_AETERNITY"
        :validation-rules="{
          ...+balance.minus(fee) > 0 && !isMultisig ? { max_value: max } : {},
          ...isMultisig ? { enough_ae_signer: fee.toString() } : { enough_ae: fee.toString() },
          ...+balance.minus(fee) > 0 && isMultisig
            ? { max_value_vault: activeMultisigAccount?.balance.toString() }
            : {},
          min_tip_amount: isTipUrl,
        }"
        @asset-selected="handleAssetChange"
      >
        <template #label-after>
          <BtnPlain
            v-if="!isMultisig"
            class="max-button"
            :class="{ chosen: isMaxValue }"
            @click="setMaxValue"
          >
            {{ $t('common.max') }}
          </BtnPlain>
        </template>
      </TransferSendAmount>
    </template>

    <template
      v-if="isAe"
      #extra
    >
      <div
        v-if="!(formModel.payload && formModel.payload.length)"
        class="payload-add-wrapper"
      >
        <BtnText
          :icon="PlusCircleIcon"
          :text="$t('modals.send.payload')"
          @click="editPayload"
        />
        <BtnHelp
          :title="$t('modals.payloadInfo.title')"
          :msg="$t('modals.payloadInfo.msg')"
        />
      </div>
      <PayloadDetails
        v-else
        :payload="formModel.payload"
        class="payload-details"
      >
        <div class="payload-options">
          <BtnIcon
            size="sm"
            dimmed
            :icon="EditIcon"
            @click="editPayload"
          />
          <BtnIcon
            size="sm"
            icon-variant="danger"
            dimmed
            :icon="DeleteIcon"
            @click="clearPayload"
          />
        </div>
      </PayloadDetails>
    </template>
  </TransferSendFormBase>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  PropType,
  ref,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';
import { Field } from 'vee-validate';
import BigNumber from 'bignumber.js';
import { useStore } from 'vuex';

import {
  AGGREGATOR_URL,
  MODAL_PAYLOAD_FORM,
  PROTOCOL_AETERNITY,
} from '@/constants';
import { isUrlValid } from '@/utils';
import {
  useAccounts,
  useBalances,
  useCurrencies,
  useMaxAmount,
  useModals,
  useMultisigAccounts,
} from '@/composables';
import {
  AE_CONTRACT_ID,
  AE_SYMBOL,
} from '@/protocols/aeternity/config';
import type {
  IAsset,
  IFormSelectOption,
  ITokenList,
  TransferFormModel,
} from '@/types';
import { useState } from '@/composables/vuex';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useTransferSendForm } from '@/composables/transferSendForm';
import { isAensNameValid } from '@/protocols/aeternity/helpers';

import TransferSendFormBase from '@/popup/components/TransferSendFormBase.vue';
import ModalHeader from '@/popup/components/ModalHeader.vue';
import AccountItem from '@/popup/components/AccountItem.vue';
import FormSelect from '@/popup/components/form/FormSelect.vue';
import InfoBox, { INFO_BOX_TYPES } from '@/popup/components/InfoBox.vue';
import BtnText from '@/popup/components/buttons/BtnText.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';
import BtnIcon from '@/popup/components/buttons/BtnIcon.vue';
import PayloadDetails from '@/popup/components/PayloadDetails.vue';
import BtnHelp from '@/popup/components/buttons/BtnHelp.vue';
import TransferSendRecipient from '@/popup/components/TransferSend/TransferSendRecipient.vue';
import BtnPlain from '@/popup/components/buttons/BtnPlain.vue';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';

import EditIcon from '@/icons/pencil.svg?vue-component';
import DeleteIcon from '@/icons/trash.svg?vue-component';
import PlusCircleIcon from '@/icons/plus-circle-fill.svg?vue-component';

export default defineComponent({
  name: 'AeTransferSendForm',
  components: {
    BtnPlain,
    TransferSendAmount,
    TransferSendRecipient,
    DetailsItem,
    BtnIcon,
    PayloadDetails,
    BtnHelp,
    BtnText,
    TransferSendFormBase,
    InfoBox,
    ModalHeader,
    AccountItem,
    FormSelect,
  },
  model: {
    prop: 'transferData',
  },
  props: {
    transferData: { type: Object as PropType<TransferFormModel>, required: true },
    isMultisig: Boolean,
  },
  emits: ['update:transferData', 'success', 'error'],
  setup(props, { emit }) {
    const store = useStore();
    const route = useRoute();

    const hasMultisigTokenWarning = ref(false);
    const isUrlTippingEnabled = ref(false);
    const amountField = ref<InstanceType<typeof Field> | null>(null);

    const { openModal } = useModals();
    const { activeMultisigAccount } = useMultisigAccounts({ store });
    const { balance } = useBalances({ store });
    const { marketData } = useCurrencies({ store });
    const {
      accounts,
      activeAccount,
      prepareAccountSelectOptions,
    } = useAccounts({ store });

    const fungibleTokens = useState('fungibleTokens');

    const availableTokens = computed<ITokenList>(() => fungibleTokens.value.availableTokens);

    function getSelectedAssetValue(tokenContractId?: string, selectedAsset?: IAsset) {
      const aeCoin = ProtocolAdapterFactory
        .getAdapter(PROTOCOL_AETERNITY)
        .getDefaultCoin(marketData, +balance.value);

      if (tokenContractId) {
        if (props.isMultisig && ![AE_SYMBOL, AE_CONTRACT_ID].includes(tokenContractId)) {
          hasMultisigTokenWarning.value = true;
          return undefined;
        }
        hasMultisigTokenWarning.value = false;
        return availableTokens.value[tokenContractId] || aeCoin;
      } if (!selectedAsset) {
        return aeCoin;
      }
      return undefined;
    }

    const {
      formModel,
      errors,
      hasError,
      invoiceId,
      invoiceContract,
      clearPayload,
      handleAssetChange,
      updateFormModelValues,
      openScanQrModal,
    } = useTransferSendForm({
      transferData: props.transferData,
      getSelectedAssetValue,
    });

    const { max, fee } = useMaxAmount({ formModel, store });

    const multisigVaultAddress = computed(() => activeMultisigAccount.value?.gaAccountId);

    const isAe = computed(
      () => formModel.value.selectedAsset?.contractId === AE_CONTRACT_ID,
    );

    const tokenBalances = computed(() => fungibleTokens.value.tokenBalances);

    const isTipUrl = computed(() => (
      !!formModel.value.address
      && isUrlTippingEnabled.value
      && isUrlValid(formModel.value.address)
      && !isAensNameValid(formModel.value.address)
    ));

    const isMaxValue = computed((): boolean => {
      const amountInt = +(formModel.value?.amount || 0);
      return amountInt > 0 && amountInt === +max.value;
    });

    const mySignerAccounts = accounts.value.filter(
      ({ address }) => activeMultisigAccount.value?.signers.includes(address),
    );

    /**
     * Determines if more than one of current user's accounts can approve this vault's txs.
     */
    const multisigVaultOwnedByManyAccounts = computed(() => mySignerAccounts?.length > 1);

    const accountsAllowedToProposeTxSelectOptions = computed(
      (): IFormSelectOption[] => prepareAccountSelectOptions(mySignerAccounts),
    );

    function editPayload() {
      openModal(MODAL_PAYLOAD_FORM, {
        payload: formModel.value.payload,
      }).then((text) => {
        formModel.value.payload = text;
      }).catch(() => null);
    }

    /**
     * Used only for multisig - selects signing account.
     * @param {string} val address of an account that will be selected
     */
    function selectAccount(val: string) {
      if (val) {
        store.commit(
          'accounts/setActiveIdx',
          accounts.value.find(({ address }) => address === val)?.globalIndex,
        );
        if (formModel.value.amount && amountField.value) {
          amountField.value.validate();
        }
      }
    }

    function setMaxValue() {
      const _fee = fee.value;
      formModel.value.amount = max.value;
      setTimeout(() => {
        if (_fee !== fee.value) {
          formModel.value.amount = max.value;
        }
      },
      100);
    }

    function emitCurrentFormModelState() {
      const inputPayload: TransferFormModel = {
        ...formModel.value,
        fee: fee.value as BigNumber,
        total: (isAe.value ? +fee.value.toFixed() : 0) + +(formModel.value?.amount || 0),
        invoiceId: invoiceId.value,
        invoiceContract: invoiceContract.value,
      };
      emit('update:transferData', inputPayload);
      return nextTick();
    }

    // Method called from a parent scope - avoid changing its name.
    async function submit() {
      if (!hasError.value) {
        await emitCurrentFormModelState();
        emit('success');
      }
    }

    watch(
      hasError,
      (val) => emit('error', val),
      { deep: true },
    );

    watch(
      formModel,
      () => {
        emitCurrentFormModelState();
      },
      { deep: true },
    );

    watch(
      activeAccount,
      () => {
        if (
          props.isMultisig
          && !activeMultisigAccount.value?.signers.includes(activeAccount.value.address)
        ) {
          store.commit('accounts/setActiveIdx', mySignerAccounts[0].globalIndex);
        }

        const { query } = route;
        const slicedAggregatorUrl = AGGREGATOR_URL.endsWith('/') ? AGGREGATOR_URL.slice(0, -1) : AGGREGATOR_URL;
        if ([query['x-success'], query['x-cancel']].every((value) => value && (value as string).startsWith(slicedAggregatorUrl))) {
          isUrlTippingEnabled.value = true;
        }
        updateFormModelValues({
          ...query,
          token: query.token || formModel.value?.selectedAsset?.contractId,
        });
      },
      { deep: true, immediate: true },
    );

    return {
      INFO_BOX_TYPES,
      AE_SYMBOL,
      PROTOCOL_AETERNITY,
      isAe,
      hasMultisigTokenWarning,
      multisigVaultAddress,
      activeMultisigAccount,
      multisigVaultOwnedByManyAccounts,
      accountsAllowedToProposeTxSelectOptions,
      formModel,
      isUrlTippingEnabled,
      fee,
      max,
      errors,
      balance,
      isTipUrl,
      isMaxValue,
      activeAccount,
      editPayload,
      clearPayload,
      openScanQrModal: () => openScanQrModal(tokenBalances.value),
      handleAssetChange,
      selectAccount,
      setMaxValue,
      submit,
      EditIcon,
      DeleteIcon,
      PlusCircleIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.transfer-send-form {
  .multisig-addresses-row {
    display: flex;
    gap: 4px;
    margin-top: 16px;

    .multisig-address-item {
      width: 50%;
      margin-bottom: 0;
    }

    .multisig-select-account {
      appearance: none; // Temporary solution that removes any styling from <select>
      padding: 0;
      color: inherit;
      background: none;
      border: none;
      font: inherit;
      outline: none;

      &:hover {
        color: variables.$color-white;
      }
    }
  }

  .account-selector {
    color: rgba(variables.$color-white, 0.75);
  }

  .max-button {
    padding: 2px 8px;
    color: variables.$color-primary;

    @extend %face-sans-14-medium;

    line-height: 20px;
    border: 2px solid transparent;
    border-radius: 12px;

    &:hover {
      background: rgba(variables.$color-primary, 0.15);
    }

    &.chosen {
      background: rgba(variables.$color-primary, 0.15);
      border-color: rgba(variables.$color-primary, 0.5);
    }
  }

  .payload-add-wrapper {
    display: flex;
    align-items: center;
    margin-bottom: 22px;

    .btn-help {
      display: flex;
      margin-left: 4px;
    }
  }

  .payload-details {
    margin-bottom: 24px;
  }

  .payload-options {
    display: flex;
    gap: 4px;
  }
}
</style>
