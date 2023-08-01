<template>
  <div class="transfer-send-form">
    <template v-if="isMultisig">
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
            <AccountItem :address="activeAccount.address" />
          </template>
        </DetailsItem>

        <DetailsItem
          class="multisig-address-item"
          :label="$t('modals.multisigTxProposal.multisigVault')"
        >
          <template #value>
            <AccountItem :address="multisigVaultAddress" />
          </template>
        </DetailsItem>
      </div>
    </template>
    <template v-else>
      <ModalHeader :title="$t('modals.send.sendTitle')" />
      <div class="account-row">
        <AccountItem
          :address="activeAccount.address"
          :name="activeAccount.name"
          size="md"
        />
      </div>
    </template>

    <Field
      v-slot="{ field }"
      name="address"
      :rules="{
        required: true,
        not_same_as: isMultisig? multisigVaultAddress : activeAccount.address,
        name_registered_address_or_url: isUrlTippingEnabled,
        name_registered_address: !isUrlTippingEnabled,
        token_to_an_address: [ !isAe ],
      }"
    >
      <InputField
        v-bind="field"
        v-model.trim="formModel.address"
        name="address"
        data-cy="address"
        show-help
        show-message-help
        :label="$t('modals.send.recipientLabel')"
        :placeholder="(isUrlTippingEnabled)
          ? $t('modals.send.recipientPlaceholderUrl')
          : $t('modals.send.recipientPlaceholder')"
        :message="addressMessage"
        @help="showRecipientHelp()"
      >
        <template #label-after>
          <a
            class="scan-button"
            data-cy="scan-button"
            @click="openScanQrModal"
          >
            <QrScanIcon />
          </a>
        </template>
      </InputField>
    </Field>
    <div class="status">
      <UrlStatus
        v-show="isTipUrl"
        :status="urlStatus"
      />
    </div>

    <Field
      v-slot="{ field }"
      ref="amountField"
      v-model="formModel.amount"
      name="amount"
      :rules="{
        required: true,
        min_value_exclusive: 0,
        ...+balance.minus(fee) > 0 && !isMultisig ? { max_value: max } : {},
        ...isMultisig ? { enough_ae_signer: fee.toString() } : { enough_ae: fee.toString() },
        ...+balance.minus(fee) > 0 && isMultisig
          ? { max_value_vault: activeMultisigAccount?.balance.toString() }
          : {},
        min_tip_amount: isTipUrl,
      }"
    >
      <InputAmount
        v-bind="field"
        :model-value="formModel.amount"
        name="amount"
        data-cy="amount"
        class="amount-input"
        show-tokens-with-balance
        :ae-only="isMultisig"
        :label="isMultisig ? $t('modals.multisigTxProposal.amount') : $t('common.amount')"
        :message="amountMessage"
        :selected-asset="formModel.selectedAsset"
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
      </InputAmount>
    </Field>

    <template v-if="isAe">
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

    <DetailsItem :label="$t('transaction.fee')">
      <template #value>
        <TokenAmount
          :amount="+fee.toFixed()"
          symbol="AE"
          data-cy="review-fee"
        />
      </template>
    </DetailsItem>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  ref,
  watch,
  PropType,
  nextTick,
} from 'vue';
import BigNumber from 'bignumber.js';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useForm, Field } from 'vee-validate';
import type {
  Dictionary,
  IFormSelectOption,
  IInputMessage,
  IToken,
  ITokenList,
} from '@/types';
import {
  isUrlValid,
  toShiftedBigNumber,
} from '@/utils';
import {
  MODAL_READ_QR_CODE,
  MODAL_RECIPIENT_INFO,
  MODAL_PAYLOAD_FORM,
  AGGREGATOR_URL,
  APP_LINK_WEB,
} from '@/popup/utils';
import {
  useAccounts,
  useBalances,
  useMaxAmount,
  useModals,
  useMultisigAccounts,
} from '@/composables';
import { useState } from '@/composables/vuex';
import { AE_CONTRACT_ID, AE_SYMBOL } from '@/protocols/aeternity/config';
import { isAensNameValid } from '@/protocols/aeternity/helpers';

import { TransferFormModel } from './Modals/TransferSend.vue';
import InputField from './InputField.vue';
import InputAmount from './InputAmount.vue';
import BtnPlain from './buttons/BtnPlain.vue';
import BtnHelp from './buttons/BtnHelp.vue';
import BtnText from './buttons/BtnText.vue';
import BtnIcon from './buttons/BtnIcon.vue';
import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';
import ModalHeader from './ModalHeader.vue';
import UrlStatus from './UrlStatus.vue';
import PayloadDetails from './PayloadDetails.vue';
import AccountItem from './AccountItem.vue';
import FormSelect from './form/FormSelect.vue';
import InfoBox, { INFO_BOX_TYPES } from './InfoBox.vue';

import QrScanIcon from '../../icons/qr-scan.svg?vue-component';
import EditIcon from '../../icons/pencil.svg?vue-component';
import DeleteIcon from '../../icons/trash.svg?vue-component';
import PlusCircleIcon from '../../icons/plus-circle-fill.svg?vue-component';

export default defineComponent({
  name: 'TransferSendForm',
  components: {
    InfoBox,
    BtnText,
    BtnHelp,
    BtnIcon,
    BtnPlain,
    PayloadDetails,
    ModalHeader,
    AccountItem,
    InputField,
    InputAmount,
    DetailsItem,
    TokenAmount,
    FormSelect,
    UrlStatus,
    QrScanIcon,
    Field,
  },
  model: {
    prop: 'transferData',
  },
  props: {
    transferData: { type: Object as PropType<TransferFormModel>, required: true },
    isMultisig: Boolean,
  },
  setup(props, { emit }) {
    const store = useStore();
    const route = useRoute();
    const { t } = useI18n();

    const { validate, errors } = useForm();

    const WARNING_RULES_WORDING = [t('validation.notSameAs'), t('validation.enoughAeSigner')];

    const invoiceId = ref(null);
    const invoiceContract = ref(null);
    const formModel = ref<TransferFormModel>(props.transferData);
    const loading = ref<boolean>(false);
    const error = ref<boolean>(false);
    const isUrlTippingEnabled = ref<boolean>(false);
    const amountField = ref<InstanceType<typeof Field> | null>(null);
    const hasMultisigTokenWarning = ref(false);

    const { max, fee } = useMaxAmount({ formModel, store });
    const { balance, aeternityCoin } = useBalances({ store });
    const { activeMultisigAccount } = useMultisigAccounts({ store });
    const { openModal, openDefaultModal } = useModals();
    const {
      accounts,
      activeAccount,
      prepareAccountSelectOptions,
    } = useAccounts({ store });

    const fungibleTokens = useState('fungibleTokens');
    const availableTokens = computed<ITokenList>(() => fungibleTokens.value.availableTokens);
    const tokenBalances = computed(() => fungibleTokens.value.tokenBalances);

    function getMessageByFieldName(fieldName: string): IInputMessage {
      if (!errors.value) return { status: 'success' };
      const items = errors.value[fieldName as keyof typeof errors.value];
      if (items && WARNING_RULES_WORDING.includes(items)) {
        return { status: 'warning', text: items };
      }
      if (items) {
        return { status: 'error', text: items };
      }
      return { status: 'success' };
    }
    const amountMessage = computed(() => getMessageByFieldName('amount'));

    const urlStatus = computed(
      () => store.getters['tipUrl/status'](formModel.value.address),
    );
    const isTipUrl = computed(() => (
      !!formModel.value.address
      && isUrlTippingEnabled.value
      && isUrlValid(formModel.value.address)
      && !isAensNameValid(formModel.value.address)
    ));

    const addressMessage = computed((): IInputMessage => {
      if (isTipUrl.value) {
        switch (urlStatus.value) {
          case 'verified': return { status: 'success', text: '', hideMessage: true };
          case 'not-secure': return { status: 'warning', text: '', hideMessage: true };
          case 'not-verified': return { status: 'warning', text: '', hideMessage: true };
          case 'blacklisted': return { status: 'error', text: '', hideMessage: true };
          default:
            throw new Error(`Unknown url status: ${urlStatus.value}`);
        }
      }
      return getMessageByFieldName('address');
    });

    const hasError = computed((): boolean => (
      amountMessage.value.status === 'error' || addressMessage.value.status === 'error'
    ));
    const isAe = computed(
      () => formModel.value.selectedAsset?.contractId === AE_CONTRACT_ID,
    );
    const isMaxValue = computed((): boolean => {
      const amountInt = +(formModel.value?.amount || 0);
      return amountInt > 0 && amountInt === +max.value;
    });

    const multisigVaultAddress = computed(() => activeMultisigAccount.value?.gaAccountId);

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

    function selectAccount(val: string) {
      if (val) {
        store.commit(
          'accounts/setActiveIdx',
          accounts.value.find(({ address }) => address === val)?.idx,
        );
        if (formModel.value.amount && amountField.value) {
          amountField.value.validate();
        }
      }
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

    function updateFormModelValues({
      account,
      amount,
      payload,
      token,
    }: Dictionary) {
      if (token) {
        if (props.isMultisig && ![AE_SYMBOL, AE_CONTRACT_ID].includes(token)) {
          hasMultisigTokenWarning.value = true;
        } else {
          formModel.value.selectedAsset = availableTokens.value[token] || aeternityCoin.value;
          hasMultisigTokenWarning.value = false;
        }
      } else if (!formModel.value.selectedAsset) {
        formModel.value.selectedAsset = aeternityCoin.value;
      }

      if (account) {
        formModel.value.address = account;
      }
      if (amount) {
        formModel.value.amount = amount;
      }
      if (payload) {
        formModel.value.payload = payload;
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

    // Method called from a parent scope - avoid changing its name.
    async function submit() {
      if (!hasError.value) {
        await emitCurrentFormModelState();
        emit('success');
      }
    }

    function showRecipientHelp() {
      openModal(MODAL_RECIPIENT_INFO);
    }

    function handleAssetChange(selectedAsset: IToken) {
      formModel.value.selectedAsset = selectedAsset;
    }

    async function openScanQrModal() {
      const scanResult = await openModal(MODAL_READ_QR_CODE, {
        title: t('pages.send.scanAddress'),
        icon: 'critical',
      });
      if (scanResult?.trim().charAt(0) === '{') {
        let parsedScanResult: any = null;
        try {
          parsedScanResult = JSON.parse(scanResult);
        } catch (e) {
          // eslint-disable-next-line no-console
          if (process.env.NODE_ENV !== 'production') console.error(e);
          formModel.value.address = undefined;
          openDefaultModal({
            title: t('modals.invalid-qr-code.msg'),
            icon: 'critical',
          });
          return;
        }
        // does user have the requested tokens?
        const requestedTokenBalance = tokenBalances.value
          .find(({ value }: any) => value === parsedScanResult.tokenContract);
        if (!requestedTokenBalance) {
          formModel.value.address = undefined;
          openDefaultModal({ msg: t('modals.insufficient-balance.msg') });
          return;
        }

        // select requested token
        formModel.value.selectedAsset = tokenBalances.value
          .find(({ value }: any) => value === parsedScanResult.tokenContract);

        // SET result data
        formModel.value.address = parsedScanResult.tokenContract;
        formModel.value.amount = toShiftedBigNumber(
          parsedScanResult.amount,
          -(formModel.value.selectedAsset as IToken)?.decimals,
        ).toString();
        invoiceId.value = parsedScanResult.invoiceId;
        invoiceContract.value = parsedScanResult.invoiceContract;
        await validate();
      } else {
        if (!scanResult) return;
        updateFormModelValues([
          ...new URL(
            scanResult.startsWith('ak_')
              ? `${APP_LINK_WEB}/account?account=${scanResult.replace('?', '&')}`
              : scanResult,
          )
            .searchParams.entries(),
        ].reduce((o, [k, v]) => ({ ...o, [k]: v }), {}));
        invoiceId.value = null;
      }
      if (!formModel.value.address) formModel.value.address = undefined;
    }

    function editPayload() {
      openModal(MODAL_PAYLOAD_FORM, {
        payload: formModel.value.payload,
      }).then((text) => {
        formModel.value.payload = text;
      }).catch(() => null);
    }

    function clearPayload() {
      formModel.value.payload = '';
    }

    watch(
      () => hasError.value,
      (val) => emit('error', val),
      { deep: true },
    );

    watch(
      () => formModel.value,
      () => emitCurrentFormModelState(),
      { deep: true },
    );

    watch(
      activeAccount,
      () => {
        if (
          props.isMultisig
          && !activeMultisigAccount.value?.signers.includes(activeAccount.value.address)
        ) {
          store.commit('accounts/setActiveIdx', mySignerAccounts[0].idx);
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
      EditIcon,
      DeleteIcon,
      PlusCircleIcon,
      isAe,
      isMaxValue,
      invoiceId,
      invoiceContract,
      formModel,
      loading,
      error,
      amountMessage,
      availableTokens,
      activeAccount,
      accounts,
      accountsAllowedToProposeTxSelectOptions,
      urlStatus,
      isTipUrl,
      addressMessage,
      hasError,
      multisigVaultAddress,
      multisigVaultOwnedByManyAccounts,
      activeMultisigAccount,
      isUrlTippingEnabled,
      hasMultisigTokenWarning,
      amountField,
      balance,
      fee,
      max,
      openScanQrModal,
      selectAccount,
      setMaxValue,
      showRecipientHelp,
      handleAssetChange,
      submit,
      editPayload,
      clearPayload,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

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

  .account-row {
    display: flex;
    justify-content: center;
  }

  .account-selector {
    color: rgba(variables.$color-white, 0.75);
  }

  .scan-button {
    color: variables.$color-white;
    display: block;
    width: 32px;
    height: 24px;
  }

  .amount-input {
    margin-bottom: 22px;
  }

  .status {
    margin-top: 9px;
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
