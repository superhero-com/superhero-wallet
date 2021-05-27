<template>
  <div
    :class="['account-card', { subaccount: idx !== 0, 'first-subaccount': idx === 1 }]"
    :style="cssVar"
  >
    <AccountInfo v-bind="$attrs" />
    <BalanceInfo v-bind="$attrs" />
    <div class="arrows">
      <button @click="$emit('left')">
        <Arrow v-if="left" />
      </button>
      <button @click="$emit('right')">
        <Arrow v-if="right" />
      </button>
    </div>
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
@use '../../../styles/variables';

.account-card {
  display: flex;
  flex-direction: column;
  height: 180px;
  width: 312px;
  border-radius: 24px;
  background-image: url('../../../icons/account-card/account-card.png');
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  box-shadow: 0px 4px 16px rgb(0 0 0 / 10%);

  &.subaccount {
    background-image: url('../../../icons/account-card/account-card.png');
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

  .arrows {
    height: 40px;
    margin-top: -23px;
    display: flex;
    justify-content: space-between;

    button {
      padding: 0;
      opacity: 0.33;
      color: variables.$color-dark-grey;
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
