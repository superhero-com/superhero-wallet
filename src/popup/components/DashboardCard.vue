<template>
  <Card
    class="dashboard-card"
    :text="title"
    :description="description"
    :background="background"
    :icon="icon"
    :card-id="cardId"
    :bg-darken="bgDarken"
    :bg-position="bgPosition"
  >
    <BtnMain
      class="card-button"
      :text="btnText"
      :href="href"
      :to="to"
      :variant="variant"
      inline
    />
  </Card>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { VueI18nTranslation } from 'vue-i18n';

import Card from './Card.vue';
import BtnMain from './buttons/BtnMain.vue';

export default defineComponent({
  components: { BtnMain, Card },
  props: {
    title: { type: String as PropType<string | VueI18nTranslation>, required: true },
    description: { type: String as PropType<string | VueI18nTranslation>, required: true },
    btnText: { type: String as PropType<string | VueI18nTranslation>, required: true },
    background: { type: String, default: null },
    variant: { type: String, default: 'secondary' },
    href: { type: String, default: null },
    cardId: { type: String, default: null },
    to: { type: Object, default: null },
    icon: { type: Object, default: null },
    bgDarken: { type: Boolean, default: false },
    bgPosition: {
      type: String,
      default: null,
    },
  },
});
</script>

<style lang="scss" scoped>
.dashboard-card {
  .card-button {
    margin-top: 12px;
  }
}
</style>
