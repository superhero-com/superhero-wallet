<template>
  <a
    :href="link"
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
import ExternalLink from '../../../icons/external-link.svg?vue-component';

export default {
  components: {
    ExternalLink,
  },
  props: {
    address: { type: String, required: true },
    limit: { type: Number, default: 3 },
  },
  computed: {
    ...mapGetters(['activeNetwork']),
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
    link() {
      const addressTypes = {
        th: 'transactions',
        ok: 'oracles/queries',
        ct: 'contracts/transactions',
        ak: 'account',
      };
      if (!(
        this.address.match(/^[a-z]{2}_[1-9A-HJ-NP-Za-km-z]{48,50}$/)
        && Object.keys(addressTypes).includes(this.address.substring(0, 2))
      )) return null;

      const type = addressTypes[this.address.substring(0, 2)];
      return `${this.activeNetwork.explorerUrl}/${type}/${this.address}`;
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';

.address-shortening {
  font-weight: 400;
  font-size: 12px;
  line-height: 24px;
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  color: variables.$color-white;

  &:hover {
    color: variables.$color-light-grey;
  }

  .dots {
    padding: 0 2px 5px;
  }

  svg {
    width: 22px;
    height: 22px;
  }
}
</style>
