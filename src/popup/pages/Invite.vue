<template>
  <div class="invite-page">
    <div class="top">
      <p class="section-title">
        <NewInviteLink class="section-title-icon" />
        {{ $t('pages.invite.generate-link') }}
      </p>
      <InputAmount
        v-model="formModel.amount"
        v-validate="{
          min_value_exclusive: 0,
          ...+balance.minus(fee) > 0 ? { max_value: max } : {},
          enough_ae: fee.toString(),
        }"
        class="amount"
        name="amount"
        :label="$t('pages.invite.tip-attached')"
        :message="errors.first('amount')"
        ae-only
        :selected-asset="formModel.selectedAsset"
        @asset-selected="(val) => formModel.selectedAsset = val"
      />
      <BtnMain
        extend
        :disabled="!formModel.amount || !!errors.first('amount')"
        @click="generate"
      >
        {{ $t('pages.invite.generate') }}
      </BtnMain>
    </div>
    <div
      v-if="invites.length > 0"
      class="generated-links"
    >
      <p class="section-title">
        <Invite class="section-title-icon" />
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
import { Crypto, AmountFormatter } from '@aeternity/aepp-sdk';

import { useStore } from 'vuex';
import { useState } from '../../composables/vuex';
import { useBalances, useSdk, useMaxAmount } from '../../composables';
import { TransferFormModel } from '../components/Modals/TransferSend.vue';
import InputAmount from '../components/InputAmountV2.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import InviteItem from '../components/InviteItem.vue';
import Invite from '../../icons/invite.svg?vue-component';
import NewInviteLink from '../../icons/new-invite-link.svg?vue-component';

export default defineComponent({
  components: {
    InputAmount,
    BtnMain,
    InviteItem,
    Invite,
    NewInviteLink,
  },
  setup(props) {
    const store = useStore();
    const loading = ref(false);
    const formModel = ref<TransferFormModel>({
      address: '', amount: '', selectedAsset: undefined, payload: '',
    });

    const { getSdk } = useSdk({ store });
    const { balance } = useBalances({ store });
    const { max, fee } = useMaxAmount({ formModel, store });

    const invites = useState('invites', 'invites');

    async function generate() {
      loading.value = true;
      const { publicKey, secretKey } = Crypto.generateKeyPair();

      try {
        const sdk = await getSdk();
        await sdk.spend(formModel.value.amount, publicKey, {
          payload: 'referral',
          denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE,
        });
      } catch (error) {
        if (await store.dispatch('invites/handleNotEnoughFoundsError', { error })) return;
        throw error;
      } finally {
        loading.value = false;
      }

      store.commit('invites/add', secretKey);
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
