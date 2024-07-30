<template>
  <Component
    v-bind="$attrs"
    :is="(to) ? 'RouterLink' : 'button'"
    class="button-plain"
    :class="{ extend, avatar }"
    :to="to"
    :type="(to) ? null : 'button'"
  >
    <slot>{{ text }}</slot>
  </Component>
</template>

<script>
export default {
  props: {
    extend: Boolean,
    text: { type: String, default: null },
    to: { type: [Object, String], default: null },
    avatar: Boolean,
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.button-plain {
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  user-select: none;
  transition: $transition-interactive;

  &.avatar {
    width: 24px;
    height: 24px;
  }

  &.extend {
    width: 100%;
  }

  &:disabled {
    opacity: 0.7;
  }
}
</style>
