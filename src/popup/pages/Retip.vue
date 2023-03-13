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

    <InputAmount
      v-model="formModel.amount"
      v-validate="{
        required: true,
        min_value_exclusive: 0,
        min_tip_amount: true,
        ...+balance.minus(fee) > 0 ? { max_value: max } : {},
        enough_ae: fee.toString(),
      }"
      name="amount"
      class="amount-input"
      ae-only
      :message="validationStatus.msg || errors.first('amount')"
    />
    <div
      v-if="tip.title"
      class="tip-note-preview"
    >
      {{ tip.title }}
    </div>

    <BtnMain
      class="bottom-btn"
      extend
      :disabled="!tippingSupported || validationStatus.error || $validator.errors.has('amount')"
      @click="sendTip"
    >
      {{ $t('pages.tipPage.confirm') }}
    </BtnMain>
    <BtnMain
      class="bottom-btn"
      extend
      @click="openCallbackOrGoHome(false)"
    >
      {{ $t('pages.tipPage.cancel') }}
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
} from '@vue/composition-api';
import { SCHEMA } from '@aeternity/aepp-sdk';
import VueI18n from 'vue-i18n';
import {
  IAccount,
  IToken,
  IPendingTransaction,
  ISdk,
} from '../../types';
import { MAGNITUDE, AETERNITY_CONTRACT_ID, MODAL_DEFAULT } from '../utils/constants';
import { convertToken, watchUntilTruthy } from '../utils';
import {
  useDeepLinkApi,
  useMaxAmount,
  IFormModel,
  useBalances,
} from '../../composables';
import { useGetter, useState } from '../../composables/vuex';
import InputAmount from '../components/InputAmountV2.vue';
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
  },
  setup(props, { root }) {
    const formModel = ref<IFormModel>({
      amount: '',
    });

    const { openCallbackOrGoHome } = useDeepLinkApi({ router: root.$router });
    const { balance, aeternityToken } = useBalances({ store: root.$store });
    const { max, fee } = useMaxAmount({ formModel, store: root.$store });

    const tipId = root.$route.query.id;
    const tip = ref<{ url: string, id: string }>({
      url: 'default',
      id: '',
    });

    const loading = ref<boolean>(false);
    const sdk = useGetter<ISdk>('sdkPlugin/sdk');
    const account = useGetter<IAccount>('account');
    const tippingV1 = useState('tippingV1');
    const tippingV2 = useState('tippingV2');
    const tippingSupported = useGetter('tippingSupported');
    const urlStatus = (useGetter('tipUrl/status') as any)[tip.value.url];
    const tippingContract = computed(
      () => tipId.includes('_v2') || tipId.includes('_v3')
        ? tippingV2.value
        : tippingV1.value,
    );

    const numericBalance = computed<number>(() => balance.value.toNumber());

    const validationStatus = computed<{
      error: boolean, msg?: string | VueI18n.TranslateResult
    }>(() => {
      if (!sdk.value || !tippingContract.value) {
        return { error: true };
      }
      return { error: false };
    });

    async function sendTip() {
      const amount = convertToken(
        +(formModel.value.amount || 0),
        formModel.value.selectedAsset?.contractId !== AETERNITY_CONTRACT_ID
          ? (formModel.value.selectedAsset as IToken).decimals
          : MAGNITUDE,
      ).toNumber();
      loading.value = true;
      await watchUntilTruthy(() => tippingV1.value);
      try {
        let retipResponse = null;
        if (formModel.value.selectedAsset?.contractId !== AETERNITY_CONTRACT_ID) {
          await root.$store.dispatch(
            'fungibleTokens/createOrChangeAllowance',
            [
              formModel.value.selectedAsset?.contractId,
              formModel.value.amount],
          );

          retipResponse = await tippingV2.value.methods.retip_token(
            +tip.value.id.split('_')[0],
            formModel.value.selectedAsset?.contractId,
            amount,
            {
              waitMined: false,
            },
          );
        } else {
          retipResponse = await tippingContract.value.methods.retip(+tip.value.id.split('_')[0], {
            amount,
            waitMined: false,
          });
        }
        const transaction: IPendingTransaction = {
          hash: retipResponse.hash,
          tipUrl: tip.value.url,
          pending: true,
          tx: {
            amount,
            callerId: account.value.address,
            contractId: tippingContract.value.deployInfo.address,
            type: SCHEMA.TX_TYPE.contractCall,
            function: 'retip',
            selectedTokenContractId: formModel.value.selectedAsset?.contractId,
          },
        };
        root.$store.dispatch('addPendingTransaction', transaction);
        openCallbackOrGoHome(true);
      } catch (error: any) {
        root.$store.dispatch('modals/open', {
          name: MODAL_DEFAULT,
          title: root.$t('modals.transaction-failed.msg'),
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
      formModel.value.selectedAsset = aeternityToken.value;

      if (!tipId) throw new Error('"id" param is missing');

      try {
        tip.value = await root.$store.dispatch('getCacheTip', tipId);
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
      validationStatus,
      tippingSupported,
      numericBalance,
      sendTip,
      max,
      fee,
      balance,
      openCallbackOrGoHome,
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
