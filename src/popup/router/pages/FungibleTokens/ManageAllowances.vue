<template>
  <div class="popup">
    <Dropdown
      v-if="tokens.length"
      :options="tokens"
      :method="changeToken"
      :selected="token"
      label="Select token"
    />
    <Input v-model="to" label="Address" :disabled="hasAllowance" />
    <Input v-model.number="amount" type="number" label="Value" :disabled="hasAllowance" />
    <div v-if="exist">
      {{ $t('pages.manage-allowances.allowance-exist') }}
      <router-link :to="{ name: 'manage-allowances', params: { type: 'change' } }">
        {{ $t('pages.manage-allowances.here') }}
      </router-link>
    </div>
    <Button @click="allowanceAction" extend>
      {{ $t('pages.manage-allowances')[type] }}
    </Button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import * as aeternityTokens from 'aeternity-tokens';
import { isEmpty } from 'lodash-es';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Dropdown from '../../components/Dropdown';

export default {
  props: {
    type: { type: String, required: true },
    allowance: { type: Object, required: false },
  },
  components: { Button, Input, Dropdown },
  data: () => ({
    tokens: [],
    token: null,
    to: null,
    amount: null,
    exist: false,
  }),
  computed: {
    ...mapGetters(['sdk', 'account']),
    hasAllowance() {
      return !isEmpty(this.allowance);
    },
  },
  async created() {
    if (this.allowance) {
      const { from_account, amount } = this.allowance;
      this.to = from_account;
      this.amount = amount;
    }
    await this.$watchUntilTruly(() => this.sdk);
    this.tokens = await this.$store.dispatch('tokens/extension', 'allowances');
    if (this.tokens.length) this.token = this.tokens[0].contract;
    if (this.allowance) this.token = this.allowance.contract;
  },
  methods: {
    async allowanceAction() {
      try {
        this.loading = true;
        const { contract, balance } = this.tokens.find(t => t.contract === this.token) || {};
        if (this.amount > balance) return;
        const instance = await this.sdk.getContractInstance(
          aeternityTokens.newToken(['allowances', 'swappable', 'burnable', 'mintable']),
          {
            contractAddress: contract,
          },
        );

        const { decodedResult: allowance } = await instance.methods.allowance({
          from_account: this.account.publicKey,
          for_account: this.to,
        });

        if (this.type === 'create') {
          await instance.methods.create_allowance(this.to, this.amount);
        } else if (this.type === 'transfer') {
          if (allowance + this.amount >= allowance) {
            await instance.methods.transfer_allowance(this.to, this.account.publicKey, this.amount);
          }
        } else if (this.type === 'change') {
          await instance.methods.change_allowance(this.to, this.amount);
        }
      } catch (e) {
        if (e.message.includes('ALLOWANCE_ALREADY_EXISTENT')) this.exist = true;
        console.log(e);
      }
    },
    changeToken(e) {
      this.token = e.target.value;
    },
  },
};
</script>