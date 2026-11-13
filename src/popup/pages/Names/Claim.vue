<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg--lighter">
      <div class="claim">
        <Field
          v-slot="{ field, errorMessage }"
          name="name"
          :rules="{
            required: true,
            aens_name: true,
            max_len: maxNameLength,
            enough_coin: totalNameClaimAmount.toString(),
          }"
        >
          <InputField
            v-bind="field"
            v-model="name"
            name="name"
            class="chain-name"
            :label="$t('pages.names.claim.register-name')"
            :message="availability === 'registered' ? $t('validation.nameUnregistered') : errorMessage"
            :placeholder="$t('pages.names.claim.name-placeholder')"
            :text-limit="maxNameLength"
          >
            <template #label-after>
              <span
                class="chain-name-counter"
                :class="{ red: maxNameLength - name.length < 0 }"
              >
                {{ name.length }}/{{ maxNameLength }}
              </span>
            </template>
            <template #after>
              <span class="aens-domain">{{ AE_AENS_DOMAIN }}</span>
            </template>
          </InputField>
        </Field>

        <div
          v-if="availability === 'auction' || availabilityError"
          class="availability"
          role="status"
        >
          <p>{{ availabilityError ? $t('pages.names.claim.availability-error') : $t('pages.names.claim.in-auction') }}</p>
          <p v-if="auctionLoadError">
            {{ $t('pages.names.claim.auction-loading-error') }}
          </p>
          <BtnPlain
            :disabled="isOpeningAuction || isCheckingAvailability || isSubmitting"
            data-cy="name-availability-action"
            @click="availability === 'auction' ? viewAuction() : refreshAvailability()"
          >
            {{ availabilityError || auctionLoadError ? $t('pages.names.claim.retry') : $t('pages.names.claim.view-auction') }}
          </BtnPlain>
        </div>

        <CheckBox v-model="autoExtend">
          <div class="auto-extend-label">
            {{ $t('pages.names.claim.auto-extend') }}
            <BtnHelp
              :title="$t('modals.nameAutoExtendHelp.title')"
              :msg="$t('modals.nameAutoExtendHelp.msg')"
              :class="{ active: autoExtend }"
            />
          </div>
        </CheckBox>

        <i18n-t
          keypath="pages.names.claim.short-names.message"
          tag="p"
          class="text-description explanation"
          scope="global"
        >
          <strong>{{ $t('pages.names.claim.short-names.insertion') }}</strong>
        </i18n-t>

        <BtnMain
          class="btn-register"
          extend
          :disabled="isLoaderVisible || isSubmitting || isCheckingAvailability || availability !== 'available' || !name || !!errorName"
          data-cy="register-name"
          @click="claim"
        >
          {{
            isNameValid
              ? $t('pages.names.claim.button-price', [totalNameClaimAmount.toFixed(4)])
              : $t('pages.names.claim.button')
          }}
        </BtnMain>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  watch,
  onBeforeUnmount,
} from 'vue';
import {
  AensName,
  buildTx,
  commitmentHash,
  getExecutionCost,
  getMinimumNameFee,
  isNameValid as isAensNameValid,
  Tag,
  unpackTx,
} from '@aeternity/aepp-sdk';
import {
  IonPage,
  IonContent,
  onIonViewWillEnter,
  onIonViewWillLeave,
} from '@ionic/vue';
import { useRouter } from 'vue-router';
import { useForm, useFieldError, Field } from 'vee-validate';
import { useI18n } from 'vue-i18n';
import BigNumber from 'bignumber.js';

import { STUB_ADDRESS, STUB_NONCE } from '@/constants/stubs';
import {
  useAccounts,
  useModals,
  useAeSdk,
  useUi,
  useNetworks,
} from '@/composables';
import { ROUTE_ACCOUNT_DETAILS_NAMES, ROUTE_AUCTION_BID } from '@/popup/router/routeNames';
import {
  AE_COIN_PRECISION,
  AE_AENS_DOMAIN,
  AE_AENS_NAME_MAX_LENGTH,
} from '@/protocols/aeternity/config';
import { NAME_CLAIM_STATUS, useAeNames } from '@/protocols/aeternity/composables/aeNames';
import { getNameRegistrationState } from '@/protocols/aeternity/helpers/nameRegistration';
import type { NameRegistrationState } from '@/protocols/aeternity/helpers/nameRegistration';
import { MODAL_NAME_CLAIM_INFO } from '@/constants';

import InputField from '../../components/InputField.vue';
import CheckBox from '../../components/CheckBox.vue';
import BtnMain from '../../components/buttons/BtnMain.vue';
import BtnHelp from '../../components/buttons/BtnHelp.vue';
import BtnPlain from '../../components/buttons/BtnPlain.vue';

const STUB_NAME_SALT = 4204563566073083;

export default defineComponent({
  name: 'Claim',
  components: {
    InputField,
    CheckBox,
    BtnMain,
    BtnHelp,
    BtnPlain,
    Field,
    IonPage,
    IonContent,
  },
  setup() {
    const router = useRouter();
    const { validate } = useForm();
    const errorName = useFieldError('name');
    const { t } = useI18n();

    const { activeAccount } = useAccounts();
    const { openDefaultModal, openModal } = useModals();
    const { getAeSdk, nodeNetworkId, ensureNodeNetworkId } = useAeSdk();
    const { activeNetwork } = useNetworks();
    const {
      isLoaderVisible,
      isNameClaimInfoModalHidden,
      setLoaderVisible,
      setNameClaimInfoModalHidden,
    } = useUi();
    const {
      addNameToClaimQueue, preclaimedNames, fetchNameAuction, setAuctionEntry,
    } = useAeNames();

    const name = ref('');
    const autoExtend = ref(false);
    const availability = ref<NameRegistrationState | null>(null);
    const availabilityError = ref(false);
    const auctionLoadError = ref(false);
    const isCheckingAvailability = ref(false);
    const isSubmitting = ref(false);
    const isOpeningAuction = ref(false);
    const isPageActive = ref(true);
    let contextRevision = 0;
    let availabilityRequestId = 0;
    let ownsLoader = false;
    const maxNameLength = AE_AENS_NAME_MAX_LENGTH - AE_AENS_DOMAIN.length;

    const fullName = computed((): AensName => `${name.value}${AE_AENS_DOMAIN}`);
    const isNameValid = computed(() => name.value && isAensNameValid(fullName.value));
    const contextKey = computed(() => JSON.stringify([
      fullName.value, activeAccount.value.address, activeNetwork.value, nodeNetworkId.value,
    ]));

    function captureContext() {
      return {
        name: fullName.value,
        address: activeAccount.value.address,
        autoExtend: autoExtend.value,
        revision: contextRevision,
      };
    }

    const isCurrentContext = (context: ReturnType<typeof captureContext>) => (
      isPageActive.value && context.revision === contextRevision
    );

    async function refreshAvailability(context = captureContext()) {
      availabilityRequestId += 1;
      const requestId = availabilityRequestId;
      availability.value = null;
      availabilityError.value = false;
      auctionLoadError.value = false;
      if (!isNameValid.value) return null;
      isCheckingAvailability.value = true;
      try {
        const aeSdk = await getAeSdk();
        // Registration stores the salt under it, a failed startup status request leaves it empty
        await ensureNodeNetworkId();
        if (!isCurrentContext(context)) return null;
        const node = aeSdk.api;
        const state = await getNameRegistrationState(context.name, node);
        if (!isCurrentContext(context) || requestId !== availabilityRequestId) return null;
        if (aeSdk.api !== node) {
          availabilityError.value = true;
          return null;
        }
        availability.value = state;
        return state;
      } catch (error) {
        if (isCurrentContext(context) && requestId === availabilityRequestId) {
          availabilityError.value = true;
        }
        return null;
      } finally {
        if (requestId === availabilityRequestId) isCheckingAvailability.value = false;
      }
    }

    watch([contextKey, isPageActive], (_, __, onCleanup) => {
      contextRevision += 1;
      availabilityRequestId += 1;
      availability.value = null;
      availabilityError.value = false;
      auctionLoadError.value = false;
      isCheckingAvailability.value = false;
      if (!isPageActive.value || !isNameValid.value) return;
      isCheckingAvailability.value = true;
      const context = captureContext();
      const timeout = setTimeout(() => { refreshAvailability(context); }, 300);
      onCleanup(() => clearTimeout(timeout));
    }, { immediate: true, flush: 'sync' });

    const queuedClaimInProgress = computed(() => {
      const queuedClaim = preclaimedNames.value[nodeNetworkId.value!]?.[fullName.value];
      return (
        queuedClaim
        && (
          queuedClaim.status === NAME_CLAIM_STATUS.preclaimSubmitted
          || queuedClaim.status === NAME_CLAIM_STATUS.preclaimed
          || queuedClaim.status === NAME_CLAIM_STATUS.claimSubmitted
        )
      ) ? queuedClaim : null;
    });

    const totalNameClaimAmount = computed(() => !isNameValid.value
      ? BigNumber(0)
      : BigNumber(unpackTx(
        buildTx({
          tag: Tag.NamePreclaimTx,
          accountId: STUB_ADDRESS,
          nonce: STUB_NONCE,
          commitmentId: commitmentHash(fullName.value, STUB_NAME_SALT),
        }),
        Tag.NamePreclaimTx,
      ).fee)
        .plus(getExecutionCost(buildTx({
          tag: Tag.NameClaimTx,
          accountId: STUB_ADDRESS,
          nonce: STUB_NONCE,
          name: fullName.value,
          nameSalt: 0,
          nameFee: getMinimumNameFee(fullName.value),
        }) as any).toString())
        .shiftedBy(-AE_COIN_PRECISION));

    function setSubmissionLoader(visible: boolean) {
      if (visible || ownsLoader) setLoaderVisible(visible);
      ownsLoader = visible;
    }

    async function claim() {
      if (isSubmitting.value) return;
      isSubmitting.value = true;
      setSubmissionLoader(true);
      const context = captureContext();
      function rejectQueuedClaim() {
        if (!queuedClaimInProgress.value) return false;
        openDefaultModal({
          title: t('modals.name-exist.title'),
          msg: queuedClaimInProgress.value.address === context.address
            ? t('modals.name-already-preclaimed.msg')
            : t('modals.name-already-preclaimed.other-account'),
        });
        return true;
      }
      try {
        if (rejectQueuedClaim()) return;
        if (await refreshAvailability(context) !== 'available') return;
        if (!(await validate()).valid || !isCurrentContext(context)) return;
        if (!isNameClaimInfoModalHidden.value) {
          setSubmissionLoader(false);
          const shouldHideInfoModal = await openModal<boolean>(MODAL_NAME_CLAIM_INFO);
          if (shouldHideInfoModal) {
            setNameClaimInfoModalHidden(true);
          }
          if (!isCurrentContext(context)) return;
          setSubmissionLoader(true);
        }
        if (!isCurrentContext(context) || rejectQueuedClaim()) return;
        const isClaimQueued = await addNameToClaimQueue(
          context.name,
          context.address,
          context.autoExtend,
        );
        if (!isCurrentContext(context)) return;
        if (isClaimQueued) {
          setSubmissionLoader(false);
          name.value = '';
          await router.push({ name: ROUTE_ACCOUNT_DETAILS_NAMES });
        } else {
          await refreshAvailability(context);
        }
      } catch (error: any) {
        if (isCurrentContext(context)) openDefaultModal({ msg: error.message });
      } finally {
        isSubmitting.value = false;
        setSubmissionLoader(false);
      }
    }

    async function viewAuction() {
      if (isOpeningAuction.value || isSubmitting.value) return;
      isOpeningAuction.value = true;
      const context = captureContext();
      try {
        if (await refreshAvailability(context) !== 'auction') return;
        const auction = await fetchNameAuction(context.name);
        if (!isCurrentContext(context)) return;
        setAuctionEntry({ name: context.name, ...auction });
        await router.push({ name: ROUTE_AUCTION_BID, params: { name: context.name } });
      } catch (error) {
        if (isCurrentContext(context)) auctionLoadError.value = true;
      } finally {
        isOpeningAuction.value = false;
      }
    }

    onIonViewWillEnter(() => {
      isPageActive.value = true;
      setLoaderVisible(false);
    });
    onIonViewWillLeave(() => {
      setSubmissionLoader(false);
      isPageActive.value = false;
    });
    onBeforeUnmount(() => {
      setSubmissionLoader(false);
      isPageActive.value = false;
    });

    return {
      AE_AENS_DOMAIN,
      autoExtend,
      availability,
      availabilityError,
      auctionLoadError,
      isCheckingAvailability,
      isSubmitting,
      isOpeningAuction,
      isLoaderVisible,
      isNameValid,
      name,
      totalNameClaimAmount,
      errorName,
      maxNameLength,
      claim,
      refreshAvailability,
      viewAuction,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';

.claim {
  padding-inline: var(--screen-padding-x);

  .chain-name {
    margin-bottom: 6px;

    &-counter {
      @extend %face-sans-13-regular;

      color: $color-grey-dark;

      &.red {
        color: $color-danger;
      }
    }

    .aens-domain {
      user-select: none;
    }
  }

  .auto-extend-label {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .availability {
    margin-top: 12px;

    .button-plain {
      color: $color-primary;
    }
  }

  .explanation {
    margin-top: 10px;
  }

  .btn-register {
    margin-top: 20px;
  }
}
</style>
