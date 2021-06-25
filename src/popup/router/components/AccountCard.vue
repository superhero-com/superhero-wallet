<template>
  <div
    :class="[
      'account-card',
      { subaccount: idx !== 0, 'first-subaccount': idx === 1, minified: cardMinified }]"
    :style="cssVar"
  >
    <AccountInfo v-bind="$attrs" />
    <BalanceInfo v-bind="$attrs" />
    <Triangle
      v-if="!cardMinified"
      class="triangle"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import AccountInfo from './AccountInfo';
import BalanceInfo from './BalanceInfo';
import Triangle from '../../../icons/account-card/card-bg-triangle.svg?vue-component';

export default {
  components: {
    AccountInfo,
    BalanceInfo,
    Triangle,
  },
  props: {
    idx: { type: Number, required: true },
    color: { type: String, required: true },
    shift: { type: Number, required: true },
  },
  computed: {
    ...mapState(['cardMinified']),
    cssVar() {
      return {
        '--shift': this.shift,
        '--color': this.color,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.account-card {
  display: flex;
  flex-direction: column;
  position: relative;
  width: 328px;
  height: 169px;
  border-radius: 6px;
  background-image: url('../../../icons/account-card/account-bg-pattern.svg');
  background-color: #0a0e16;
  background-position: calc(var(--shift) * 15px) calc(var(--shift) * 20px);
  transition: height 0.2s ease-out;

  &.minified {
    height: 109px;
    overflow: hidden;
  }

  &.subaccount {
    background-image: url('../../../icons/account-card/subaccount-bg-pattern.svg');
    background-color: variables.$color-bg-1;

    &.first-subaccount {
      background-color: #131b2a;
    }
  }

  &:hover {
    box-shadow: inset 0 0 0 1000px rgba(17, 97, 254, 0.1);
  }

  .account-info {
    padding: 6px 6px 0 6px;
  }

  .balance-info {
    margin-bottom: 0;
  }

  .triangle {
    position: absolute;
    bottom: 0;
    height: 23px;
    width: 23px;
    border-radius: 0 0 5px 0;
    align-self: flex-end;
    color: var(--color);
  }
}
</style>
