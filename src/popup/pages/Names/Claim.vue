<template>
  <div class="claim">
    <Field
      v-slot="{ field, errorMessage }"
      name="name"
      :rules="'required|name|name_unregistered'"
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
          {{ AENS_DOMAIN }}
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
      :disabled="!sdk || !name || errorName"
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

<script>
import { mapGetters, mapActions, useStore } from 'vuex';
import { TxBuilderHelper } from '@aeternity/aepp-sdk';
import { useForm, useFieldError, Field } from 'vee-validate';
import {
  MAGNITUDE,
  MODAL_DEFAULT,
  AENS_DOMAIN,
  AENS_NAME_MAX_LENGTH,
  AENS_NAME_AUCTION_MAX_LENGTH,
  checkAensName,
  convertToken,
} from '../../utils';
import InputField from '../../components/InputField.vue';
import CheckBox from '../../components/CheckBox.vue';
import BtnMain from '../../components/buttons/BtnMain.vue';
import BtnHelp from '../../components/buttons/BtnHelp.vue';

export default {
  name: 'Claim',
  components: {
    InputField,
    CheckBox,
    BtnMain,
    BtnHelp,
    Field,
  },
  setup() {
    const errorName = useFieldError('name');
    return {
      errorName,
    };
  },
  data: () => ({
    AENS_DOMAIN,
    name: '',
    loading: false,
    autoExtend: false,
    maxNameLength: AENS_NAME_MAX_LENGTH - AENS_DOMAIN.length,
  }),
  computed: {
    ...mapGetters('sdkPlugin', [
      'sdk',
    ]),
    isNameValid() {
      return this.name && checkAensName(`${this.name}${AENS_DOMAIN}`);
    },
    nameFee() {
      return convertToken(
        TxBuilderHelper.getMinimumNameFee(`${this.name}${AENS_DOMAIN}`),
        -MAGNITUDE,
      ).toFixed(4);
    },
  },
  methods: {
    ...mapActions('modals', {
      openModal: 'open',
    }),
    async claim() {
      const store = useStore();
      const { validate } = useForm();

      if (!await validate()) return;
      const name = `${this.name}${AENS_DOMAIN}`;
      const nameEntry = await this.sdk.api.getNameEntryByName(name).catch(() => false);
      if (nameEntry) {
        this.openModal({
          name: MODAL_DEFAULT,
          title: this.$t('modals.name-exist.msg'),
        });
      } else {
        this.loading = true;
        let claimTxHash;
        try {
          const { salt } = await this.sdk.aensPreclaim(name);
          claimTxHash = (await this.sdk.aensClaim(name, salt, { waitMined: false })).hash;
          if (this.autoExtend) {
            store.commit('names/setPendingAutoExtendName', name);
          }
          this.$router.push({ name: 'account-details-names' });
        } catch (e) {
          let msg = e.message;
          if (msg.includes('is not enough to execute') || e.statusCode === 404) {
            msg = this.$t('pages.names.balance-error');
          }
          this.openModal({
            name: MODAL_DEFAULT,
            icon: 'critical',
            title: msg,
          });
          return;
        } finally {
          this.loading = false;
        }

        try {
          store.dispatch('names/fetchOwned');
          await this.sdk.poll(claimTxHash);
          const isAuction = AENS_NAME_AUCTION_MAX_LENGTH >= name.length;
          if (!isAuction) {
            store.dispatch('names/updatePointer', {
              name,
              address: store.getters.account.address,
            });
          }
        } catch (e) {
          this.openModal({
            name: MODAL_DEFAULT,
            msg: e.message,
          });
        } finally {
          store.dispatch('names/fetchOwned');
        }
      }
    },
  },
};
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
