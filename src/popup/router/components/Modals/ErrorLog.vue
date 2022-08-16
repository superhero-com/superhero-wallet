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

    <template slot="footer">
      <Button
        fill="secondary"
        @click="cancel"
      >
        {{ $t('modals.cancel') }}
      </Button>
      <Button @click="createReport">
        {{ $t('modals.error-log.create-report') }}
      </Button>
    </template>
  </Modal>
</template>

<script>
import Modal from '../Modal.vue';
import Button from '../Button.vue';

export default {
  components: { Modal, Button },
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
@use '../../../../styles/variables';

.error-msg {
  color: variables.$color-error;
  margin-bottom: 30px;
}

span {
  display: block;
  font-weight: bold;
}
</style>
