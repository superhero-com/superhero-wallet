<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="invite-page">
        <AccountInfo
          :address="activeAccount.address"
          :name="activeAccount.name"
          :idx="activeAccount.idx"
          :protocol="activeAccount.protocol"
          can-copy-address
          with-protocol-icon
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
          v-slot="{ field, errorMessage }"
          v-model="formModel.amount"
          name="amount"
          :rules="{
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
            :protocol="PROTOCOL_AETERNITY"
            :selected-asset="formModel.selectedAsset"
            @asset-selected="(val) => formModel.selectedAsset = val"
          />
          <BtnMain
            extend
            :icon="PlusCircleFillIcon"
            :disabled="!formModel.amount || !!errorMessage"
            @click="generate"
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
            :key="link.secretKey"
            @loading="(val) => (loading = val)"
          />
        </div>
        <Loader v-if="loading" />
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import { IonPage, IonContent } from '@ionic/vue';
import { defineComponent, ref } from 'vue';
import { Field } from 'vee-validate';
import { generateKeyPair, AE_AMOUNT_FORMATS } from '@aeternity/aepp-sdk';

import { useStore } from 'vuex';
import type { IFormModel } from '@/types';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { PROTOCOL_AETERNITY } from '@/constants';
import { useState } from '../../composables/vuex';
import {
  useAccounts,
  useAeSdk,
  useBalances,
  useMaxAmount,
  useCurrencies,
} from '../../composables';

import AccountInfo from '../components/AccountInfo.vue';
import BalanceInfo from '../components/BalanceInfo.vue';
import InputAmount from '../components/InputAmount.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import InviteItem from '../components/InviteItem.vue';
import PlusCircleFillIcon from '../../icons/plus-circle-fill.svg?vue-component';

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
    const store = useStore();
    const loading = ref(false);

    const { activeAccount } = useAccounts({ store });
    const { marketData } = useCurrencies({ store });
    const { getAeSdk } = useAeSdk({ store });
    const { balance } = useBalances({ store });

    const formModel = ref<IFormModel>({
      amount: '',
      selectedAsset: ProtocolAdapterFactory
        .getAdapter(PROTOCOL_AETERNITY)
        .getDefaultCoin(marketData.value!, +balance.value),
    });

    const { max, fee } = useMaxAmount({ formModel, store });

    const invites = useState('invites', 'invites');

    async function generate() {
      loading.value = true;
      const { publicKey, secretKey } = generateKeyPair();

      try {
        const aeSdk = await getAeSdk();
        await aeSdk.spend(
          formModel.value.amount || 0,
          publicKey,
          // @ts-ignore
          { denomination: AE_AMOUNT_FORMATS.AE },
        );
      } catch (error) {
        if (await store.dispatch('invites/handleNotEnoughFoundsError', { error })) return;
        throw error;
      } finally {
        loading.value = false;
      }

      store.commit('invites/add', Buffer.from(secretKey, 'hex').slice(0, 32));
      formModel.value.amount = '';
    }

    return {
      PROTOCOL_AETERNITY,
      PlusCircleFillIcon,
      activeAccount,
      balance,
      fee,
      invites,
      loading,
      max,
      formModel,
      generate,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.invite-page {
  padding: 0 var(--screen-padding-x);
  overflow: hidden;

  .section-title {
    display: flex;
    align-items: center;
    margin: 36px 0 16px;
    font-size: 16px;
    text-align: left;
    color: variables.$color-grey-light;
    font-weight: 500;

    &-icon {
      width: 20px;
      height: 20px;
      margin-right: 4px;
      color: variables.$color-white;
      opacity: 0.5;
    }
  }

  .amount {
    margin-bottom: 20px;
  }
}
</style>
