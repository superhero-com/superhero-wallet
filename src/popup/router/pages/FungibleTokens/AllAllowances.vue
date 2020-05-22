<template>
  <div class="popup">
    <Dropdown :options="tokens" :method="changeToken" :selected="token" v-if="tokens.length" />
    <ul v-for="(allowance, index) in allowances" :key="index.id">
      <li>
        <b> {{ $t('pages.allowances.from') }}: </b>
        {{ allowance.from_account }} -
        <ae-badge>{{ allowance.amount }} {{ allowance.symbol }}</ae-badge>
      </li>
      <Button @click="getAllowance(allowance)">
        {{ $t('pages.allowances.get-allowance') }}
      </Button>
    </ul>
    <div v-if="!allowances.length">
      <p>{{ $t('pages.allowances.no-allowances-found') }}</p>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import * as aeternityTokens from 'aeternity-tokens';
import Button from '../../components/Button';
import Dropdown from '../../components/Dropdown';

export default {
  components: { Button, Dropdown },
  data: () => ({
    tokens: [],
    token: null,
    allowances: [],
  }),
  computed: {
    ...mapGetters(['sdk', 'account']),
  },
  async created() {
    await this.$watchUntilTruly(() => this.sdk);
    this.tokens = await this.$store.dispatch('tokens/extension', 'allowances');
    if (this.tokens.length) this.token = this.tokens[0].contract;
  },
  methods: {
    async changeToken(e) {
      this.token = e.target.value;
      try {
        const { contract, balance, symbol } =
          this.tokens.find(t => t.contract === this.token) || {};
        const instance = await this.sdk.getContractInstance(
          aeternityTokens.newToken(['allowances', 'swappable', 'burnable', 'mintable']),
          {
            contractAddress: contract,
          },
        );

        const { decodedResult: all } = await instance.methods.allowances();
        if (all.length) {
          const mine = all.filter(([{ for_account }]) => for_account === this.account.publicKey);
          if (mine.length) {
            this.allowances = mine.map(a => ({
              contract,
              from_account: a[0].from_account,
              amount: a[1],
              symbol,
              balance,
            }));
          }
        }
      } catch (e) {
        console.log(e);
      }
    },
    getAllowance(allowance) {
      this.$router.push({ name: 'manage-allowances', params: { allowance, type: 'change' } });
    },
  },
};
</script>

<style lang="scss" scoped>
b {
  word-break: normal;
  display: block;
}
</style>