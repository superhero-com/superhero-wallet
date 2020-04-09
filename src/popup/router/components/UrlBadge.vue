<template>
  <Badge :class="type ? `badge-${type}` : ''">
    <template v-if="type === 'verified'">
      <TickIcon />
      {{ $t(`badges.${type}`) }}
    </template>
    <template v-if="type === 'untrusted'"> ! {{ $t(`badges.${type}`) }} </template>
  </Badge>
</template>

<script>
import TickIcon from '../../../icons/tick-icon.svg?vue-component';
import Badge from './Badge';

export default {
  props: {
    type: {
      type: String,
      required: true,
    },
  },
  components: {
    TickIcon,
    Badge,
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.badge {
  color: #000;
  margin-left: auto;
  &.badge-verified {
    background: $accent-color;
  }
  &.badge-untrusted {
    background: $untrusted-badge-bg;
  }
}
</style>
