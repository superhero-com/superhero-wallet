<template>
    <ae-input :label="$t('pages.send.amount')" placeholder="0.0" aemount v-model="amount" class="sendAmount">
        <ae-text slot="header" fill="black">
          <!-- <span class="token-symbol">{{tokenSymbol}}</span> -->
          <ae-dropdown v-if="myTokens && myTokens.length > 1">
            <ae-icon name="grid" size="20px" slot="button" />
            <li v-for="(tkn,key) in myTokens" v-bind:key="key" v-if="tkn.name != tokenSymbol" @click="setActiveToken(tkn.key)">
              <img :src="ae_token" class="token-image" alt="" v-if="tkn.key == 0" >
              <ae-identicon class="subAccountIcon" :address="tkn.contract" size="base" v-if="tkn.key != 0"/> {{tkn.name}}
            </li>
          </ae-dropdown>
        </ae-text>
        <ae-toolbar slot="footer" class="flex-justify-between" v-if="txFee">
          <span>
            {{$t('pages.send.txFee')}}
          </span>
          <span>
            {{txFee}} AE
          </span>
        </ae-toolbar>
        <ae-toolbar slot="footer" class="flex-justify-between" v-if="error">{{error}}</ae-toolbar>
    </ae-input>
</template>

<script>
import {mapGetters} from 'vuex';
export default {
    props: ['myTokens', 'txFee', 'amount', 'error'],
    computed: {
        ...mapGetters(['tokens', 'tokenSymbol', 'current']),
    },
    watch: {
      amount(val) {
        this.$emit("update",val)
      }
    },
    methods: {
      setActiveToken(token) {
        this.current.token = token
        this.$store.commit('RESET_TRANSACTIONS',[]);
      }
    }
}
</script>

<style lang="scss" scoped>
@import '../../../common/base';
.sendAmount {
  margin:15px 0;
}
.token-symbol {
  margin-right: 2rem;
}
.ae-dropdown-button {
  width:16px !important;
  height:16px !important;
}
 .ae-dropdown {
  margin-bottom:0 !important;
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