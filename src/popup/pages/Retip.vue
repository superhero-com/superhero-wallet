<template>
  <div class="retip">
    <BalanceInfo :balance="numericBalance" />
    <div class="section-title">
      {{ $t('pages.tipPage.url') }}
    </div>

    <div
      v-if="urlStatus"
      class="url-bar"
    >
      <UrlStatus :status="urlStatus" />
      <a>{{ tip.url }}</a>
    </div>

    <Field
      v-slot="{ field, errorMessage}"
      name="amount"
      :rules="{
        required: true,
        min_value_exclusive: 0,
        min_tip_amount: true,
        ...+balance.minus(fee) > 0 ? { max_value: max } : {},
        enough_coin: fee.toString(),
      }"
    >
      <InputAmount
        v-bind="field"
        v-model="formModel.amount"
        name="amount"
        class="amount-input"
        readonly
        :message="errorMessage"
      />
    </Field>

    <div
      v-if="tip.title"
      class="tip-note-preview"
    >
      {{ tip.title }}
    </div>

    <BtnMain
      class="bottom-btn"
      extend
      :disabled="!isTippingSupported || errorAmount"
      @click="sendTip"
    >
      {{ $t('common.confirm') }}
    </BtnMain>
    <BtnMain
      class="bottom-btn"
      extend
      @click="openCallbackOrGoHome(false)"
    >
      {{ $t('common.cancel') }}
    </BtnMain>

    <Loader v-if="loading" />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  onMounted,
  ref,
  computed,
} from 'vue';
import { Tag } from '@aeternity/aepp-sdk';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import { Field, useFieldError } from 'vee-validate';
import type {
  IFormModel,
  IToken,
  ITransaction,
} from '@/types';
import { toShiftedBigNumber } from '@/utils';
import {
  useCurrencies,
  useDeepLinkApi,
  useMaxAmount,
  useBalances,
  useModals,
  useAccounts,
  useTippingContracts,
  useAeSdk,
  useTransactionList,
} from '@/composables';
import { AE_COIN_PRECISION, AE_CONTRACT_ID } from '@/protocols/aeternity/config';

import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { PROTOCOL_AETERNITY } from '@/constants';
import { useGetter } from '../../composables/vuex';
import InputAmount from '../components/InputAmount.vue';
import UrlStatus from '../components/UrlStatus.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import BalanceInfo from '../components/BalanceInfo.vue';

export default defineComponent({
  name: 'Retip',
  components: {
    InputAmount,
    UrlStatus,
    BtnMain,
    BalanceInfo,
    Field,
  },
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    const { t } = useI18n();
    const errorAmount = useFieldError();

    const formModel = ref<IFormModel>({
      amount: '',
    });

    const { isTippingSupported } = useAeSdk({ store });
    const { openDefaultModal } = useModals();
    const { marketData } = useCurrencies({ store });
    const { activeAccount } = useAccounts({ store });
    const { openCallbackOrGoHome } = useDeepLinkApi({ router });
    const { balance } = useBalances({ store });
    const { max, fee } = useMaxAmount({ formModel, store });
    const { getTippingContracts } = useTippingContracts({ store });
    const { upsertCustomPendingTransactionForAccount } = useTransactionList({ store });

    const tipId = route.query.id;
    const tip = ref<{ url: string, id: string }>({
      url: 'default',
      id: '',
    });

    const loading = ref<boolean>(false);
    const urlStatus = (useGetter('tipUrl/status') as any)[tip.value.url];

    const numericBalance = computed<number>(() => balance.value.toNumber());

    async function sendTip() {
      const precision = (formModel.value.selectedAsset?.contractId !== AE_CONTRACT_ID)
        ? (formModel.value.selectedAsset as IToken).decimals
        : AE_COIN_PRECISION;
      const amount = toShiftedBigNumber(+(formModel.value.amount || 0), precision).toNumber();
      loading.value = true;
      try {
        const { tippingV1, tippingV2 } = await getTippingContracts();
        const tippingContract = tipId?.includes('_v2') || tipId?.includes('_v3')
          ? tippingV2
          : tippingV1;
        if (!tippingContract) {
          throw Error('failed to initialize tipping contract');
        }
        let retipResponse = null;
        if (
          tippingV2
          && formModel.value.selectedAsset?.contractId
          && formModel.value.selectedAsset.contractId !== AE_CONTRACT_ID
        ) {
          await store.dispatch(
            'fungibleTokens/createOrChangeAllowance',
            [
              formModel.value.selectedAsset.contractId,
              formModel.value.amount],
          );

          retipResponse = await tippingV2.retip_token(
            +tip.value.id.split('_')[0],
            formModel.value.selectedAsset.contractId as any,
            amount,
            {
              waitMined: false,
            },
          );
        } else {
          retipResponse = await tippingContract.retip(
            +tip.value.id.split('_')[0],
            {
              ...{ amount } as any,
              waitMined: false,
            },
          );
        }
        const transaction: ITransaction = {
          hash: retipResponse.hash,
          tipUrl: tip.value.url,
          pending: true,
          transactionOwner: activeAccount.value.address,
          tx: {
            amount,
            callerId: activeAccount.value.address,
            contractId: tippingContract.$options.address!,
            type: Tag[Tag.ContractCallTx],
            function: 'retip',
            selectedTokenContractId: formModel.value.selectedAsset?.contractId,
            arguments: [],
            fee: 0,
          },
        };
        upsertCustomPendingTransactionForAccount(activeAccount.value.address, transaction);
        openCallbackOrGoHome(true);
      } catch (error: any) {
        openDefaultModal({
          title: t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
        error.payload = tip.value;
        throw error;
      } finally {
        loading.value = false;
      }
    }

    onMounted(async () => {
      loading.value = true;
      formModel.value.selectedAsset = ProtocolAdapterFactory
        .getAdapter(PROTOCOL_AETERNITY)
        .getDefaultCoin(marketData, +balance.value);

      if (!tipId) throw new Error('"id" param is missing');

      try {
        tip.value = await store.dispatch('getCacheTip', tipId);
      } catch (error: any) {
        error.payload = tipId;
        throw error;
      }
      loading.value = false;
    });

    return {
      tip,
      formModel,
      loading,
      urlStatus,
      isTippingSupported,
      numericBalance,
      sendTip,
      max,
      fee,
      balance,
      openCallbackOrGoHome,
      errorAmount,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.retip {
  padding: 16px;

  .url-bar {
    display: flex;
    align-items: center;

    svg {
      width: 24px;
      height: 24px;
    }

    > a {
      overflow-wrap: anywhere;
      text-align: left;
      color: variables.$color-white;
      flex-grow: 1;
      text-decoration: none;
      width: 90%;
      margin: 8px 0 8px 10px;

      @extend %face-sans-11-regular;
    }
  }

  .input-field + .button {
    margin-top: 50px;
  }

  .section-title {
    margin-bottom: 8px;
    margin-top: 16px;
    color: variables.$color-white;
    text-align: left;

    @extend %face-sans-16-regular;
  }

  .bottom-btn {
    max-width: 280px;
    margin: 10px auto 0;
  }
}
</style>
