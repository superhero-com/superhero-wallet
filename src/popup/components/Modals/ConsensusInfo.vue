<template>
  <Default
    class="consensus-info"
    v-bind="{ ...$attrs, resolve }"
    icon="info"
    :title="$t('modals.consensusInfo.title')"
    :close="resolve"
  >
    <template #msg>
      <div class="content">
        <div class="subtitle">
          {{ $t("modals.consensusInfo.subtitle") }}
        </div>
        <ul class="list">
          <li>
            <TemplateRenderer
              :str="$t('modals.consensusInfo.firstPoint')"
            />
          </li>
          <li>
            <TemplateRenderer
              :str="$t('modals.consensusInfo.secondPoint')"
            />
          </li>
          <li>
            <TemplateRenderer
              :str="$t('modals.consensusInfo.thirdPoint')"
            />
          </li>
        </ul>

        <TemplateRenderer
          :str="$t('modals.consensusInfo.description')"
        />
      </div>
    </template>
    <template #footer>
      <BtnMain
        class="footer"
        extend
        :text="$t('common.ok')"
        @click="resolve"
      />
    </template>
  </Default>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ResolveCallback } from '../../../types';
import Default from './Default.vue';
import BtnMain from '../buttons/BtnMain.vue';
import TemplateRenderer from '../TemplateRenderer.vue';

export default defineComponent({
  components: {
    TemplateRenderer,
    Default,
    BtnMain,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    close: { type: Function, default: null },
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/typography';

.consensus-info {
  .content {
    @extend %face-sans-15-regular;

    text-align: center;
    line-height: 22px;

    .subtitle {
      @extend %face-sans-16-regular;

      margin-top: -8px;
    }

    .list {
      text-align: left;
      padding: 16px 24px 8px;
      margin: 0;
    }
  }
}

</style>
