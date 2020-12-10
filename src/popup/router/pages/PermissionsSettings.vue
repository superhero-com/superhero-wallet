<template>
  <div class="popup">
    <div class="permission-row">
      <CheckBox :value="!address" @input="togglePermission('address')" />
      <span :class="{ highlight: !address }">{{ $t('pages.permissions.login') }}</span>
    </div>

    <div class="permission-row">
      <CheckBox :value="!messageSign" @input="togglePermission('messageSign')" />
      <span :class="{ highlight: !messageSign }">
        {{ $t('pages.permissions.message-sign') }}
      </span>
    </div>

    <div class="transaction-sign-limit">
      <div class="permission-row">
        {{ $t('pages.permissions.transaction-sign') }}
        <Input
          :value="transactionSignLimit || ''"
          :error="transactionSignLimitError"
          placeholder="no limit"
          @input="setTransactionSignLimit"
        />
      </div>
      <RangeInput
        :value="transactionSignLimit"
        min="0"
        :max="tokenBalance"
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
        <TokenAmount :amount="tokenBalance" />
      </div>
    </div>
  </div>
</template>

<script>
import { pick } from 'lodash-es';
import { mapState, mapMutations } from 'vuex';
import CheckBox from '../components/CheckBox';
import Input from '../components/Input';
import RangeInput from '../components/RangeInput';
import TokenAmount from '../components/TokenAmount';

export default {
  components: {
    CheckBox,
    Input,
    RangeInput,
    TokenAmount,
  },
  data: () => ({
    transactionSignLimitError: false,
  }),
  subscriptions() {
    return pick(this.$store.state.observables, ['tokenBalance']);
  },
  computed: {
    ...mapState('permissions', [
      'address',
      'messageSign',
      'transactionSignLimit',
      'transactionSignLimitLeft',
    ]),
  },
  methods: {
    ...mapMutations('permissions', ['togglePermission']),
    setTransactionSignLimit(rawValue) {
      const value = +rawValue;
      this.transactionSignLimitError = Number.isNaN(value) || value < 0;
      if (this.transactionSignLimitError) return;
      this.$store.commit('permissions/setTransactionSignLimit', value);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables.scss';

.popup {
  font-size: 15px;
  text-align: left;
  color: $text-color;

  .permission-row {
    display: flex;
    margin: 30px 0;

    + .permission-row {
      margin-top: -16px;
    }

    + .range-input {
      display: block;
      margin: -16px 0 0 0;
    }

    .highlight {
      font-weight: 700;
      color: $white-1;
    }

    .token-amount {
      margin-left: auto;
      color: $white-1;
    }
  }

  .transaction-sign-limit {
    margin: 0 -12px;
    padding: 0 12px;
    border: 1px solid $border-color;
    border-left: 0;
    border-right: 0;

    .input-wrapper {
      position: relative;

      ::v-deep .input {
        margin: 4px 0 0 30px;
        padding-right: 35px;
        width: 120px;
      }

      &::after {
        content: 'AE';
        position: absolute;
        top: 10px;
        left: 120px;
        color: $secondary-color;
      }
    }
  }
}
</style>
