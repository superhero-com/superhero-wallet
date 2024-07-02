<template>
  <Modal
    class="claim-success-modal"
    has-close-button
    centered
    @close="resolve"
  >
    <div class="top-icon-wrapper">
      <IconBoxed>
        <StatusIcon
          status="success"
          class="status-icon"
        />
      </IconBoxed>
    </div>

    <span>
      <b>{{ $t('pages.claim.url') }}:</b>
      {{ url }}
    </span>
    <span>
      <b>{{ $t('pages.claim.tipsOnUrl') }}:</b>
      {{ claimAmount }}
      {{ $t('pages.claim.ae') }}
    </span>
    <span class="claimed">{{ $t('pages.claim.claimed') }}</span>

    <template #footer>
      <BtnMain @click="resolve">
        {{ $t('common.ok') }}
      </BtnMain>
    </template>
  </Modal>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ResolveCallback } from '@/types';

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import IconBoxed from '../IconBoxed.vue';
import StatusIcon from '../StatusIcon.vue';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    IconBoxed,
    StatusIcon,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    url: { type: String, required: true },
    claimAmount: { type: Number, required: true },
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.claim-success-modal {
  .claimed {
    color: $color-primary;
  }

  .top-icon-wrapper {
    margin-bottom: 20px;
    text-align: center;
  }
}
</style>
