<template>
  <div class="three-dots" :class="{ active: showMenu }" @click="showMenu = !showMenu">
    <!--eslint-disable-line vue-i18n/no-raw-text-->
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
.three-dots {
  position: relative;

  &.active {
    background-color: #21222c;
  }

  &:hover {
    cursor: pointer;
    color: #fff;
  }

  ::v-deep .not-bootstrap-modal-content {
    font-size: 0.75rem;
    border-radius: 0.25rem;
    color: #d9d9d9;
    background-color: #000;
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
        color: #fff;
      }
    }
  }
}
</style>
