<template>
  <div class="multisig-vault-create-review">
    <h2 class="text-heading-1">
      {{ $t('modals.createMultisigAccount.title') }}
    </h2>

    <DetailsItem :label="$t('multisig.creatingAccount')">
      <template #value>
        <div class="creator">
          <Avatar :address="creatorAccount.address" />
          <div class="creator-data">
            <BtnPill
              class="account-select"
              dense
            >
              <FormSelect
                v-model="creatorAddress"
                unstyled
                :default-text="$t('modals.createMultisigAccount.selectAccount')"
                :options="accountsOptions"
              />
            </BtnPill>
            <AddressTruncated
              show-explorer-link
              :address="creatorAccount.address"
            />
          </div>
        </div>
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
        {{ confirmationsRequired }}/{{ confirmationsRequired }}
        {{ $t('common.of') }}
        {{ signers.length }}
      </DetailsItem>
    </div>

    <DetailsItem :label="$t('transaction.fee')">
      <template #value>
        <PendingIcon
          v-if="loading"
          class="loading-icon"
        />
        <TokenAmount
          v-else
          :amount="gasFee"
          :symbol="AETERNITY_SYMBOL"
        />
      </template>
    </DetailsItem>

    <DetailsItem
      expandable
      :label="$t('transaction.advancedDetails')"
    >
      <DetailsItem :label="$t('common.nonce')">
        <!-- TODO -->
        TODO
      </DetailsItem>
      <DetailsItem :label="$t('common.callData')">
        <!-- TODO -->
        TODO
      </DetailsItem>
      <DetailsItem
        :label="$t('common.contractId')"
        small
      >
        <!-- TODO -->
        <AddressFormatted
          :address="'TO_DOTODOTODO'"
        />
      </DetailsItem>
    </DetailsItem>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
} from '@vue/composition-api';
import BigNumber from 'bignumber.js';
import { IAccount, ICreateMultisigAccount } from '../../types';
import { AETERNITY_SYMBOL, getAccountNameToDisplay, MAGNITUDE } from '../utils';
import { useAccounts, useMultisigAccounts } from '../../composables';
import { useGetter } from '../../composables/vuex';

import Avatar from './Avatar.vue';
import AddressTruncated from './AddressTruncated.vue';
import AddressFormatted from './AddressFormatted.vue';
import AccountItem from './AccountItem.vue';
import BtnPill from './buttons/BtnPill.vue';
import DetailsItem from './DetailsItem.vue';
import DialogBox from './DialogBox.vue';
import TokenAmount from './TokenAmount.vue';
import FormSelect, { FormSelectOption } from './form/FormSelect.vue';

import PendingIcon from '../../icons/animated-pending.svg?vue-component';

export default defineComponent({
  components: {
    DetailsItem,
    AccountItem,
    DialogBox,
    TokenAmount,
    BtnPill,
    Avatar,
    AddressTruncated,
    FormSelect,
    PendingIcon,
    AddressFormatted,
  },
  props: {
    signers: { type: Array as PropType<ICreateMultisigAccount[]>, required: true },
    confirmationsRequired: { type: Number, required: true },
  },
  setup(props, { root }) {
    const {
      isLocalAccountAddress,
    } = useAccounts({ store: root.$store });

    const {
      estimateMultisigAccountDeployGasFee,
    } = useMultisigAccounts({ store: root.$store });

    const loading = ref(false);
    const gasFee = ref(0);
    const accounts = useGetter<IAccount[]>('accounts');
    const accountsOptions = computed(
      (): FormSelectOption[] => accounts.value.map((acc) => ({
        text: getAccountNameToDisplay(acc),
        value: acc.address,
        address: acc.address,
      })),
    );
    const creatorAddress = ref<string>(accounts.value[0].address);
    const creatorAccount = computed(
      () => accounts.value.find(({ address }) => address === creatorAddress.value),
    );

    (async () => {
      loading.value = true;
      const rawGasFee = await estimateMultisigAccountDeployGasFee(
        null,
        props.confirmationsRequired,
        props.signers.map(({ address }) => address),
      );
      // TODO establish the correct fee
      gasFee.value = parseInt(new BigNumber(rawGasFee).shiftedBy(-MAGNITUDE).toFixed(), 10);
      loading.value = false;
    })();

    return {
      AETERNITY_SYMBOL,
      loading,
      accountsOptions,
      creatorAddress,
      creatorAccount,
      gasFee,
      isLocalAccountAddress,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables' as *;

.multisig-vault-create-review {
  display: flex;
  flex-direction: column;
  gap: var(--gap);

  .creator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-block: 4px;
  }

  .account-select {
    margin-bottom: 4px;
    margin-left: -3px; // Compensate roundness
    color: $color-white;
  }

  .review-details-row {
    display: flex;
    gap: 20px;
  }

  .loading-icon {
    width: 24px;
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
