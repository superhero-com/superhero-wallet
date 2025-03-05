<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="auction-bid">
        <AuctionCard :name="name" />

        <div class="form">
          <Field
            v-slot="{ field, errorMessage }"
            name="amount"
            :rules="{
              enough_coin: amountTotal.toString(),
              required: true,
              does_not_exceed_decimals: AE_COIN_PRECISION,
            }"
          >
            <InputAmount
              v-bind="field"
              v-model="amount"
              name="amount"
              :message="amountError || errorMessage"
              :protocol="PROTOCOLS.aeternity"
              readonly
            />
          </Field>
          <div class="tx-details">
            <DetailsItem :label="$t('transaction.fee')">
              <template #value>
                <TokenAmount
                  :amount="+txFee"
                  :protocol="PROTOCOLS.aeternity"
                  hide-fiat
                />
              </template>
            </DetailsItem>
            <DetailsItem :label="$t('common.total')">
              <template #value>
                <TokenAmount
                  :amount="+amountTotal"
                  :protocol="PROTOCOLS.aeternity"
                />
              </template>
            </DetailsItem>
          </div>

          <BtnMain
            :disabled="!!amountError || !amount || errorName"
            class="button"
            extend
            @click="bid"
          >
            {{ $t('pages.names.auctions.place-bid') }}
          </BtnMain>
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  PropType,
} from 'vue';
import { IonPage, IonContent } from '@ionic/vue';
import BigNumber from 'bignumber.js';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  AensName,
  buildTx,
  unpackTx,
  Tag,
  Name,
} from '@aeternity/aepp-sdk';
import { useForm, useFieldError, Field } from 'vee-validate';

import { useModals, useAeSdk, useUi } from '@/composables';
import { PROTOCOLS } from '@/constants';
import { STUB_ADDRESS, STUB_NONCE } from '@/constants/stubs';
import {
  AE_AENS_BID_MIN_RATIO,
  AE_COIN_PRECISION,
} from '@/protocols/aeternity/config';
import { ROUTE_AUCTION_HISTORY } from '@/popup/router/routeNames';
import { aeToAettos } from '@/protocols/aeternity/helpers';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';

import AuctionCard from '../../components/AuctionCard.vue';
import InputAmount from '../../components/InputAmount.vue';
import DetailsItem from '../../components/DetailsItem.vue';
import TokenAmount from '../../components/TokenAmount.vue';
import BtnMain from '../../components/buttons/BtnMain.vue';

export default defineComponent({
  name: 'AuctionBid',
  components: {
    AuctionCard,
    InputAmount,
    DetailsItem,
    TokenAmount,
    BtnMain,
    Field,
    IonPage,
    IonContent,
  },
  props: {
    name: { type: String as PropType<AensName>, required: true },
  },
  setup(props) {
    const router = useRouter();
    const { t } = useI18n();
    const { validate } = useForm();
    const errorName = useFieldError('amount');

    const { getAeSdk } = useAeSdk();
    const { getNameAuctionHighestBid } = useAeNames();
    const { openDefaultModal } = useModals();
    const { setLoaderVisible } = useUi();

    const amount = ref('');

    const highestBid = computed(
      () => getNameAuctionHighestBid(props.name)?.nameFee || new BigNumber(0),
    );
    const txFee = computed<BigNumber>(
      () => BigNumber(unpackTx(
        buildTx({
          tag: Tag.NameClaimTx,
          accountId: STUB_ADDRESS,
          nonce: STUB_NONCE,
          name: props.name,
          nameSalt: 0,
          nameFee: aeToAettos(highestBid.value.multipliedBy(AE_AENS_BID_MIN_RATIO).toString()),
        }),
        Tag.NameClaimTx, // https://github.com/aeternity/aepp-sdk-js/issues/1852
      ).fee).shiftedBy(-AE_COIN_PRECISION),
    );
    const amountTotal = computed(() => txFee.value.plus(amount.value || 0));
    const amountError = computed(() => {
      const minBid = highestBid.value.multipliedBy(AE_AENS_BID_MIN_RATIO);
      return (amount.value !== '' && minBid.isGreaterThanOrEqualTo(+amount.value))
        ? t('pages.names.auctions.min-bid', { minBid })
        : null;
    });

    async function bid() {
      if (!(await validate()).valid) {
        return;
      }
      if (amountError.value) return;
      const aeSdk = await getAeSdk();
      const nameObj = new Name(props.name, aeSdk.getContext());
      try {
        setLoaderVisible(true);
        await nameObj.bid(aeToAettos(amount.value));
        openDefaultModal({
          msg: t('pages.names.auctions.bid-added', { name: props.name }),
        });
        router.push({ name: ROUTE_AUCTION_HISTORY, params: { name: props.name } });
      } catch (error: any) {
        let msg = error.message;
        if (msg.includes('is not enough to execute')) {
          msg = t('pages.names.balance-error');
        }
        openDefaultModal({ msg });
      } finally {
        setLoaderVisible(false);
      }
    }

    return {
      AE_COIN_PRECISION,
      PROTOCOLS,
      amount,
      amountTotal,
      amountError,
      errorName,
      txFee,
      bid,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.auction-bid {
  .form {
    padding: 16px;

    .tx-details {
      display: flex;
      padding-top: 16px;

      .details-item {
        margin-right: 24px;
      }
    }

    .button {
      margin-top: 16px;
    }
  }
}
</style>
