<template>
  <div class="popup">
    <Input :label="$t('pages.deploy-token.name')" v-model="token.name" />
    <Input :label="$t('pages.deploy-token.symbol')" v-model="token.symbol" />
    <Input
      :label="$t('pages.deploy-token.initial-supply')"
      v-model.number="token.initialSupply"
      type="number"
    />
    <Input
      v-if="advanced"
      :label="$t('pages.deploy-token.decimals')"
      v-model.number="token.decimals"
      type="number"
    />

    <label class="label text-left">{{ $t('pages.deploy-token.extensions') }}</label>
    <div v-for="ext in extensions" :key="ext.type" class="extensions">
      <CheckBox v-model="ext.selected" :val="ext.type">
        {{ ext.type }}
      </CheckBox>
    </div>
    <div v-if="requireBurnable" class="error-msg">
      {{ $t('pages.deploy-token.require-burnable') }}
    </div>
    <hr />
    <CheckBox v-model="advanced">
      {{ $t('pages.deploy-token.advanced') }}
    </CheckBox>
    <Button @click="deploy" :disabled="!validData || requireBurnable" extend>
      {{ $t('pages.deploy-token.deploy') }}
    </Button>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import * as aeternityTokens from 'aeternity-tokens';
import Input from '../../components/Input';
import Button from '../../components/Button';
import CheckBox from '../../components/CheckBox';

const extensions = ['allowances', 'swappable', 'burnable', 'mintable'];

export default {
  components: { Input, Button, CheckBox },
  data() {
    return {
      token: {
        name: '',
        decimals: 18,
        symbol: '',
        initialSupply: undefined,
      },
      advanced: false,
      extensions: extensions.reduce((a, c) => [...a, { type: c }], []),
    };
  },
  computed: {
    ...mapGetters(['sdk', 'account', 'balance', 'wallet', 'tokens']),
    selectedExtensions() {
      return this.extensions
        .filter(e => e.selected)
        .reduce((a, { type }) => {
          a.push(type);
          return a;
        }, []);
    },
    requireBurnable() {
      return (
        this.selectedExtensions.includes('swappable') &&
        !this.selectedExtensions.includes('burnable')
      );
    },
    validData() {
      const { name, decimals, symbol, initialSupply } = this.token;
      return (
        name && symbol && symbol.length < 12 && decimals > 0 && decimals < 36 && initialSupply >= 0
      );
    },
  },
  async created() {
    
  },
  methods: {
    async deploy() {
      const source = aeternityTokens.newToken(this.selectedExtensions);
      const instance = await this.sdk.getContractInstance(source);

      try {
        const { address } = await instance.deploy(Object.values(this.token));
        this.$store.dispatch('tokens/add', {
          ...this.token,
          balance: 0,
          contract: address,
        });
      } catch (e) {
        console.log(e);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.token-registry {
  display: flex;
  align-items: center;

  label {
    text-align: left;
    line-height: 17px;
    font-size: 14px;
  }
}

.extensions {
  margin-top: 5px;
}

.checkbox-container {
  align-items: center;
}

.error-msg {
  margin-top: 10px;
  text-align: left;
}
</style>
