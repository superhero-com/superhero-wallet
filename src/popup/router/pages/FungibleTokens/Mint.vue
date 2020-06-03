<template>
  <div>
    <div class="popup">
      <Dropdown
        :options="[
          { text: 'Mint', value: 'mint' },
          { text: 'Burn', value: 'burn' },
        ]"
        :method="changeType"
        :selected="type"
        :label="$t('pages.mint-token.type')"
      />
      <Dropdown
        v-if="tokens.length"
        :options="tokens"
        :method="changeToken"
        :selected="token"
        :label="$t('pages.mint-token.token')"
      />
      <label v-if="type === 'mint'" class="label text-left">
        {{ $t('pages.mint-token.address') }}
      </label>
      <Textarea
        v-if="type === 'mint'"
        v-model="address"
        placeholder="ak.."
        size="h-50 sm"
      ></Textarea>
      <Input type="number" v-model="amount" :label="$t('pages.mint-token.amount')" />

      <Button @click="mint" extend :disabled="invalid">
        {{ $t('pages.mint-token.mint') }}
      </Button>
    </div>
    <Loader size="big" :loading="loading" type="transparent" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { checkAddress } from '../../../utils/helper';
import Button from '../../components/Button';
import Dropdown from '../../components/Dropdown';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';

export default {
  components: { Button, Dropdown, Input, Textarea },
  data() {
    return {
      loading: false,
      token: null,
      amount: null,
      address: null,
      type: 'mint',
      tokens: [],
    };
  },
  computed: {
    ...mapGetters(['sdk']),
    invalid() {
      return !this.amount || (this.type === 'mint' && !checkAddress(this.address));
    },
  },
  async created() {
    await this.$watchUntilTruly(() => this.sdk);
    this.tokens = await this.$store.dispatch('tokens/extension', 'mintable');
    if (this.tokens.length) this.token = this.tokens[0].contract;
  },
  methods: {
    changeToken(e) {
      this.token = e.target.value;
    },
    async changeType(e) {
      this.loading = true;
      this.type = e.target.value;
      const extension = { mint: 'mintable', burn: 'burnable' };
      this.tokens = await this.$store.dispatch('tokens/extension', extension[this.type]);
      this.loading = false;
    },
    async mint() {
      this.loading = true;
      const { contract, convertBalance } = this.tokens.find(t => t.contract === this.token);
      const instance = await this.$store.dispatch('tokens/instance', contract);
      const amount = parseInt(convertBalance(this.amount), 10);
      const params = this.type === 'mint' ? [this.address, amount] : [amount];
      try {
        await instance.methods[this.type](...params);
        this.$store.dispatch('modals/open', {
          name: 'default',
          title: this.$t('modals.mint/burn-token.title', { type: this.type }),
          msg: this.$t('modals.mint/burn-token.msg', { type: this.type }),
        });
      } catch (e) {
        this.$store.dispatch('modals/open', {
          name: 'default',
          title: 'Something went wrong',
          msg: e.message,
        });
      } finally {
        this.loading = false;
        this.address = null;
        this.amount = null;
      }
    },
  },
};
</script>
