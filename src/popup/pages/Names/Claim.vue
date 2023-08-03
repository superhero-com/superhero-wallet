<template>
  <div class="claim">
    <Field
      v-slot="{ field, errorMessage }"
      name="name"
      :rules="{
        enough_ae: totalNameClaimAmount.toString(),
        required: true,
        name: true,
        name_unregistered: true,
      }"
    >
      <InputField
        v-bind="field"
        v-model="name"
        name="name"
        class="chain-name"
        :label="$t('pages.names.claim.register-name')"
        :message="errorMessage"
        :placeholder="$t('pages.names.claim.name-placeholder')"
      >
        <template #label-after>
          <span class="chain-name-counter">
            {{ name.length }}/{{ maxNameLength }}
          </span>
        </template>
        <template #after>
          <span class="aens-domain">{{ AE_AENS_DOMAIN }}</span>
        </template>
      </InputField>
    </Field>

    <CheckBox v-model="autoExtend">
      <div class="auto-extend-label">
        {{ $t('pages.names.claim.auto-extend') }}
        <BtnHelp
          :title="$t('modals.autoextend-help.title')"
          :msg="$t('modals.autoextend-help.msg')"
          :class="{ active: autoExtend }"
        />
      </div>
    </CheckBox>

    <Loader v-if="loading" />

    <i18n-t
      keypath="pages.names.claim.short-names.message"
      tag="p"
      class="text-description explanation"
      scope="global"
    >
      <strong>{{ $t('pages.names.claim.short-names.insertion') }}</strong>
    </i18n-t>

    <BtnMain
      class="btn-register"
      extend
      :disabled="!isAeSdkReady || !name || errorName"
      @click="claim"
    >
      {{
        isNameValid
          ? $t('pages.names.claim.button-price', [totalNameClaimAmount.toFixed(4)])
          : $t('pages.names.claim.button')
      }}
    </BtnMain>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import {
  AensName,
  buildTx,
  commitmentHash,
  getExecutionCost,
  getMinimumNameFee,
  Tag,
  unpackTx,
} from '@aeternity/aepp-sdk';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useForm, useFieldError, Field } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import BigNumber from 'bignumber.js';

import { STUB_ADDRESS, STUB_NONCE } from '@/constants/stubs';
import { useAccounts, useModals, useAeSdk } from '@/composables';
import { ROUTE_ACCOUNT_DETAILS_NAMES } from '@/popup/router/routeNames';
import { isAensNameValid } from '@/protocols/aeternity/helpers';
import {
  AE_COIN_PRECISION,
  AE_AENS_DOMAIN,
  AE_AENS_NAME_MAX_LENGTH,
  AE_AENS_NAME_AUCTION_MAX_LENGTH,
} from '@/protocols/aeternity/config';

import InputField from '../../components/InputField.vue';
import CheckBox from '../../components/CheckBox.vue';
import BtnMain from '../../components/buttons/BtnMain.vue';
import BtnHelp from '../../components/buttons/BtnHelp.vue';

const STUB_NAME_SALT = 4204563566073083;

export default defineComponent({
  name: 'Claim',
  components: {
    InputField,
    CheckBox,
    BtnMain,
    BtnHelp,
    Field,
  },
  setup() {
    const router = useRouter();
    const store = useStore();
    const { validate } = useForm();
    const errorName = useFieldError('name');
    const { t } = useI18n();

    const name = ref('');
    const autoExtend = ref(false);
    const loading = ref(false);
    const maxNameLength = AE_AENS_NAME_MAX_LENGTH - AE_AENS_DOMAIN.length;

    const fullName = computed((): AensName => `${name.value}${AE_AENS_DOMAIN}`);
    const isNameValid = computed(() => name.value && isAensNameValid(fullName.value));

    const totalNameClaimAmount = computed(() => !name.value.length
      ? BigNumber(0)
      : BigNumber(unpackTx(
          buildTx({
            tag: Tag.NamePreclaimTx,
            accountId: STUB_ADDRESS,
            nonce: STUB_NONCE,
            commitmentId: commitmentHash(fullName.value, STUB_NAME_SALT),
          }) as any,
          Tag.NamePreclaimTx,
      ).fee)
        .plus(getExecutionCost(buildTx({
          tag: Tag.NameClaimTx,
          accountId: STUB_ADDRESS,
          nonce: STUB_NONCE,
          name: fullName.value,
          nameSalt: 0,
          nameFee: getMinimumNameFee(fullName.value),
        }) as any).toString())
        .shiftedBy(-AE_COIN_PRECISION));

    const { getAeSdk, isAeSdkReady } = useAeSdk({ store });

    async function claim() {
      if (!(await validate()).valid) {
        return;
      }

      const { openDefaultModal } = useModals();
      const { activeAccount } = useAccounts({ store });

      const aeSdk = await getAeSdk();
      const nameEntry = await aeSdk.api.getNameEntryByName(fullName.value).catch(() => false);

      if (nameEntry) {
        openDefaultModal({
          title: t('modals.name-exist.msg'),
        });
      } else {
        loading.value = true;
        let claimTxHash;

        try {
          const { salt } = await aeSdk.aensPreclaim(fullName.value);
          claimTxHash = (await aeSdk.aensClaim(fullName.value, salt, { waitMined: false })).hash;
          if (autoExtend.value) {
            store.commit('names/setPendingAutoExtendName', fullName.value);
          }
          router.push({ name: ROUTE_ACCOUNT_DETAILS_NAMES });
        } catch (e: any) {
          let msg = e.message;
          if (msg.includes('is not enough to execute') || e.statusCode === 404) {
            msg = t('pages.names.balance-error');
          }
          openDefaultModal({
            icon: 'critical',
            msg,
          });
          return;
        } finally {
          loading.value = false;
        }

        try {
          store.dispatch('names/fetchOwned');
          await aeSdk.poll(claimTxHash);
          if (AE_AENS_NAME_AUCTION_MAX_LENGTH < fullName.value.length) {
            store.dispatch('names/updatePointer', {
              name: fullName.value,
              address: activeAccount.value.address,
            });
          }
        } catch (e: any) {
          openDefaultModal({ msg: e.message });
        } finally {
          store.dispatch('names/fetchOwned');
        }
      }
    }

    return {
      AE_AENS_DOMAIN,
      autoExtend,
      isNameValid,
      isAeSdkReady,
      name,
      totalNameClaimAmount,
      errorName,
      loading,
      maxNameLength,
      claim,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.claim {
  .chain-name {
    margin-bottom: 6px;

    &-counter {
      @extend %face-sans-13-regular;

      color: variables.$color-grey-dark;
    }

    .aens-domain {
      user-select: none;
    }
  }

  .auto-extend-label {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .explanation {
    margin-top: 10px;
  }

  .btn-register {
    margin-top: 20px;
  }
}
</style>
