<template>
  <div class="popup">
    <div v-if="mode === 'list'">
      <h1 class="primary-title text-left mb-8">{{ $t('pages.network.allNetworks') }}</h1>
      <ListItem v-for="(n, key, index) in networks" :key="index" @click.native="selectNetwork(n.name)">
        {{ n.name }}
        <CheckBox :value="n.name === current.network" type="radio" name="activeNetwork" />
        <ae-icon name="edit" v-if="!n.system" @click.native="setNetworkEdit(n, index)" />
      </ListItem>
      <Button extend @click="mode = 'add'">{{ $t('pages.network.addNetwork') }}</Button>
    </div>
    <div v-if="mode === 'add' || mode === 'edit'">
      <h1 class="primary-title text-left mb-8">{{ $t('pages.network.addNetwork') }}</h1>
      <Input :placeholder="$t('pages.network.networkNamePlaceholder')" :label="$t('pages.network.networkNameLabel')" v-model="network.name" />
      <Input :placeholder="$t('pages.network.networkUrlPlaceholder')" :label="$t('pages.network.networkUrlLabel')" v-model="network.url" />
      <Input :placeholder="$t('pages.network.networkMiddlewarePlaceholder')" :label="$t('pages.network.networkMiddlewareLabel')" v-model="network.middlewareUrl" />
      <Button half @click="cancel">{{ $t('pages.network.cancel') }}</Button>
      <Button class="danger" half @click="addNetwork" :disabled="!network.name || !network.url || !network.middlewareUrl || network.error !== false">
        {{ $t('pages.network.save') }}
      </Button>
      <div v-if="network.error" class="error-msg" v-html="network.error"></div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Button from '../components/Button';
import Input from '../components/Input';
import CheckBox from '../components/CheckBox';
import ListItem from '../components/ListItem';
import { defaultNetworks, DEFAULT_NETWORK, AEX2_METHODS } from '../../utils/constants';
import wallet from '../../../lib/wallet';
import { postMessage } from '../../utils/connection';

const networkProps = {
  name: null,
  url: null,
  middlewareUrl: null,
  error: false,
};

export default {
  components: {
    Button,
    Input,
    ListItem,
    CheckBox,
  },
  data() {
    return {
      mode: 'list',
      network: networkProps,
      active: 'Testnet',
    };
  },
  computed: {
    ...mapGetters(['networks', 'current']),
  },
  watch: {
    'network.name': function(val) {
      this.network.error = val === DEFAULT_NETWORK;
    },
  },
  created() {

  },
  methods: {
    async selectNetwork(network) {
      await this.$store.dispatch('switchNetwork', network);
      this.$store.commit('SET_NODE_STATUS', 'connecting');
      postMessage({ type: AEX2_METHODS.SWITCH_NETWORK, payload: network });
      wallet.initSdk();
    },
    cancel() {
      this.mode = 'list';
      this.network = networkProps;
    },
    setNetworkEdit(n, idx) {
      this.mode = 'edit';
      this.network = { ...networkProps, ...n, idx };
    },
    async addNetwork() {
      try {
        this.network.error = false;
        const url = new URL(this.network.url);
        const middleware = new URL(this.network.middlewareUrl);

        if (!url.hostname || !middleware.hostname) throw new Error('Invalid hostname');

        const exist = (name, idx) => (this.network.idx ? name === this.network.name && idx !== this.network.idx : name === this.network.name);
        const allNetworks = Object.values(this.networks);
        if (allNetworks.find(({ name }, idx) => exist(name, idx))) throw new Error('Network with this name exist');
        const newNetwork = {
          ...defaultNetworks[DEFAULT_NETWORK],
          url: this.network.url,
          internalUrl: this.network.url,
          middlewareUrl: this.network.middlewareUrl,
          name: this.network.name,
          selected: true,
        };
        if (this.network.idx >= 0) {
          allNetworks[this.network.idx] = newNetwork;
          await this.$store.commit(
            'SET_NETWORKS',
            allNetworks.reduce((p, n) => ({ ...p, [n.name]: { ...n } }), {})
          );
        } else {
          allNetworks.push(newNetwork);
          await this.$store.commit('ADD_NETWORK', newNetwork);
        }
        await browser.storage.local.set({ userNetworks: allNetworks.filter(({ name }) => name !== DEFAULT_NETWORK) });
        this.mode = 'list';
      } catch (e) {
        this.network.error = e.message;
      }
    },
  },
};
</script>
