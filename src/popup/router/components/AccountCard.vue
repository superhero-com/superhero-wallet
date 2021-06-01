<template>
  <div
    :class="['account-card', { subaccount: idx !== 0, 'first-subaccount': idx === 1 }]"
    :style="cssVar"
  >
    <AccountInfo v-bind="$attrs" />
    <BalanceInfo v-bind="$attrs" />
    <div class="arrows">
      <ButtonPlain @click="$emit('left')">
        <Arrow v-if="left" />
      </ButtonPlain>
      <ButtonPlain @click="$emit('right')">
        <Arrow v-if="right" />
      </ButtonPlain>
    </div>
    <Triangle class="triangle" />
  </div>
</template>

<script>
import AccountInfo from './AccountInfo';
import BalanceInfo from './BalanceInfo';
import ButtonPlain from './ButtonPlain';
import Triangle from '../../../icons/account-card/card-bg-triangle.svg?vue-component';
import Arrow from '../../../icons/account-card/arrow.svg?vue-component';

export default {
  components: {
    AccountInfo,
    BalanceInfo,
    ButtonPlain,
    Triangle,
    Arrow,
  },
  props: {
    idx: { type: Number, required: true },
    color: { type: String, required: true },
    shift: { type: Number, required: true },
    left: Boolean,
    right: Boolean,
  },
  computed: {
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
  height: 169px;
  width: 312px;
  border-radius: 6px;
  background-image: url('../../../icons/account-card/account-bg-pattern.svg');
  background-color: #0a0e16;
  background-position: calc(var(--shift) * 15px) calc(var(--shift) * 20px);

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
    padding: 8px 8px 0 8px;
  }

  .balance-info {
    margin-bottom: 0;
  }

  .triangle {
    height: 23px;
    width: 23px;
    border-radius: 0 0 5px 0;
    align-self: flex-end;
    margin-top: -14px;
    color: var(--color);
  }

  .arrows {
    height: 40px;
    margin-top: -23px;
    display: flex;
    justify-content: space-between;

    .button-plain {
      opacity: 0.33;
      color: variables.$color-white;

      svg {
        height: 40px;
        width: 40px;
      }

      &:last-of-type svg {
        transform: rotate(180deg);
      }

      &:hover {
        opacity: 1;
      }
    }
  }
}
</style>
