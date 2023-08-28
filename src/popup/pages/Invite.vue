<template>
  <div class="invite-page">
    <div class="top">
      <p class="section-title">
        <NewInviteLink class="section-title-icon" />
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
          :selected-asset="formModel.selectedAsset"
          @asset-selected="(val) => formModel.selectedAsset = val"
        />
        <BtnMain
          extend
          :disabled="!formModel.amount || !!errorMessage"
          @click="generate"
        >
          {{ $t('pages.invite.generate') }}
        </BtnMain>
      </Field>
    </div>
    <div
      v-if="invites.length > 0"
      class="generated-links"
    >
      <p class="section-title">
        <InviteIcon class="section-title-icon" />
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { Field } from 'vee-validate';
import { generateKeyPair, AE_AMOUNT_FORMATS } from '@aeternity/aepp-sdk';

import { useStore } from 'vuex';
import type { IFormModel } from '@/types';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import { PROTOCOL_AETERNITY } from '@/constants';
import { useState } from '../../composables/vuex';
import {
  useBalances,
  useAeSdk,
  useMaxAmount,
  useCurrencies,
} from '../../composables';

import InputAmount from '../components/InputAmount.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import InviteItem from '../components/InviteItem.vue';
import InviteIcon from '../../icons/invite.svg?vue-component';
import NewInviteLink from '../../icons/new-invite-link.svg?vue-component';

export default defineComponent({
  components: {
    InputAmount,
    BtnMain,
    InviteItem,
    InviteIcon,
    NewInviteLink,
    Field,
  },
  setup() {
    const store = useStore();
    const loading = ref(false);

    const { marketData } = useCurrencies({ store });
    const { getAeSdk } = useAeSdk({ store });
    const { balance } = useBalances({ store });

    const formModel = ref<IFormModel>({
      amount: '',
      selectedAsset: ProtocolAdapterFactory
        .getAdapter(PROTOCOL_AETERNITY)
        .getDefaultCoin(marketData, +balance.value),
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
    margin: 20px 0 16px;
    font-size: 17px;
    text-align: left;
    color: variables.$color-grey-light;
    font-weight: 400;

    &-icon {
      width: 22px;
      height: 22px;
      margin-right: 7px;
    }
  }

  .amount {
    margin-bottom: 20px;
  }
}
</style>
