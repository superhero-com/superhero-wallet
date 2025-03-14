<template>
  <div
    class="avatar"
    :class="[
      size,
      (variant) ? `variant-${variant}` : null,
      {
        borderless,
        placeholder: isPlaceholder,
      },
    ]"
    :title="name"
    :style="{ '--color': calculatedColor }"
  >
    <slot>
      <img
        v-if="!isPlaceholder && srcUrl"
        v-show="!isLoading"
        class="avatar-img"
        :src="srcUrl"
        alt="Avatar"
        @load="isLoading = false"
      >
      <ion-skeleton-text v-if="!IS_TRANSITIONS_DISABLED && isLoading" animated />
    </slot>
  </div>
</template>

<script lang="ts">
import { IonSkeletonText } from '@ionic/vue';
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
} from 'vue';

import { checkImageAvailability, getAddressColor } from '@/utils';
import { AE_AVATAR_URL } from '@/protocols/aeternity/config';
import { isContract } from '@/protocols/aeternity/helpers';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';
import { IS_TRANSITIONS_DISABLED } from '@/constants';

const SIZES = ['xs', 'sm', 'rg', 'md', 'lg', 'xl'] as const;
export type AvatarSize = typeof SIZES[number];

const VARIANTS = ['primary', 'grey'] as const;
type AvatarVariant = typeof VARIANTS[number];

export default defineComponent({
  components: {
    IonSkeletonText,
  },
  props: {
    address: { type: String, default: '' },
    name: { type: String, default: null },
    size: {
      type: String as PropType<AvatarSize>,
      default: 'rg',
      validator: (val: AvatarSize) => SIZES.includes(val),
    },
    variant: {
      type: String as PropType<AvatarVariant>,
      default: null,
      validator: (val: AvatarVariant) => VARIANTS.includes(val),
    },
    borderless: Boolean,
    isPlaceholder: Boolean,
  },
  setup(props) {
    const { aeActiveNetworkSettings } = useAeNetworkSettings();

    const profileImageAvailable = ref(false);
    const isLoading = ref(true);

    const avatarUrl = computed(() => `${AE_AVATAR_URL}${props.address}`);

    const calculatedColor = computed(() => (props.address)
      ? getAddressColor(props.address)
      : undefined);

    const profileImageUrl = computed(() => (props.address === '' || isContract(props.address))
      ? null
      : `${aeActiveNetworkSettings.value.backendUrl}/profile/image/${props.address}`);

    const srcUrl = computed(() => profileImageAvailable.value
      ? profileImageUrl.value
      : avatarUrl.value);

    onMounted(async () => {
      profileImageAvailable.value = (
        !!profileImageUrl.value
        && await checkImageAvailability(profileImageUrl.value)
      );
    });

    return {
      IS_TRANSITIONS_DISABLED,
      srcUrl,
      calculatedColor,
      profileImageAvailable,
      isLoading,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/mixins';

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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  object-fit: cover;
  user-select: none;
  flex-shrink: 0;
  border: 1px solid var(--color);
  background-color: $color-bg-2;

  .avatar-img {
    width: 100%;
    height: 100%;
  }

  &.placeholder {
    background-color: rgba($color-white, 0.15);
  }

  &.variant {
    &-primary {
      --color: #{$color-primary};
    }

    &-grey {
      --color: #{$color-grey-border};
    }
  }

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

  &.rg {
    height: $size-rg;
    width: $size-rg;
    border-width: 2px;
  }

  &.lg {
    height: $size-lg;
    width: $size-lg;
    border-width: 2px;
  }

  &.xl {
    height: $size-xl;
    width: $size-xl;
    border-width: 2px;
  }

  &.borderless {
    border: none;
  }

  ion-skeleton-text {
    --border-radius: 16px;
    --background: rgba(#{$color-white-rgb}, 0.1);
    --background-rgb: #{$color-white-rgb};
    width: 100%;
    height: 100%;
    margin: 0;
  }
}
</style>
