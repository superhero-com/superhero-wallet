<template>
  <Default
    class="name-claim-info"
    icon="info"
    :resolve="handleResolve"
    :close="handleResolve"
    :title="$t('modals.nameClaimInfo.title')"
    :button-message="$t('modals.nameClaimInfo.button')"
  >
    <p>{{ $t('modals.nameClaimInfo.preclaim') }}</p>
    <p>{{ $t('modals.nameClaimInfo.device') }}</p>

    <CheckBox
      v-model="neverShowAgain"
      class="never-show"
    >
      {{ $t('modals.nameClaimInfo.neverShowAgain') }}
    </CheckBox>
  </Default>
</template>

<script lang="ts">
import {
  defineComponent,
  PropType,
  ref,
} from 'vue';
import type { ResolveCallback } from '@/types';

import CheckBox from '../CheckBox.vue';
import Default from './Default.vue';

export default defineComponent({
  name: 'NameClaimInfo',
  components: {
    CheckBox,
    Default,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback<boolean>>, required: true },
  },
  setup(props) {
    const neverShowAgain = ref(false);

    function handleResolve() {
      props.resolve(neverShowAgain.value);
    }

    return {
      handleResolve,
      neverShowAgain,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/typography';

.name-claim-info {
  p {
    @extend %face-sans-15-regular;

    margin: 0 0 12px;
  }

  .never-show {
    margin-top: 8px;
  }
}
</style>
