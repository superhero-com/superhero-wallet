<template>
  <Modal
    class="wallet-connect-modal"
    from-bottom
    has-close-button
    @close="reject()"
  >
    <div
      class="parties"
      :class="{ connected: wcSession }"
    >
      <Avatar
        class="parties-avatar"
        size="lg"
        variant="grey"
      >
        <AeternityLogo class="parties-logo-ae" />
      </Avatar>

      <TriangleRightIcon class="parties-arrow" />

      <IconBoxed
        :icon="connecting ? AnimatedSpinner : WalletConnectLogo"
        class="parties-logo-wc"
        :outline-solid="!!wcSession"
        bg-colored
        icon-padded
      />

      <TriangleRightIcon class="parties-arrow" />

      <Avatar
        :name="peerMetadata?.name"
        class="parties-avatar"
        variant="grey"
        size="lg"
      >
        <img
          v-if="peerMetadata?.icons.length"
          :src="peerMetadata.icons[0]"
          :alt="peerMetadata?.name"
        >
      </Avatar>
    </div>

    <!--
      USER CONNECTED
      Connection summary
    -->
    <div
      v-if="wcSession"
      class="text-center"
    >
      <Panel>
        <PanelTableItem :name="$t('common.status')">
          <strong class="color-success">{{ $t('common.connected') }}</strong>
        </PanelTableItem>

        <PanelTableItem :name="$t('common.activeAccount')">
          <div class="connected-account">
            <AddressTruncated
              :address="activeAccount && activeAccount.address ? activeAccount.address : ''"
              :protocol="activeAccount && activeAccount.protocol
                ? activeAccount.protocol
                : PROTOCOLS.ethereum"
            />
            <Avatar
              size="sm"
              :address="activeAccount && activeAccount.address ? activeAccount.address : ''"
            />
          </div>
        </PanelTableItem>

        <PanelTableItem :name="$t('walletConnect.dappName')">
          {{ peerMetadata?.name || '-' }}
        </PanelTableItem>

        <PanelTableItem :name="$t('walletConnect.dappDescription')">
          {{ peerMetadata?.description || '-' }}
        </PanelTableItem>

        <PanelTableItem
          v-if="peerMetadata?.url"
          :href="peerMetadata.url"
          :name="$t('walletConnect.dappUrl')"
          is-external-link
        >
          {{ peerMetadata.url }}
        </PanelTableItem>
      </Panel>
    </div>

    <!--
      USER NOT CONNECTED
      QR Scanner + connection URI input
    -->
    <div v-else>
      <div class="text-center">
        <h2 class="text-heading-4" v-text="$t('walletConnect.modalTitle')" />
        <p v-text="$t('walletConnect.modalSubtitle')" />
      </div>

      <InfoBox
        v-if="error"
        type="danger"
        :text="$t('common.connectionFailed')"
      />
      <InfoBox
        v-else-if="peerDisconnected"
        type="warning"
        :text="$t('walletConnect.dappRequestedDisconnect')"
      />

      <DetailsItem
        v-if="evmAccounts.length"
        class="active-account"
        :label="$t('common.connectingAs')"
      >
        <AccountInfo
          v-if="activeAccount"
          :account="activeAccount"
          show-protocol-icon
          show-explorer-link
        />
      </DetailsItem>
      <InfoBox
        v-else
        type="danger"
        :text="$t('common.noProtocolAccountFound', { protocolName })"
      />

      <FormScanQrResult
        v-model="connectionUri"
        :label="$t('walletConnect.uriInputLabel')"
        :readonly="!evmAccounts.length || connecting"
        :qr-title="$t('walletConnect.uriInputLabel')"
        placeholder="wc:a2813545345bb3e4..."
        auto-height
      />
    </div>

    <template #footer>
      <BtnMain
        :text="$t('common.cancel')"
        variant="muted"
        extra-padded
        @click="cancel()"
      />
      <BtnMain
        v-if="wcSession"
        :text="(disconnecting) ? $t('common.disconnecting') : $t('common.disconnect')"
        :disabled="disconnecting"
        :icon="CloseCircleIcon"
        extend
        @click="disconnectFromDapp()"
      />
      <BtnMain
        v-else
        :text="(connecting) ? $t('common.connecting') : $t('common.connect')"
        :icon="WalletConnectLogo"
        :disabled="!evmAccounts.length || !connectionUri || connecting"
        extend
        @click="connectToDapp()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  PropType,
  computed,
  defineComponent,
  ref,
  toRefs,
  watch,
} from 'vue';
import type { RejectCallback, ResolveCallback } from '@/types';
import { PROTOCOLS } from '@/constants';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';
import {
  useAccounts,
  useConnection,
  useWalletConnect,
  type WalletConnectUri,
} from '@/composables';

import Avatar from '@/popup/components/Avatar.vue';
import AddressTruncated from '@/popup/components/AddressTruncated.vue';
import Modal from '@/popup/components/Modal.vue';
import AccountInfo from '@/popup/components/AccountInfo.vue';
import FormScanQrResult from '@/popup/components/form/FormScanQrResult.vue';
import BtnMain from '@/popup/components/buttons/BtnMain.vue';
import InfoBox from '@/popup/components//InfoBox.vue';
import Panel from '@/popup/components/Panel.vue';
import PanelTableItem from '@/popup/components/PanelTableItem.vue';
import IconBoxed from '@/popup/components/IconBoxed.vue';
import DetailsItem from '@/popup/components/DetailsItem.vue';

import AnimatedSpinner from '@/icons/animated-spinner.svg?vue-component';
import AeternityLogo from '@/icons/logo-small.svg?vue-component';
import WalletConnectLogo from '@/icons/wallet-connect.svg?vue-component';
import TriangleRightIcon from '@/icons/triangle-right.svg?vue-component';
import CloseCircleIcon from '@/icons/circle-close.svg?vue-component';
import QrScanIcon from '@/icons/qr-scan.svg?vue-component';

export default defineComponent({
  components: {
    AccountInfo,
    AddressTruncated,
    Avatar,
    BtnMain,
    DetailsItem,
    FormScanQrResult,
    InfoBox,
    Modal,
    Panel,
    PanelTableItem,
    IconBoxed,
    AeternityLogo,
    TriangleRightIcon,
  },
  props: {
    resolve: { type: Function as PropType<ResolveCallback>, required: true },
    reject: { type: Function as PropType<RejectCallback>, required: true },
    deeplinkUri: { type: String as PropType<WalletConnectUri>, default: '' },
  },
  setup(props) {
    // Prefer active EVM protocol for naming; fallback to Ethereum adapter name
    const ethAdapter = ProtocolAdapterFactory.getAdapter(PROTOCOLS.ethereum);
    const { getLastActiveProtocolAccount } = useAccounts();
    const activeAccount = computed(() => (
      getLastActiveProtocolAccount(
        (getLastActiveProtocolAccount(PROTOCOLS.bnb) ? PROTOCOLS.bnb : PROTOCOLS.ethereum),
      )
      || getLastActiveProtocolAccount(PROTOCOLS.ethereum)
    ));
    const protocolName = computed(() => ethAdapter.protocolName);

    const { isOnline } = useConnection();
    const {
      wcSession,
      wcState,
      evmAccounts,
      connect,
      disconnect,
    } = useWalletConnect();

    const {
      connecting,
      disconnecting,
      error,
      peerDisconnected,
    } = toRefs(wcState);

    /** eg.: wc:1b3eda3f4... */
    const connectionUri = ref<WalletConnectUri | undefined>(props.deeplinkUri);

    // activeAccount already defined above for EVM context
    const peerMetadata = computed(() => wcSession.value?.peer?.metadata);

    async function connectToDapp() {
      await connect(connectionUri.value!);
    }

    function disconnectFromDapp() {
      disconnect();
      connectionUri.value = undefined;
    }

    function cancel() {
      props.reject();
      connectionUri.value = undefined;

      if (connecting.value || error.value) {
        disconnect();
      }
    }

    watch(peerDisconnected, (val) => {
      if (val) {
        connectionUri.value = undefined;
      }
    });

    return {
      AnimatedSpinner,
      CloseCircleIcon,
      QrScanIcon,
      WalletConnectLogo,

      PROTOCOLS,
      protocolName,
      isOnline,
      connectionUri,
      evmAccounts,
      wcSession,
      connecting,
      disconnecting,
      error,
      peerDisconnected,
      peerMetadata,
      activeAccount,

      connectToDapp,
      disconnectFromDapp,
      cancel,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;

.wallet-connect-modal {
  --wallet-connect-color: #5570ff;

  .qr-code-scanner-wrapper {
    width: 100%;
    max-width: 270px;
    margin-inline: auto;
  }

  .parties {
    --scale: 0;
    --opacity: 0;

    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    margin-bottom: 26px;

    // Horizontal line
    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 10px;
      right: 10px;
      z-index: -1;
      border-bottom: 2px solid $color-grey-border;
      opacity: var(--opacity);
      transform: scaleX(var(--scale)) translateY(-50%);
      transition: all 2s;
    }

    .parties-avatar,
    .parties-arrow {
      opacity: var(--opacity);
      transform: scale(var(--scale));
    }

    .parties-avatar {
      transition: all 1s;
    }

    .parties-arrow {
      width: 15px;
      color: $color-grey-border;
    }

    .parties-logo-wc {
      color: var(--wallet-connect-color);
    }

    .parties-logo-ae {
      width: 36px;
      color: $color-primary;
      transform: translateY(1px);
    }

    &.connected {
      --scale: 1;
      --opacity: 1;

      .arrow {
        transition: all 1s;
        transition-delay: 1s;
      }
    }
  }

  .active-account {
    margin-top: 20px;
  }

  .connected-account {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
