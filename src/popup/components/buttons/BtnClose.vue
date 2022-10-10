<template>
  <button
    class="btn-close"
    v-bind="$attrs"
    @click="$emit('click', $event)"
  >
    <CloseIcon />
  </button>
</template>

<script>
import CloseIcon from '../../../icons/modal/close_modal.svg?vue-component';

export default {
  name: 'BtnClose',
  components: {
    CloseIcon,
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.btn-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  transition: 0.4s;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 4px;
  right: 8px;
  cursor: pointer;

  &:hover {
    background-color: variables.$color-grey-dark-hover;
  }
}
</style>
