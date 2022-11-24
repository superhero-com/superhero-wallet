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

    <i18n
      path="pages.names.claim.short-names.message"
      tag="p"
      class="text-description explanation"
    >
      <strong>{{ $t('pages.names.claim.short-names.insertion') }}</strong>
    </i18n>

    <BtnMain
      class="btn-register"
      extend
      :disabled="!sdk || !name || errors.any()"
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
import { mapActions, mapGetters } from 'vuex';
import { TxBuilderHelper } from '@aeternity/aepp-sdk';
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
  },
  data: () => ({
    AENS_DOMAIN,
    name: '',
    loading: false,
    autoExtend: false,
    maxNameLength: AENS_NAME_MAX_LENGTH - AENS_DOMAIN.length,
  }),
  computed: {
    ...mapGetters('sdkPlugin', ['sdk']),
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
      if (!await this.$validator.validateAll()) return;
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
            this.$store.commit('names/setPendingAutoExtendName', name);
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
          this.$store.dispatch('names/fetchOwned');
          await this.sdk.poll(claimTxHash);
          const isAuction = AENS_NAME_AUCTION_MAX_LENGTH >= name.length;
          if (!isAuction) {
            this.$store.dispatch('names/updatePointer', {
              name,
              address: this.$store.getters.account.address,
            });
          }
        } catch (e) {
          this.openModal({
            name: MODAL_DEFAULT,
            msg: e.message,
          });
        } finally {
          this.$store.dispatch('names/fetchOwned');
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
