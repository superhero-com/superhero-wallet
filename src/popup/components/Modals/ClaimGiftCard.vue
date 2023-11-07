<template>
  <Modal
    from-bottom
    body-without-padding-bottom
    has-close-button
    min-height
    class="claim-gift-card"
    @close="reject"
  >
    <div class="header text-heading-2">
      {{ $t('modals.claimGiftCard.title') }}
    </div>
    <template v-if="step === STEPS.redeemPartially || (step === STEPS.redeemFull && !isCardEmpty)">
      <CheckCircleIcon class="check-circle-icon" />
      <div class="redeemed-amount">
        <span>{{ amount }} {{ AE_SYMBOL }}</span>
        <span class="redeemed-by">
          {{ $t('modals.claimGiftCard.redeemedBy', [`(${currencyFormatted})`]) }}
        </span>
      </div>
    </template>
    <DetailsItem>
      <template #label>
        <AccountSelector
          v-if="step !== STEPS.redeemPartially && step !== STEPS.redeemFull"
          v-model="recipientId"
          :options="aeAccountsSelectOptions"
        />
        <AccountItem
          v-else-if="!isCardEmpty"
          :address="recipientId"
          :protocol="PROTOCOL_AETERNITY"
        />
      </template>
    </DetailsItem>
    <div class="redeem-balance">
      <span v-if="step !== STEPS.initial || !isCardEmpty">
        {{ $t('modals.claimGiftCard.balance') }}
      </span>
      <BalanceInfo
        :balance="balance.toNumber()"
        :protocol="PROTOCOL_AETERNITY"
        :class="{
          gray: balance.toNumber() === 0,
        }"
      />
    </div>
    <span
      v-if="isCardEmpty"
      class="already-redeemed"
    >
      {{ $t('modals.claimGiftCard.alreadyRedeemed') }}
    </span>
    <TransferSendAmount
      v-if="step === STEPS.form"
      v-model="amount"
      :errors="errors"
      readonly
      :protocol="PROTOCOL_AETERNITY"
      :custom-label="$t('modals.claimGiftCard.amount')"
      :validation-rules="{
        max_redeem: max.toString(),
      }"
      without-margin
    >
      <template #label-after>
        <BtnMaxAmount
          :is-max="isMax"
          @click="setMaxAmount"
        />
      </template>
    </TransferSendAmount>
    <template #footer>
      <div class="buttons">
        <BtnMain
          v-if="step === STEPS.initial"
          variant="muted"
          :text="$t('modals.claimGiftCard.redeemPartially')"
          :disabled="loading"
          @click="step = STEPS.form"
        />
        <BtnMain
          :icon="loading ? AnimatedSpinner : null"
          :text="mainButtonText"
          :disabled="isDisabled || loading"
          @click="handleMainButtonClick()"
        />
      </div>
    </template>
  </Modal>
</template>

<script lang="ts">
import BigNumber from 'bignumber.js';
import {
  computed,
  defineComponent,
  ref,
  PropType,
  onMounted,
} from 'vue';
import { useForm } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import {
  AE_AMOUNT_FORMATS,
  buildTx,
  encode,
  Encoded,
  Encoding,
  Tag,
  unpackTx,
} from '@aeternity/aepp-sdk';

import type { RejectCallback, ResolveCallback, ObjectValues } from '@/types';
import {
  useAccounts,
  useAeSdk,
  useCurrencies,
  useInvites,
} from '@/composables';
import { AE_COIN_PRECISION, AE_SYMBOL } from '@/protocols/aeternity/config';
import { getAccountFromSecret } from '@/protocols/aeternity/helpers';
import { PROTOCOL_AETERNITY } from '@/constants';
import CheckCircleIcon from '@/icons/check-circle.svg?vue-component';

import DetailsItem from '../DetailsItem.vue';
import AccountSelector from '../AccountSelector.vue';
import AccountItem from '../AccountItem.vue';
import BalanceInfo from '../BalanceInfo.vue';
import Modal from '../Modal.vue';
import TransferSendAmount from '../TransferSend/TransferSendAmount.vue';
import BtnMain from '../buttons/BtnMain.vue';
import AnimatedSpinner from '../../../icons/animated-spinner.svg?skip-optimize';

const STEPS = {
  initial: 'initial',
  form: 'form',
  redeemPartially: 'redeemPartially',
  redeemFull: 'redeemFull',
} as const;
type Step = ObjectValues<typeof STEPS>;

export default defineComponent({
  components: {
    AccountSelector,
    AccountItem,
    BalanceInfo,
    BtnMain,
    CheckCircleIcon,
    DetailsItem,
    TransferSendAmount,
    Modal,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    secretKey: { type: Buffer, required: true },
  },
  setup(props) {
    const { t } = useI18n();

    const { errors } = useForm();
    const { getAeSdk } = useAeSdk();
    const { aeAccounts, aeAccountsSelectOptions } = useAccounts();
    const { getFormattedFiat } = useCurrencies();
    const { claimInvite } = useInvites();

    const recipientId = ref<Encoded.AccountAddress>(aeAccounts.value[0].address);
    const amount = ref('');
    const balance = ref(new BigNumber(0));
    const step = ref<Step>(STEPS.initial);
    const isCardEmpty = ref(false);
    const loading = ref(false);

    const currencyFormatted = computed(() => getFormattedFiat(+amount.value, PROTOCOL_AETERNITY));
    const mainButtonText = computed(() => {
      switch (step.value) {
        case STEPS.initial:
          return t('modals.claimGiftCard.redeemFull');
        case STEPS.form:
          return t('modals.claimGiftCard.redeem');
        case STEPS.redeemPartially:
        case STEPS.redeemFull:
          return t('common.ok');
        default:
          return null;
      }
    });

    const { address } = getAccountFromSecret(props.secretKey);

    const fee = BigNumber(unpackTx(
      buildTx({
        tag: Tag.SpendTx,
        senderId: address,
        recipientId: recipientId.value,
        amount: +amount.value,
        payload: encode(new TextEncoder().encode(''), Encoding.Bytearray),
        nonce: 1,
      }) as any,
      Tag.SpendTx, // https://github.com/aeternity/aepp-sdk-js/issues/1852
    ).fee).shiftedBy(-AE_COIN_PRECISION);

    const max = computed(() => balance.value.minus(fee));

    const isMax = computed(() => amount.value.toString() === max.value.toString());

    async function updateBalance() {
      const aeSdk = await getAeSdk();
      balance.value = BigNumber((await aeSdk
        .getBalance(address, { format: AE_AMOUNT_FORMATS.AE })
        .catch(() => 0)
      )
        .toString());
    }

    function setMaxAmount() {
      amount.value = max.value.isPositive() ? max.value.toString() : '0';
    }

    async function handleMainButtonClick() {
      loading.value = true;
      switch (step.value) {
        case STEPS.initial:
          setMaxAmount();
          await claimInvite({
            secretKey: props.secretKey,
            recipientId: recipientId.value,
            isMax: true,
          });
          step.value = STEPS.redeemFull;
          break;
        case STEPS.form:
          await claimInvite({
            secretKey: props.secretKey,
            recipientId: recipientId.value,
            amount: amount.value,
            isMax: max.value.toString() === amount.value.toString(),
          });
          step.value = STEPS.redeemPartially;
          break;
        case STEPS.redeemPartially:
        case STEPS.redeemFull:
          props.resolve();
          break;
        default:
          throw new Error(`Unknown step ${step.value}`);
      }
      loading.value = false;
    }

    const isDisabled = computed(() => {
      switch (step.value) {
        case STEPS.form:
          return !amount.value || !!errors.value?.amount;
        default:
          return false;
      }
    });

    onMounted(async () => {
      await updateBalance();
      if (balance.value.toNumber() === 0) {
        step.value = STEPS.redeemFull;
        isCardEmpty.value = true;
      }
      setInterval(updateBalance, 3000);
    });

    return {
      AE_SYMBOL,
      AnimatedSpinner,
      aeAccountsSelectOptions,
      amount,
      balance,
      currencyFormatted,
      errors,
      fee,
      handleMainButtonClick,
      isCardEmpty,
      isDisabled,
      isMax,
      loading,
      mainButtonText,
      max,
      PROTOCOL_AETERNITY,
      recipientId,
      setMaxAmount,
      step,
      STEPS,
      updateBalance,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables';
@use '@/styles/typography';

.claim-gift-card {
  .header {
    @extend %face-sans-19-medium;

    text-align: center;
    margin-bottom: 4px;
  }

  .check-circle-icon {
    width: 40px;
    height: 40px;
    color: variables.$color-success-dark;
    display: flex;
    align-self: center;
    margin: 8px auto 4px auto;
  }

  .redeemed-amount {
    @extend %face-sans-16-medium;

    display: flex;
    justify-content: center;
    color: variables.$color-white;
    line-height: 24px;

    .redeemed-by {
      opacity: 0.75;
      margin-left: 4px;
    }
  }

  .details-item {
    display: flex;
    justify-content: center;
  }

  .redeem-balance {
    display: flex;
    flex-direction: column;
    justify-items: center;
    margin: auto;

    > span {
      @extend %face-sans-16-medium;

      line-height: 24px;
      display: block;
      color: variables.$color-white;
      opacity: 0.5;
      margin-bottom: 4px;
    }

    .balance-info {
      padding: 8px 0 16px 0;
      border-radius: 10px;
      background-image: url("../../../image/dashboard/buy-ae.webp");

      &.gray {
        filter: grayscale(1);
      }
    }
  }

  .already-redeemed {
    @extend %face-sans-15-regular;

    display: block;
    text-align: center;
    margin-top: 24px;
    color: variables.$color-white;
  }

  .buttons {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;

    .btn-main {
      width: 100%;
    }
  }
}
</style>
