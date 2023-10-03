<template>
  <ListItemWrapper
    :to="to"
    replace
    class="name-row"
    @click="$emit('click')"
  >
    <div class="content">
      <Avatar
        :name="name"
        :address="address"
      />
      <div class="name-info">
        <slot />
      </div>
    </div>
  </ListItemWrapper>
</template>

<script>
import Avatar from './Avatar.vue';
import ListItemWrapper from './ListItemWrapper.vue';

export default {
  components: { ListItemWrapper, Avatar },
  props: {
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    to: { type: Object, default: null },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.name-row {
  @extend %face-sans-14-medium;

  padding: 0 12px;

  .content {
    display: flex;
    align-items: center;
    padding: 8px 0;
    color: variables.$color-white;
    text-align: left;
    text-decoration: none;
    transition: 0.2s;
  }

  .name-info {
    margin-left: 8px;
    width: 100%;
  }
}
</style>
