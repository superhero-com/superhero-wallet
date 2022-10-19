<template>
  <a
    :href="explorerPath"
    target="_blank"
    class="address-shortening"
  >
    <span>{{ firstPart }}</span>
    <span class="dots">...</span>
    <span>{{ secondPart }}</span>
    <ExternalLink />
  </a>
</template>

<script>
import { mapGetters } from 'vuex';
import ExternalLink from '../../icons/external-link.svg?vue-component';

export default {
  components: {
    ExternalLink,
  },
  props: {
    address: { type: String, required: true },
    limit: { type: Number, default: 3 },
  },
  computed: {
    ...mapGetters([
      'getExplorerPath',
    ]),
    firstPart() {
      if (!this.address) return '';

      return String(this.address).substring(0, (this.limit + 3));
    },
    secondPart() {
      if (!this.address) return '';

      return String(this.address).substring(
        (this.address.length - this.limit), this.address.length,
      );
    },
    explorerPath() {
      return this.getExplorerPath(this.address);
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';

.address-shortening {
  @extend %face-mono-12-regular;

  line-height: 20px;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: variables.$color-grey-light;
  letter-spacing: 0.07em;

  &:hover {
    color: variables.$color-white;
  }

  .dots {
    letter-spacing: -0.025em;
    font-size: 16px;
    line-height: 20px;
    transform: translateY(-25%);
  }

  svg {
    width: 22px;
    height: 22px;
  }
}
</style>
