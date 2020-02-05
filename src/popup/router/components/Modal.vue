<template>
  <div>
    <ae-modal v-if="modal.visible" @close="modal.visible = false">
      <h2 class="modaltitle">{{ modal.title }}</h2>
      <slot name="content"></slot>
    </ae-modal>
  </div>
</template>

<script>
export default {
  props: ['modal'],
};
</script>
