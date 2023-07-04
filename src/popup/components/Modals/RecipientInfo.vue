<template>
  <Default
    v-bind="{ ...$attrs, resolve }"
    icon="help"
    :title="$t('modals.recipient.title')"
    :close="resolve"
    full-screen
  >
    <template #msg>
      <div class="msg">
        <span class="sub-header">
          {{ $t('modals.recipient.sub-header') }}
        </span>
        <p>
          <i18n-t
            keypath="modals.recipient.msg.publicAddress.msg"
            tag="div"
            scope="global"
          >
            <strong class="title">
              {{ $t('modals.recipient.msg.publicAddress.title') }}:
            </strong>
          </i18n-t>
        </p>
        <p>
          <i18n-t
            keypath="modals.recipient.msg.chain.msg"
            tag="div"
            scope="global"
          >
            <strong class="title">
              {{ $t('modals.recipient.msg.chain.title') }}:
            </strong>
            {{ $t('modals.recipient.msg.chain.linkTitle') }}
          </i18n-t>
        </p>
        <p>
          <i18n-t
            keypath="modals.recipient.msg.url.msg"
            tag="div"
            scope="global"
          >
            <strong class="title">
              {{ $t('modals.recipient.msg.url.title') }}:
            </strong>
          </i18n-t>
        </p>
        <p v-if="UNFINISHED_FEATURES">
          <i18n-t
            keypath="modals.readMore.msg"
            class="help"
            scope="global"
          >
            <a :href="BLOG_CLAIM_TIP_URL">
              {{ $t('modals.readMore.linkTitle') }}
            </a>
          </i18n-t>
        </p>
      </div>
    </template>
    <template #footer>
      <BtnMain
        class="footer"
        extend
        @click="resolve"
      >
        {{ $t('common.ok') }}
      </BtnMain>
    </template>
  </Default>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { ResolveCallback } from '../../../types';
import { BLOG_CLAIM_TIP_URL } from '../../utils/constants';
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
  },
  setup() {
    return {
      BLOG_CLAIM_TIP_URL,
      UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../../styles/share-info';
@use '../../../styles/variables';
@use '../../../styles/typography';
@use '../../../styles/mixins';

.msg {
  @extend %face-sans-14-regular;

  text-align: left;
  line-height: 20px;

  .sub-header {
    @extend %face-sans-16-medium;

    @include mixins.flex(center, center);

    text-align: center;
    margin-bottom: 20px;
  }

  .title {
    color: variables.$color-white;
  }
}
</style>
