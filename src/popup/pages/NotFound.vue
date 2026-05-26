<template>
  <PageWrapper :page-title="$t('pages.titles.notFound')">
    <div class="not-found">
      <img
        class="image"
        :src="NotFoundImage"
        alt="Feature not found"
      >
      <div
        class="text-heading-1 heading"
        v-text="$t('pages.notFound.header')"
      />
      <div
        class="text-description description"
        v-text="$t('pages.notFound.description')"
      />

      <div class="button-wrapper">
        <BtnMain
          v-if="!hideHomeButton"
          class="button"
          :to="{ name: 'index' }"
          :text="$t('pages.notFound.backToHome')"
          extend
        />
        <BtnMain
          class="button"
          :href="BUG_REPORT_URL"
          :icon="BugIcon"
          :text="$t('pages.notFound.reportBug')"
          variant="muted"
          extend
        />
      </div>
    </div>
  </PageWrapper>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { BUG_REPORT_URL } from '@/constants';

import PageWrapper from '@/popup/components/PageWrapper.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import NotFoundImage from '../../image/not-found.webp';
import BugIcon from '../../icons/bug.svg?vue-component';

export default defineComponent({
  components: {
    PageWrapper,
    BtnMain,
  },
  props: {
    hideHomeButton: Boolean,
  },
  setup() {
    return {
      BugIcon,
      NotFoundImage,
      BUG_REPORT_URL,
    };
  },
});

</script>

<style lang="scss" scoped>
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

  .heading {
    margin-top: 16px;
  }

  .description {
    margin-top: 8px;
  }

  .button-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 32px;
    width: 100%;
  }
}
</style>
