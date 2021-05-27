<template>
  <Component
    :is="to ? 'RouterLink' : 'button'"
    :to="to"
    class="panel-item"
    @click="$emit('click')"
  >
    <span class="panel-item-title">{{ title }}</span>
    <p class="panel-item-info">
      {{ info }}
    </p>
    <slot
      v-if="$slots['content']"
      name="content"
    />
    <i
      v-else
      class="panel-item-arrow-right"
    />
  </Component>
</template>

<script>
export default {
  props: {
    title: { type: String, required: true },
    info: { type: String, default: '' },
    to: { type: [String, Object], default: null },
  },
};
</script>

<style lang="scss" scoped>
@use "../../../styles/variables";

.panel-item {
  text-decoration: none;
  transition: 0.4s;
  position: relative;
  padding: 1rem 1.5rem;
  width: 100%;
  display: block;
  font-size: 14px;
  border-bottom: 1px solid variables.$color-border;
  text-align: left;
  border-left: 2px solid transparent;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    border-left: 2px solid variables.$color-blue;
    .arrow-right {
      right: 20px;
    }
  }

  .panel-item-title {
    color: variables.$color-dark-grey;
    font-size: 18px;
  }

  .checkbox-container,
  .panel-item-arrow-right {
    position: absolute;
    right: 1rem;
    top: 50%;
    margin-top: -15px;

    ::v-deep .checkmark {
      margin-right: 0;
    }
  }

  .panel-item-arrow-right {
    transition: 0.4s;
    border: solid variables.$color-dark-grey;
    border-width: 0 4px 4px 0;
    display: inline-block;
    padding: 10px;
    transform: rotate(-45deg);
    -webkit-transform: rotate(-45deg);
    border-radius: 4px;
  }

  .panel-item-info {
    color: variables.$color-light-grey;
    font-weight: normal;
    margin: 5px 0;
    width: 90%;
    word-break: break-word;
  }
}
</style>
