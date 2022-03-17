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
import Avatar from './Avatar.vue';

export default {
  components: { Avatar },
  props: {
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    to: { type: [String, Object], default: null },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.name-row {
  text-decoration: none;
  transition: 0.4s;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  font-size: 14px;
  border-bottom: 1px solid variables.$color-black;
  text-align: left;
  color: variables.$color-white;
  background: variables.$color-bg-2;

  @extend %face-sans-14-medium;

  .name-info {
    margin-left: 8px;
    width: 100%;
  }
}
</style>
