<template>
  <Component
    :is="to ? 'RouterLink' : 'li'"
    :to="to"
    class="name-row"
    @click="$emit('click')"
  >
    <Avatar
      :name="name"
      :address="address"
    />
    <div class="name-info">
      <slot />
    </div>
  </Component>
</template>

<script>
import Avatar from './Avatar';

export default {
  components: { Avatar },
  props: {
    name: String,
    address: String,
    to: [String, Object],
  },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/typography';

.name-row {
  text-decoration: none;
  transition: 0.4s;
  position: relative;
  padding: 1rem 1.5rem;
  width: 100%;
  display: flex;
  align-items: center;
  font-size: 14px;
  border-bottom: 1px solid $color-bg-3;
  text-align: left;
  border-left: 2px solid transparent;
  color: $color-white;
  background: $color-bg-1;

  .name-info ::v-deep {
    margin-left: 10px;
    width: 90%;
    margin-right: auto;

    .name {
      font-weight: bold;
    }

    .address {
      word-break: break-all;

      @extend %face-sans-12-regular;

      line-height: 14px;
      display: inline-block;
    }

    .active-name,
    .pending-name {
      float: right;
      background: $color-blue;
      color: $color-white;
      position: absolute;
      top: 4px;
      right: 4px;
    }

    .pending-name {
      background: $color-error;
    }
  }
}
</style>
