<template>
  <div class="three-dots" :class="{ active: showMenu }" @click="showMenu = !showMenu">
    •••
    <SmallModal v-if="showMenu" @close="showMenu = false">
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
@import '../../../styles/variables';

.three-dots {
  position: relative;

  &.active {
    background-color: $black-1;
  }

  &:hover {
    cursor: pointer;
    color: $color-white;
  }

  ::v-deep .not-bootstrap-modal-content {
    font-size: 0.75rem;
    border-radius: 0.25rem;
    color: #d9d9d9;
    background-color: $color-black;
    padding: 0.5rem;
    top: 1.2rem;
    right: 0;
    white-space: nowrap;

    & > div {
      padding-bottom: 0.5rem;

      &:last-child {
        padding-bottom: 0;
      }

      &:hover {
        cursor: pointer;
        color: $color-white;
      }
    }
  }
}
</style>
