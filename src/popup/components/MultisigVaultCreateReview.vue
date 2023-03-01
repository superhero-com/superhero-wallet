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
                :options="accountsSelectOptions"
              >
                <template #current-text="{ text }">
                  <div>
                    <Truncate
                      class="account-select-text"
                      :str="text"
                    />
                  </div>
                </template>
              </FormSelect>
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
} from '@vue/composition-api';
import {
  IAccountFetched,
  ICreateMultisigAccount,
  IMultisigCreationPhase,
} from '../../types';
import { AETERNITY_SYMBOL } from '../utils';
import { useAccounts, useMultisigAccountCreate, useSdk } from '../../composables';

import Avatar from './Avatar.vue';
import AddressTruncated from './AddressTruncated.vue';
import AccountItem from './AccountItem.vue';
import BtnPill from './buttons/BtnPill.vue';
import DetailsItem from './DetailsItem.vue';
import DialogBox from './DialogBox.vue';
import FormSelect from './form/FormSelect.vue';
import TokenAmount from './TokenAmount.vue';
import Truncate from './Truncate.vue';

import LoadingIcon from '../../icons/animated-spinner.svg?skip-optimize';

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
    LoadingIcon,
    Truncate,
  },
  props: {
    phase: { type: String as PropType<IMultisigCreationPhase>, default: null },
    signers: { type: Array as PropType<ICreateMultisigAccount[]>, required: true },
    confirmationsRequired: { type: Number, required: true },
  },
  setup(props, { root }) {
    const { accounts, accountsSelectOptions } = useAccounts({ store: root.$store });
    const {
      multisigAccountCreationFee,
      prepareVaultCreationRawTx,
      multisigAccountCreationEncodedCallData,
    } = useMultisigAccountCreate({ store: root.$store });
    const { isLocalAccountAddress } = useAccounts({ store: root.$store });

    const { getSdk } = useSdk({ store: root.$store });

    const creatorAddress = ref<string>(props.signers[0].address || accounts.value[0].address);
    const creatorAccountFetched = ref<IAccountFetched>();
    const creatorAccount = computed(
      () => accounts.value.find(({ address }) => address === creatorAddress.value),
    );
    const fee = computed(() => multisigAccountCreationFee.value);
    const callData = computed(() => multisigAccountCreationEncodedCallData);

    watch(creatorAddress, async (val, oldVal) => {
      if (val !== oldVal) {
        creatorAccountFetched.value = undefined;
        const sdk = await getSdk();
        creatorAccountFetched.value = await sdk.api.getAccountByPubkey(val) as IAccountFetched;
        await prepareVaultCreationRawTx(val);
      }
    }, { immediate: true });

    return {
      AETERNITY_SYMBOL,
      accountsSelectOptions,
      creatorAddress,
      creatorAccount,
      creatorAccountFetched,
      isLocalAccountAddress,
      fee,
      callData,
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

  .account-select-text {
    max-width: 220px;
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
