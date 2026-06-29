/**
 * Local type definitions for pubsub messages.
 *
 * These types are normally imported from `@libp2p/interface` but the v2 types
 * are not compatible with v3. We define them locally to avoid the version
 * conflict.
 */

export interface Message {
  type: 'signed' | 'unsigned'
  from?: any
  data: Uint8Array
  sequenceNumber?: bigint
  topic: string
  key?: any
  signature?: Uint8Array
}

export type EventHandler<T> = (evt: T) => void
