import Web3Eth, { sendSignedTransaction } from 'web3-eth';
import { DEFAULT_RETURN_FORMAT, type Bytes } from 'web3-types';

/**
 * Upper bound on how long we will wait for `eth_sendRawTransaction`
 * to acknowledge a broadcast (`transactionHash` event). Longer than the
 * slowest EVM RPC we care about while still short enough to fail fast
 * when the provider is unreachable or silently dropping the request.
 *
 * Without this, a flaky / stalled provider would keep the PromiEvent
 * pending forever and the signing UI would sit on the confirmation
 * modal indefinitely with no way to recover besides killing the app.
 */
const BROADCAST_TIMEOUT_MS = 45_000;

/**
 * Broadcasts a pre-signed EVM transaction and resolves as soon as the node
 * accepts it (the `transactionHash` PromiEvent event fires). Rejects if
 * `eth_sendRawTransaction` fails for any reason — invalid signature, wrong
 * nonce, insufficient funds, node unreachable, etc. — or if the RPC does
 * not acknowledge the broadcast within {@link BROADCAST_TIMEOUT_MS}.
 *
 * Critically, this does NOT wait for the transaction to be mined. Callers
 * can return the hash to the UI immediately after this resolves so the
 * "pending" state renders without a multi-minute block on the main flow.
 *
 * Previously the EVM adapters called `sendSignedTransaction`
 * fire-and-forget, silently swallowing broadcast errors while returning
 * the locally-computed hash as if the transaction had succeeded.
 */
export async function broadcastSignedTransaction(
  web3Eth: Web3Eth,
  serializedTx: Bytes,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      // eslint-disable-next-line no-use-before-define
      clearTimeout(timeoutId);
      fn();
    };

    const timeoutId = setTimeout(() => {
      settle(() => reject(new Error(
        `EVM transaction broadcast timed out after ${BROADCAST_TIMEOUT_MS}ms`,
      )));
    }, BROADCAST_TIMEOUT_MS);

    const promiEvent = sendSignedTransaction(web3Eth, serializedTx, DEFAULT_RETURN_FORMAT);
    promiEvent.on('transactionHash', () => settle(resolve));
    promiEvent.on('error', (err) => settle(() => reject(err)));
    promiEvent.catch(() => {});
  });
}
