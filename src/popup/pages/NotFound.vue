<template>
  <div class="not-found">
    <img
      class="image"
      :src="Image"
    >
    <div class="title">
      {{ $t('pages.notFound.notFound') }}
    </div>
    <div class="description">
      {{ $t('pages.notFound.description') }}
    </div>
    <BtnMain
      class="button"
      :to="{ name: 'index' }"
    >
      {{ $t('pages.notFound.backToHome') }}
    </BtnMain>
    <BtnMain
      class="button"
      :href="BUG_REPORT_URL"
      variant="secondary"
    >
      <BugIcon class="icon" />
      {{ $t('pages.notFound.reportBug') }}
    </BtnMain>
  </div>
</template>

<script>
import {
  computed,
  defineComponent,
  onMounted,
  watch,
} from '@vue/composition-api';
import BtnMain from '../components/buttons/BtnMain.vue';
import Image from '../../image/not-found.jpg';
import BugIcon from '../../icons/bug.svg?vue-component';
import { BUG_REPORT_URL } from '../utils';

export default defineComponent({
  components: { BtnMain, BugIcon },
  setup() {
    return {
      Image,
      BUG_REPORT_URL,
    };
  },
});

</script>

<style lang="scss" scoped>
@use '../../styles/typography';

.not-found {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: auto;
  padding: 0 16px;

  .image {
    margin-top: 88px;
    width: 156px;
  }

  .title {
    margin-top: 16px;

    @extend %face-sans-22-bold;
  }

  .description {
    margin-top: 8px;
    margin-bottom: 24px;

    @extend %face-sans-15-regular;
  }

  .button {
    max-height: 40px;
    width: 100%;
    margin-bottom: 16px;
  }

  .icon {
    margin-right: 4px;
    width: 20px;
    height: 20px;
  }
}
</style>
