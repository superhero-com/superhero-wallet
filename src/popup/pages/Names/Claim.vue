<template>
  <div class="claim">
    <InputField
      v-model="name"
      v-validate="'required|name|name_unregistered'"
      name="name"
      class="chain-name"
      :label="$t('pages.names.claim.register-name')"
      :message="errors.first('name')"
      :placeholder="$t('pages.names.claim.name-placeholder')"
    >
      <template #label-after>
        <span class="chain-name-counter">
          {{ name.length }}/{{ maxNameLength }}
        </span>
      </template>
      <template #after>
        {{ AENS_DOMAIN }}
      </template>
    </InputField>

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
      :disabled="!isSdkReady || !name || errors.any()"
      @click="claim"
    >
      {{
        isNameValid
          ? $t('pages.names.claim.button-price', [nameFee])
          : $t('pages.names.claim.button')
      }}
    </BtnMain>
  </div>
</template>

<script lang="ts">
import {
  defineComponent, ref, computed, getCurrentInstance,
} from 'vue';
import { TxBuilderHelper } from '@aeternity/aepp-sdk';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import {
  AETERNITY_COIN_PRECISION,
  AENS_DOMAIN,
  AENS_NAME_MAX_LENGTH,
  AENS_NAME_AUCTION_MAX_LENGTH,
  checkAensName,
  convertToken,
} from '../../utils';
import { ROUTE_ACCOUNT_DETAILS_NAMES } from '../../router/routeNames';
import { useAccounts, useModals, useSdk } from '../../../composables';
import InputField from '../../components/InputField.vue';
import CheckBox from '../../components/CheckBox.vue';
import BtnMain from '../../components/buttons/BtnMain.vue';
import BtnHelp from '../../components/buttons/BtnHelp.vue';

export default defineComponent({
  name: 'Claim',
  components: {
    InputField,
    CheckBox,
    BtnMain,
    BtnHelp,
  },
  setup(props) {
    const instance = getCurrentInstance();
    const root = instance?.root as any;
    const router = useRouter();
    const store = useStore();

    const name = ref('');
    const autoExtend = ref(false);
    const loading = ref(false);
    const maxNameLength = AENS_NAME_MAX_LENGTH - AENS_DOMAIN.length;

    const isNameValid = computed(() => name.value && checkAensName(`${name.value}${AENS_DOMAIN}`));

    const nameFee = computed(() => convertToken(
      TxBuilderHelper.getMinimumNameFee(`${name.value}${AENS_DOMAIN}`),
      -AETERNITY_COIN_PRECISION,
    ).toFixed(4));

    const { getSdk, isSdkReady } = useSdk({ store });

    async function claim() {
      if (!await (root as any).$validator.validateAll()) return;

      const { openDefaultModal } = useModals();
      const { activeAccount } = useAccounts({ store });

      const sdk = await getSdk();

      const fullName = `${name.value}${AENS_DOMAIN}`;
      const nameEntry = await sdk.api.getNameEntryByName(fullName).catch(() => false);

      if (nameEntry) {
        openDefaultModal({
          title: root.$t('modals.name-exist.msg'),
        });
      } else {
        loading.value = true;
        let claimTxHash;

        try {
          const { salt } = await sdk.aensPreclaim(fullName);
          claimTxHash = (await sdk.aensClaim(fullName, salt, { waitMined: false })).hash;
          if (autoExtend.value) {
            store.commit('names/setPendingAutoExtendName', fullName);
          }
          router.push({ name: ROUTE_ACCOUNT_DETAILS_NAMES });
        } catch (e: any) {
          let msg = e.message;
          if (msg.includes('is not enough to execute') || e.statusCode === 404) {
            msg = root.$t('pages.names.balance-error');
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
          await sdk.poll(claimTxHash);
          if (AENS_NAME_AUCTION_MAX_LENGTH < fullName.length) {
            store.dispatch('names/updatePointer', {
              name: fullName,
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
      AENS_DOMAIN,
      autoExtend,
      isNameValid,
      isSdkReady,
      name,
      nameFee,
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
