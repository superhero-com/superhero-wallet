<template>
  <div class="flex flex-align-center flex-justify-between account-info">
    <div class="text-left account-addresses">
      <button style="padding:0" @click="copy" v-clipboard:copy="account.publicKey">
        <Copyicon />
      </button>
      <p class="copied-alert" v-if="copied">{{ $t('pages.account.copied') }}</p>
      <span class="account-name">{{ activeAccountName }}</span>
      <span class="ae-address">{{ account.publicKey }}</span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Copyicon from '../../../icons/copy.svg';

export default {
  components: {
    Copyicon,
  },
  data() {
    return {
      copied: false,
    };
  },
  computed: {
    ...mapGetters(['account', 'activeAccountName']),
  },
  methods: {
    copy() {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 3000);
    },
  },
};
</script>

<style lang="scss">
@import '../../../common/variables';
.account-info {
  margin: 32px 20px 0 20px;

  .account-name {
    font-size: 16px;
    color: $white-color !important;
    font-weight: 500;
    float: left;
    width: 92%;
  }
  .ae-address {
    color: $text-color !important;
    font-size: 11px;
    display: inline-block;
    width: 300px;
    white-space: nowrap;
    overflow: hidden !important;
    text-overflow: ellipsis;
  }
  .account-addresses {
    position: relative;
  }
  .copied-alert {
    color: #505058;
    z-index: 1;
    top: 0;
    right: 35px;
    margin: 0;
    position: absolute;
  }
}
</style>
