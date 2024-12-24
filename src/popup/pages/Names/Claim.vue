<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg--lighter">
      <div class="claim">
        <Field
          v-slot="{ field, errorMessage }"
          name="name"
          :rules="{
            enough_coin: totalNameClaimAmount.toString(),
            required: true,
            aens_name: true,
            aens_name_unregistered: true,
            max_len: maxNameLength,
          }"
        >
          <InputField
            v-bind="field"
            v-model="name"
            name="name"
            class="chain-name"
            :label="$t('pages.names.claim.register-name')"
            :message="errorMessage"
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
          :disabled="isLoaderVisible || !name || errorName"
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
  nextTick,
} from 'vue';
import {
  AensName,
  buildTx,
  commitmentHash,
  getExecutionCost,
  getMinimumNameFee,
  isNameValid as isAensNameValid,
  Name,
  Tag,
  unpackTx,
} from '@aeternity/aepp-sdk';
import { IonPage, IonContent, onIonViewWillEnter } from '@ionic/vue';
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
} from '@/composables';
import { ROUTE_ACCOUNT_DETAILS_NAMES } from '@/popup/router/routeNames';
import {
  AE_COIN_PRECISION,
  AE_AENS_DOMAIN,
  AE_AENS_NAME_MAX_LENGTH,
  AE_AENS_NAME_AUCTION_MAX_LENGTH,
} from '@/protocols/aeternity/config';
import { useAeNames } from '@/protocols/aeternity/composables/aeNames';

import InputField from '../../components/InputField.vue';
import CheckBox from '../../components/CheckBox.vue';
import BtnMain from '../../components/buttons/BtnMain.vue';
import BtnHelp from '../../components/buttons/BtnHelp.vue';

const STUB_NAME_SALT = 4204563566073083;

export default defineComponent({
  name: 'Claim',
  components: {
    InputField,
    CheckBox,
    BtnMain,
    BtnHelp,
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
    const { openDefaultModal } = useModals();
    const { getAeSdk } = useAeSdk();
    const { isLoaderVisible, setLoaderVisible } = useUi();
    const {
      setPendingAutoExtendName,
      updateOwnedNames,
      updateNamePointer,
    } = useAeNames();

    const name = ref('');
    const autoExtend = ref(false);
    const maxNameLength = AE_AENS_NAME_MAX_LENGTH - AE_AENS_DOMAIN.length;

    const fullName = computed((): AensName => `${name.value}${AE_AENS_DOMAIN}`);
    const isNameValid = computed(() => name.value && isAensNameValid(fullName.value));

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

    async function claim() {
      // Show loader at the beginning because the validation is also fetching some data
      // so we need to block user from double clicking the claim button.
      setLoaderVisible(true);

      if (!(await validate()).valid) {
        setLoaderVisible(false);
        return;
      }

      const aeSdk = await getAeSdk();
      const nameObj = new Name(fullName.value, aeSdk.getContext());
      const isNameRegistered = await nameObj.getState().then(() => true, () => false);

      if (isNameRegistered) {
        setLoaderVisible(false);
        openDefaultModal({
          title: t('modals.name-exist.msg'),
        });
      } else {
        let claimTxHash;

        try {
          await nameObj.preclaim();
          claimTxHash = (await nameObj.claim({ waitMined: false })).hash;
          if (autoExtend.value) {
            setPendingAutoExtendName(fullName.value);
          }
          await nextTick();
          router.push({ name: ROUTE_ACCOUNT_DETAILS_NAMES });
        } catch (error: any) {
          let msg = error.message;
          if (msg.includes('is not enough to execute') || error.statusCode === 404) {
            msg = t('pages.names.balance-error');
          }
          openDefaultModal({
            icon: 'critical',
            msg,
          });
          return;
        } finally {
          setLoaderVisible(false);
        }

        try {
          await aeSdk.poll(claimTxHash);
          if (AE_AENS_NAME_AUCTION_MAX_LENGTH < fullName.value.length) {
            await updateNamePointer({
              name: fullName.value,
              address: activeAccount.value.address,
            });
          }
        } catch (error: any) {
          openDefaultModal({ msg: error.message });
        } finally {
          updateOwnedNames();
        }
      }
    }

    onIonViewWillEnter(() => {
      setLoaderVisible(false);
    });

    return {
      AE_AENS_DOMAIN,
      autoExtend,
      isLoaderVisible,
      isNameValid,
      name,
      totalNameClaimAmount,
      errorName,
      maxNameLength,
      claim,
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

  .explanation {
    margin-top: 10px;
  }

  .btn-register {
    margin-top: 20px;
  }
}
</style>
