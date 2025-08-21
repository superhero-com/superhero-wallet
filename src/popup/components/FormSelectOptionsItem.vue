<template>
  <ListItemWrapper
    class="form-select-options-item"
    :selected="(option.value === value)"
    @click.prevent="$emit('click')"
  >
    <div class="option-wrapper">
      <Avatar
        v-if="option.address"
        :address="option.address"
        size="sm"
      />
      <ProtocolIcon
        v-else-if="isProtocol"
        :protocol="option.value"
      />
      {{ option.text }}
    </div>
  </ListItemWrapper>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
} from 'vue';
import type { IFormSelectOption } from '../../types';

import ListItemWrapper from './ListItemWrapper.vue';
import Avatar from './Avatar.vue';
import ProtocolIcon from './ProtocolIcon.vue';

export default defineComponent({
  components: {
    ListItemWrapper,
    Avatar,
    ProtocolIcon,
  },
  props: {
    option: { type: Object as PropType<IFormSelectOption>, default: () => {} },
    value: { type: [String, Number], default: null },
    isProtocol: { type: Boolean, default: false },
  },
});
</script>

<style lang="scss" scoped>
.form-select-options-item {
  .option-wrapper {
    display: flex;
    gap: 8px;
    align-items: center;
    padding-block: 4px;
  }
}
</style>
