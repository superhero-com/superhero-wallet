<template>
  <ae-input :label="$t('pages.aeAddressInput.label')" class="address">
    <textarea
      class="ae-input textarea"
      v-model="address"
      placeholder="ak_..."
      slot-scope="{ context }"
      @focus="context.focus = true"
      @blur="context.focus = false"
    />
    <ae-toolbar slot="footer" align="justify">
      <template v-if="validAddress">
        <ae-identicon :address="address" size="xs" style="vertical-align: middle;" />
        {{ $t('pages.aeAddressInput.identicon') }}
      </template>
      <template v-else-if="address && address.length > 0">
        {{ $t('pages.aeAddressInput.error') }}
      </template>
    </ae-toolbar>
  </ae-input>
</template>

<script>
import { checkAddress } from '../../utils/helper';

export default {
  data() {
    return {
      address: null,
    };
  },
  computed: {
    validAddress() {
      if (!this.address) return false;
      return checkAddress(this.address);
    },
  },
  watch: {
    address(val) {
      this.$emit('update', val);
    },
  },
  methods: {
    setAccount(address) {
      this.address = address;
    },
  },
};
</script>

<style lang="scss" scoped>
.ae-input-container {
  overflow: unset;
}

.ae-toolbar {
  justify-content: space-between;
}
</style>
