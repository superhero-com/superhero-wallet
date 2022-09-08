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
    title: { type: String, default: '' },
    msg: { type: String, default: '' },
    type: { type: String, default: '' },
    icon: { type: String, default: '' },
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

.msg,
.help {
  @extend %face-sans-14-regular;

  text-align: center;
  line-height: 20px;

  a {
    cursor: pointer;
    text-decoration: none;
    color: variables.$color-primary;
  }
}

.footer {
  width: 100% !important;
}
</style>
