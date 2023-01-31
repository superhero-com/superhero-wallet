<template>
  <div class="address-truncated">
    <span>{{ truncatedAddress[0] }}</span>
    <span class="dots">
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

.address-truncated {
  @extend %face-mono-12-medium;

  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  letter-spacing: 0.07em;

  .dots {
    @extend %face-mono-16-regular;

    letter-spacing: -0.25em;
    text-align: center;
    margin-left: -1px;
    margin-right: 3px;
  }
}

</style>
