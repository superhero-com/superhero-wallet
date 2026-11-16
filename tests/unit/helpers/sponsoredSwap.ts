import camelCaseKeysDeep from 'camelcase-keys-deep';
import { AE_NETWORK_MAINNET_ID, DEX_CONTRACTS } from '@/protocols/aeternity/config';
import { useAeMiddleware } from '@/protocols/aeternity/composables/aeMiddleware';
import type { ITransaction } from '@/types';

export const ACCOUNT = 'ak_signer';
export const PAYER = 'ak_payer';
export const TOKEN = 'ct_token';
export const ROUTER = DEX_CONTRACTS[AE_NETWORK_MAINNET_ID].router[0];
export const WAE = DEX_CONTRACTS[AE_NETWORK_MAINNET_ID].wae[0];

/** A swap of 10 TOKEN for at least 1.5 AE whose fee is paid by `PAYER` */
export function sponsoredSwap(returnType = 'ok'): ITransaction {
  const middleware = useAeMiddleware();
  const [activity] = middleware.normalizeActivitiesStructure([camelCaseKeysDeep({
    type: 'PayingForTxEvent',
    height: 800000,
    payload: {
      hash: 'th_fxSJErbUC3WAqiURFSWhafRdxJC6wzbj5yUKmLTUte6bNWLB8',
      block_height: 800000,
      micro_time: 1700000000000,
      tx: {
        type: 'PayingForTx',
        payer_id: PAYER,
        nonce: 3,
        fee: 100000000000000,
        tx: {
          signatures: [],
          tx: {
            type: 'ContractCallTx',
            caller_id: ACCOUNT,
            contract_id: ROUTER,
            function: 'swap_exact_tokens_for_ae',
            amount: 0,
            nonce: 1,
            fee: 100000000000000,
            gas_price: 1000000000,
            gas_used: 10000,
            arguments: [
              { type: 'int', value: '10000000000000000000' },
              { type: 'int', value: '1500000000000000000' },
              {
                type: 'list',
                value: [{ type: 'contract', value: TOKEN }, { type: 'contract', value: WAE }],
              },
              { type: 'address', value: ACCOUNT },
              { type: 'int', value: 1700000000000 },
            ],
            return_type: returnType,
            return: returnType === 'ok'
              ? {
                type: 'list',
                value: [
                  { type: 'int', value: '10000000000000000000' },
                  { type: 'int', value: '2000000000000000000' },
                ],
              }
              : 'AedexV2Router: INSUFFICIENT_OUTPUT_AMOUNT',
          },
        },
      },
    },
  })]);
  return middleware.normalizeMiddlewareTransactionStructure(activity, ACCOUNT);
}
