<template>
  <InfoBox
    text="Feature not implemented yet"
  />
</template>

<script lang="ts">

/**
 * Temporary component displayed for the features not implemented within the BTC scope.
 * TODO: Remove after implementing all BTC views
 */

import { defineComponent } from 'vue';

import InfoBox from '@/popup/components/InfoBox.vue';

export default defineComponent({
  name: 'NotImplemented',
  components: {
    InfoBox,
  },
});
</script>
