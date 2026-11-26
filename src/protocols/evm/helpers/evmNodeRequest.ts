export interface IEvmNodeResponse<T = any> {
  result?: T;
  error?: { code: number; message: string; data?: string };
}

/**
 * A JSON-RPC request to an EVM node. Resolves with the node's answer, also its error;
 * rejects only when there is none, e.g. offline or after `timeoutMs`.
 */
export async function evmNodeRequest<T = any>(
  nodeUrl: string,
  method: string,
  params: unknown[],
  timeoutMs = 5000,
): Promise<IEvmNodeResponse<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(nodeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1, method, params,
      }),
      signal: controller.signal,
    });
    const json = await response.json().catch(() => undefined);
    // Nodes send some errors with an HTTP error status
    if (json && ('result' in json || json.error)) {
      return json.error ? { error: json.error } : { result: json.result };
    }
    throw new Error(`HTTP ${response.status}`);
  } finally {
    clearTimeout(timeout);
  }
}
