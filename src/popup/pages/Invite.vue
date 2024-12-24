<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="invite-page">
        <AccountInfo
          :account="activeAccount"
          can-copy-address
          show-protocol-icon
        />
        <BalanceInfo
          :balance="balance.toNumber()"
          :protocol="activeAccount.protocol"
          horizontal-offline-message
        />
        <p class="section-title">
          {{ $t('pages.invite.generate-link') }}
        </p>
        <Field
          v-slot="{ field, errorMessage, resetField }"
          v-model="formModel.amount"
          name="amount"
          :rules="{
            does_not_exceed_decimals: formModel.selectedAsset?.decimals,
            min_value_exclusive: 0,
            ...+balance.minus(fee) > 0 ? { max_value: max } : {},
            enough_coin: fee.toString(),
          }"
        >
          <InputAmount
            v-bind="field"
            :model-value="formModel.amount"
            class="amount"
            name="amount"
            :label="$t('pages.invite.tip-attached')"
            :message="errorMessage"
            readonly
            :protocol="PROTOCOLS.aeternity"
            :selected-asset="formModel.selectedAsset"
            @asset-selected="(val) => formModel.selectedAsset = val"
          />
          <BtnMain
            extend
            :icon="PlusCircleFillIcon"
            :disabled="!formModel.amount || !!errorMessage"
            data-cy="invite-generate"
            @click="generate(resetField)"
          >
            {{ $t('pages.invite.generate') }}
          </BtnMain>
        </Field>
        <div
          v-if="invites.length > 0"
          class="generated-links"
        >
          <p class="section-title">
            {{ $t('pages.invite.created-links') }}
          </p>
          <InviteItem
            v-for="link in invites"
            v-bind="link ?? null"
            :key="link.secretKey.toString()"
            @loading="(val) => setLoaderVisible(val)"
          />
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { defineComponent, ref } from 'vue';
import { Field } from 'vee-validate';
import { AE_AMOUNT_FORMATS, decode, MemoryAccount } from '@aeternity/aepp-sdk';

import type { IFormModel } from '@/types';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { PROTOCOLS } from '@/constants';
import {
  useAccounts,
  useAeSdk,
  useBalances,
  useCurrencies,
  useInvites,
  useMaxAmount,
  useUi,
} from '@/composables';

import AccountInfo from '../components/AccountInfo.vue';
import BalanceInfo from '../components/BalanceInfo.vue';
import InputAmount from '../components/InputAmount.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import InviteItem from '../components/InviteItem.vue';
import PlusCircleFillIcon from '../../icons/plus-circle.svg?vue-component';

export default defineComponent({
  components: {
    AccountInfo,
    BalanceInfo,
    InputAmount,
    BtnMain,
    InviteItem,
    Field,
    IonPage,
    IonContent,
  },
  setup() {
    const { activeAccount } = useAccounts();
    const { marketData } = useCurrencies();
    const { getAeSdk } = useAeSdk();
    const { balance } = useBalances();
    const { invites, addInvite, handleInsufficientBalanceError } = useInvites();
    const { setLoaderVisible } = useUi();

    const formModel = ref<IFormModel>({
      amount: '',
      selectedAsset: ProtocolAdapterFactory
        .getAdapter(PROTOCOLS.aeternity)
        .getDefaultCoin(marketData.value!, +balance.value),
    });

    const { max, fee } = useMaxAmount({ formModel });

    async function generate(resetField: () => void) {
      setLoaderVisible(true);
      const { address, secretKey } = MemoryAccount.generate();

      try {
        const aeSdk = await getAeSdk();
        await aeSdk.spend(
          formModel.value.amount || 0,
          address,
          // @ts-ignore
          { denomination: AE_AMOUNT_FORMATS.AE },
        );
      } catch (error: any) {
        if (await handleInsufficientBalanceError(error)) {
          return;
        }
        throw error;
      } finally {
        setLoaderVisible(false);
      }

      addInvite(decode(secretKey));
      // Field is dirty after submit, so we need to reset it and not just clear the value
      resetField();
    }

    return {
      PROTOCOLS,
      PlusCircleFillIcon,
      activeAccount,
      balance,
      fee,
      invites,
      max,
      formModel,
      generate,
      setLoaderVisible,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.invite-page {
  padding-inline: var(--screen-padding-x);
  overflow: hidden;

  .section-title {
    display: flex;
    align-items: center;
    margin: 36px 0 16px;
    font-size: 16px;
    text-align: left;
    color: $color-grey-light;
    font-weight: 500;

    &-icon {
      width: 20px;
      height: 20px;
      margin-right: 4px;
      color: $color-white;
      opacity: 0.5;
    }
  }

  .amount {
    margin-bottom: 20px;
  }
}
</style>
