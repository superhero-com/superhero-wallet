<template>
  <div
    :class="['account-card', { subaccount: idx !== 0, 'first-subaccount': idx === 1 }]"
    :style="cssVar"
  >
    <AccountInfo v-bind="$attrs" />
    <BalanceInfo v-bind="$attrs" />
    <div class="arrows">
      <button @click="$emit('left')"><Arrow v-if="left" /></button>
      <button @click="$emit('right')"><Arrow v-if="right" /></button>
    </div>
    <Triangle class="triangle" />
  </div>
</template>

<script>
import AccountInfo from './AccountInfo';
import BalanceInfo from './BalanceInfo';
import Triangle from '../../../icons/account-card/card-bg-triangle.svg?vue-component';
import Arrow from '../../../icons/account-card/arrow.svg?vue-component';

export default {
  components: {
    AccountInfo,
    BalanceInfo,
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
@import '../../../styles/variables';

.account-card {
  display: flex;
  flex-direction: column;
  height: 169px;
  width: 312px;
  border-radius: 6px;
  // stylelint-disable-next-line declaration-colon-newline-after
  background: url('../../../icons/account-card/account-bg-pattern.svg'),
    linear-gradient(rgb(10, 14, 22), rgb(10, 14, 22));
  background-position: calc(var(--shift) * 15px) calc(var(--shift) * 20px), center, center, center;

  &.subaccount {
    background: url('../../../icons/account-card/subaccount-bg-pattern.svg'), $color-bg-1;
    background-position: calc(var(--shift) * 15px) calc(var(--shift) * 20px), center, center, center;
  }

  &.first-subaccount.subaccount {
    // stylelint-disable-next-line declaration-colon-newline-after
    background: url('../../../icons/account-card/subaccount-bg-pattern.svg'),
      linear-gradient(rgb(19, 27, 42), rgb(19, 27, 42));
    background-position: calc(var(--shift) * 15px) calc(var(--shift) * 20px), center, center, center;
  }

  &:hover {
    box-shadow: inset 0 0 0 1000px rgba(17, 97, 254, 0.1);
  }

  .account-info {
    padding: 8px 8px 0 8px;
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

    button {
      padding: 0;
      opacity: 0.33;
      color: $color-white;
      cursor: pointer;

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
