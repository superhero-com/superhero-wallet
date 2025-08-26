<template>
  <TransferReviewBase :protocol="PROTOCOLS.dogecoin" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { PROTOCOLS } from '@/constants';
import TransferReviewBase from '@/popup/components/TransferSend/TransferReviewBase.vue';

export default defineComponent({
  name: 'DogeTransferReview',
  components: { TransferReviewBase },
  setup() { return { PROTOCOLS }; },
});
</script>
