<template>
  <div>
    <span>{{ truncatedAddress[0] }}</span>
    <span
      class="dots"
      :class="{ 'medium-dots': mediumDots }"
    >
      &middot;&middot;&middot;
    </span>
    <span>{{ truncatedAddress[1] }}</span>
  </div>
</template>

<script>
import { computed, defineComponent } from '@vue/composition-api';
import { truncateAddress } from '../utils';

export default defineComponent({
  props: {
    address: { type: String, required: true },
    mediumDots: Boolean,
  },
  setup(props) {
    const truncatedAddress = computed(() => truncateAddress(props.address));

    return {
      truncatedAddress,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/typography';

.dots {
  @extend %face-mono-15-regular;

  letter-spacing: -0.25em;
  text-align: center;
  margin-left: -1px;
  margin-right: 3px;
}
</style>
