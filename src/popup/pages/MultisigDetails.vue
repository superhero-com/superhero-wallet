<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div
        v-if="activeMultisigAccount"
        class="multisig-details"
      >
        <DetailsItem
          :label="$t('multisig.address')"
        >
          <template #value>
            <div class="address-row">
              <Avatar
                class="avatar"
                :address="activeMultisigAccount.gaAccountId"
              />
              <AddressFormatted
                :address="activeMultisigAccount.gaAccountId"
                :column-count="9"
                class="text-address"
              />
            </div>
          </template>
        </DetailsItem>

        <DetailsItem
          :label="$t('common.contractId')"
        >
          <template #value>
            <div class="address-row">
              <Avatar
                class="avatar"
                :address="activeMultisigAccount.contractId"
              />
              <AddressFormatted
                :address="activeMultisigAccount.contractId"
                :column-count="9"
                class="text-address"
              />
            </div>
          </template>
        </DetailsItem>

        <div class="explorer-link">
          <LinkButton
            :text="$t('multisig.explorerLink')"
            :href="activeMultisigAccountExplorerUrl!"
            variant="muted"
            is-external
            underlined
          />
        </div>

        <div class="row">
          <DetailsItem
            class="details-item"
            :label="$t('multisig.version')"
            :value="activeMultisigAccount.version"
          />
          <DetailsItem
            class="details-item"
            :label="$t('multisig.currentNonce')"
            :value="activeMultisigAccount.nonce"
          />
        </div>

        <DetailsItem
          class="details-item"
          :label="$t('multisig.consensus')"
        >
          <template #label>
            <BtnHelp @help="openConsensusInfoModal" />
          </template>
          <template #value>
            <ConsensusLabel
              :confirmations-required="activeMultisigAccount.confirmationsRequired"
              :has-pending-transaction="activeMultisigAccount.hasPendingTransaction"
              :confirmed-by="activeMultisigAccount.confirmedBy"
              :signers="activeMultisigAccount.signers"
            />
          </template>
        </DetailsItem>
        <AuthorizedAccounts
          :address-list="activeMultisigAccount.signers"
        />
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  IonContent,
  IonPage,
  onIonViewWillEnter,
  onIonViewWillLeave,
} from '@ionic/vue';
import {
  defineComponent,
  onBeforeUnmount,
} from 'vue';
import { MODAL_CONSENSUS_INFO } from '@/constants';
import { useModals, useMultisigAccounts } from '@/composables';

import DetailsItem from '../components/DetailsItem.vue';
import AddressFormatted from '../components/AddressFormatted.vue';
import Avatar from '../components/Avatar.vue';
import AuthorizedAccounts from '../components/AuthorizedAccounts.vue';
import LinkButton from '../components/LinkButton.vue';

import ConsensusLabel from '../components/ConsensusLabel.vue';
import BtnHelp from '../components/buttons/BtnHelp.vue';

export default defineComponent({
  name: 'MultisigDetails',
  components: {
    BtnHelp,
    ConsensusLabel,
    LinkButton,
    AuthorizedAccounts,
    Avatar,
    AddressFormatted,
    DetailsItem,
    IonContent,
    IonPage,
  },
  setup() {
    const { openModal } = useModals();
    const {
      activeMultisigAccount,
      activeMultisigAccountExplorerUrl,
      fetchAdditionalInfo,
      stopFetchingAdditionalInfo,
    } = useMultisigAccounts();

    function openConsensusInfoModal() {
      openModal(MODAL_CONSENSUS_INFO);
    }

    onIonViewWillEnter(fetchAdditionalInfo);

    onIonViewWillLeave(stopFetchingAdditionalInfo);

    onBeforeUnmount(stopFetchingAdditionalInfo);

    return {
      activeMultisigAccount,
      activeMultisigAccountExplorerUrl,
      openConsensusInfoModal,
    };
  },
});
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;
@use '@/styles/typography';

.multisig-details {
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  .address-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .text-address {
    color: $color-white;
  }

  .row {
    display: flex;
    gap: 24px;
  }

  .explorer-link {
    @extend %face-sans-14-medium;

    margin-block: 4px;
  }
}
</style>
