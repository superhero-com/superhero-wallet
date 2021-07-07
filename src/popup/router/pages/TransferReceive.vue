<template>
  <div
    class="transfer-receive"
    data-cy="top-up-container"
  >
    <p class="primary-title text-left mt-20 f-14 mx-20">
      {{ $t('pages.receive.heading') }}
    </p>
    <qrcode-vue
      :value="account.address"
      size="140"
      class="my-25 qrcode"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import QrcodeVue from 'qrcode.vue';

export default {
  components: { QrcodeVue },
  computed: mapGetters(['account']),
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables.scss';

.transfer-receive {
  p.primary-title {
    margin-left: 20px;
  }

  ::v-deep .qrcode canvas {
    border: 5px solid variables.$color-white;
  }
}
</style>
