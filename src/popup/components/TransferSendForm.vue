<template>
  <div class="transfer-send-form">
    <template v-if="isMultisig">
      <ModalHeader :title="$t('modals.multisigTxProposal.title')" />
      <div class="multisig-addresses-row">
        <DetailsItem
          class="multisig-address-item"
        >
          <template #label>
            <FormSelect
              v-if="multisigVaultOwnedByManyAccounts"
              :options="accountsAllowedToProposeTxSelectOptions"
              :default-text="$t('modals.multisigTxProposal.signingAccount')"
              class="account-selector"
              persistent-default-text
              unstyled
              @select="selectAccount($event)"
            />
            <template v-else>
              {{ $t('modals.multisigTxProposal.signingAccount') }}
            </template>
          </template>
          <template #value>
            <AccountItem
              :address="account.address"
            />
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
          :address="account.address"
          :name="account.name"
          size="md"
        />
      </div>
    </template>

    <InputField
      v-model.trim="formModel.address"
      v-validate="{
        required: true,
        not_same_as: isMultisig? multisigVaultAddress : account.address,
        name_registered_address_or_url: true,
        token_to_an_address: { isToken: !isAe },
      }"
      name="address"
      data-cy="address"
      show-help
      show-message-help
      :label="$t('modals.send.recipientLabel')"
      :placeholder="isMultisig
        ? $t('modals.send.recipientPlaceholder')
        : $t('modals.send.recipientPlaceholderUrl')"
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
    <div class="status">
      <UrlStatus
        v-show="isTipUrl"
        :status="urlStatus"
      />
    </div>

    <InputAmount
      v-model="formModel.amount"
      v-validate="{
        required: true,
        min_value_exclusive: 0,
        ...+balance.minus(fee) > 0 && !isMultisig ? { max_value: max } : {},
        ...isMultisig ? {} : { enough_ae: fee.toString() },
        ...isMultisig ? { max_value_vault: activeMultisigAccount.balance.toString() } : {},
        min_tip_amount: isTipUrl,
      }"
      name="amount"
      data-cy="amount"
      class="amount-input"
      show-tokens-with-balance
      :ae-only="isMultisig"
      :label="isMultisig ? $t('modals.multisigTxProposal.amount') : $t('pages.send.amount')"
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
          MAX
        </BtnPlain>
      </template>
    </InputAmount>

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
  onMounted,
  PropType,
  nextTick,
} from '@vue/composition-api';
import BigNumber from 'bignumber.js';
import type {
  IAccount,
  IFormSelectOption,
  IInputMessage,
  IToken,
  ITokenList,
} from '../../types';
import {
  MODAL_DEFAULT,
  MODAL_READ_QR_CODE,
  MODAL_RECIPIENT_INFO,
  MODAL_PAYLOAD_FORM,
  AETERNITY_CONTRACT_ID,
  convertToken,
  validateTipUrl,
  checkAensName,
  getAccountNameToDisplay,
} from '../utils';
import {
  useBalances,
  useMaxAmount,
  useMultisigAccounts,
} from '../../composables';
import { useState, useGetter } from '../../composables/vuex';
import { TransferFormModel } from './Modals/TransferSend.vue';
import InputField from './InputField.vue';
import InputAmount from './InputAmountV2.vue';
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

import QrScanIcon from '../../icons/qr-scan.svg?vue-component';
import EditIcon from '../../icons/pencil.svg?vue-component';
import DeleteIcon from '../../icons/trash.svg?vue-component';
import PlusCircleIcon from '../../icons/plus-circle-fill.svg?vue-component';

const WARNING_RULES = ['not_same_as', 'max_value_vault'];

export default defineComponent({
  name: 'TransferSendForm',
  components: {
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
  },
  model: {
    prop: 'transferData',
  },
  props: {
    transferData: { type: Object as PropType<TransferFormModel>, required: true },
    isMultisig: Boolean,
  },
  setup(props, { root, emit }) {
    const invoiceId = ref(null);
    const invoiceContract = ref(null);
    const formModel = ref<TransferFormModel>(props.transferData);
    const loading = ref<boolean>(false);
    const error = ref<boolean>(false);

    const { max, fee } = useMaxAmount({ formModel, store: root.$store });
    const { balance, balanceCurrency } = useBalances({ store: root.$store });
    const { activeMultisigAccount } = useMultisigAccounts({ store: root.$store });

    const account = useGetter<IAccount>('account');
    const accounts = useGetter<IAccount[]>('accounts');
    const fungibleTokens = useState('fungibleTokens');
    const availableTokens = computed<ITokenList>(() => fungibleTokens.value.availableTokens);
    const tokenBalances = computed(() => fungibleTokens.value.tokenBalances);
    const getAeternityToken = computed(() => root.$store.getters['fungibleTokens/getAeternityToken']);

    function getMessageByFieldName(fieldName: string): IInputMessage {
      const warning = (root as any).errors.items
        .filter(({ field }: any) => field === fieldName)
        .find((_error: any) => WARNING_RULES.includes(_error.rule))?.msg || null;
      if (warning) return { status: 'warning', text: warning };
      const _error = (root as any).errors.items
        .filter(({ field }: any) => field === fieldName)
        .filter(({ rule }: any) => !WARNING_RULES.includes(rule))[0]?.msg || null;
      if (_error) return { status: 'error', text: _error };
      return { status: 'success' };
    }
    const amountMessage = computed(() => getMessageByFieldName('amount'));

    const urlStatus = computed(
      () => root.$store.getters['tipUrl/status'](formModel.value.address),
    );
    const isTipUrl = computed(() => (
      !!formModel.value.address
      && validateTipUrl(formModel.value.address)
      && !checkAensName(formModel.value.address)
    ));

    const addressMessage = computed((): IInputMessage => {
      if (isTipUrl.value) {
        switch (urlStatus.value) {
          case 'verified': return { status: 'success', text: ' ', hideMessage: true };
          case 'not-secure': return { status: 'warning', text: ' ', hideMessage: true };
          case 'not-verified': return { status: 'warning', text: ' ', hideMessage: true };
          case 'blacklisted': return { status: 'error', text: ' ', hideMessage: true };
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
      () => formModel.value.selectedAsset?.contractId === AETERNITY_CONTRACT_ID,
    );
    const isMaxValue = computed<boolean>(() => {
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
      (): IFormSelectOption[] => mySignerAccounts
        .map((acc): IFormSelectOption => ({
          text: getAccountNameToDisplay(acc),
          value: acc.address,
          address: acc.address,
        })),
    );

    function selectAccount(val: string) {
      if (val) {
        root.$store.commit(
          'accounts/setActiveIdx',
          accounts.value.find(({ address }) => address === val)?.idx,
        );
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
      emit('input', inputPayload);
      return nextTick();
    }

    async function queryHandler(query: any) {
      formModel.value.selectedAsset = availableTokens.value[query.token]
        || getAeternityToken.value({
          tokenBalance: balance.value,
          balanceCurrency: balanceCurrency.value,
        });
      if (query.account) formModel.value.address = query.account;
      if (query.amount) formModel.value.amount = query.amount;
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
      const isValid = !(await (root as any).$validator._base.anyExcept('address', WARNING_RULES));
      if (isValid) {
        await emitCurrentFormModelState();
        emit('success');
      }
    }

    function showRecipientHelp() {
      root.$store.dispatch('modals/open', {
        name: MODAL_RECIPIENT_INFO,
      });
    }

    function handleAssetChange(selectedAsset: IToken) {
      formModel.value.selectedAsset = selectedAsset;
    }

    async function openScanQrModal() {
      const scanResult = await root.$store.dispatch('modals/open', {
        name: MODAL_READ_QR_CODE,
        title: root.$t('pages.send.scanAddress'),
        icon: 'critical',
      });
      if (scanResult?.trim().charAt(0) === '{') {
        let parsedScanResult: any = null;
        try {
          parsedScanResult = JSON.parse(scanResult);
        } catch (e) {
          // eslint-disable-next-line no-console
          if (process.env.NODE_ENV !== 'production') console.error(e);
          formModel.value.address = '';
          root.$store.dispatch('modals/open', {
            name: MODAL_DEFAULT,
            title: root.$t('modals.invalid-qr-code.msg'),
            icon: 'critical',
          });
          return;
        }
        // does user have the requested tokens?
        const requestedTokenBalance = tokenBalances.value
          .find(({ value }: any) => value === parsedScanResult.tokenContract);
        if (!requestedTokenBalance) {
          formModel.value.address = '';
          root.$store.dispatch('modals/open', { name: MODAL_DEFAULT, type: 'insufficient-balance' });
          formModel.value.address = '';
          return;
        }

        // select requested token
        formModel.value.selectedAsset = tokenBalances.value
          .find(({ value }: any) => value === parsedScanResult.tokenContract);

        // SET result data
        formModel.value.address = parsedScanResult.tokenContract;
        formModel.value.amount = +convertToken(
          parsedScanResult.amount,
          -(formModel.value.selectedAsset as IToken)?.decimals,
        );
        invoiceId.value = parsedScanResult.invoiceId;
        invoiceContract.value = parsedScanResult.invoiceContract;
        await (root as any).validate();
      } else {
        if (!scanResult) return;
        if (scanResult.startsWith('ak_')) formModel.value.address = scanResult;
        else {
          queryHandler([
            ...new URL(scanResult).searchParams.entries(),
          ].reduce((o, [k, v]) => ({ ...o, [k]: v }), {}));
        }
        invoiceId.value = null;
      }
      if (!formModel.value.address) formModel.value.address = '';
    }

    function editPayload() {
      root.$store.dispatch('modals/open', {
        name: MODAL_PAYLOAD_FORM,
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
    );

    watch(
      () => formModel.value,
      () => emitCurrentFormModelState(),
      { deep: true },
    );

    onMounted(async () => {
      if (
        props.isMultisig
        && !activeMultisigAccount.value?.signers.includes(account.value.address)
      ) {
        root.$store.commit('accounts/setActiveIdx', mySignerAccounts[0].idx);
      }
      const tipUrlEncoded: any = root.$route.query.url;
      if (tipUrlEncoded) {
        const tipUrl = decodeURIComponent(tipUrlEncoded);
        const tipUrlNormalised = new URL(/^\w+:\D+/.test(tipUrl) ? tipUrl : `https://${tipUrl}`);
        formModel.value.address = tipUrlNormalised.toString();
      }

      const { query } = root.$route;

      queryHandler({
        ...query,
        token: formModel.value?.selectedAsset?.contractId || query.token,
      });
    });

    return {
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
      account,
      accounts,
      accountsAllowedToProposeTxSelectOptions,
      urlStatus,
      isTipUrl,
      addressMessage,
      hasError,
      multisigVaultAddress,
      multisigVaultOwnedByManyAccounts,
      activeMultisigAccount,
      getAccountNameToDisplay,
      openScanQrModal,
      selectAccount,
      setMaxValue,
      showRecipientHelp,
      handleAssetChange,
      submit,
      balance,
      fee,
      max,
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
