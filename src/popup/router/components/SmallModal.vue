<template>
  <div class="not-bootstrap-modal">
    <div class="overlay" @click.stop="$emit('close')" />
    <div class="not-bootstrap-modal-content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.not-bootstrap-modal {
  .overlay {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: 0;
    z-index: 1;
  }

  .not-bootstrap-modal-content {
    position: absolute;
  }
}
</style>
