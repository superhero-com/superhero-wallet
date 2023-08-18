<template>
  <div class="auction-bid">
    <AuctionCard :name="name" />

    <div class="form">
      <Field
        v-slot="{ field, errorMessage }"
        name="amount"
        :rules="{
          enough_ae: amountTotal.toString(),
          required: true,
          name: true,
          name_unregistered: true,
        }"
      >
        <InputAmount
          v-bind="field"
          v-model="amount"
          name="amount"
          :message="amountError || errorMessage"
          readonly
        />
      </Field>
      <div class="tx-details">
        <DetailsItem :label="$t('transaction.fee')">
          <template #value>
            <TokenAmount
              :amount="+txFee"
              hide-fiat
            />
          </template>
        </DetailsItem>
        <DetailsItem :label="$t('common.total')">
          <template #value>
            <TokenAmount
              :amount="+amountTotal"
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
    <Loader v-if="loading" />
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  PropType,
} from 'vue';
import BigNumber from 'bignumber.js';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  AensName,
  buildTx,
  unpackTx,
  Tag,
} from '@aeternity/aepp-sdk';
import { useForm, useFieldError, Field } from 'vee-validate';

import type { IAuctionBid } from '@/types';
import { useModals, useAeSdk } from '@/composables';
import { useGetter } from '@/composables/vuex';
import { STUB_ADDRESS, STUB_NONCE } from '@/constants/stubs';
import {
  AE_AENS_BID_MIN_RATIO,
  AE_COIN_PRECISION,
} from '@/protocols/aeternity/config';
import { aeToAettos } from '@/protocols/aeternity/helpers';

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
  },
  props: {
    name: { type: String as PropType<AensName>, required: true },
  },
  setup(props) {
    const store = useStore();
    const router = useRouter();
    const { t } = useI18n();
    const { validate } = useForm();
    const errorName = useFieldError('amount');

    const { getAeSdk } = useAeSdk({ store });
    const { openDefaultModal } = useModals();

    const loading = ref(false);
    const amount = ref('');

    const getHighestBid = useGetter<(n: string) => IAuctionBid | null>('names/getHighestBid');

    const highestBid = computed(() => getHighestBid.value(props.name)?.nameFee || new BigNumber(0));
    const txFee = computed<BigNumber>(
      () => BigNumber(unpackTx(
        buildTx({
          tag: Tag.NameClaimTx,
          accountId: STUB_ADDRESS,
          nonce: STUB_NONCE,
          name: props.name,
          nameSalt: 0,
          nameFee: aeToAettos(highestBid.value.multipliedBy(AE_AENS_BID_MIN_RATIO).toString()),
        }) as any,
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
      const aeSdk = await getAeSdk();
      if (amountError.value) return;
      try {
        loading.value = true;
        await aeSdk.aensBid(props.name, aeToAettos(amount.value));
        openDefaultModal({
          msg: t('pages.names.auctions.bid-added', { name: props.name }),
        });
        router.push({ name: 'auction-history', params: { name: props.name } });
      } catch (error: any) {
        let msg = error.message;
        if (msg.includes('is not enough to execute')) {
          msg = t('pages.names.balance-error');
        }
        openDefaultModal({ msg });
      } finally {
        loading.value = false;
      }
    }

    return {
      loading,
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
@use '../../../styles/variables';

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
