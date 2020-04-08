<template>
  <Modal>
    <div slot="body">testtt</div>
  </Modal>
</template>

<script>
import Modal from '../Modal';

export default {
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
  },
  components: { Modal },
  created() {
    console.log(this.resolve);
    console.log(this.reject);
  }
}
</script>