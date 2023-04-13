<template>
  <BtnIcon
    class="btn-close"
    v-bind="$attrs"
    :icon="CloseIcon"
    @click="$emit('click', $event)"
  />
</template>

<script>
import BtnIcon from './BtnIcon.vue';
import CloseIcon from '../../../icons/close.svg?vue-component';

export default {
  name: 'BtnClose',
  components: {
    BtnIcon,
  },
  data: () => ({
    CloseIcon,
  }),
};
</script>
