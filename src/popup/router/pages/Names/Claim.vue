<template>
  <div class="claim">
    <InputField
      v-model="name"
      v-validate="'required|name|name_unregistered'"
      name="name"
      class="name-input"
      :label="$t('pages.names.claim.register-name')"
      :message="errors.first('name')"
      :placeholder="$t('pages.names.claim.name-placeholder')"
    >
      <template #after>
        <span class="name-input-after">.chain</span>
      </template>
    </InputField>
    <div class="flex-row">
      <CheckBox v-model="autoExtend">
        {{ $t('pages.names.claim.auto-extend') }}
        <HelpButton
          :title="$t('modals.autoextend-help.title')"
          :msg="$t('modals.autoextend-help.msg')"
          :class="{ active: autoExtend }"
        />
      </CheckBox>
      <label>{{ name.length }}/{{ maxNameLength }}</label>
    </div>
    <Loader v-if="loading" />
    <i18n
      path="pages.names.claim.short-names.message"
      tag="p"
      class="explanation"
    >
      <mark>{{ $t('pages.names.claim.short-names.insertion') }}</mark>
    </i18n>
    <Button
      :disabled="!sdk || !name || errors.any()"
      @click="claim"
    >
      {{
        validName ?
          $t('pages.names.claim.button-price', [nameFee])
          : $t('pages.names.claim.button')
      }}
    </Button>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { TxBuilderHelper } from '@aeternity/aepp-sdk';
import InputField from '../../components/InputField.vue';
import CheckBox from '../../components/CheckBox.vue';
import HelpButton from '../../components/HelpButton.vue';
import Button from '../../components/Button.vue';
import { MAX_AUCTION_NAME_LENGTH, MAGNITUDE } from '../../../utils/constants';
import { checkAensName, convertToken } from '../../../utils/helper';

export default {
  components: {
    InputField, CheckBox, HelpButton, Button,
  },
  data: () => ({
    name: '',
    loading: false,
    autoExtend: false,
    maxNameLength: 253,
  }),
  computed: {
    ...mapState(['sdk']),
    validName() {
      return this.name && checkAensName(`${this.name}.chain`);
    },
    nameFee() {
      return convertToken(TxBuilderHelper.getMinimumNameFee(`${this.name}.chain`), -MAGNITUDE).toFixed(4);
    },
  },
  methods: {
    async claim() {
      if (!await this.$validator.validateAll()) return;
      const name = `${this.name}.chain`;
      const nameEntry = await this.sdk.api.getNameEntryByName(name).catch(() => false);
      if (nameEntry) {
        this.$store.dispatch('modals/open', {
          name: 'default',
          title: this.$t('modals.name-exist.msg'),
        });
      } else {
        this.loading = true;
        let claimTxHash;
        try {
          const { salt } = await this.sdk.aensPreclaim(name);
          claimTxHash = (await this.sdk.aensClaim(name, salt, { waitMined: false })).hash;
          if (this.autoExtend) this.$store.commit('names/setPendingAutoExtendName', name);
          this.$router.push({ name: 'name-list' });
        } catch (e) {
          let msg = e.message;
          if (msg.includes('is not enough to execute') || e.statusCode === 404) {
            msg = this.$t('pages.names.balance-error');
          }
          this.$store.dispatch('modals/open', { name: 'default', icon: 'critical', title: msg });
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
          this.$store.dispatch('modals/open', { name: 'default', msg: e.message });
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
  margin: 16px 16px 0 16px;
  display: flex;
  flex-direction: column;
  color: variables.$color-dark-grey;

  .flex-row {
    display: flex;
    justify-content: space-between;

    .checkbox-container {
      &:hover ::v-deep .checkmark {
        background-color: variables.$color-black;
        border-color: variables.$color-border;
      }

      ::v-deep .checkmark {
        margin-right: 8px;
      }

      .hint-button {
        margin-left: 8px;

        &.active:not(:hover) {
          opacity: 1;
        }

        &:hover {
          opacity: unset;
          color: variables.$color-blue;
          background-color: rgba(17, 97, 254, 0.44);
        }
      }
    }

    .checkbox-container + label {
      font-size: 12px;
    }
  }

  .name-input {
    margin: 8px auto;
    width: 100%;

    &-after {
      color: variables.$color-dark-grey;

      @extend %face-sans-14-regular;
    }
  }

  .explanation {
    @extend %face-sans-15-medium;

    color: variables.$color-light-grey;
    margin: 24px 16px 16px 16px;

    mark {
      background-color: transparent;
      color: variables.$color-white;
    }
  }
}
</style>
