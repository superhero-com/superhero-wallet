<template>
  <BtnBase
    data-cy="account-card-base"
    class="account-card-base"
    :class="{ active: selected && !pending }"
    :to="to"
    :disabled="!selected || pending"
    :bg-color="color"
    :variant="color ? undefined : 'dark'"
  >
    <div class="top">
      <slot name="top" />
    </div>

    <div class="middle">
      <slot name="middle" />
    </div>

    <div class="bottom">
      <div class="bottom-left">
        <slot name="bottom-left" />
      </div>
      <div class="bottom-right">
        <slot name="bottom-right" />
      </div>
    </div>
  </BtnBase>
</template>

<script lang="ts">
import { PropType, computed, defineComponent } from 'vue';
import { RouteLocationNamedRaw } from 'vue-router';

import { getAddressColor } from '@/utils';

import BtnBase from './buttons/BtnBase.vue';

export const accountCardBaseCommonProps = {
  selected: Boolean,
  pending: Boolean,
};

export default defineComponent({
  components: {
    BtnBase,
  },
  props: {
    address: { type: String, default: '' },
    to: { type: Object as PropType<RouteLocationNamedRaw>, default: null },
    ...accountCardBaseCommonProps,
  },
  setup(props) {
    const color = computed(() => props.address ? getAddressColor(props.address) : undefined);

    return {
      color,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.account-card-base {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 192px;
  padding: 12px;
  border-radius: $border-radius-card;
  text-decoration: none;

  &.active {
    .top,
    .middle,
    .bottom {
      opacity: 1;
    }
  }

  .top,
  .middle,
  .bottom {
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
    justify-content: space-between;
    line-height: 0;
  }
}
</style>
