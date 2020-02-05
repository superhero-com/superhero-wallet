<template>
  <ae-input :label="$t('pages.aeAddressInput.label')" class="address">
    <textarea class="ae-input textarea" v-model="address" placeholder="ak_..." slot-scope="{ context }" @focus="context.focus = true" @blur="context.focus = false" />
    <ae-toolbar slot="footer" align="justify">
      <span v-if="validAddress">
        <ae-identicon :address="address" size="xs" style="vertical-align: middle" />
        {{ $t('pages.aeAddressInput.identicon') }}
      </span>
      <span v-else-if="!validAddress && address && address.length > 0">{{ $t('pages.aeAddressInput.error') }}</span>
      <span v-else>&nbsp;</span>
      <ae-dropdown v-if="subaccounts && subaccounts.length > 1">
        <ae-icon name="contacts" size="20px" slot="button" />
        <li v-for="(account, key) in subaccounts" v-bind:key="key" @click="setAccount(account.publicKey)">
          <ae-identicon class="subAccountIcon" :address="account.publicKey" size="base" /> {{ account.name }}
        </li>
      </ae-dropdown>
    </ae-toolbar>
  </ae-input>
</template>

<script>
import { mapGetters } from 'vuex';
import { checkAddress } from '../../utils/helper';

export default {
  data() {
    return {
      address: null,
      error: false,
    };
  },
  computed: {
    ...mapGetters(['subaccounts']),
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
