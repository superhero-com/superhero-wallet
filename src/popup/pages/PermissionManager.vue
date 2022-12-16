<template>
  <div class="permission-manager">
    <div
      v-if="!editView"
      class="text-description"
    >
      {{ $t('pages.permissions.add-description') }}
    </div>

    <div class="inputs">
      <div class="permission-row">
        <InputField
          v-model="permission.name"
          v-validate="'required'"
          name="name"
          :label="$t('pages.permissions.custom-name')"
          :placeholder="$t('pages.permissions.enter-custom-name')"
          :text-limit="32"
          :message="errors.first('name')"
        />
      </div>

      <div class="permission-row">
        <InputField
          v-model="permission.host"
          v-validate="{
            required: true,
            url: permissionHostValidation
          }"
          type="url"
          name="url"
          :label="$t('pages.permissions.permissions-for-url')"
          :placeholder="$t('pages.permissions.enter-url')"
          :message="errors.first('url')"
        />
      </div>
    </div>
    <div class="permission-row switch">
      <SwitchButton
        v-model="permission.address"
        :label="$t('pages.permissions.login')"
      />
    </div>

    <div class="permission-row switch">
      <SwitchButton
        v-model="permission.messageSign"
        :label="$t('pages.permissions.message-sign')"
      />
    </div>

    <div class="permission-row switch">
      <SwitchButton
        v-model="permission.dailySpendLimit"
        :label="$t('pages.permissions.daily-spending-limit')"
      />
    </div>

    <transition
      name="fade-transition"
      mode="out-in"
    >
      <div
        v-if="permission.dailySpendLimit"
        class="transaction-sign-limit"
      >
        <InputAmount
          v-model="permission.transactionSignLimit"
          v-validate="{
            min_value_exclusive: 0,
          }"
          class="transaction-limit-input"
          name="transactionSignLimit"
          label=" "
          :selected-asset="selectedAsset"
          ae-only
        />

        <div class="limit-info">
          <TokenAmount
            :label="$t('pages.permissions.spent-today')"
            :amount="permission.transactionSignLimitLeft"
          />
        </div>
        <div class="limit-info">
          <TokenAmount
            :label="$t('pages.permissions.left-today')"
            :amount="permission.transactionSignLimit - permission.transactionSignLimitLeft"
          />
        </div>
        <div class="limit-info">
          <TokenAmount
            :label="$t('pages.account.balance')"
            :amount="+balance"
          />
        </div>
      </div>
    </transition>

    <div class="bottom">
      <div class="actions">
        <BtnMain
          class="btn"
          extend
          variant="secondary"
          :to="{ name: 'permissions-settings' }"
        >
          {{ $t('pages.permissions.cancel') }}
        </BtnMain>
        <BtnMain
          class="confirm"
          extend
          :disabled="!permissionChanged"
          @click="onSavePermission"
        >
          {{ $t('pages.permissions.confirm') }}
        </BtnMain>
      </div>
      <BtnMain
        v-if="editView"
        extend
        has-icon
        variant="secondary"
        @click="onRemovePermission"
      >
        <DeleteIcon />
        {{ $t('pages.permissions.delete') }}
      </BtnMain>
    </div>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapGetters } from 'vuex';
import { AETERNITY_CONTRACT_ID, AETERNITY_SYMBOL } from '../utils';
import SwitchButton from '../components/SwitchButton.vue';
import InputAmount from '../components/InputAmountV2.vue';
import InputField from '../components/InputField.vue';
import TokenAmount from '../components/TokenAmount.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import DeleteIcon from '../../icons/trash.svg?vue-component';

export default {
  components: {
    SwitchButton,
    InputField,
    InputAmount,
    TokenAmount,
    BtnMain,
    DeleteIcon,
  },
  data() {
    return {
      permission: {
        host: '',
        name: '',
        address: false,
        messageSign: false,
        transactionSignLimit: 0,
        transactionSignLimitLeft: 0,
        transactionSignFirstAskedOn: null,
      },
      permissionChanged: false,
      originalTransactionSignLimit: null,
    };
  },
  computed: {
    ...mapGetters([
      'formatCurrency',
      'convertToCurrencyFormatted',
      'currentCurrencyRate',
    ]),
    transactionSignLimitError() {
      return (
        Number.isNaN(this.permission.transactionSignLimit)
        || this.permission.transactionSignLimit < 0
      ) ? { status: 'error' } : null;
    },
    host() {
      return this.$route.params.host;
    },
    editView() {
      return !!this.$route.meta?.isEdit;
    },
    selectedAsset() {
      return {
        contractId: AETERNITY_CONTRACT_ID,
        symbol: AETERNITY_SYMBOL,
        current_price: this.currentCurrencyRate,
      };
    },
    permissionHostValidation() {
      return !this.permission.host || !this.permission.host.includes('localhost');
    },
  },
  subscriptions() {
    return pick(this.$store.state.observables, ['balance']);
  },
  mounted() {
    if (this.editView) {
      if (!this.$store.state.permissions[this.host]) {
        this.$router.replace({ name: 'not-found' });
      } else {
        const permission = {
          ...this.$store.state.permissions[this.host],
          host: this.host,
        };

        if (typeof permission.transactionSignLimit === 'string') {
          permission.transactionSignLimit = parseInt(permission.transactionSignLimit, 0);
          this.originalTransactionSignLimit = permission.transactionSignLimit;
        }

        if (typeof permission.transactionSignLimitLeft === 'string') {
          permission.transactionSignLimitLeft = parseInt(permission.transactionSignLimitLeft, 0);
        }

        this.permission = {
          ...permission,
        };
      }
    }

    this.$watch('permission', (permission) => {
      this.permissionChanged = !!permission.name;
    }, { deep: true });
  },
  methods: {
    onRemovePermission() {
      this.$store.commit('permissions/removePermission', this.host);
      this.$router.push({ name: 'permissions-settings' });
    },
    onSavePermission() {
      this.$validator.validateAll().then((result) => {
        if (!result) return;

        const { host } = (new URL(
          `${this.permission.host.includes('http') ? '' : 'http://'}${this.permission.host}`,
        ));

        if (host !== this.host) {
          this.$store.commit('permissions/removePermission', this.host);
        }

        if (!this.permission.dailySpendLimit) {
          this.permission.transactionSignLimit = 0;
        } else if (this.originalTransactionSignLimit !== this.permission.transactionSignLimit) {
          this.permission.transactionSignLimitLeft += (
            this.permission.transactionSignLimit - this.originalTransactionSignLimit
          );
        }

        this.$store.commit('permissions/addPermission', {
          ...this.permission,
          host,
        });
        this.$router.push({ name: 'permissions-settings' });
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.permission-manager {
  padding: 14px;
  color: variables.$color-white;

  .inputs {
    margin-bottom: 32px;
  }

  .permission-row {
    margin: 10px 0;

    &.switch {
      margin-bottom: 0;
      padding-top: 3px;
      padding-right: 5px;
    }
  }

  .transaction-sign-limit {
    .transaction-limit-input {
      margin-bottom: 16px;
    }

    .limit-info {
      padding: 4px 0;
    }
  }

  .bottom {
    padding-top: 38px;
    padding-bottom: 16px;

    .actions {
      width: 100%;
      display: flex;
      padding-bottom: 12px;
      gap: 12px;

      .confirm {
        flex: 1.8;
      }
    }
  }
}
</style>
