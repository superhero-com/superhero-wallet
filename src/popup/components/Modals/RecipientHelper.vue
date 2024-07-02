<template>
  <Default
    v-bind="{ ...$attrs, resolve }"
    :icon="icon"
    :title="title"
    :close="resolve"
  >
    <template #msg>
      <div class="msg">
        {{ msg }}
        <p v-if="UNFINISHED_FEATURES">
          <section class="help">
            {{ $t('modals.readMore.msg') }}
            <a :href="AE_BLOG_CLAIM_TIP_URL">
              {{ $t('modals.readMore.linkTitle') }}
            </a>
          </section>
        </p>
      </div>
    </template>
    <template #footer>
      <BtnMain
        class="footer"
        @click="resolve"
      >
        {{ $t('common.ok') }}
      </BtnMain>
    </template>
  </Default>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ResolveCallback } from '@/types';
import { UNFINISHED_FEATURES } from '@/constants';
import { AE_BLOG_CLAIM_TIP_URL } from '@/protocols/aeternity/config';

import Default from './Default.vue';
import BtnMain from '../buttons/BtnMain.vue';

export default defineComponent({
  components: {
    Default,
    BtnMain,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    close: { type: Function, default: null },
    title: { type: String, default: '' },
    msg: { type: String, default: '' },
    type: { type: String, default: '' },
    icon: { type: String, default: '' },
  },
  setup() {
    return {
      AE_BLOG_CLAIM_TIP_URL,
      UNFINISHED_FEATURES,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/share-info';
@use '@/styles/variables' as *;
@use '@/styles/typography';

.msg,
.help {
  @extend %face-sans-14-regular;

  text-align: center;
  line-height: 20px;

  a {
    cursor: pointer;
    text-decoration: none;
    color: $color-primary;
  }
}

.footer {
  width: 100% !important;
}
</style>
