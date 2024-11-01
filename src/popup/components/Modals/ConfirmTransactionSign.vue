<template>
  <Modal
    show
    full-screen
    class="confirm-transaction-sign"
    data-cy="popup-aex2"
  >
    <AnimatedSpinner
      v-if="loading"
      class="loader"
    />

    <template v-else>
      <TransactionOverview
        :transaction="transaction"
        :additional-tag="appName"
      />
      <div
        v-if="appName || error"
        class="subtitle"
        :class="{ warning: !!error }"
      >
        <template v-if="!!error">
          {{ $t('modals.confirmTransactionSign.unableToExecute') }}
        </template>
        <template v-else>
          <span class="app-name">{{ appName }}</span>
          {{ $t('modals.confirmTransactionSign.confirmSigning') }}
        </template>
      </div>
      <DetailsItem
        v-if="!!error"
        :label="$t('pages.transactionDetails.reason')"
        :value="error"
        class="reason"
        data-cy="reason"
      />
      <span
        v-if="popupProps?.isSenderReplaced"
        class="sender-replaced"
        data-cy="sender-replaced-warning"
      >
        {{ $t('modals.confirmTransactionSign.senderReplaced') }}
      </span>
      <DetailsItem
        v-if="decodedCallData?.functionName"
        :label="$t('modals.confirmTransactionSign.functionName')"
        :value="decodedCallData.functionName"
      />

      <!-- Aeternity DEX & Tokaen transactions any ETH transactions involving multiple assets -->
      <template
        v-if="(
          (isDex || isTokenSale) && tokenList.length
          || protocol === PROTOCOLS.ethereum && tokenList.length > 1
        )"
      >
        <TransactionDetailsPoolTokenRow
          v-for="(token, idx) in tokenList"
          :key="token.contractId"
          :token="token"
          :tokens="token.tokens || null"
          :label="getLabels(token, idx)"
          :hide-amount="isDexSwap || isTokenSale"
          :protocol="protocol"
        />
      </template>

      <div class="details">
        <DetailsItem
          v-if="nameAeFee"
          :label="$t('modals.confirmTransactionSign.nameFee')"
        >
          <TokenAmount
            :amount="nameAeFee"
            :protocol="protocol"
          />
        </DetailsItem>

        <DetailsItem
          v-if="isDexSwap || isTokenSale"
          :label="swapDirectionTranslation"
        >
          <TokenAmount
            :amount="swapTokenAmount"
            :symbol="tokenSymbol"
            :hide-fiat="!swapTokenData.isWrappedCoin || isAex9"
            :protocol="protocol"
            data-cy="total"
          />
        </DetailsItem>

        <DetailsItem
          v-if="popupProps?.tx?.gasLimit"
          :value="popupProps.tx.gasLimit"
          :label="$t('transaction.gasLimit')"
          data-cy="gas"
        />
        <DetailsItem
          v-if="gasPrice"
          :label="$t('pages.transactionDetails.gasPrice')"
          data-cy="gas-price"
        >
          <template #value>
            <TokenAmount
              :amount="+aettosToAe(gasPrice)"
              :symbol="AE_SYMBOL"
              :protocol="PROTOCOLS.aeternity"
            />
          </template>
        </DetailsItem>
        <DetailsItem
          v-if="+gasCost"
          :label="$t('transaction.gasCost')"
          data-cy="gas-cost"
        >
          <template #value>
            <TokenAmount
              :amount="+aettosToAe(gasCost)"
              :symbol="AE_SYMBOL"
              :protocol="PROTOCOLS.aeternity"
            />
          </template>
        </DetailsItem>

        <DetailsItem :label="$t('transaction.fee')">
          <TokenAmount
            :amount="fee"
            :protocol="protocol"
            data-cy="fee"
          />
        </DetailsItem>

        <DetailsItem
          v-if="!isDexMaxSpent && !isDexMinReceived"
          :label="$t('common.total')"
        >
          <TokenAmount
            :amount="executionCost || amountTotal"
            :symbol="isTokenSale ? undefined : tokenSymbol"
            :hide-fiat="isAex9"
            :protocol="protocol"
            high-precision
            data-cy="total"
          />
        </DetailsItem>
      </div>

      <DetailsItem
        expandable
        :label="$t('transaction.advancedDetails')"
      >
        <DetailsItem
          v-if="transaction?.tx?.data"
          :label="$t('transaction.data')"
        >
          <Tabs class="tabs">
            <Tab
              v-for="({ name, text }) in dataTabs"
              :key="name"
              :data-cy="name"
              :name="name"
              :text="text"
              :active="activeTab === name"
              @click="setActiveTab(name)"
            />
          </Tabs>
          <div class="tabs-content">
            <!-- Decoded Data -->
            <DetailsItem v-if="activeTab === dataTabs[0].name">
              <Panel v-if="decodedCallData?.args">
                <PanelTableItem
                  v-for="([key, value]) in Object.entries(decodedCallData?.args as any) || []"
                  :key="key"
                  :name="key"
                >
                  <div class="scrollable">
                    {{ value }}
                  </div>
                </PanelTableItem>
              </Panel>
              <InfoBox
                v-else
                type="warning"
                :text="$t('transaction.decodingDataFailed')"
              />
            </DetailsItem>
            <!--
              Raw Data
              Display the ETH transaction raw data until we are able to decode it
              into human readable arguments (e.g.: amount).
            -->
            <DetailsItem
              v-if="activeTab === dataTabs[1].name"
              :value="transaction.tx.data"
            />
          </div>
        </DetailsItem>

        <DetailsItem
          v-if="transactionArguments"
          :label="$t('modals.confirmTransactionSign.arguments')"
          :value="transactionArguments"
        />

        <DetailsItem
          v-for="key in filteredTxFields"
          :key="key"
          :label="getTxKeyLabel(key)"
          :value="key === PAYLOAD_FIELD ? decodedPayload : popupProps?.tx?.[key]"
          :class="{ 'hash-field': isHash(key) }"
        />
      </DetailsItem>
    </template>

    <template #footer>
      <BtnMain
        variant="muted"
        data-cy="deny"
        third
        extra-padded
        :text="$t('pages.signTransaction.reject')"
        @click="cancel()"
      />
      <BtnMain
        class="button-action-primary"
        data-cy="accept"
        third
        :disabled="!!error || verifying"
        :icon="verifying ? AnimatedSpinner : null"
        :text="verifying ? $t('common.verifying') : $t('common.confirm')"
        @click="confirm()"
      />
    </template>
  </Modal>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
} from 'vue';
import { useI18n } from 'vue-i18n';
import BigNumber from 'bignumber.js';
import {
  buildTx,
  decode,
  Encoded,
  getExecutionCost,
  getTransactionSignerAddress,
  Tag,
  unpackTx,
} from '@aeternity/aepp-sdk';
import { ContractByteArrayEncoder, BytecodeContractCallEncoder } from '@aeternity/aepp-calldata';

import JsonBig from '@/lib/json-big';
import type {
  ITokenResolved,
  ITransaction,
  ITx,
  TxFunctionRaw,
} from '@/types';
import { AeDecodedCallData } from '@/protocols/aeternity/types';
import { tg } from '@/popup/plugins/i18n';
import { RejectedByUserError } from '@/lib/errors';
import {
  ACCOUNT_TYPES,
  AIRGAP_SIGNED_TRANSACTION_MESSAGE_TYPE,
  MODAL_SIGN_AIR_GAP_TRANSACTION,
  PROTOCOLS,
  RUNNING_IN_POPUP,
  SUPERHERO_CHAT_URLS,
  TX_DIRECTION,
} from '@/constants';
import {
  fetchJson,
  handleUnknownError,
  isNotFoundError,
  toShiftedBigNumber,
  watchUntilTruthy,
} from '@/utils';
import {
  useAccounts,
  useAeSdk,
  useFungibleTokens,
  useModals,
  usePopupProps,
  useTransactionData,
} from '@/composables';
import { AE_SYMBOL } from '@/protocols/aeternity/config';
import {
  aettosToAe,
  getAeFee,
  getTransactionTokenInfoResolver,
} from '@/protocols/aeternity/helpers';
import { useAeNetworkSettings } from '@/protocols/aeternity/composables';
import { decodeTxData } from '@/protocols/ethereum/helpers';
import { ProtocolAdapterFactory } from '@/lib/ProtocolAdapterFactory';

import type { EthDecodedCallData } from '@/protocols/ethereum/types';
import { useAeTokenSales } from '@/protocols/aeternity/composables/aeTokenSales';
import { type SignAirGapTransactionResolvedVal } from './SignAirGapTransaction.vue';

import Modal from '../Modal.vue';
import BtnMain from '../buttons/BtnMain.vue';
import TransactionOverview from '../TransactionOverview.vue';
import DetailsItem from '../DetailsItem.vue';
import TokenAmount from '../TokenAmount.vue';
import TransactionDetailsPoolTokenRow from '../TransactionDetailsPoolTokenRow.vue';
import Panel from '../Panel.vue';
import PanelTableItem from '../PanelTableItem.vue';
import Tabs from '../tabs/Tabs.vue';
import Tab from '../tabs/Tab.vue';
import InfoBox from '../InfoBox.vue';

import AnimatedSpinner from '../../../icons/animated-spinner.svg?vue-component';

type ITxKey = keyof ITx;

const PAYLOAD_FIELD = 'payload';

const TX_FIELDS_TO_DISPLAY: Partial<Record<ITxKey, () => string>> = {
  callData: () => tg('common.callData'),
  code: () => tg('pages.transactionDetails.code'),
  contractId: () => tg('common.contractId'),
  commitmentId: () => tg('modals.confirmTransactionSign.commitmentId'),
  name: () => tg('pages.transactionDetails.name'),
  nameFee: () => tg('modals.confirmTransactionSign.nameFee'),
  nameSalt: () => tg('pages.transactionDetails.nameSalt'),
  nameId: () => tg('pages.transactionDetails.nameId'),
  nonce: () => tg('pages.transactionDetails.nonce'),
  payload: () => tg('pages.transactionDetails.payload'),
  pointers: () => tg('modals.confirmTransactionSign.pointers'),
  recipientId: () => tg('modals.confirmTransactionSign.recipientId'),
};

export default defineComponent({
  components: {
    Modal,
    BtnMain,
    TransactionOverview,
    DetailsItem,
    TokenAmount,
    TransactionDetailsPoolTokenRow,
    PanelTableItem,
    Panel,
    Tabs,
    Tab,
    InfoBox,
    AnimatedSpinner,
  },
  setup() {
    const { t } = useI18n();

    const { aeActiveNetworkSettings } = useAeNetworkSettings();
    const { getAeSdk } = useAeSdk();
    const { getLastActiveProtocolAccount } = useAccounts();
    const { popupProps, setPopupProps } = usePopupProps();
    const { getProtocolAvailableTokens, getTxAssetSymbol } = useFungibleTokens();
    const { openModal } = useModals();
    const { areTokenSalesReady, tokenSaleAddressToTokenContractAddress } = useAeTokenSales();

    const protocol = popupProps.value?.protocol || PROTOCOLS.aeternity;
    const adapter = ProtocolAdapterFactory.getAdapter(protocol);
    const activeAccount = getLastActiveProtocolAccount(protocol);
    const transaction = ref<ITransaction>({
      protocol,
      tx: popupProps.value?.tx || {},
    } as ITransaction);

    const dataTabs = [
      {
        name: 'decoded',
        text: t('transaction.decoded'),
      },
      {
        name: 'raw',
        text: t('transaction.rawData'),
      },
    ];

    const {
      amountTotal,
      direction,
      isAex9,
      isDex,
      isDexAllowance,
      isDexLiquidityAdd,
      isDexLiquidityRemove,
      isDexMaxSpent,
      isDexMinReceived,
      isDexPool,
      isDexSwap,
      isTokenSale,
      txFunctionParsed,
      transactionAssets,
    } = useTransactionData({
      transaction,
      hideFeeFromAssets: true,
    });

    const tokenList = ref<ITokenResolved[]>(transactionAssets.value);
    const executionCost = ref(0);
    const loading = ref(false);
    const error = ref('');
    const verifying = ref(false);
    const gasPrice = ref(0);
    const decodedCallData = ref<AeDecodedCallData | EthDecodedCallData | undefined>();
    const activeTab = ref(dataTabs[0].name);

    const app = computed(() => popupProps.value?.app);

    const fee = computed(() => (protocol === PROTOCOLS.aeternity)
      ? getAeFee(popupProps.value?.tx?.fee!)
      : popupProps.value?.tx?.fee!);

    const nameAeFee = computed(() => getAeFee(popupProps.value?.tx?.nameFee!));
    const gasCost = computed(() => new BigNumber(popupProps.value?.tx?.gasLimit ?? 0)
      .multipliedBy(gasPrice.value));

    const appName = computed((): string | undefined => {
      if (SUPERHERO_CHAT_URLS.includes(`${app.value?.protocol}//${app.value?.name}`)) {
        return t('modals.confirmTransactionSign.superheroChat');
      }
      if (protocol !== PROTOCOLS.aeternity) {
        return app.value?.name;
      }
      return undefined;
    });

    const swapDirectionTranslation = computed(() => {
      if (isDexMaxSpent.value) {
        return t('pages.signTransaction.maxSpent');
      }
      if (isDexMinReceived.value) {
        return t('pages.signTransaction.minReceived');
      }
      return t('common.total');
    });

    const singleToken = computed((): ITokenResolved => ({
      isReceived: direction.value === TX_DIRECTION.received,
      amount: amountTotal.value,
      symbol: getTxAssetSymbol({ tx: popupProps.value?.tx!, protocol } as ITransaction),
    }));

    const decodedPayload = computed(() => popupProps.value?.tx?.payload
      ? decode(popupProps.value?.tx?.payload).toString()
      : undefined);

    const filteredTxFields = computed(
      () => (Object.keys(TX_FIELDS_TO_DISPLAY) as ITxKey[])
        .filter((field) => field === PAYLOAD_FIELD
          ? !!decodedPayload.value
          : !!popupProps.value?.tx?.[field]),
    );

    const swapTokenData = computed((): ITokenResolved => {
      const token = (isDexMaxSpent.value) ? tokenList.value[0] : tokenList.value[1];
      return token || {};
    });

    const swapTokenAmount = computed((): number => +toShiftedBigNumber(
      swapTokenData.value.amount || 0,
      -(swapTokenData.value.decimals || 0),
    ));

    const tokenSymbol = computed(
      () => (swapTokenData.value.isWrappedCoin)
        ? adapter.coinSymbol
        : swapTokenData.value.symbol,
    );

    const transactionArguments = computed(() => decodedCallData.value?.args?.length
      ? JsonBig.stringify(decodedCallData.value.args)
      : undefined);

    async function getTokens(txParams: ITx): Promise<ITokenResolved[]> {
      if (!isDex.value && !isDexAllowance.value && !isTokenSale.value) {
        return [singleToken.value];
      }
      const resolver = getTransactionTokenInfoResolver(txFunctionParsed.value!);
      if (!resolver) {
        return [];
      }
      if (protocol === PROTOCOLS.aeternity && isTokenSale.value) {
        // Wait until token sale tokens are resolved
        await watchUntilTruthy(areTokenSalesReady);
      }
      const tokens = resolver(
        { tx: { ...txParams, ...popupProps.value?.tx } } as ITransaction,
        getProtocolAvailableTokens(PROTOCOLS.aeternity),
        tokenSaleAddressToTokenContractAddress,
      )?.tokens;
      if (!(isDexPool.value || isTokenSale.value)) {
        return tokens;
      }
      if (isDexLiquidityAdd.value) {
        return tokens.filter((token) => !token.isPool);
      }
      return tokens.reverse();
    }

    function isHash(key: ITxKey) {
      const propertiesWithHashValues: ITxKey[] = ['callData', 'contractId'];
      return propertiesWithHashValues.includes(key);
    }

    function getLabels(token: any, idx: number) {
      if (isDexAllowance.value) {
        return t('pages.signTransaction.approveUseOfToken');
      }
      if (isDexLiquidityAdd.value) {
        return token.isPool ? '' : t('pages.signTransaction.maximumDeposited');
      }
      if (isDexLiquidityRemove.value) {
        return token.isPool
          ? t('pages.signTransaction.poolTokenSpent')
          : t('pages.signTransaction.minimumWithdrawn');
      }
      return (idx === 0) ? t('pages.signTransaction.from') : t('pages.signTransaction.to');
    }

    async function confirm() {
      if (RUNNING_IN_POPUP && activeAccount?.type === ACCOUNT_TYPES.airGap) {
        const signedTransaction = await openModal<SignAirGapTransactionResolvedVal>(
          MODAL_SIGN_AIR_GAP_TRANSACTION,
          { txRaw: popupProps.value?.txBase64 },
        );
        if (signedTransaction) {
          browser.runtime.sendMessage({
            type: AIRGAP_SIGNED_TRANSACTION_MESSAGE_TYPE,
            payload: signedTransaction,
            target: 'offscreen',
          });
        }
      }
      popupProps.value?.resolve();
    }

    function cancel() {
      popupProps.value?.reject(new RejectedByUserError());
    }

    /**
     * Verifies aeternity transactions
     */
    async function verifyTransaction() {
      if (popupProps.value?.txBase64 && protocol === PROTOCOLS.aeternity) {
        try {
          verifying.value = true;
          const sdk = await getAeSdk();
          const balance = await sdk.getBalance(
            (popupProps.value?.fromAccount || activeAccount!.address) as Encoded.AccountAddress,
          )
            .catch((err) => {
              if (!isNotFoundError(err)) {
                handleUnknownError(err);
              }
              return 0;
            });
          // We've chosen the approach to trust the aepp itself in amount of gas,
          // they think is needed
          const executionCostAettos = getExecutionCost(popupProps.value.txBase64).toString();
          executionCost.value = getAeFee(executionCostAettos);

          if (new BigNumber(balance).isLessThan(executionCostAettos)) {
            error.value = t('validation.enoughCoin');
            return;
          }
          const txParams = unpackTx(popupProps.value.txBase64);
          if (txParams.tag === Tag.ContractCallTx || txParams.tag === Tag.ContractCreateTx) {
            const accountAddress = getTransactionSignerAddress(popupProps.value.txBase64);
            txParams.nonce = (await sdk.api.getAccountByPubkey(accountAddress)).nonce + 1;
            const dryRunResult = await sdk.txDryRun(buildTx(txParams), accountAddress);
            gasPrice.value = dryRunResult.callObj?.gasPrice
              ? +dryRunResult.callObj.gasPrice.toString()
              : 0;
            if (dryRunResult.callObj && dryRunResult.callObj.returnType !== 'ok') {
              error.value = new ContractByteArrayEncoder().decode(
                dryRunResult.callObj.returnValue as Encoded.ContractBytearray,
              );
            }
          }
        } catch (e: any) {
          error.value = e.message;
        } finally {
          verifying.value = false;
        }
      }
    }

    async function loadAdditionalContractCallInfo() {
      if (
        protocol === PROTOCOLS.aeternity
        && popupProps.value?.tx?.contractId
        && popupProps.value.tx.callData
      ) {
        try {
          loading.value = true;
          setTimeout(() => { loading.value = false; }, 20000);

          const [
            { bytecode },
          ] = await Promise.all([
            fetchJson(`${aeActiveNetworkSettings.value.nodeUrl}/v3/contracts/${popupProps.value.tx.contractId}/code`),
            // aeSdk is needed to establish the `networkId` and the dex contracts for the network
            getAeSdk(),
          ]);

          const bytecodeContractCallEncoder = new BytecodeContractCallEncoder(bytecode);

          decodedCallData.value = bytecodeContractCallEncoder.decodeCall(
            popupProps.value.tx.callData,
          ) as AeDecodedCallData;

          if (!decodedCallData.value) return;

          transaction.value.tx.function = decodedCallData.value.functionName as TxFunctionRaw;
          transaction.value.tx.arguments = decodedCallData.value.args.map((arg: any) => ({
            type: Array.isArray(arg) ? 'list' : 'any',
            value: Array.isArray(arg) ? arg.map((element) => ({ value: element })) : arg,
          }));

          const allTokens = await getTokens(transaction.value.tx);

          tokenList.value = allTokens.map((token) => ({
            ...token,
            // TODO `tokens` is not part of `ITokenResolved`, replace logic of child tokens
            tokens: token.isPool && !isDexLiquidityAdd.value
              ? allTokens.filter((tkn) => !tkn.isPool).reverse()
              : [token],
          }));
        } catch (e) {
          tokenList.value = [];
        } finally {
          loading.value = false;
        }
      } else if (
        protocol === PROTOCOLS.ethereum
        && activeAccount
        && popupProps.value?.tx?.data
        && popupProps.value?.tx?.contractId
      ) {
        decodedCallData.value = await decodeTxData(
          popupProps.value.tx.data,
          popupProps.value.tx.contractId,
          activeAccount.address,
        );
      }
    }

    function getTxKeyLabel(txKey: ITxKey) {
      const translateFunc = TX_FIELDS_TO_DISPLAY[txKey];
      return translateFunc ? translateFunc() : '';
    }

    function setActiveTab(tabName: string) {
      activeTab.value = tabName;
    }

    onMounted(async () => {
      if (popupProps.value) {
        await Promise.all([
          verifyTransaction(),
          loadAdditionalContractCallInfo(),
        ]);
      } else {
        error.value = t('modals.transaction-failed.msg');
      }
    });

    onUnmounted(() => {
      setPopupProps(null);
    });

    return {
      AE_SYMBOL,
      aettosToAe,
      AnimatedSpinner,
      PAYLOAD_FIELD,
      PROTOCOLS,
      appName,
      confirm,
      cancel,
      decodedCallData,
      decodedPayload,
      direction,
      error,
      executionCost,
      filteredTxFields,
      gasCost,
      gasPrice,
      getLabels,
      getTxKeyLabel,
      getTxAssetSymbol,
      isAex9,
      isDex,
      isDexAllowance,
      isDexMaxSpent,
      isDexMinReceived,
      isDexSwap,
      isTokenSale,
      isHash,
      loading,
      nameAeFee,
      popupProps,
      protocol,
      singleToken,
      swapDirectionTranslation,
      swapTokenAmount,
      swapTokenData,
      tokenSymbol,
      tokenList,
      amountTotal,
      transaction,
      transactionArguments,
      fee,
      verifying,
      dataTabs,
      activeTab,
      setActiveTab,
    };
  },
});
</script>

<style lang="scss" scoped>
@use '@/styles/variables' as *;
@use '@/styles/typography';
@use '@/styles/mixins';

.confirm-transaction-sign {
  .loader {
    display: flex;
    margin: 0 auto;
    width: 56px;
    height: 56px;
  }

  .scrollable {
    word-break: keep-all;
  }

  .subtitle {
    margin: 8px 0;
    color: $color-grey-light;

    &.warning {
      color: $color-warning;
    }

    .app-name {
      color: $color-white;
    }
  }

  .transaction-overview {
    margin-bottom: 16px;
  }

  .reason:deep() {
    .value {
      word-break: break-all;
      color: $color-warning;
    }
  }

  .sender-replaced {
    @extend %face-sans-15-regular;

    color: $color-warning;
    margin-top: 8px;
  }

  .details {
    @include mixins.flex(flex-start, flex-start, column);

    gap: 8px;
    padding: 8px 0;
  }

  .tabs {
    margin-top: 8px;
  }

  .pool-token-row:deep() {
    padding-bottom: 8px;
  }

  .button-action-primary {
    display: flex;
  }
}
</style>
