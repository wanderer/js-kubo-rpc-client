import { toUrlSearchParams } from '../lib/to-url-search-params.js'
import type { HTTPRPCClient } from '../lib/core.js'
import type { CID } from 'multiformats/cid'

export interface DagStatResult {
  /** The CID that was queried */
  cid: CID
  /** Total size of the DAG in bytes */
  totalSize: number
  /** Size of this specific block */
  size: number
  /** Number of blocks in the DAG */
  numBlocks: number
}

export interface DagStatOptions {
  signal?: AbortSignal
  headers?: Headers | Record<string, string>
}

export function createStat (client: HTTPRPCClient) {
  return async function stat (cid: CID, options: DagStatOptions = {}): Promise<DagStatResult> {
    const res = await client.post('dag/stat', {
      signal: options.signal,
      searchParams: toUrlSearchParams({
        arg: `${cid}`
      }),
      headers: options.headers
    })

    // dag/stat may return NDJSON (progress updates + final result). Parse
    // all lines and use the last (most complete) one.
    const text = await res.text()
    const lines = text.trim().split('\n').filter(l => l.length > 0)
    const data = JSON.parse(lines[lines.length - 1])

    // dag/stat returns { TotalSize, DagStats: [{ Cid, Size, NumBlocks }], UniqueBlocks, Ratio }
    const dagStat = data.DagStats?.[0] ?? {}
    return {
      cid,
      totalSize: data.TotalSize ?? 0,
      size: dagStat.Size ?? 0,
      numBlocks: dagStat.NumBlocks ?? 0
    }
  }
}
