import { toUrlSearchParams } from '../lib/to-url-search-params.js'
import type { HTTPRPCClient } from '../lib/core.js'
import type { HTTPRPCOptions } from '../index.js'

export interface KeySignOptions extends HTTPRPCOptions {
  /**
   * Password to decrypt the key (if encrypted)
   */
  pass?: string
}

export interface KeySignResult {
  /**
   * The signature, base64-encoded
   */
  Signature: string
  /**
   * The key ID used to sign
   */
  KeyId: string
}

export function createSign (client: HTTPRPCClient) {
  return async function sign (keyName: string, data: Uint8Array, options: KeySignOptions = {}): Promise<string> {
    const form = new FormData()
    form.append('file', new Blob([data as unknown as BlobPart]))

    const res = await client.post('key/sign', {
      signal: options.signal,
      searchParams: toUrlSearchParams({
        arg: keyName,
        ...options
      }),
      headers: options.headers,
      body: form
    })

    const result = await res.json() as KeySignResult
    return result.Signature
  }
}
