<template>
  <ae-input :label="$t('pages.send.amount')" placeholder="0.0" aemount v-model="amount" class="sendAmount">
    <ae-text slot="header" fill="black"> </ae-text>
    <ae-toolbar slot="footer" class="flex-justify-between" v-if="txFee">
      <span>
        {{ $t('pages.send.txFee') }}
      </span>
      <span> {{ txFee }} {{ $t('pages.appVUE.aeid') }} </span>
    </ae-toolbar>
    <ae-toolbar slot="footer" class="flex-justify-between" v-if="error">{{ error }}</ae-toolbar>
  </ae-input>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  props: ['myTokens', 'txFee', 'amount', 'error'],
  computed: {
    ...mapGetters(['current']),
  },
  watch: {
    amount(val) {
      this.$emit('update', val);
    },
  },
  methods: {
    setActiveToken(token) {
      this.current.token = token;
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../../common/variables';
.sendAmount {
  margin: 15px 0;
}
.token-symbol {
  margin-right: 2rem;
}
.ae-dropdown-button {
  width: 16px !important;
  height: 16px !important;
}
.ae-dropdown {
  margin-bottom: 0 !important;
  width: 4rem;
  position: absolute;
  right: 0;
  top: 0.5rem;
}
.ae-dropdown .ae-dropdown-button {
  width: 100% !important;
  height: 16px !important;
  font-size: 1.3rem;
}
</style>
