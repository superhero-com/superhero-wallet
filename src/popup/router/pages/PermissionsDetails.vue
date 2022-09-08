<template>
  <div class="permissions-details">
    <p>{{ host }}</p>
    <div class="permission-row">
      <CheckBox
        :value="address"
        @input="togglePermission({ host, name: 'address' })"
      />
      <span :class="{ highlight: address }">{{ $t('pages.permissions.login') }}</span>
    </div>

    <div class="permission-row">
      <CheckBox
        :value="messageSign"
        @input="togglePermission({ host, name: 'messageSign' })"
      />
      <span :class="{ highlight: messageSign }"> {{ $t('pages.permissions.message-sign') }}</span>
    </div>

    <div class="transaction-sign-limit">
      <InputField
        :value="transactionSignLimit || ''"
        :message="transactionSignLimitError"
        :label="$t('pages.permissions.transaction-sign')"
        placeholder="always ask"
        @input="setTransactionSignLimit"
      >
        <template #after>
          <span class="currency-name">AE</span>
        </template>
      </InputField>
      <InputRange
        :value="transactionSignLimit"
        min="0"
        :max="+balance"
        step="0.1"
        @input="setTransactionSignLimit"
      />
      <div class="permission-row">
        {{ $t('pages.permissions.spent-today') }}
        <TokenAmount :amount="transactionSignLimit - transactionSignLimitLeft" />
      </div>
      <div class="permission-row">
        {{ $t('pages.permissions.left-today') }}
        <TokenAmount :amount="transactionSignLimitLeft" />
      </div>
      <div class="permission-row">
        {{ $t('pages.account.balance') }}
        <TokenAmount :amount="+balance" />
      </div>
    </div>
    <Button
      bold
      @click="removePermissions"
    >
      {{ $t('pages.permissions.delete') }}
    </Button>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapState, mapMutations } from 'vuex';
import CheckBox from '../components/CheckBox.vue';
import InputField from '../components/InputField.vue';
import InputRange from '../components/InputRange.vue';
import TokenAmount from '../components/TokenAmount.vue';
import Button from '../components/Button.vue';

export default {
  components: {
    CheckBox,
    InputField,
    InputRange,
    TokenAmount,
    Button,
  },
  data: () => ({
    transactionSignLimitError: false,
  }),
  subscriptions() {
    return pick(this.$store.state.observables, ['balance']);
  },
  computed: {
    host() {
      return this.$route.params.host;
    },
    ...mapState(
      'permissions',
      ['address', 'messageSign', 'transactionSignLimit', 'transactionSignLimitLeft'].reduce(
        (c, s) => ({
          ...c,
          [s](state) {
            return state[this.host][s];
          },
        }),
        {},
      ),
    ),
  },
  mounted() {
    if (!this.$store.state.permissions[this.host]) this.$router.replace({ name: 'not-found' });
  },
  methods: {
    ...mapMutations('permissions', ['togglePermission']),
    setTransactionSignLimit(rawValue) {
      const value = +rawValue;
      this.transactionSignLimitError = Number.isNaN(value) || value < 0;
      if (this.transactionSignLimitError) return;
      this.$store.commit('permissions/setTransactionSignLimit', { host: this.host, value });
    },
    removePermissions() {
      this.$store.commit('permissions/removeAeppPermissions', this.host);
      this.$router.push({ name: 'permissions-settings' });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables.scss';

.permissions-details {
  font-size: 15px;
  text-align: left;
  color: variables.$color-white;

  p {
    text-align: center;
  }

  .permission-row {
    display: flex;
    margin: 30px 0;

    + .permission-row {
      margin-top: -16px;
    }

    + .input-range {
      display: block;
      margin: -16px 0 0 0;
    }

    .highlight {
      font-weight: 700;
      color: variables.$color-white;
    }

    .token-amount {
      margin-left: auto;
      color: variables.$color-white;
    }
  }

  .transaction-sign-limit {
    margin: 0 -12px;
    padding: 0 12px;
    border: 1px solid variables.$color-border;
    border-left: 0;
    border-right: 0;

    .currency-name {
      color: variables.$color-blue;
    }
  }
}
</style>
