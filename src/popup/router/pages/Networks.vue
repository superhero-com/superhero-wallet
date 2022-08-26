<template>
  <div
    v-if="mode === 'list'"
    class="networks"
    data-cy="networks"
  >
    <div
      v-for="network in networks"
      :key="network.name"
      class="network-row"
    >
      <CheckBox
        :value="network === activeNetwork"
        type="radio"
        name="activeNetwork"
        @input="selectNetwork(network.name)"
      />
      <div>
        <p
          class="name"
          data-cy="network-name"
        >
          {{ network.name }}
        </p>
        <p
          class="url"
          data-cy="network-url"
        >
          <b>{{ $t('pages.network.url') }}</b> {{ network.url }}
        </p>
        <p
          class="url"
          data-cy="network-middleware"
        >
          <b>{{ $t('pages.network.middleware') }}</b> {{ network.middlewareUrl }}
        </p>
      </div>
      <ActionsMenu
        v-if="network.index !== undefined"
        data-cy="more"
      >
        <ae-icon
          slot="display"
          name="more"
          size="20px"
        />
        <ButtonPlain
          data-cy="edit"
          @click="setNetworkEdit(network)"
        >
          <ae-icon name="edit" />
          {{ $t('pages.network.edit') }}
        </ButtonPlain>
        <ButtonPlain
          data-cy="delete"
          @click="deleteNetwork(network.index)"
        >
          <ae-icon name="delete" />
          {{ $t('pages.network.delete') }}
        </ButtonPlain>
      </ActionsMenu>
    </div>
    <Button
      extend
      class="connect"
      data-cy="to-add"
      @click="mode = 'add'"
    >
      {{ $t('pages.network.addNetwork') }}
    </Button>
  </div>
  <div
    v-else-if="mode === 'add' || mode === 'edit'"
    class="network"
  >
    <InputField
      v-model="newNetwork.name"
      :placeholder="$t('pages.network.networkNamePlaceholder')"
      :label="$t('pages.network.networkNameLabel')"
      data-cy="network"
      new-ui
    />
    <InputField
      v-model="newNetwork.url"
      :placeholder="$t('pages.network.networkUrlPlaceholder')"
      :label="$t('pages.network.networkUrlLabel')"
      data-cy="url"
      new-ui
    />
    <InputField
      v-model="newNetwork.middlewareUrl"
      :placeholder="$t('pages.network.networkMiddlewarePlaceholder')"
      :label="$t('pages.network.networkMiddlewareLabel')"
      data-cy="middleware"
      new-ui
    />
    <InputField
      v-model="newNetwork.compilerUrl"
      :placeholder="$t('pages.network.networkCompilerPlaceholder')"
      :label="$t('pages.network.networkCompilerLabel')"
      data-cy="compiler"
      new-ui
    />
    <ButtonPlain
      class="expand"
      @click="backendUrlInputExpanded = !backendUrlInputExpanded"
    >
      <Arrow :class="['icon', { rotated: backendUrlInputExpanded }]" />
      <span>
        {{
          backendUrlInputExpanded
            ? $t('pages.network.hideTippingConfig')
            : $t('pages.network.showTippingConfig')
        }}
      </span>
    </ButtonPlain>
    <InputField
      v-if="backendUrlInputExpanded"
      v-model="newNetwork.backendUrl"
      :placeholder="$t('pages.network.backendUrlPlaceholder')"
      :label="$t('pages.network.backendUrlLabel')"
      new-ui
    />
    <Button
      half
      data-cy="cancel"
      @click="cancel"
    >
      {{ $t('pages.network.cancel') }}
    </Button>
    <Button
      class="danger"
      half
      :disabled="
        !newNetwork.name ||
          !newNetwork.url ||
          !newNetwork.middlewareUrl ||
          !newNetwork.compilerUrl ||
          !newNetwork.backendUrl ||
          !!newNetwork.error
      "
      data-cy="connect"
      @click="addOrUpdateNetwork"
    >
      {{ $t('pages.network.save') }}
    </Button>
    <div
      v-if="newNetwork.error"
      class="error-msg"
      data-cy="error-msg"
    >
      {{ newNetwork.error }}
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import Button from '../components/Button.vue';
import ButtonPlain from '../components/ButtonPlain.vue';
import ActionsMenu from '../components/ActionsMenu.vue';
import InputField from '../components/InputField.vue';
import CheckBox from '../components/CheckBox.vue';
import { defaultNetwork } from '../../utils/constants';
import Arrow from '../../../icons/arrow.svg?vue-component';

const networkProps = {
  name: null,
  url: null,
  middlewareUrl: defaultNetwork.middlewareUrl,
  compilerUrl: defaultNetwork.compilerUrl,
  backendUrl: defaultNetwork.backendUrl,
  error: false,
};

export default {
  components: {
    Button,
    ButtonPlain,
    ActionsMenu,
    InputField,
    CheckBox,
    Arrow,
  },
  data() {
    return {
      mode: 'list',
      newNetwork: networkProps,
      backendUrlInputExpanded: false,
    };
  },
  computed: mapGetters(['networks', 'activeNetwork', 'tippingSupported']),
  mounted() {
    this.$watch(
      ({
        newNetwork: {
          name, url, middlewareUrl, compilerUrl, backendUrl,
        },
      }) => [
        name,
        url,
        middlewareUrl,
        compilerUrl,
        backendUrl,
      ],
      () => {
        this.newNetwork.error = false;
      },
    );
  },
  methods: {
    async selectNetwork(network) {
      await this.$store.dispatch('switchNetwork', network);
      if (this.tippingSupported) return;
      await this.$store.dispatch('modals/open', {
        name: 'default',
        ...this.$t('modals.tip-mainnet-warning'),
      });
    },
    cancel() {
      this.mode = 'list';
      this.newNetwork = networkProps;
    },
    setNetworkEdit(network) {
      this.mode = 'edit';
      this.newNetwork = { ...networkProps, ...network };
    },
    async deleteNetwork(networkIndex) {
      this.$store.commit('deleteUserNetwork', networkIndex);
      await this.selectNetwork(defaultNetwork.name);
    },
    async addOrUpdateNetwork() {
      try {
        this.newNetwork.error = false;
        if (!this.newNetwork.name) throw new Error('Enter network name');
        const url = new URL(this.newNetwork.url);
        const middleware = new URL(this.newNetwork.middlewareUrl);
        const compiler = new URL(this.newNetwork.compilerUrl);
        const backendUrl = new URL(this.newNetwork.backendUrl);
        if (!url.hostname || !middleware.hostname || !compiler.hostname || !backendUrl.hostname) throw new Error('Invalid hostname');

        const networkWithSameName = this.networks[this.newNetwork.name];
        if (
          networkWithSameName
          && (this.newNetwork.index === undefined
          || networkWithSameName.index !== this.newNetwork.index)
        ) throw new Error('Network with this name exist');

        this.$store.commit('setUserNetwork', {
          index: this.newNetwork.index,
          url: this.newNetwork.url,
          middlewareUrl: this.newNetwork.middlewareUrl,
          compilerUrl: this.newNetwork.compilerUrl,
          name: this.newNetwork.name,
          backendUrl: this.newNetwork.backendUrl,
        });
        await this.selectNetwork(this.newNetwork.name);
        this.mode = 'list';
      } catch (e) {
        this.newNetwork.error = e.message;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
@use '../../../styles/variables';
@use '../../../styles/typography';

.networks,
.network {
  padding-left: var(--screen-padding-x);
  padding-right: var(--screen-padding-x);
}

.networks {
  padding: 16px;

  .network-row {
    display: flex;
    align-items: center;
    padding: 12px 0;
    text-align: left;

    p {
      margin: 0;
    }

    .name {
      @extend %face-sans-16-regular;
    }

    p.url {
      @extend %face-sans-12-regular;
    }

    .actions-menu {
      ::v-deep .content {
        display: flex;
        flex-direction: column;
      }

      .button-plain {
        padding: 8px;

        &:hover {
          color: variables.$color-white;
        }
      }
    }
  }

  .connect {
    position: initial;
  }
}

.network {
  .expand {
    text-align: left;
    font-size: 14px;
    color: variables.$color-white;
    width: 100%;
    margin-top: 16px;

    span {
      display: inline-block;
      margin-bottom: 10px;
    }

    .icon {
      width: 16px;
      height: 16px;
      color: #727278;
      transform: rotate(-90deg);
      vertical-align: middle;

      &.rotated {
        transform: none;
      }
    }
  }

  .button {
    margin-top: 20px;
  }
}
</style>
