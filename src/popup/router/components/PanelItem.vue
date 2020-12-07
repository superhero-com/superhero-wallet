<template>
  <Component :is="to ? 'RouterLink' : 'button'" :to="to" @click="$emit('click')" class="panel-item">
    <span class="panel-item-title">{{ title }}</span>
    <p class="panel-item-info">{{ info }}</p>
    <slot v-if="$slots['content']" name="content" />
    <i v-else class="panel-item-arrow-right" />
  </Component>
</template>

<script>
export default {
  props: {
    title: String,
    info: String,
    to: [String, Object],
  },
};
</script>

<style lang="scss" scoped>
.panel-item {
  text-decoration: none;
  transition: 0.4s;
  position: relative;
  padding: 1rem 1.5rem;
  width: 100%;
  display: block;
  font-size: 14px;
  border-bottom: 1px solid #ccc;
  text-align: left;
  border-left: 2px solid transparent;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    border-left: 2px solid #2a9cff;
    background: rgba(99, 99, 99, 0.5);

    .arrow-right {
      right: 20px;
    }
  }

  .panel-item-title {
    color: white;
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
    border: solid white;
    border-width: 0 4px 4px 0;
    display: inline-block;
    padding: 10px;
    transform: rotate(-45deg);
    -webkit-transform: rotate(-45deg);
    border-radius: 4px;
  }

  .panel-item-info {
    color: #ccc;
    font-weight: normal;
    margin: 5px 0;
    width: 90%;
    word-break: break-word;
  }
}
</style>
