<template>
  <div class="retip">
    <BalanceInfo />
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
      v-if="false"
      v-model="formModel.amount"
      v-validate="{
        required: true,
        min_value_exclusive: 0,
        ...+balance.minus(fee) > 0 ? { max_value: max } : {},
        enough_ae: fee.toString(),
      }"
      name="amount"
      class="amount-input"
      show-tokens-with-balance
      :message="validationStatus.msg || errors.first('amount')"
      :selected-asset="formModel.selectedAsset"
      @asset-selected="(val) => $set(formModel, 'selectedAsset', val)"
    />
    <div
      v-if="tip.title"
      class="tip-note-preview"
    >
      {{ tip.title }}
    </div>

    <BtnMain
      :disabled="!tippingSupported || validationStatus.error || $validator.errors.has('amount')"
      @click="sendTip"
    >
      {{ $t('pages.tipPage.confirm') }}
    </BtnMain>
    <BtnMain @click="openCallbackOrGoHome(false)">
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
  watch,
  computed,
} from '@vue/composition-api';
import { mapGetters, mapState } from 'vuex';
import { SCHEMA } from '@aeternity/aepp-sdk';
import { MAGNITUDE, AETERNITY_CONTRACT_ID } from '../utils/constants';
import { convertToken, watchUntilTruthy } from '../utils';
import {
  IAccount,
} from '../../types';
import deeplinkApi from '../../mixins/deeplinkApi';
import maxAmountMixin from '../../mixins/maxAmountMixin';
import InputAmount from '../components/InputAmountV2.vue';
import UrlStatus from '../components/UrlStatus.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import BalanceInfo from '../components/BalanceInfo.vue';

export default defineComponent({
  name: 'Retip',
  components: {
    InputAmount, UrlStatus, BtnMain, BalanceInfo,
  },
  mixins: [
    deeplinkApi,
    // maxAmountMixin,
  ],
  setup(props, { root }) {
    const tip = ref<any>({
      url: 'default',
    });
    const formModel = ref<any>({
      amount: null,
      selectedAsset: null,
    });
    const loading = ref<boolean>(false);
    const tippingV1 = computed(() => root.$store.state.tippingV1);
    const tippingV2 = computed(() => root.$store.state.tippingV2);
    const account = computed<IAccount>(() => root.$store.getters.account);
    const tippingSupported = computed(() => root.$store.getters.tippingSupported);
    const urlStatus = computed(() => root.$store.getters['tipUrl/status'][tip.value.url]);
    const tippingContract = computed(
      () => root.$route.query.id.includes('_v2') || root.$route.query.id.includes('_v3')
        ? tippingV2.value
        : tippingV1.value,
    );

    const validationStatus = computed(() => {
      const { sdk } = root.$store.state;
      const { minTipAmount } = root.$store.getters;
      if (!sdk || !tippingContract.value) {
        return { error: true };
      }
      if (formModel.value.selectedAsset?.contractId !== AETERNITY_CONTRACT_ID
        && root.$route.query.id.includes('_v1')) {
        return { error: true, msg: root.$t('pages.tipPage.v1FungibleTokenTipError') };
      }
      if (formModel.value.selectedAsset?.contractId === AETERNITY_CONTRACT_ID
        && +formModel.value.amount < minTipAmount) {
        return { error: true, msg: root.$t('pages.tipPage.minAmountError') };
      }
      return { error: false };
    });

    const sendTip = async () => {
      const amount = convertToken(
        formModel.value.amount,
        formModel.value.selectedAsset.contractId !== AETERNITY_CONTRACT_ID
          ? formModel.value.selectedAsset.decimals : MAGNITUDE,
      ).toFixed();
      loading.value = true;
      await watchUntilTruthy(() => tippingV1.value);
      try {
        let retipResponse = null;
        if (formModel.value.selectedAsset.contractId !== AETERNITY_CONTRACT_ID) {
          await root.$store.dispatch('fungibleTokens/createOrChangeAllowance',
            [formModel.value.selectedAsset.contractId, formModel.value.amount]);
          retipResponse = await tippingV2.value.methods.retip_token(
            +tip.value.id.split('_')[0],
            formModel.value.selectedAsset.contractId,
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
        root.$store.dispatch('addPendingTransaction', {
          hash: retipResponse.hash,
          amount,
          tipUrl: tip.value.url,
          tx: {
            callerId: account.value.address,
            contractId: tippingContract.value.deployInfo.address,
            type: SCHEMA.TX_TYPE.contractCall,
            function: 'retip',
            selectedTokenId: formModel.value.selectedAsset?.contractId,
          },
        });
        // this.openCallbackOrGoHome(true); // TODO
      } catch (e:any) {
        console.info('========================');
        console.info('error ::', e);
        console.info('========================');

        root.$store.dispatch('modals/open', {
          name: 'default',
          title: root.$t('modals.transaction-failed.msg'),
          icon: 'critical',
        });
        e.payload = tip.value;
        throw e;
      } finally {
        loading.value = false;
      }
    };

    onMounted(async () => { // maybe created()
      console.info('========================');
      console.info('props ::', props);
      console.info('root ::', root);
      console.info('========================');

      loading.value = true;
      // formModel.value.selectedAsset = root.$store.getters.fungibleTokens.getAeternityToken({
      //   tokenBalance: this.balance,
      //   balanceCurrency: this.balanceCurrency,
      // });

      const tipId = root.$route.query.id;
      if (!tipId) throw new Error('"id" param is missed');
      try {
        tip.value = await root.$store.dispatch('getCacheTip', tipId);
      } catch (error) {
        //
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
      sendTip,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.retip {
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
}
</style>
