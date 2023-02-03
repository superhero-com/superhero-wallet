<template>
  <div class="multisig-details">
    <DetailsItem
      :label="$t('pages.multisigDetails.address')"
    >
      <template #value>
        <div class="address-row">
          <Avatar
            class="avatar"
            :address="multisigAccountId"
          />
          <AddressFormatted
            :address="multisigAccountId"
            :column-count="9"
            class="text-address"
          />
        </div>
      </template>
    </DetailsItem>

    <DetailsItem
      :label="$t('pages.multisigDetails.contractId')"
    >
      <template #value>
        <div class="address-row">
          <Avatar
            class="avatar"
            :address="contractId"
          />
          <AddressFormatted
            :address="contractId"
            :column-count="9"
            class="text-address"
          />
        </div>
      </template>
    </DetailsItem>

    <LinkButton
      class="explorer-link"
      :to="getExplorerPath(contractId)"
    >
      {{ $t('pages.multisigDetails.explorerLink') }}
      <ExternalLinkIcon class="external-icon" />
    </LinkButton>

    <div class="row">
      <DetailsItem
        class="details-item"
        :label="$t('pages.multisigDetails.version')"
        :value="version"
      />
      <DetailsItem
        class="details-item"
        :label="$t('pages.multisigDetails.currentNonce')"
        :value="nonce"
      />
    </div>

    <div class="row">
      <AuthorizedAccounts
        :address-list="signers"
      />
      <DetailsItem
        class="details-item"
        :label="$t('pages.multisigDetails.consensus')"
        :value="consensus"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from '@vue/composition-api';
import { useGetter } from '../../composables/vuex';
import { useMultisigAccounts } from '../../composables';

import { IMultisigAccount } from '../../types';
import DetailsItem from '../components/DetailsItem.vue';
import AddressFormatted from '../components/AddressFormatted.vue';
import Avatar from '../components/Avatar.vue';
import AuthorizedAccounts from '../components/AuthorizedAccounts.vue';
import LinkButton from '../components/LinkButton.vue';
import ExternalLinkIcon from '../../icons/external-link.svg?vue-component';

export default defineComponent({
  name: 'MultisigDetails',
  components: {
    LinkButton,
    AuthorizedAccounts,
    Avatar,
    AddressFormatted,
    DetailsItem,
    ExternalLinkIcon,
  },
  setup(props, { root }) {
    const getExplorerPath = useGetter('getExplorerPath');

    const { activeMultisigAccount } = useMultisigAccounts({ store: root.$store });

    const {
      multisigAccountId, contractId, version, confirmedBy,
      nonce, signers, confirmationsRequired,
    } = activeMultisigAccount.value || {} as IMultisigAccount;

    const consensus = computed(() => (
      `${confirmedBy.length}/${confirmationsRequired} ${root.$t('of')} ${signers.length}`
    ));

    return {
      multisigAccountId,
      contractId,
      getExplorerPath,
      signers,
      version,
      nonce,
      consensus,
    };
  },
});
</script>

<style scoped lang="scss">
@use '../../styles/variables';

.multisig-details {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .address-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .text-address {
    color: variables.$color-white;
  }

  .row {
    display: flex;
    gap: 24px;
  }

  .details-item {
    width: 100%;
  }

  .explorer-link {
    color: rgba(variables.$color-white, 0.75);
    margin-block: 4px;

    .external-icon {
      opacity: 1;
      color: rgba(variables.$color-white, 0.75);
    }

    &:active,
    &:hover {
      color: variables.$color-white;
    }
  }
}
</style>
