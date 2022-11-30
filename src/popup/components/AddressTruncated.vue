<template>
  <div>
    <span>{{ truncatedAddress[0] }}</span>
    <span class="dots">&middot;&middot;&middot;</span>
    <span>{{ truncatedAddress[1] }}</span>
  </div>
</template>

<script>
import { computed, defineComponent } from '@vue/composition-api';
import { truncateAddress } from '../utils';

export default defineComponent({
  props: {
    address: { type: String, required: true },
  },
  setup(props) {
    const truncatedAddress = computed(() => truncateAddress(props.address));
    return {
      truncatedAddress,
    };
  },
});
</script>
