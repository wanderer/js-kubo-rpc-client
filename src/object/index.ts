import { createPatch } from './patch/index.js'
import { createStat } from './stat.js'
import type { Codecs } from '../index.js'
import type { ObjectPatchAPI } from './patch/index.js'
import type { StatResult, StatOptions } from './stat.js'
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

export interface ObjectAPI {
  patch: ObjectPatchAPI
  /**
   * Returns statistics for an IPFS DAG node.
   */
  stat(cid: CID, options?: StatOptions): Promise<StatResult>
}

export function createObject (client: HTTPRPCClient, codecs: Codecs): ObjectAPI {
  return {
    patch: createPatch(client),
    stat: createStat(client)
  }
}
