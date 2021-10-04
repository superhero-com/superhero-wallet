<template>
  <RouterLink
    v-if="tokenData"
    class="tokens-list-item"
    :to="{
      name: 'token-details',
      params: { id: tokenData.contract },
    }"
  >
    <div class="left">
      <Avatar
        :address="tokenData.contract !== 'aeternity' ? tokenData.contract : ''"
        :src="tokenData.image || null"
      />
      <Truncate :str="tokenData.symbol" />
    </div>
    <TokenAmount
      :amount="+tokenData.convertedBalance || 0"
      :symbol="tokenData.symbol"
      :aex9="tokenData.contract !== 'aeternity'"
      no-symbol
    />
  </RouterLink>
</template>

<script>
import Avatar from '../Avatar.vue';
import Truncate from '../Truncate.vue';
import TokenAmount from '../TokenAmount.vue';

export default {
  components: { Avatar, Truncate, TokenAmount },
  props: { tokenData: { type: Object, default: null } },
};
</script>

<style lang="scss" scoped>
@use '../../../../styles/variables';
@use '../../../../styles/typography';

.tokens-list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 8px 16px;
  color: unset;
  text-decoration: unset;
  background-color: variables.$color-bg-1;
  border-width: 0;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: variables.$color-black;

  &:first-child {
    border-top-width: 1px;
  }

  .left {
    display: flex;
    align-items: center;

    .avatar {
      width: 32px;
      height: 32px;
    }

    .truncate {
      @extend %face-sans-14-medium;

      text-transform: uppercase;
      margin-left: 4px;
      color: variables.$color-blue;
    }
  }
}
</style>
