<template>
  <IonPage>
    <IonContent class="ion-padding ion-content-bg">
      <div class="permission-manager">
        <div
          v-if="!editView"
          class="text-description"
        >
          {{ $t('pages.permissions.add-description') }}
        </div>

        <div class="inputs">
          <div class="permission-row">
            <Field
              v-slot="{ field, errorMessage }"
              name="name"
              rules="required"
            >
              <InputField
                v-bind="field"
                v-model="permission.name"
                name="name"
                :label="$t('pages.permissions.custom-name')"
                :placeholder="$t('pages.permissions.enter-custom-name')"
                :text-limit="32"
                :message="errorMessage"
              />
            </Field>
          </div>

          <div class="permission-row">
            <Field
              v-slot="{ field, errorMessage }"
              name="url"
              :rules="{
                required: true,
                url: permissionHostValidation
              }"
            >
              <InputField
                v-bind="field"
                v-model="permission.host"
                type="url"
                name="url"
                :label="$t('pages.permissions.permissions-for-url')"
                :placeholder="$t('pages.permissions.enter-url')"
                :message="errorMessage"
              />
            </Field>
          </div>
        </div>
        <div class="permission-row switch">
          <SwitchButton
            v-model="permission.address"
            :label="$t('pages.permissions.login')"
          />
        </div>

        <div class="permission-row switch">
          <SwitchButton
            v-model="permission.addressList"
            :label="$t('pages.permissions.addressList')"
          />
        </div>

        <div class="permission-row switch">
          <SwitchButton
            v-model="permission.messageSign"
            :label="$t('pages.permissions.message-sign')"
          />
        </div>

        <div class="permission-row switch">
          <SwitchButton
            v-model="permission.dailySpendLimit"
            :label="$t('pages.permissions.daily-spending-limit')"
          />
        </div>

        <transition
          name="fade-transition"
          mode="out-in"
        >
          <div
            v-if="permission.dailySpendLimit"
            class="transaction-sign-limit"
          >
            <Field
              v-slot="{ field }"
              name="transactionSignLimit"
              :rules="{
                min_value_exclusive: 0,
              }"
            >
              <InputAmount
                v-bind="field"
                v-model="permission.transactionSignLimit"
                class="transaction-limit-input"
                name="transactionSignLimit"
                label=" "
                :selected-asset="selectedAsset"
                :protocol="PROTOCOLS.aeternity"
                readonly
              />
            </Field>

            <div class="limit-info">
              <TokenAmount
                :label="$t('pages.permissions.spent-today')"
                :amount="permission.transactionSignSpent"
                :protocol="PROTOCOLS.aeternity"
              />
            </div>
            <div class="limit-info">
              <TokenAmount
                :label="$t('pages.permissions.left-today')"
                :amount="permission.transactionSignLimit - permission.transactionSignSpent"
                :protocol="PROTOCOLS.aeternity"
              />
            </div>
            <div class="limit-info">
              <TokenAmount
                :label="$t('pages.account.balance')"
                :amount="+balance"
                :protocol="PROTOCOLS.aeternity"
              />
            </div>
          </div>
        </transition>

        <div class="bottom">
          <div class="actions">
            <BtnMain
              variant="muted"
              :text="$t('common.cancel')"
              :to="{ name: ROUTE_PERMISSIONS_SETTINGS, replace: true }"
            />
            <BtnMain
              class="confirm"
              extra-padded
              :text="$t('common.confirm')"
              :disabled="!permissionChanged"
              @click="savePermission"
            />
          </div>
          <BtnMain
            v-if="editView"
            extend
            variant="muted"
            :text="$t('pages.permissions.delete')"
            :icon="DeleteIcon"
            @click="removePermissionAndRedirect()"
          />
        </div>
      </div>
    </IonContent>
  </IonPage>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useForm, Field } from 'vee-validate';
import { IonPage, IonContent } from '@ionic/vue';

import type { IPermission } from '@/types';
import {
  PERMISSION_DEFAULTS,
  PROTOCOLS,
} from '@/constants';
import { useBalances, useCurrencies } from '@/composables';
import { usePermissions } from '@/composables/permissions';
import { ROUTE_NOT_FOUND, ROUTE_PERMISSIONS_SETTINGS } from '@/popup/router/routeNames';
import { AE_CONTRACT_ID, AE_SYMBOL } from '@/protocols/aeternity/config';

import SwitchButton from '../components/SwitchButton.vue';
import InputAmount from '../components/InputAmount.vue';
import InputField from '../components/InputField.vue';
import TokenAmount from '../components/TokenAmount.vue';
import BtnMain from '../components/buttons/BtnMain.vue';
import DeleteIcon from '../../icons/trash.svg?vue-component';

export default defineComponent({
  components: {
    SwitchButton,
    InputField,
    InputAmount,
    TokenAmount,
    BtnMain,
    Field,
    IonPage,
    IonContent,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const { validate, setValues } = useForm();

    const { balance } = useBalances();
    const { getCurrentCurrencyRate } = useCurrencies();
    const { permissions, addPermission, removePermission } = usePermissions();

    const routeHost = route.params.host as string;
    const editView = !!route.meta?.isEdit;

    const permission = ref<IPermission>({ ...PERMISSION_DEFAULTS });
    const permissionChanged = ref(false);

    const selectedAsset = computed(() => ({
      contractId: AE_CONTRACT_ID,
      symbol: AE_SYMBOL,
      currentPrice: getCurrentCurrencyRate(PROTOCOLS.aeternity),
    }));

    const permissionHostValidation = computed(() => !permission.value.host?.includes('localhost'));

    function removePermissionAndRedirect() {
      removePermission(routeHost);
      router.replace({ name: ROUTE_PERMISSIONS_SETTINGS });
    }

    async function savePermission() {
      if (!(await validate()).valid) {
        return;
      }
      const hostValue = permission.value.host.toLowerCase();
      const { host } = (new URL(
        `${hostValue.includes('http') ? '' : 'http://'}${hostValue}`,
      ));

      if (host !== routeHost) {
        removePermission(routeHost);
      }

      if (!permission.value.dailySpendLimit) {
        permission.value.transactionSignLimit = 0;
      }

      addPermission({ ...permission.value, host });
      router.replace({ name: ROUTE_PERMISSIONS_SETTINGS });
    }

    if (editView) {
      const savedPermission = permissions.value[routeHost];
      if (!savedPermission) {
        router.replace({ name: ROUTE_NOT_FOUND });
      } else {
        if (typeof savedPermission.transactionSignLimit === 'string') {
          savedPermission.transactionSignLimit = +savedPermission.transactionSignLimit;
        }

        setValues({ url: savedPermission.host, ...savedPermission });
        permission.value = { ...PERMISSION_DEFAULTS, ...savedPermission };
      }
    }

    watch(permission, (val) => {
      permissionChanged.value = !!val.name;
    }, { deep: true });

    return {
      PROTOCOLS,
      ROUTE_PERMISSIONS_SETTINGS,
      DeleteIcon,
      editView,
      balance,
      permission,
      permissionHostValidation,
      permissionChanged,
      selectedAsset,
      removePermissionAndRedirect,
      savePermission,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '../../styles/variables';
@use '../../styles/typography';
@use '../../styles/mixins';

.permission-manager {
  --screen-padding-x: 14px;

  padding-inline: var(--screen-padding-x);
  color: variables.$color-white;

  .inputs {
    margin-bottom: 32px;
  }

  .permission-row {
    margin: 10px 0;

    &.switch {
      margin-bottom: 0;
      padding-top: 3px;
      padding-right: 5px;
    }
  }

  .transaction-sign-limit {
    .transaction-limit-input {
      margin-bottom: 16px;
    }

    .limit-info {
      padding: 4px 0;
    }
  }

  .bottom {
    padding-top: 38px;
    padding-bottom: 16px;

    .actions {
      width: 100%;
      display: flex;
      padding-bottom: 12px;
      gap: 12px;

      .confirm {
        flex: 1.8;
      }
    }
  }
}
</style>
