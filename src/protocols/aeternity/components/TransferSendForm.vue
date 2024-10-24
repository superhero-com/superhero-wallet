<template>
  <TransferSendFormBase
    v-bind="$attrs"
    :transfer-data="transferData"
    :fee="+fee.toFixed()"
    :fee-symbol="AE_SYMBOL"
    :protocol="PROTOCOLS.aeternity"
    :custom-title="isActiveAccountAirGap ? $t('airGap.send.title') : undefined"
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
              :address="(multisigVaultAddress as string)"
              :protocol="PROTOCOLS.aeternity"
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
        :protocol="PROTOCOLS.aeternity"
        :placeholder="(isUrlTippingEnabled)
          ? $t('modals.send.recipientPlaceholderUrl')
          : $t('modals.send.recipientPlaceholder')"
        :validation-rules="{
          aens_name_registered_or_address_or_url: isUrlTippingEnabled,
          aens_name_registered_or_address: !isUrlTippingEnabled,
          ...(isMultisig
            ? { address_not_same_as: [multisigVaultAddress, PROTOCOLS.aeternity] }
            : {}),
          token_to_an_address: [!isAe],
          airgap_to_an_address: isActiveAccountAirGap,
        }"
        @openQrModal="scanTransferQrCode()"
      />
    </template>

    <template #amount>
      <TransferSendAmount
        v-model="formModel.amount"
        :custom-label="isMultisig ? $t('modals.multisigTxProposal.amount') : ''"
        :errors="errors"
        :selected-asset="formModel.selectedAsset"
        :readonly="isMultisig"
        :protocol="PROTOCOLS.aeternity"
        :blink-on-change="shouldUseMaxAmount"
        :validation-rules="{
          ...+balance.minus(fee) > 0 && !isMultisig ? { max_value: max } : {},
          ...isMultisig ? { enough_ae_signer: fee.toString() } : { enough_coin: fee.toString() },
          ...+balance.minus(fee) > 0 && isMultisig
            ? { max_value_vault: activeMultisigAccount?.balance.toString() }
            : {},
          ae_min_tip_amount: isTipUrl,
        }"
        @update:model-value="shouldUseMaxAmount = false"
        @asset-selected="handleAssetChange"
      >
        <template #label-after>
          <BtnMaxAmount
            v-if="!isMultisig"
            :is-max="shouldUseMaxAmount"
            @click="toggleMaxAmount"
          />
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
import { Encoded, isNameValid } from '@aeternity/aepp-sdk';

import type {
  AssetContractId,
  IAsset,
  IFormSelectOption,
  TransferFormModel,
} from '@/types';
import {
  MODAL_PAYLOAD_FORM,
  PROTOCOLS,
} from '@/constants';
import {
  checkIfSuperheroCallbackUrl,
  isUrlValid,
  prepareAccountSelectOptions,
} from '@/utils';
import {
  useAccounts,
  useBalances,
  useCurrencies,
  useAccountAssetsList,
  useMaxAmount,
  useModals,
  useMultisigAccounts,
} from '@/composables';
import {
  AE_CONTRACT_ID,
  AE_SYMBOL,
} from '@/protocols/aeternity/config';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { useTransferSendForm } from '@/composables/transferSendForm';

import { type PayloadFormResolvedVal } from '@/popup/components/Modals/PayloadForm.vue';

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
import BtnMaxAmount from '@/popup/components/buttons/BtnMaxAmount.vue';
import TransferSendAmount from '@/popup/components/TransferSend/TransferSendAmount.vue';

import EditIcon from '@/icons/pencil.svg?vue-component';
import DeleteIcon from '@/icons/trash.svg?vue-component';
import PlusCircleIcon from '@/icons/plus-circle-fill.svg?vue-component';

export default defineComponent({
  name: 'AeTransferSendForm',
  components: {
    BtnMaxAmount,
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
  emits: [
    'update:transferData',
    'success',
    'error',
  ],
  setup(props, { emit }) {
    const route = useRoute();

    const shouldUseMaxAmount = ref(false);
    const hasMultisigTokenWarning = ref(false);
    const isUrlTippingEnabled = ref(false);
    const amountField = ref<InstanceType<typeof Field> | null>(null);

    const { openModal } = useModals();
    const { activeMultisigAccount } = useMultisigAccounts();
    const { balance } = useBalances();
    const { marketData } = useCurrencies();
    const {
      accounts,
      activeAccount,
      isActiveAccountAirGap,
      setActiveAccountByGlobalIdx,
      setActiveAccountByAddress,
    } = useAccounts();

    const { accountAssets } = useAccountAssetsList();

    function getSelectedAssetValue(assetContractId?: AssetContractId, selectedAsset?: IAsset) {
      const aeCoin = ProtocolAdapterFactory
        .getAdapter(PROTOCOLS.aeternity)
        .getDefaultCoin(marketData.value!, +balance.value);

      if (assetContractId) {
        if (props.isMultisig && ![AE_SYMBOL, AE_CONTRACT_ID].includes(assetContractId)) {
          hasMultisigTokenWarning.value = true;
          return undefined;
        }
        hasMultisigTokenWarning.value = false;
        return accountAssets.value.find((asset) => asset.contractId === assetContractId) || aeCoin;
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
      scanTransferQrCode,
    } = useTransferSendForm({
      transferData: props.transferData,
      getSelectedAssetValue,
    });

    const {
      gasPrice,
      gasUsed,
      max,
      fee,
      total,
    } = useMaxAmount({
      formModel,
      multisigVault: props.isMultisig ? activeMultisigAccount.value : undefined,
    });

    const multisigVaultAddress = computed(() => activeMultisigAccount.value?.gaAccountId);

    const isAe = computed(
      () => formModel.value.selectedAsset?.contractId === AE_CONTRACT_ID,
    );

    const isTipUrl = computed(() => (
      !!formModel.value.address
      && isUrlTippingEnabled.value
      && isUrlValid(formModel.value.address)
      && !isNameValid(formModel.value.address)
    ));

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

    async function editPayload() {
      try {
        formModel.value.payload = await openModal<PayloadFormResolvedVal>(
          MODAL_PAYLOAD_FORM,
          { payload: formModel.value.payload },
        );
      } catch (error) { /* NOOP */ }
    }

    /**
     * Used only for multisig - selects signing account.
     */
    function selectAccount(address: Encoded.AccountAddress) {
      if (address) {
        setActiveAccountByAddress(address);
        if (formModel.value.amount && amountField.value) {
          amountField.value.validate();
        }
      }
    }

    function toggleMaxAmount() {
      shouldUseMaxAmount.value = !shouldUseMaxAmount.value;
      if (shouldUseMaxAmount.value) {
        formModel.value.amount = max.value;
      }
    }

    function emitCurrentFormModelState() {
      const inputPayload: TransferFormModel = {
        ...formModel.value,
        gasPrice: gasPrice.value,
        gasUsed: gasUsed.value,
        fee: fee.value as BigNumber,
        total: +total.value.toFixed(),
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
      max,
      (newMax) => {
        if (shouldUseMaxAmount.value) {
          formModel.value.amount = newMax;
        }
      },
    );

    watch(
      activeAccount,
      () => {
        if (
          props.isMultisig
          && !activeMultisigAccount.value?.signers.includes(activeAccount.value.address)
        ) {
          setActiveAccountByGlobalIdx(mySignerAccounts[0].globalIdx);
        }

        const { query } = route;

        if (checkIfSuperheroCallbackUrl(query)) {
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
      PROTOCOLS,
      isAe,
      shouldUseMaxAmount,
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
      activeAccount,
      isActiveAccountAirGap,
      editPayload,
      clearPayload,
      scanTransferQrCode,
      handleAssetChange,
      toggleMaxAmount,
      selectAccount,
      submit,
      EditIcon,
      DeleteIcon,
      PlusCircleIcon,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

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
        color: $color-white;
      }
    }
  }

  .account-selector {
    color: rgba($color-white, 0.75);
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
