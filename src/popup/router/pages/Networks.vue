<template>
  <div class="popup">
    <div v-if="mode === 'list'" data-cy="networks">
      <ListItem v-for="network in networks" :key="network.name" class="network-row">
        <CheckBox
          :value="network === activeNetwork"
          type="radio"
          name="activeNetwork"
          @click.native="selectNetwork(network.name)"
          prevent
        />
        <div class="mr-auto text-left">
          <p class="f-16" data-cy="network-name">{{ network.name }}</p>
          <p class="f-12 url" data-cy="network-url">
            <b>{{ $t('pages.network.url') }}</b> {{ network.url }}
          </p>
          <p class="f-12 url" data-cy="network-middleware">
            <b>{{ $t('pages.network.middleware') }}</b> {{ network.middlewareUrl }}
          </p>
        </div>
        <ae-dropdown direction="right" v-if="network.index !== undefined" data-cy="more">
          <ae-icon name="more" size="20px" slot="button" />
          <li @click="setNetworkEdit(network)" data-cy="edit">
            <ae-icon name="edit" />
            {{ $t('pages.network.edit') }}
          </li>
          <li @click="deleteNetwork(network.index)" data-cy="delete">
            <ae-icon name="delete" />
            {{ $t('pages.network.delete') }}
          </li>
        </ae-dropdown>
      </ListItem>
      <Button extend @click="mode = 'add'" class="mt-20" data-cy="to-add">{{
        $t('pages.network.addNetwork')
      }}</Button>
    </div>
    <div v-if="mode === 'add' || mode === 'edit'" class="mt-10">
      <Input
        :placeholder="$t('pages.network.networkNamePlaceholder')"
        :label="$t('pages.network.networkNameLabel')"
        v-model="network.name"
        data-cy="network"
      />
      <Input
        :placeholder="$t('pages.network.networkUrlPlaceholder')"
        :label="$t('pages.network.networkUrlLabel')"
        v-model="network.url"
        data-cy="url"
      />
      <Input
        :placeholder="$t('pages.network.networkMiddlewarePlaceholder')"
        :label="$t('pages.network.networkMiddlewareLabel')"
        v-model="network.middlewareUrl"
        data-cy="middleware"
      />
      <Input
        :placeholder="$t('pages.network.networkCompilerPlaceholder')"
        :label="$t('pages.network.networkCompilerLabel')"
        v-model="network.compilerUrl"
        data-cy="compiler"
      />
      <Button half @click="cancel" data-cy="cancel">{{ $t('pages.network.cancel') }}</Button>
      <Button
        class="danger"
        half
        @click="addOrUpdateNetwork"
        :disabled="
          !network.name ||
            !network.url ||
            !network.middlewareUrl ||
            !network.compilerUrl ||
            !!network.error
        "
        data-cy="connect"
      >
        {{ $t('pages.network.save') }}
      </Button>
      <div v-if="network.error" class="error-msg" v-html="network.error" data-cy="error-msg" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Button from '../components/Button';
import Input from '../components/Input';
import CheckBox from '../components/CheckBox';
import ListItem from '../components/ListItem';
import { defaultNetwork } from '../../utils/constants';
import wallet from '../../../lib/wallet';

const networkProps = {
  name: null,
  url: null,
  middlewareUrl: null,
  compilerUrl: null,
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
    };
  },
  computed: mapGetters(['networks', 'activeNetwork', 'allowTipping']),
  mounted() {
    this.$watch(
      ({ network: { name, url, middlewareUrl, compilerUrl } }) => [
        name,
        url,
        middlewareUrl,
        compilerUrl,
      ],
      () => {
        this.network.error = false;
      },
    );
  },
  methods: {
    async selectNetwork(network) {
      await this.$store.dispatch('switchNetwork', network);
      await wallet.initSdk();
      if (this.allowTipping) return;
      await this.$store.dispatch('modals/open', {
        name: 'default',
        ...this.$t('modals.tip-mainnet-warning'),
      });
    },
    cancel() {
      this.mode = 'list';
      this.network = networkProps;
    },
    setNetworkEdit(network) {
      this.mode = 'edit';
      this.network = { ...networkProps, ...network };
    },
    async deleteNetwork(networkIndex) {
      await this.selectNetwork(defaultNetwork.name);
      await this.$store.commit('deleteUserNetwork', networkIndex);
    },
    async addOrUpdateNetwork() {
      try {
        this.network.error = false;
        if (!this.network.name) throw new Error('Enter network name');
        const url = new URL(this.network.url);
        const middleware = new URL(this.network.middlewareUrl);
        const compiler = new URL(this.network.compilerUrl);
        if (!url.hostname || !middleware.hostname || !compiler.hostname)
          throw new Error('Invalid hostname');

        const networkWithSameName = this.networks[this.network.name];
        if (
          networkWithSameName &&
          (this.network.index === undefined || networkWithSameName.index !== this.network.index)
        )
          throw new Error('Network with this name exist');

        this.$store.commit('setUserNetwork', {
          index: this.network.index,
          url: this.network.url,
          internalUrl: this.network.url,
          middlewareUrl: this.network.middlewareUrl,
          compilerUrl: this.network.compilerUrl,
          name: this.network.name,
        });
        await this.selectNetwork(this.network.name);
        this.mode = 'list';
      } catch (e) {
        this.network.error = e.message;
      }
    },
  },
};
</script>
<style lang="scss">
.network-row li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  border-top: 1px solid #100c0d !important;

  p {
    margin: 0;
  }

  p.url {
    font-weight: normal;
  }
}

.edit-btn {
  margin-left: 5px;
  margin-right: 0;
}
</style>
