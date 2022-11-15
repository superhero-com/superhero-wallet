<template>
  <BtnIcon
    class="btn-close"
    v-bind="$attrs"
    @click="$emit('click', $event)"
  >
    <CloseIcon />
  </BtnIcon>
</template>

<script>
import BtnIcon from './BtnIcon.vue';
import CloseIcon from '../../../icons/modal/close_modal.svg?vue-component';

export default {
  name: 'BtnClose',
  components: {
    BtnIcon,
    CloseIcon,
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.btn-close {
  position: absolute;
  top: 4px;
  right: 8px;
}
</style>
