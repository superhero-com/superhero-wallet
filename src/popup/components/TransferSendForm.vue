<template>
  <div class="transfer-send">
    <ModalHeader :title="$t('modals.send.sendTitle')" />
    <AccountRow />
    <InputField
      v-model.trim="formModel.address"
      v-validate="{
        required: true,
        not_same_as: account.address,
        name_registered_address_or_url: true,
        token_to_an_address: { isToken },
      }"
      name="address"
      data-cy="address"
      show-help
      show-message-help
      :label="$t('modals.send.recipientLabel')"
      :placeholder="$t('modals.send.recipientPlaceholder')"
      :message="message"
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
        ...+balance.minus(fee) > 0 ? { max_value: max } : {},
        enough_ae: fee.toString(),
        min_tip_amount: isTipUrl,
      }"
      name="amount"
      class="amount-input"
      show-tokens-with-balance
      :message="errors.first('amount')"
      :selected-asset="formModel.selectedAsset"
      @asset-selected="handleAssetChange"
    >
      <template #label-after>
        <BtnPlain
          class="max-button"
          :class="{ chosen: isMaxValue }"
          @click="setMaxValue"
        >
          MAX
        </BtnPlain>
      </template>
    </InputAmount>

    <DetailsItem
      :label="$t('pages.signTransaction.fee')"
    >
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
} from '@vue/composition-api';
import type { IAsset, IToken } from '../../types';
import {
  convertToken,
  isNumbersEqual,
  validateTipUrl,
  checkAensName,
  MODAL_DEFAULT,
} from '../utils';
import {
  MODAL_READ_QR_CODE,
  MODAL_RECIPIENT_INFO,
  AETERNITY_CONTRACT_ID,
} from '../utils/constants';
import { useMaxAmount } from '../../composables';
import AccountRow from './AccountRow.vue';
import InputField from './InputField.vue';
import InputAmount from './InputAmountV2.vue';
import BtnPlain from './buttons/BtnPlain.vue';
import DetailsItem from './DetailsItem.vue';
import TokenAmount from './TokenAmount.vue';
import QrScanIcon from '../../icons/qr-scan.svg?vue-component';
import ModalHeader from './ModalHeader.vue';
import UrlStatus from './UrlStatus.vue';

const WARNING_RULES = ['not_same_as'];

export default defineComponent({
  name: 'TransferSendForm',
  components: {
    ModalHeader,
    AccountRow,
    InputField,
    InputAmount,
    BtnPlain,
    DetailsItem,
    TokenAmount,
    QrScanIcon,
    UrlStatus,
  },
  model: {
    prop: 'transferData',
  },
  props: {
    transferData: { type: Object, required: true },
  },
  setup(props, { root, emit }) {
    const invoiceId = ref(null);
    const invoiceContract = ref(null);
    const formModel = ref<{
      amount: number;
      address: string;
      selectedAsset: IToken | IAsset | null
    }>(props.transferData as any);
    const loading = ref<boolean>(false);
    const error = ref<boolean>(false);

    const {
      max,
      fee,
      balance,
      balanceCurrency,
      account,
    } = useMaxAmount({ formModel });

    const availableTokens = computed(() => root.$store.state.fungibleTokens.availableTokens);
    const tokenBalances = computed(() => root.$store.getters.fungibleTokens.tokenBalances);
    const getAeternityToken = computed(() => root.$store.getters['fungibleTokens/getAeternityToken']);
    const addressErrorMsg = computed(
      () => (root as any).errors.items
        .filter(({ field }: any) => field === 'address')
        .filter(({ rule }: any) => !WARNING_RULES.includes(rule))[0]?.msg || null,
    );
    const addressWarningMsg = computed(
      () => (root as any).errors.items
        .filter(({ field }: any) => field === 'address')
        .find((_error: any) => WARNING_RULES.includes(_error.rule))?.msg || null,
    );
    const urlStatus = computed(
      () => root.$store.getters['tipUrl/status'](formModel.value.address),
    );
    const isTipUrl = computed(
      () => validateTipUrl(formModel.value.address) && !checkAensName(formModel.value.address),
    );

    const message = computed(() => {
      if (isTipUrl.value) {
        switch (urlStatus.value) {
          case 'verified': return { status: 'success', text: ' ', hideMessage: true };
          case 'not-secure': return { status: 'warning', text: ' ', hideMessage: true };
          case 'not-verified': return { status: 'warning', text: ' ', hideMessage: true };
          case 'blacklisted': return { status: 'error', text: ' ', hideMessage: true };
          default:
            throw new Error(`Unknown url status: ${message.value.status}`);
        }
      } else {
        const warning = (root as any).errors.items
          .filter(({ field }: any) => field === 'address')
          .find((_error: any) => WARNING_RULES.includes(_error.rule))?.msg || null;
        if (warning) return { status: 'warning', text: warning };
        const _error = (root as any).errors.items
          .filter(({ field }: any) => field === 'address')
          .filter(({ rule }: any) => !WARNING_RULES.includes(rule))[0]?.msg || null;
        if (_error) return { status: 'error', text: _error };
      }
      return { status: 'success' };
    });

    const hasError = computed<boolean>(
      () => !!addressErrorMsg.value || !!(root as any).errors.first('amount'),
    );
    const isToken = computed<boolean>(
      () => formModel.value.selectedAsset?.contractId !== AETERNITY_CONTRACT_ID,
    );
    const isMaxValue = computed<boolean>(
      () => isNumbersEqual(formModel.value.amount, max.value),
    );

    watch(
      () => hasError.value,
      (val) => emit('error', val),
    );
    watch(
      () => formModel.value,
      (val) => emit('input', {
        ...val,
        fee: fee.value,
        total: (val.selectedAsset?.contractId === AETERNITY_CONTRACT_ID
          ? +fee.value.toFixed() : 0) + +val.amount,
      }),
      {
        deep: true,
      },
    );

    const queryHandler = async (query:any) => {
      formModel.value.selectedAsset = availableTokens.value[query.token]
        || getAeternityToken.value({
          tokenBalance: balance.value,
          balanceCurrency: balanceCurrency.value,
        });
      if (query.account) formModel.value.address = query.account;
      if (query.amount) formModel.value.amount = query.amount;
    };

    const setMaxValue = () => {
      const _fee = fee.value;
      formModel.value.amount = max.value;
      setTimeout(() => {
        if (_fee !== fee.value) {
          formModel.value.amount = max.value;
        }
      },
      100);
    };

    // Method called from a parent scope - avoid changing it's name.
    const submit = async () => {
      const isValid = !(await (root as any).$validator._base.anyExcept('address', WARNING_RULES));
      if (isValid) {
        const { address, amount, selectedAsset } = formModel.value;
        emit('success', {
          address,
          amount,
          selectedAsset,
          fee: fee.value,
          total: (selectedAsset?.contractId === AETERNITY_CONTRACT_ID ? +fee.value : 0) + +amount,
          invoiceId: invoiceId.value,
          invoiceContract: invoiceContract.value,
        });
      }
    };

    const showRecipientHelp = () => root.$store.dispatch('modals/open', {
      name: MODAL_RECIPIENT_INFO,
    });

    const handleAssetChange = (selectedAsset: any) => {
      formModel.value.selectedAsset = selectedAsset;
    };

    const openScanQrModal = async () => {
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
    };

    onMounted(async () => {
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
      isToken,
      isMaxValue,
      invoiceId,
      invoiceContract,
      formModel,
      loading,
      error,
      addressErrorMsg,
      addressWarningMsg,
      availableTokens,
      account,
      urlStatus,
      isTipUrl,
      message,
      hasError,
      openScanQrModal,
      setMaxValue,
      showRecipientHelp,
      handleAssetChange,
      submit,
      balance,
      fee,
      max,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.transfer-send {
  .scan-button {
    color: variables.$color-white;
    display: block;
    width: 32px;
    height: 24px;
  }

  .amount-input {
    margin-bottom: 20px;
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
}
</style>
