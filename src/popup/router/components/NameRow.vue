<template>
  <Component :is="to ? 'RouterLink' : 'li'" :to="to" class="name-row" @click="$emit('click')">
    <Avatar :name="name" :address="address" />
    <div class="name-info">
      <slot />
    </div>
  </Component>
</template>

<script>
import Avatar from './Avatar';

export default {
  props: {
    name: String,
    address: String,
    to: [String, Object],
  },
  components: { Avatar },
};
</script>

<style lang="scss" scoped>
@import '../../../styles/variables';

.name-row {
  text-decoration: none;
  transition: 0.4s;
  position: relative;
  padding: 1rem 1.5rem;
  width: 100%;
  display: flex;
  align-items: center;
  font-size: 14px;
  border-bottom: 1px solid #12121b;
  text-align: left;
  border-left: 2px solid transparent;
  color: $text-color;
  background: #21222a;

  .name-info ::v-deep {
    margin-left: 10px;
    width: 90%;
    margin-right: auto;

    .name {
      font-weight: bold;
    }

    .address {
      word-break: break-all;
      font-size: 12px;
      line-height: 14px;
      font-family: IBM Plex Mono, monospace;
      display: inline-block;
    }

    .active-name,
    .pending-name,
    .revoked-name {
      float: right;
      background: #2a9cff;
      color: #fff;
      position: absolute;
      top: 4px;
      right: 4px;
    }

    .pending-name {
      background: $error-color;
    }

    .revoked-name {
      background: #ffa857;
    }
  }
}
</style>
