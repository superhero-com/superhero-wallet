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
  @extend %face-sans-14-medium;

  display: flex;
  align-items: center;
  padding: 8px var(--screen-padding-x);
  margin-left: calc(-1 * var(--screen-padding-x));
  margin-right: calc(-1 * var(--screen-padding-x));
  color: variables.$color-white;
  background: variables.$color-bg-2;
  text-align: left;
  text-decoration: none;
  transition: 0.2s;

  &:hover {
    background-color: variables.$color-bg-4-hover;
  }

  .name-info {
    margin-left: 8px;
    width: 100%;
  }
}
</style>
