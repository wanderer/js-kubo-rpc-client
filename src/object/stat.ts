import { toUrlSearchParams } from '../lib/to-url-search-params.js'
import type { HTTPRPCClient } from '../lib/core.js'
import type { CID } from 'multiformats/cid'

export interface StatResult {
  Hash: CID
  NumLinks: number
  BlockSize: number
  LinksSize: number
  DataSize: number
  CumulativeSize: number
}

export interface StatOptions {
  signal?: AbortSignal
  headers?: Headers | Record<string, string>
}

export function createStat (client: HTTPRPCClient) {
  return async function stat (cid: CID, options: StatOptions = {}): Promise<StatResult> {
    const res = await client.post('object/stat', {
      signal: options.signal,
      searchParams: toUrlSearchParams({
        arg: `${cid}`
      }),
      headers: options.headers
    })

    const data = await res.json()

    return {
      Hash: data.Hash,
      NumLinks: data.NumLinks,
      BlockSize: data.BlockSize,
      LinksSize: data.LinksSize,
      DataSize: data.DataSize,
      CumulativeSize: data.CumulativeSize
    }
  }
}
