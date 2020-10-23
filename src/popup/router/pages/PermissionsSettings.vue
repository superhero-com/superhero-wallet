<template>
  <div class="popup">
    <ListItem class="permission-row">
      <CheckBox
        :value="!permissions.address"
        @click.native="changePermission('address', !permissions.address)"
        prevent
      />
      <p :class="{ checked: !permissions.address }">{{ $t('pages.permissions.login') }}</p>
    </ListItem>
    <ListItem class="permission-row">
      <CheckBox
        :value="!permissions.messageSign"
        @click.native="changePermission('messageSign', !permissions.messageSign)"
        prevent
      />
      <p :class="{ checked: !permissions.messageSign }">
        {{ $t('pages.permissions.message-sign') }}
      </p>
    </ListItem>
    <ListItem class="permission-row">
      <p class="text-left">{{ $t('pages.permissions.transaction-sign') }}</p>
      <Input
        :value="permissions.transactionSignLimit || ''"
        :error="error"
        placeholder="no limit"
        @input="value => changePermission('transactionSignLimit', value)"
      />
    </ListItem>
    <div>
      <RangeInput
        :value="permissions.transactionSignLimit"
        min="0"
        :max="tokenBalance"
        step="0.1"
        @input="value => changePermission('transactionSignLimit', value)"
      />
    </div>
    <ListItem class="permission-row">
      <p class="text-left grow">{{ $t('pages.permissions.spent-today') }}</p>
      <span class="tokens">
        {{ (permissions.transactionSignLimit - limitLeft).toFixed(2) }}
        <span class="secondary-text">&nbsp;{{ $t('pages.appVUE.aeid') }}</span>
      </span>
      <span class="currency">{{
        `(${formatCurrency(convertToCurrency(permissions.transactionSignLimit - limitLeft))})`
      }}</span>
    </ListItem>
    <ListItem class="permission-row">
      <p class="text-left grow">{{ $t('pages.permissions.left-today') }}</p>
      <span class="tokens">
        {{ limitLeft.toFixed(2) }}
        <span class="secondary-text">&nbsp;{{ $t('pages.appVUE.aeid') }}</span>
      </span>
      <span class="currency">{{ `(${formatCurrency(convertToCurrency(limitLeft))})` }}</span>
    </ListItem>
    <ListItem class="permission-row">
      <p class="text-left grow">{{ $t('pages.account.balance') }}</p>
      <span class="tokens">
        {{ tokenBalance }}
        <span class="secondary-text">&nbsp;{{ $t('pages.appVUE.aeid') }}</span>
      </span>
      <span class="currency">{{ `(${formatCurrency(balanceCurrency)})` }}</span>
    </ListItem>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import CheckBox from '../components/CheckBox';
import ListItem from '../components/ListItem';
import Input from '../components/Input';
import RangeInput from '../components/RangeInput';
import { getLimitLeft, setLimitLeft } from '../../../store/modules/permissions';

export default {
  components: {
    ListItem,
    CheckBox,
    Input,
    RangeInput,
  },
  data: () => ({
    error: false,
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
      // eslint-disable-next-line no-restricted-globals
      if (isNaN(value) || !isFinite(value) || value < 0) {
        this.error = true;
        return;
      }
      this.error = false;
      if (name === 'transactionSignLimit') {
        // eslint-disable-next-line no-param-reassign
        value = +value;
        this.limitLeft = value;
        await setLimitLeft(value, undefined);
      }
      this.$store.commit('permissions/setPermissionValue', { name, value });
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables.scss';

.popup {
  .permission-row {
    margin: 30px 0 14px;
    padding: 0;

    &:nth-child(2),
    &:last-child {
      margin: 0 -12px;
      padding: 0 12px 30px;
      border-bottom: 1px solid $border-color;
    }

    &:nth-last-child(2) {
      margin-top: 0;
    }

    /deep/ .ae-list-item {
      padding: 0;
      align-items: flex-start;
      border: none;

      .input-wrapper {
        position: relative;

        .input {
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
          font-size: 15px;
        }
      }
    }

    p {
      margin: 0;
      font-size: 15px;
      color: $white-1;

      &:not(.checked) {
        font-weight: normal;
        color: $text-color;
      }

      &.grow {
        flex-grow: 1;
      }
    }

    .currency {
      margin-left: 4px;
      color: $gray-2;
    }
  }

  .range-input {
    margin: 0;
  }
}
</style>
