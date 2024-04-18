<template>
  <div
    class="invite-item"
    data-cy="invite-item"
  >
    <div class="invite-info">
      <TokenAmount
        :amount="inviteLinkBalance"
        :protocol="PROTOCOLS.aeternity"
      />
      <span class="date">{{ formatDate(createdAt) }}</span>
    </div>
    <CopyText
      class="invite-link"
      :value="link.toString()"
    >
      <span
        class="invite-link-url"
        data-cy="invite-link-url"
      >
        {{ link }}
      </span>
    </CopyText>

    <div
      v-if="!topUp"
      class="centered-buttons"
    >
      <BtnMain
        v-if="inviteLinkBalance > 0"
        class="button"
        variant="muted"
        data-cy="invite-claim"
        :text="$t('pages.invite.claim')"
        @click="claim"
      />
      <BtnMain
        v-else
        class="button"
        variant="muted"
        data-cy="invite-delete"
        :text="$t('pages.invite.delete')"
        @click="deleteItem"
      />
      <BtnMain
        class="button"
        data-cy="invite-top-up"
        :text="$t('pages.invite.top-up')"
        @click="topUp = true"
      />
    </div>
    <template v-else>
      <Field
        v-slot="{ field, errorMessage }"
        v-model="formModel.amount"
        name="amount"
        :rules="{
          required: true,
          max_value: max,
          does_not_exceed_decimals: formModel.selectedAsset?.decimals,
        }"
      >
        <InputAmount
          v-bind="field"
          :model-value="formModel.amount"
          name="amount"
          class="input-amount"
          :label="$t('pages.invite.top-up-with')"
          :message="errorMessage"
          :protocol="PROTOCOLS.aeternity"
          readonly
        />
        <div class="centered-buttons">
          <BtnMain
            variant="muted"
            :text="$t('pages.invite.collapse')"
            data-cy="collapse"
            @click="resetTopUpChanges"
          />
          <BtnMain
            :disabled="!formModel.amount || !!errorMessage"
            :text="$t('pages.invite.top-up')"
            data-cy="send-top-up"
            @click="sendTopUp"
          />
        </div>
      </Field>
    </template>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  nextTick,
  ref,
  watch,
} from 'vue';
import { Field } from 'vee-validate';
import {
  AE_AMOUNT_FORMATS,
  encode,
  Encoding,
} from '@aeternity/aepp-sdk';
import { useRouter } from 'vue-router';

import { getAccountFromSecret } from '@/protocols/aeternity/helpers';
import type { IFormModel } from '@/types';
import { formatDate } from '@/utils';
import {
  APP_LINK_WEB,
  PROTOCOLS,
} from '@/constants';
import { ROUTE_INVITE_CLAIM } from '@/popup/router/routeNames';
import {
  useAccounts,
  useAeSdk,
  useBalances,
  useCurrencies,
  useInvites,
  useMaxAmount,
} from '@/composables';

import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import TokenAmount from './TokenAmount.vue';
import InputAmount from './InputAmount.vue';
import BtnMain from './buttons/BtnMain.vue';
import CopyText from './CopyText.vue';

export default defineComponent({
  components: {
    TokenAmount,
    BtnMain,
    InputAmount,
    CopyText,
    Field,
  },
  props: {
    secretKey: { type: Buffer, required: true },
    createdAt: { type: Number, required: true },
  },
  setup(props, { emit }) {
    const router = useRouter();

    const { getLastActiveProtocolAccount } = useAccounts();
    const { marketData } = useCurrencies();
    const { balance } = useBalances();
    const { getAeSdk } = useAeSdk();
    const { claimInvite, removeInvite, handleInsufficientBalanceError } = useInvites();

    const formModel = ref<IFormModel>({
      amount: '',
      selectedAsset: ProtocolAdapterFactory
        .getAdapter(PROTOCOLS.aeternity)
        .getDefaultCoin(marketData.value!, +balance.value),
    });
    const { max } = useMaxAmount({ formModel });

    const topUp = ref(false);
    const inviteLinkBalance = ref(0);

    const link = computed(() => {
      // nm_ prefix was chosen as a dummy to decode from base58Check
      const secretKey = (encode(Buffer.from(props.secretKey), Encoding.Name)).slice(3);
      return new URL(
        `${router
          .resolve({ name: ROUTE_INVITE_CLAIM })
          .href.replace(/^#/, '')}#${secretKey}`,
        APP_LINK_WEB,
      );
    });

    const address = computed(() => getAccountFromSecret(props.secretKey).address);

    function deleteItem() {
      removeInvite(props.secretKey);
    }

    async function updateBalance() {
      const aeSdk = await getAeSdk();
      inviteLinkBalance.value = parseFloat(
        (await aeSdk
          .getBalance(address.value, { format: AE_AMOUNT_FORMATS.AE })
          .catch(() => 0)
        )
          .toString(),
      );
    }

    async function claim() {
      emit('loading', true);
      try {
        await claimInvite({
          secretKey: Buffer.from(props.secretKey),
          recipientId: getLastActiveProtocolAccount(PROTOCOLS.aeternity)?.address!,
          isMax: true,
        });
        await updateBalance();
      } catch (error: any) {
        if (await handleInsufficientBalanceError(error, true)) {
          return;
        }
        throw error;
      } finally {
        emit('loading', false);
      }
    }

    /**
     * Close the top up form
     */
    async function resetTopUpChanges() {
      formModel.value.amount = '';
      await nextTick();
      topUp.value = false;
    }

    async function sendTopUp() {
      emit('loading', true);
      const aeSdk = await getAeSdk();
      try {
        await aeSdk.spend(
          formModel.value.amount!, // validateAll method confirms the presence of the amount field
          address.value,
          // @ts-ignore
          { denomination: AE_AMOUNT_FORMATS.AE },
        );
        await updateBalance();
        resetTopUpChanges();
      } catch (error: any) {
        if (await handleInsufficientBalanceError(error)) {
          return;
        }
        throw error;
      } finally {
        emit('loading', false);
      }
    }

    watch(
      () => props.secretKey,
      () => updateBalance(),
      { immediate: true },
    );

    return {
      PROTOCOLS,
      formModel,
      max,
      topUp,
      inviteLinkBalance,
      link,
      formatDate,
      resetTopUpChanges,
      deleteItem,
      sendTopUp,
      claim,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.invite-item {
  padding: 1rem var(--screen-padding-x);
  margin: -2px calc(-1 * var(--screen-padding-x)) 0;
  border-style: solid;
  border-color: variables.$color-border;
  border-width: 2px 0;
  text-align: left;
  color: variables.$color-white;
  position: relative;

  .invite-link {
    width: 100%;
    margin: 12px 0;

    &-url {
      display: block;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      font-size: 11px;
      color: variables.$color-white;
    }
  }

  .invite-info {
    font-size: 13px;
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    color: variables.$color-grey-dark;

    .token-amount {
      flex-grow: 1;
    }

    .date {
      font-size: 11px;
      color: variables.$color-white;
      opacity: 0.5;
    }
  }

  .input-amount {
    margin-bottom: var(--gap);
  }

  .centered-buttons {
    display: flex;
    gap: var(--gap);
  }
}
</style>
