<template>
  <div
    class="avatar-with-chain-name"
    :class="{ 'only-name': (name || !showAddress) && !hideAvatar }"
  >
    <Avatar
      v-if="!hideAvatar"
      v-bind="$attrs"
      :size="avatarSize"
      :address="address"
    />

    <div
      v-if="name || !showAddress"
      class="chain-name"
      :class="{ centered: hideAvatar }"
    >
      {{ name }}
    </div>
    <AddressFormatted
      v-else
      v-bind="$attrs"
      :address="address"
      columns
    />
  </div>
</template>

<script>
import Avatar from './Avatar.vue';
import AddressFormatted from './AddressFormatted.vue';

export default {
  components: {
    AddressFormatted,
    Avatar,
  },
  props: {
    address: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: '',
    },
    hideAvatar: Boolean,
    avatarSize: {
      type: String,
      default: 'md',
    },
    showAddress: Boolean,
  },
};
</script>

<style lang="scss" scoped>
@use '@/styles/mixins';
@use '@/styles/variables' as *;
@use '@/styles/typography';

.avatar-with-chain-name {
  @include mixins.flex(flex-start, flex-start);

  width: 100%;
  gap: 8px;

  .avatar {
    margin-top: 8px;
    background-color: $color-black;
  }

  .chain-name {
    @extend %face-sans-15-medium;

    text-align: left;
    opacity: 0.75;
  }

  .centered {
    @extend %face-sans-15-medium;

    opacity: 1;
    text-align: center;
    color: $color-white;
    width: 100%;
  }

  &.only-name {
    align-items: center;

    .avatar {
      margin-top: 0;
    }
  }
}
</style>
