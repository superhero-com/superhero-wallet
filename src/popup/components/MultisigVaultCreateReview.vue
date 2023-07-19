<template>
  <div class="multisig-vault-create-review">
    <h2 class="text-heading-1">
      {{ $t('modals.createMultisigAccount.title') }}
    </h2>

    <DetailsItem :label="$t('multisig.creatingAccount')">
      <template #value>
        <AccountSelector v-model="creatorAddress" />
        <i18n-t
          v-if="notEnoughBalanceToCreateMultisig"
          keypath="modals.createMultisigAccount.errorNotEnoughBalanceToCreateVault"
          tag="div"
          class="creator-error-message"
          scope="global"
        >
          <span>{{ fee }} {{ AETERNITY_SYMBOL }}</span>
        </i18n-t>
      </template>
    </DetailsItem>

    <div class="review-details-row">
      <DetailsItem :label="$t('multisig.authorizedSigners')">
        <template #value>
          <div class="authorized-signers">
            <div
              v-for="signer in signers"
              :key="signer.address"
              class="authorized-signers-row"
            >
              <AccountItem :address="signer.address" />
              <DialogBox
                v-if="isLocalAccountAddress(signer.address)"
                dense
                v-text="$t('common.you')"
              />
            </div>
          </div>
        </template>
      </DetailsItem>

      <DetailsItem :label="$t('multisig.consensus')">
        <template #label>
          <BtnHelp @help="openConsensusInfoModal" />
        </template>
        <ConsensusLabel
          :confirmations-required="confirmationsRequired"
          :signers="signers"
          :default-confirmed-by="confirmationsRequired"
        />
      </DetailsItem>
    </div>

    <LoadingIcon
      v-if="!fee || !callData || !creatorAccountFetched"
      class="loading-icon"
    />
    <template v-else>
      <DetailsItem :label="$t('transaction.fee')">
        <template #value>
          <TokenAmount
            :amount="fee"
            :symbol="AETERNITY_SYMBOL"
          />
        </template>
      </DetailsItem>

      <DetailsItem
        expandable
        :label="$t('transaction.advancedDetails')"
      >
        <DetailsItem
          :label="$t('common.nonce')"
          :value="creatorAccountFetched.nonce"
        />
        <DetailsItem
          :label="$t('common.callData')"
          :value="callData"
          small
        />
      </DetailsItem>
    </template>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
  watch,
} from 'vue';
import { useStore } from 'vuex';
import { Encoded } from '@aeternity/aepp-sdk';

import {
  IAccountFetched,
  ICreateMultisigAccount,
  IMultisigCreationPhase,
} from '../../types';
import {
  AETERNITY_SYMBOL,
  handleUnknownError,
  MODAL_CONSENSUS_INFO,
} from '../utils';
import {
  useAccounts,
  useModals,
  useMultisigAccountCreate,
  useSdk,
} from '../../composables';

import AccountSelector from './AccountSelector.vue';
import AccountItem from './AccountItem.vue';
import DetailsItem from './DetailsItem.vue';
import DialogBox from './DialogBox.vue';
import TokenAmount from './TokenAmount.vue';
import ConsensusLabel from './ConsensusLabel.vue';
import BtnHelp from './buttons/BtnHelp.vue';

import LoadingIcon from '../../icons/animated-spinner.svg?skip-optimize';

export default defineComponent({
  components: {
    BtnHelp,
    AccountSelector,
    ConsensusLabel,
    DetailsItem,
    AccountItem,
    DialogBox,
    TokenAmount,
    LoadingIcon,
  },
  props: {
    phase: { type: String as PropType<IMultisigCreationPhase>, default: null },
    signers: { type: Array as PropType<ICreateMultisigAccount[]>, required: true },
    confirmationsRequired: { type: Number, required: true },
    accountId: { type: String as PropType<Encoded.AccountAddress>, required: true },
  },
  setup(props) {
    const store = useStore();
    const { accounts } = useAccounts({ store });
    const {
      multisigAccountCreationFee,
      prepareVaultCreationRawTx,
      pendingMultisigCreationTxs,
      notEnoughBalanceToCreateMultisig,
    } = useMultisigAccountCreate({ store });
    const { isLocalAccountAddress } = useAccounts({ store });

    const { getSdk } = useSdk({ store });

    const { openModal } = useModals();

    const creatorAddress = ref<Encoded.AccountAddress>(
      props.signers[0].address || accounts.value[0].address,
    );
    const creatorAccountFetched = ref<IAccountFetched>();
    const creatorAccount = computed(
      () => accounts.value.find(({ address }) => address === creatorAddress.value),
    );
    const fee = computed(() => multisigAccountCreationFee.value);
    const callData = computed(
      () => pendingMultisigCreationTxs.value[props.accountId]
        .multisigAccountCreationEncodedCallData,
    );

    watch(creatorAddress, async (val, oldVal) => {
      if (val !== oldVal) {
        creatorAccountFetched.value = undefined;
        const sdk = await getSdk();
        try {
          const rawAccount = await sdk.api.getAccountByPubkey(val);
          creatorAccountFetched.value = {
            ...rawAccount,
            balance: rawAccount.balance.toString(),
          };
        } catch (error) {
          handleUnknownError(error);
          creatorAccountFetched.value = {
            balance: '0',
            id: val,
            kind: 'basic',
            nonce: 0,
            payable: false,
          };
        }
        await prepareVaultCreationRawTx(val, props.accountId);
      }
    }, { immediate: true });

    function openConsensusInfoModal() {
      openModal(MODAL_CONSENSUS_INFO);
    }

    return {
      AETERNITY_SYMBOL,
      creatorAddress,
      creatorAccount,
      creatorAccountFetched,
      isLocalAccountAddress,
      fee,
      callData,
      notEnoughBalanceToCreateMultisig,
      openConsensusInfoModal,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;
@use '../../styles/typography';

.multisig-vault-create-review {
  display: flex;
  flex-direction: column;
  gap: var(--gap);

  .creator-error-message {
    @extend %face-sans-14-regular;

    letter-spacing: normal;
    color: $color-danger;
    line-height: 22px;

    span {
      font-weight: 500;
    }
  }

  .review-details-row {
    display: flex;
    gap: 20px;
  }

  .loading-icon {
    margin-inline: auto;
    width: 72px;
  }

  .authorized-signers {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &-row {
      display: flex;
      gap: 4px;
      align-items: center;
    }
  }
}
</style>
