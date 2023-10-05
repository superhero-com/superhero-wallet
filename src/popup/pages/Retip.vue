<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="retip">
        <BalanceInfo
          :balance="numericBalance"
          :protocol="PROTOCOL_AETERNITY"
        />

        <DetailsItem
          v-if="tip.url"
          class="url-info"
          :label="$t('pages.tipPage.url')"
        >
          <a
            :href="tip.url"
            class="url"
            v-text="tip.url"
          />
          <UrlStatus
            v-if="urlStatus"
            :status="urlStatus"
          />
        </DetailsItem>

        <Field
          v-slot="{ field, errorMessage }"
          name="amount"
          :rules="{
            required: true,
            min_value_exclusive: 0,
            ae_min_tip_amount: true,
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
            :protocol="PROTOCOL_AETERNITY"
          />
        </Field>

        <div
          v-if="tip.title"
          class="tip-note-preview"
        >
          {{ tip.title }}
        </div>

        <div class="button-wrapper">
          <BtnMain
            variant="muted"
            extra-padded
            :text="$t('common.cancel')"
            @click="openCallbackOrGoHome(false)"
          />
          <BtnMain
            wide
            :disabled="!isTippingSupported || errorAmount"
            :text="$t('common.confirm')"
            @click="sendTip"
          />
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import {
  defineComponent,
  onMounted,
  ref,
  computed,
} from 'vue';
import { Tag } from '@aeternity/aepp-sdk';
import { useI18n } from 'vue-i18n';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { Field, useFieldError } from 'vee-validate';
import type {
  IFormModel,
  IToken,
  ITransaction,
} from '@/types';
import { toShiftedBigNumber } from '@/utils';
import {
  useAccounts,
  useAeSdk,
  useBalances,
  useCurrencies,
  useDeepLinkApi,
  useFungibleTokens,
  useMaxAmount,
  useModals,
  useTippingContracts,
  useTransactionList,
  useUi,
} from '@/composables';
import { AE_COIN_PRECISION, AE_CONTRACT_ID } from '@/protocols/aeternity/config';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { PROTOCOL_AETERNITY } from '@/constants';
import { useAeTippingBackend, useAeTippingUrls } from '@/protocols/aeternity/composables';

import InputAmount from '../components/InputAmount.vue';
import UrlStatus from '../components/UrlStatus.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import BalanceInfo from '../components/BalanceInfo.vue';
import DetailsItem from '../components/DetailsItem.vue';

export default defineComponent({
  name: 'Retip',
  components: {
    InputAmount,
    UrlStatus,
    BtnMain,
    BalanceInfo,
    Field,
    IonPage,
    IonContent,
    DetailsItem,
  },
  setup() {
    const store = useStore();
    const route = useRoute();
    const { t } = useI18n();
    const errorAmount = useFieldError();
    const { setLoaderVisible } = useUi();

    const formModel = ref<IFormModel>({
      amount: '',
    });
    const { getCacheTip } = useAeTippingBackend();
    const { isTippingSupported } = useAeSdk({ store });
    const { openDefaultModal } = useModals();
    const { marketData } = useCurrencies();
    const { getLastActiveProtocolAccount } = useAccounts();
    const { openCallbackOrGoHome } = useDeepLinkApi();
    const { balance } = useBalances();
    const { max, fee } = useMaxAmount({ formModel, store });
    const { getTippingContracts } = useTippingContracts({ store });
    const { upsertCustomPendingTransactionForAccount } = useTransactionList({ store });
    const { getTippingUrlStatus } = useAeTippingUrls();
    const { createOrChangeAllowance } = useFungibleTokens({ store });

    const tipId = route.query.id;
    const tip = ref<{ url: string, id: string }>({
      url: 'default',
      id: '',
    });

    const urlStatus = computed(() => getTippingUrlStatus(tip.value.url));

    const numericBalance = computed<number>(() => balance.value.toNumber());

    async function sendTip() {
      const precision = (formModel.value.selectedAsset?.contractId !== AE_CONTRACT_ID)
        ? (formModel.value.selectedAsset as IToken).decimals
        : AE_COIN_PRECISION;
      const amount = toShiftedBigNumber(+(formModel.value.amount || 0), precision).toNumber();
      const account = getLastActiveProtocolAccount(PROTOCOL_AETERNITY)!;
      setLoaderVisible(true);
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
          await createOrChangeAllowance(
            formModel.value.selectedAsset.contractId,
            formModel.value.amount || 0,
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
          transactionOwner: account.address,
          tx: {
            amount,
            callerId: account.address,
            contractId: tippingContract.$options.address!,
            type: Tag[Tag.ContractCallTx],
            function: 'retip',
            selectedTokenContractId: formModel.value.selectedAsset?.contractId,
            arguments: [],
            fee: 0,
          },
        };
        upsertCustomPendingTransactionForAccount(account.address, transaction);
        openCallbackOrGoHome(true);
      } catch (error: any) {
        openDefaultModal({
          title: t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
        error.payload = tip.value;
        throw error;
      } finally {
        setLoaderVisible(false);
      }
    }

    onMounted(async () => {
      setLoaderVisible(true);
      formModel.value.selectedAsset = ProtocolAdapterFactory
        .getAdapter(PROTOCOL_AETERNITY)
        .getDefaultCoin(marketData.value!, +balance.value);

      if (!tipId) throw new Error('"id" param is missing');

      try {
        tip.value = await getCacheTip(tipId as string);
      } catch (error: any) {
        error.payload = tipId;
        throw error;
      }
      setLoaderVisible(false);
    });

    return {
      PROTOCOL_AETERNITY,
      tip,
      formModel,
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

  .url-info {
    margin-block: 30px 20px;

    .url {
      @extend %face-sans-14-medium;

      display: block;
      margin-bottom: 2px;
      overflow-wrap: anywhere;
      line-height: 1.4em;
      color: variables.$color-white;
      text-decoration: none;
    }
  }

  .button-wrapper {
    display: flex;
    gap: var(--gap);
  }
}
</style>
