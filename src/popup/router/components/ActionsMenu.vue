<template>
  <div
    class="actions-menu"
    :class="{ active: showMenu }"
    @click="showMenu = !showMenu"
  >
    <slot name="display" />
    <SmallModal
      v-if="showMenu"
      @close="showMenu = false"
    >
      <slot />
    </SmallModal>
  </div>
</template>

<script>
import SmallModal from './SmallModal';

export default {
  components: {
    SmallModal,
  },
  data() {
    return {
      showMenu: false,
    };
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.actions-menu {
  position: relative;

  &:hover {
    cursor: pointer;
    color: variables.$color-white;
  }

  ::v-deep .content {
    border-radius: 0.25rem;
    color: variables.$color-light-grey;
    background-color: variables.$color-black;
    top: 1.5rem;
    right: 0;
    white-space: nowrap;
  }
}
</style>
