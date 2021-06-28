<template>
  <div
    class="account-item"
    :class="{ 'has-name': name }"
  >
    <div
      v-if="name"
      class="head"
    >
      <Avatar
        :address="address"
        :name="name"
        size="mid"
      />
      <span class="name">{{ name }}</span>
    </div>
    <Avatar
      v-else
      :address="address"
      size="mid"
    />
    <span class="address">{{ address }}</span>
  </div>
</template>

<script>
import Avatar from './Avatar';

export default {
  components: { Avatar },
  props: {
    address: { type: String, required: true },
    name: { type: String, default: '' },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.account-item {
  display: flex;
  align-items: center;

  .avatar {
    margin-right: 8px;
  }

  .address {
    @extend %face-mono-10-medium;

    color: variables.$color-light-grey;
    text-align: left;
    word-break: break-all;
  }

  &.has-name {
    flex-direction: column;
    align-items: flex-start;

    .head {
      display: flex;
      align-items: center;
      margin-bottom: 4px;

      .name {
        @extend %face-sans-14-bold;
      }
    }
  }
}
</style>
