<template>
  <img
    class="avatar"
    :src="error ? avatar : profileImage"
    :class="[size, { 'with-border': withBorder }]"
    :style="avatarStyle"
    @error="error = true"
  >
</template>

<script lang="ts">
import { computed, defineComponent, ref } from '@vue/composition-api';
import type { INetwork } from '../../types';
import { useGetter } from '../../composables/vuex';
import { AVATAR_URL, isContract } from '../utils';
import { getAddressColor } from '../utils/avatar';

const SIZES = ['xs', 'sm', 'rg', 'md', 'lg', 'xl'];

export default defineComponent({
  props: {
    address: { type: String, default: '' },
    name: { type: String, default: null },
    size: {
      type: String,
      default: 'rg',
      validator: (val: string) => SIZES.includes(val),
    },
    withBorder: Boolean,
    colorfulBorder: Boolean,
  },
  setup(props) {
    const error = ref(false);
    const activeNetwork = useGetter<INetwork>('activeNetwork');
    const avatar = computed(() => `${AVATAR_URL}${props.name || props.address}`);
    const color = computed(() => props.address ? getAddressColor(props.address) : null);
    const profileImage = computed(() => (isContract(props.address) || props.address === '')
      ? ''
      : `${activeNetwork.value.backendUrl}/profile/image/${props.address}`);
    const avatarStyle = computed(() => (props.colorfulBorder) ? { 'border-color': color.value } : null);

    return {
      error,
      avatar,
      color,
      profileImage,
      avatarStyle,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';

$size-xs: 18px;
$size-sm: 24px;
$size-md: 32px;
$size-rg: 40px;
$size-lg: 48px;
$size-xl: 56px;

.avatar {
  width: $size-rg;
  height: $size-rg;
  border-radius: 50%;
  overflow: hidden;
  display: inline-block;
  object-fit: cover;
  user-select: none;
  flex-shrink: 0;

  &.sm {
    height: $size-sm;
    width: $size-sm;
  }

  &.xs {
    height: $size-xs;
    width: $size-xs;
  }

  &.md {
    height: $size-md;
    width: $size-md;
  }

  &.lg {
    height: $size-lg;
    width: $size-lg;
  }

  &.xl {
    height: $size-xl;
    width: $size-xl;
  }

  &.with-border {
    border: 1px solid variables.$color-grey-border-avatar;
  }
}
</style>
