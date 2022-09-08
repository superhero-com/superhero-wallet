<template>
  <Default
    v-bind="{ ...$attrs, resolve }"
    icon="help"
    :title="$t('modals.recipient.title')"
    :close="resolve"
  >
    <template #msg>
      <div class="msg">
        <span class="sub-header">
          {{ $t('modals.recipient.sub-header') }}
        </span>
        <p>
          <i18n
            path="modals.recipient.msg.publicAddress.msg"
            tag="div"
          >
            <strong class="title">
              {{ $t('modals.recipient.msg.publicAddress.title') }}:
            </strong>
          </i18n>
        </p>
        <p>
          <i18n
            path="modals.recipient.msg.chain.msg"
            tag="div"
          >
            <strong class="title">
              {{ $t('modals.recipient.msg.chain.title') }}:
            </strong>
            <span>
              {{ $t('modals.recipient.msg.chain.linkTitle') }}
            </span>
          </i18n>
        </p>
        <p>
          <i18n
            path="modals.recipient.msg.url.msg"
            tag="div"
          >
            <strong class="title">
              {{ $t('modals.recipient.msg.url.title') }}:
            </strong>
          </i18n>
        </p>
        <p v-if="UNFINISHED_FEATURES">
          <i18n
            path="modals.readMore.msg"
            class="help"
          >
            <a :href="BLOG_CLAIM_TIP_URL">
              {{ $t('modals.readMore.linkTitle') }}
            </a>
          </i18n>
        </p>
      </div>
    </template>
    <template #footer>
      <Button
        class="footer"
        @click="resolve"
      >
        {{ $t('ok') }}
      </Button>
    </template>
  </Default>
</template>

<script>
import Default from './Default.vue';
import Button from '../Button.vue';
import { BLOG_CLAIM_TIP_URL } from '../../../utils/constants';

export default {
  components: {
    Default,
    Button,
  },
  props: {
    resolve: { type: Function, required: true },
    close: { type: Function, default: null },
  },
  data: () => ({
    BLOG_CLAIM_TIP_URL,
    UNFINISHED_FEATURES: process.env.UNFINISHED_FEATURES,
  }),
};
</script>

<style lang="scss" scoped>
@use "../../../../styles/share-info";
@use "../../../../styles/variables";
@use '../../../../styles/typography';
@use '../../../../styles/mixins';

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
