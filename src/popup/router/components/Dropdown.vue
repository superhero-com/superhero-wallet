<template>
  <ActionsMenu
    class="dropdown"
    @click.native.stop
  >
    <slot
      v-for="slot in Object.keys($slots)"
      :slot="slot"
      :name="slot"
    />
    <ul class="list">
      <li
        v-for="{ text, value } in options"
        :key="value"
        class="list-item"
      >
        <ButtonPlain @click="method(value)">
          {{ text }}
        </ButtonPlain>
      </li>
    </ul>
  </ActionsMenu>
</template>

<script>
import ActionsMenu from './ActionsMenu.vue';
import ButtonPlain from './ButtonPlain.vue';

export default {
  components: { ActionsMenu, ButtonPlain },
  props: {
    options: { type: Array, default: null },
    method: { type: Function, required: true },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.dropdown {
  min-width: 6rem;

  ::v-deep .content {
    width: 100%;
    z-index: 1;
  }

  ul {
    margin: 0;
    padding: 0;
    max-height: 100px;
    overflow: scroll;
    transition: all 0.3s ease-in-out;
    background: variables.$color-bg-3;
    border: 1px solid variables.$color-blue;
    border-radius: 5px;
    scrollbar-width: none;

    .list-item {
      list-style-type: none;

      &:hover {
        background: variables.$color-bg-2;
      }

      .button-plain {
        width: 100%;
        color: variables.$color-white;
        padding: 4px 4px;
      }
    }
  }
}
</style>
