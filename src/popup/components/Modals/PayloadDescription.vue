<template>
  <Default
    :icon="icon || 'info'"
    v-bind="$attrs"
    :title="$t('modals.payload-info.title')"
    class="payload-description"
  >
    <template #msg>
      <div class="msg">{{ $t('modals.payload-info.msg')}}</div>
      <div class="msg">{{ $t('modals.payload-info.desc')}}</div>
    </template>
  </Default>
</template>

<script>
import Default from './Default.vue';

export default {
  components: {
    Default,
  },
  props: {
    msg: { type: String, default: '' },
    option: { type: Object, default: null },
    icon: { type: String, default: null },
  },
};
</script>

<style scoped lang="scss">
  .payload-description {
    text-align: center;

    .msg {
      margin-top: 16px;
    }
  }
</style>
