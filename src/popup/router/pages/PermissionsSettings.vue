<template>
  <div class="popup">
    <div class="permission-row">
      <CheckBox
        :value="!permissions.address"
        @input="changePermission('address', !permissions.address)"
      />
      <span :class="{ highlight: !permissions.address }">{{ $t('pages.permissions.login') }}</span>
    </div>

    <div class="permission-row">
      <CheckBox
        :value="!permissions.messageSign"
        @input="changePermission('messageSign', !permissions.messageSign)"
      />
      <span :class="{ highlight: !permissions.messageSign }">
        {{ $t('pages.permissions.message-sign') }}
      </span>
    </div>

    <div class="transaction-sign-limit">
      <div class="permission-row">
        {{ $t('pages.permissions.transaction-sign') }}
        <Input
          :value="permissions.transactionSignLimit || ''"
          :error="transactionSignLimitError"
          placeholder="no limit"
          @input="(value) => changePermission('transactionSignLimit', value)"
        />
      </div>
      <RangeInput
        :value="permissions.transactionSignLimit"
        min="0"
        :max="tokenBalance"
        step="0.1"
        @input="(value) => changePermission('transactionSignLimit', value)"
      />
      <div class="permission-row">
        {{ $t('pages.permissions.spent-today') }}
        <TokenAmount :amount="permissions.transactionSignLimit - limitLeft" />
      </div>
      <div class="permission-row">
        {{ $t('pages.permissions.left-today') }}
        <TokenAmount :amount="limitLeft" />
      </div>
      <div class="permission-row">
        {{ $t('pages.account.balance') }}
        <TokenAmount :amount="tokenBalance" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import CheckBox from '../components/CheckBox';
import Input from '../components/Input';
import RangeInput from '../components/RangeInput';
import TokenAmount from '../components/TokenAmount';
import { getLimitLeft, setLimitLeft } from '../../../store/modules/permissions';

export default {
  components: {
    CheckBox,
    Input,
    RangeInput,
    TokenAmount,
  },
  data: () => ({
    transactionSignLimitError: false,
    limitLeft: 0,
  }),
  computed: {
    ...mapGetters(['tokenBalance', 'convertToCurrency', 'balanceCurrency', 'formatCurrency']),
    permissions() {
      return this.$store.state.permissions;
    },
  },
  async mounted() {
    const storageLimitLeft = (await getLimitLeft())?.limitLeft;
    this.limitLeft =
      storageLimitLeft === undefined ? this.permissions.transactionSignLimit : storageLimitLeft;
  },
  methods: {
    async changePermission(name, value) {
      let newValue = value;
      if (name === 'transactionSignLimit') {
        newValue = +value;
        if (Number.isNaN(newValue) || newValue < 0) {
          this.transactionSignLimitError = true;
          return;
        }
        this.limitLeft = newValue;
        await setLimitLeft(newValue, undefined);
      }
      this.transactionSignLimitError = false;
      this.$store.commit('permissions/setPermissionValue', { name, value: newValue });
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
