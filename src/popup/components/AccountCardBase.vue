<template>
  <BtnBase
    :class="['account-card', { selected }]"
    :to="to"
    :disabled="!selected"
    :bg-color="color"
    data-cy="account-card"
  >
    <div class="top">
      <slot
        name="top"
        :color="color"
      />
    </div>

    <div class="middle">
      <slot name="middle" />
    </div>

    <div class="bottom">
      <slot name="bottom" />
    </div>
  </BtnBase>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from '@vue/composition-api';
import { Location } from 'vue-router';

import { getAddressColor } from '../utils/avatar';

import BtnBase from './buttons/BtnBase.vue';

export default defineComponent({
  components: {
    BtnBase,
  },
  props: {
    address: { type: String, required: true },
    to: { type: Object as PropType<Location>, required: true },
    selected: Boolean,
  },
  setup(props) {
    const color = computed(() => getAddressColor(props.address));

    return {
      color,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

.account-card {
  display: flex;
  flex-direction: column;
  border-radius: variables.$border-radius-card;
  padding: 12px;
  text-decoration: none;
  color: inherit;
  width: 100%;
  height: 192px;

  &.selected {
    .account-info,
    .middle {
      opacity: 1;
    }
  }

  .account-info,
  .middle {
    opacity: 0.5;
  }

  .middle {
    margin-top: 5px;
    text-align: center;
  }

  .bottom {
    flex: 1;
    display: flex;
    align-items: flex-end;
  }
}
</style>
