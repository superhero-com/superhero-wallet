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
        <InviteIcon class="section-title-icon" />
        {{ $t('pages.invite.created-links') }}
      </p>
      <InviteItem
        v-for="link in invites"
        :key="link.secretKey"
        v-bind="link"
        @loading="(val) => (loading = val)"
      />
    </div>
    <Loader v-if="loading" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import { Crypto, AmountFormatter } from '@aeternity/aepp-sdk';

import { useState } from '../../composables/vuex';
import {
  useBalances,
  useSdk,
  useMaxAmount,
  IFormModel,
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
  },
  setup(props, { root }) {
    const loading = ref(false);

    const { getSdk } = useSdk({ store: root.$store });
    const { balance, aeternityCoin } = useBalances({ store: root.$store });

    const formModel = ref<IFormModel>({
      amount: '', selectedAsset: aeternityCoin.value,
    });

    const { max, fee } = useMaxAmount({ formModel, store: root.$store });

    const invites = useState('invites', 'invites');

    async function generate() {
      loading.value = true;
      const { publicKey, secretKey } = Crypto.generateKeyPair();

      try {
        const sdk = await getSdk();
        await sdk.spend(formModel.value.amount, publicKey, {
          denomination: AmountFormatter.AE_AMOUNT_FORMATS.AE,
        });
      } catch (error) {
        if (await root.$store.dispatch('invites/handleNotEnoughFoundsError', { error })) return;
        throw error;
      } finally {
        loading.value = false;
      }

      root.$store.commit('invites/add', secretKey);
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
