<template>
  <Default
    v-bind="{ ...$attrs, resolve }"
    :title="$t('modals.shareQr.title')"
    :close="resolve"
  >
    <div>
      <qrcode-vue
        :value="qrStr"
        :class="[ 'qrcode', { copied }]"
        size="170"
        level="Q"
      />
    </div>
    <TemplateRenderer
      :class="!msgStr.includes('.chain') && 'address'"
      :str="msgStr"
    />
    <template slot="footer">
      <Button
        fill="secondary"
        @click="resolve"
      >
        {{ $t('modals.shareQr.close') }}
      </Button>
      <Button
        v-if="!IS_MOBILE_DEVICE"
        v-clipboard:copy="qrStr"
        v-clipboard:success="copy"
        has-icon
      >
        <Copy />
        {{ $t('copy') }}
      </Button>
      <Button
        v-else
        has-icon
        @click="share"
      >
        <Share />
        {{ $t('modals.shareQr.share') }}
      </Button>
    </template>
  </Default>
</template>

<script>
import QrcodeVue from 'qrcode.vue';
import Default from './Default.vue';
import TemplateRenderer from '../TemplateRenderer.vue';
import Button from '../Button.vue';
import Copy from '../../../../icons/copy.svg?vue-component';
import Share from '../../../../icons/share.svg?vue-component';
import copy from '../../../../mixins/copy';

export default {
  components: {
    QrcodeVue,
    Default,
    TemplateRenderer,
    Button,
    Copy,
    Share,
  },
  mixins: [copy],
  props: {
    resolve: { type: Function, required: true },
    reject: { type: Function, required: true },
    qrStr: { type: String, required: true },
    msgStr: { type: String, required: true },
  },
  data: () => ({
    IS_MOBILE_DEVICE: window.IS_MOBILE_DEVICE,
  }),
  methods: {
    async share() {
      await this.$store.dispatch('share', { text: this.qrStr });
    },
  },
};
</script>

<style lang="scss" scoped>
@use "../../../../styles/share-info";
@use "../../../../styles/variables";

.qrcode {
  position: relative;
  width: 182px;
  height: 182px;
  margin: 0 auto 24px;
  padding: 6px;
  border-radius: 6px;
  background-color: variables.$color-white;

  &.copied::after {
    content: "";
    position: absolute;
    left: -6px;
    top: -6px;
    width: 192px;
    height: 192px;
    border: 1px dashed variables.$color-blue;
    border-radius: 6px;
    background-color: rgba(variables.$color-primary, 0.15);
  }
}
</style>
