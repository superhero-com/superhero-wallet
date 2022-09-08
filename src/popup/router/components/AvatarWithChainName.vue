<template>
  <div
    class="avatar-with-chain-name"
    :class="{ name: !showAddress }"
  >
    <Avatar
      :size="avatarSize"
      :address="address"
    />
    <span
      class="text"
    >{{ showAddress ? truncateAddress(address) : name }}</span>
  </div>
</template>

<script>
import Avatar from './Avatar.vue';

export default {
  components: {
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
    avatarSize: {
      type: String,
      default: 'md',
    },
    showAddress: Boolean,
  },
  methods: {
    truncateAddress(address) {
      return address.match(/.{1,3}/g).reduce((acc, current) => `${acc} ${current}`);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/mixins';
@use '../../../styles/variables';
@use '../../../styles/typography';

.avatar-with-chain-name {
  @include mixins.flex(flex-start, flex-start);

  gap: 12px;

  .text {
    @extend %face-mono-14-medium;

    text-align: start;
    color: variables.$color-white;
    letter-spacing: 0.15em;
    line-height: 24px;
  }

  .avatar {
    margin-top: 8px;
    background-color: variables.$color-black;
  }

  &.name {
    align-items: center;
    margin-top: 8px;

    .text {
      @extend %face-sans-15-regular;

      letter-spacing: initial;
    }

    .avatar {
      margin-top: 0;
    }
  }
}
</style>
