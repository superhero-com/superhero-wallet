<template>
  <div class="claim">
    <InputField
      v-model="name"
      v-validate="'required|name|name_unregistered'"
      name="name"
      class="chain-name"
      new-ui
      :label="$t('pages.names.claim.register-name')"
      :error="errors.has('name')"
      :error-message="errors.first('name')"
      :placeholder="$t('pages.names.claim.name-placeholder')"
    >
      <template #label-after>
        <span class="chain-name-counter">
          {{ name.length }}/{{ maxNameLength }}
        </span>
      </template>
      <template #after>
        .chain
      </template>
    </InputField>

    <CheckBox v-model="autoExtend">
      <div class="auto-extend-label">
        {{ $t('pages.names.claim.auto-extend') }}
        <HelpButton
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
      class="explanation"
    >
      <mark>{{ $t('pages.names.claim.short-names.insertion') }}</mark>
    </i18n>

    <Button
      class="btn-register"
      new-ui
      extend
      :disabled="!sdk || !name || errors.any()"
      @click="claim"
    >
      {{
        validName
          ? $t('pages.names.claim.button-price', [nameFee])
          : $t('pages.names.claim.button')
      }}
    </Button>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex';
import { TxBuilderHelper } from '@aeternity/aepp-sdk';
import InputField from '../../components/InputField.vue';
import CheckBox from '../../components/CheckBox.vue';
import HelpButton from '../../components/HelpButton.vue';
import Button from '../../components/Button.vue';
import { MAX_AUCTION_NAME_LENGTH, MAGNITUDE, MODAL_DEFAULT } from '../../../utils/constants';
import { checkAensName, convertToken } from '../../../utils/helper';

export default {
  components: {
    InputField,
    CheckBox,
    HelpButton,
    Button,
  },
  data: () => ({
    name: '',
    loading: false,
    autoExtend: false,
    maxNameLength: 253,
  }),
  computed: {
    ...mapState([
      'sdk',
    ]),
    validName() {
      return this.name && checkAensName(`${this.name}.chain`);
    },
    nameFee() {
      return convertToken(
        TxBuilderHelper.getMinimumNameFee(`${this.name}.chain`),
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
      const name = `${this.name}.chain`;
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
          const isAuction = MAX_AUCTION_NAME_LENGTH >= name.length;
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
@use '../../../../styles/variables';
@use '../../../../styles/typography';

.claim {
  .chain-name {
    margin-bottom: 20px;

    &-counter {
      @extend %face-sans-13-regular;

      color: variables.$color-dark-grey;
    }
  }

  .auto-extend-label {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .explanation {
    margin-top: 16px;
    line-height: 1.4em;
    color: variables.$color-light-grey;

    mark {
      background-color: transparent;
      color: variables.$color-white;
    }
  }
}
</style>
