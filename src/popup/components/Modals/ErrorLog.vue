<template>
  <Modal
    has-close-button
    @close="resolve"
  >
    <h2 class="text-heading-2 text-center">
      {{ $t('modals.error-log.title') }}
    </h2>

    <div class="error-msg">
      {{ message }}...
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

<script>
import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';

export default {
  components: { Modal, BtnMain },
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
    entry: { type: Object, required: true },
  },
  computed: {
    message() {
      const { message = '' } = this.entry.error;
      return message.substr(0, 150);
    },
  },
  methods: {
    cancel() {
      this.reject(new Error('Rejected by user'));
    },
    createReport() {
      this.resolve(true);
      this.$router.push({ name: 'donate-error', params: { entry: this.entry } });
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.error-msg {
  color: variables.$color-danger;
  margin-bottom: 30px;
}

span {
  display: block;
  font-weight: bold;
}
</style>
