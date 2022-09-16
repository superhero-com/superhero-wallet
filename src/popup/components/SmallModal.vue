<template>
  <div class="small-modal">
    <div
      class="overlay"
      @click.stop="$emit('close')"
    />
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.small-modal {
  .overlay {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: 0;
  }

  .content {
    position: absolute;
  }
}
</style>
