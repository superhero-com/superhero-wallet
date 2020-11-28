<template>
  <div v-if="mode === 'list'" class="popup" data-cy="networks">
    <div v-for="network in networks" :key="network.name" class="network-row">
      <CheckBox
        :value="network === activeNetwork"
        type="radio"
        name="activeNetwork"
        @input="selectNetwork(network.name)"
      />
      <div>
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
    </div>
    <Button extend @click="mode = 'add'" class="mt-20" data-cy="to-add">{{
      $t('pages.network.addNetwork')
    }}</Button>
  </div>
  <div v-else-if="mode === 'add' || mode === 'edit'" class="mt-10 popup network">
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
    <button class="text-left expand" @click="backendUrlInputExpanded = !backendUrlInputExpanded">
      <img :class="{ expanded: backendUrlInputExpanded }" src="../../../icons/carret-down.svg" />
      <span>{{
        backendUrlInputExpanded
          ? $t('pages.network.hideTippingConfig')
          : $t('pages.network.showTippingConfig')
      }}</span>
    </button>
    <Input
      v-if="backendUrlInputExpanded"
      :placeholder="$t('pages.network.backendUrlPlaceholder')"
      :label="$t('pages.network.backendUrlLabel')"
      v-model="network.backendUrl"
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
        !network.backendUrl ||
        !!network.error
      "
      data-cy="connect"
    >
      {{ $t('pages.network.save') }}
    </Button>
    <div v-if="network.error" class="error-msg" v-html="network.error" data-cy="error-msg" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Button from '../components/Button';
import Input from '../components/Input';
import CheckBox from '../components/CheckBox';
import { defaultNetwork } from '../../utils/constants';
import wallet from '../../../lib/wallet';

const networkProps = {
  name: null,
  url: null,
  middlewareUrl: null,
  compilerUrl: null,
  backendUrl: defaultNetwork.backendUrl,
  error: false,
};

export default {
  components: {
    Button,
    Input,
    CheckBox,
  },
  data() {
    return {
      mode: 'list',
      network: networkProps,
      backendUrlInputExpanded: false,
    };
  },
  computed: mapGetters(['networks', 'activeNetwork', 'tippingSupported']),
  mounted() {
    this.$watch(
      ({ network: { name, url, middlewareUrl, compilerUrl, backendUrl } }) => [
        name,
        url,
        middlewareUrl,
        compilerUrl,
        backendUrl,
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
      if (this.tippingSupported) return;
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
      this.$store.commit('deleteUserNetwork', networkIndex);
      await this.selectNetwork(defaultNetwork.name);
    },
    async addOrUpdateNetwork() {
      try {
        this.network.error = false;
        if (!this.network.name) throw new Error('Enter network name');
        const url = new URL(this.network.url);
        const middleware = new URL(this.network.middlewareUrl);
        const compiler = new URL(this.network.compilerUrl);
        const backendUrl = new URL(this.network.backendUrl);
        if (!url.hostname || !middleware.hostname || !compiler.hostname || !backendUrl.hostname)
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
          middlewareUrl: this.network.middlewareUrl,
          compilerUrl: this.network.compilerUrl,
          name: this.network.name,
          backendUrl: this.network.backendUrl,
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

<style lang="scss" scoped>
@import '../../../styles/variables';

.network-row {
  display: flex;
  align-items: center;
  border-top: 1px solid #100c0d;
  padding: 12px 0;
  text-align: left;

  p {
    margin: 0;
  }

  p.url {
    font-weight: normal;
  }
}

.network {
  .edit-btn {
    margin-left: 5px;
    margin-right: 0;
  }

  .expand {
    font-size: 14px;
    color: $white-1;
    width: 100%;
    padding: 0;

    span {
      display: inline-block;
      margin-bottom: 10px;
    }

    img {
      transform: rotate(-90deg);
      vertical-align: middle;

      &.expanded {
        transform: none;
      }
    }
  }

  .primary-button {
    margin-top: 20px;
  }
}
</style>
