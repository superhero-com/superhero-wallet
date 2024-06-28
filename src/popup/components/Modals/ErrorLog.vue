<template>
  <Modal
    has-close-button
    @close="resolve"
  >
    <h2 class="text-heading-4 text-center">
      {{ $t('modals.error-log.title') }}
    </h2>

    <div class="error-msg">
      {{ messageTruncated }}...
    </div>
    <div>
      <span>{{ $t('modals.error-log.sub-title') }}</span>
      {{ $t('modals.error-log.content') }}
    </div>

    <template #footer>
      <BtnMain
        variant="muted"
        @click="cancel"
      >
        {{ $t('common.cancel') }}
      </BtnMain>
      <BtnMain @click="createReport">
        {{ $t('modals.error-log.create-report') }}
      </BtnMain>
    </template>
  </Modal>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { useRouter } from 'vue-router';
import type { RejectCallback, ResolveCallback } from '../../../types';
import { RejectedByUserError } from '../../../lib/errors';
import { ROUTE_DONATE_ERROR } from '../../router/routeNames';
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';

export default defineComponent({
  components: {
    Modal,
    BtnMain,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    entry: { type: Object, required: true },
  },
  setup(props) {
    const router = useRouter();

    const messageTruncated = computed(() => {
      const { message = '' } = props.entry.error;
      return message.substr(0, 150);
    });

    function cancel() {
      props.reject(new RejectedByUserError());
    }

    function createReport() {
      props.resolve(true);
      router.push({
        name: ROUTE_DONATE_ERROR,
        params: { entry: props.entry as any },
      });
    }

    return {
      messageTruncated,
      cancel,
      createReport,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.error-msg {
  color: $color-danger;
  margin-bottom: 30px;
}

span {
  display: block;
  font-weight: bold;
}
</style>
