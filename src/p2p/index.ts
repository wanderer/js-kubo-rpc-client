import { toUrlSearchParams } from '../lib/to-url-search-params.js'
import type { HTTPRPCClient } from '../lib/core.js'
import type { HTTPRPCOptions } from '../index.js'

export interface P2PListenOptions extends HTTPRPCOptions {
  /**
   * If true, do not report success if the listener is already registered
   */
  'allow-custom-protocol'?: boolean
}

export interface P2PCloseOptions extends HTTPRPCOptions {
  /**
   * Close all p2p listeners
   */
  all?: boolean
}

export interface P2PAPI {
  /**
   * Listen for libp2p streams on a protocol and forward to a target multiaddr
   *
   * @example
   * ```js
   * await ipfs.p2p.listen('/pin-market/1.0.0', '/ip4/127.0.0.1/tcp/4003')
   * ```
   */
  listen(protocol: string, targetMultiaddr: string, options?: P2PListenOptions): Promise<void>

  /**
   * Stop listening for libp2p streams on a protocol
   *
   * @example
   * ```js
   * await ipfs.p2p.close('/pin-market/1.0.0')
   * ```
   */
  close(protocol: string, options?: P2PCloseOptions): Promise<void>
}

export function createP2P (client: HTTPRPCClient): P2PAPI {
  return {
    listen: async function listen (protocol: string, targetMultiaddr: string, options: P2PListenOptions = {}): Promise<void> {
      await client.post('p2p/listen', {
        signal: options.signal,
        searchParams: toUrlSearchParams({
          arg: [protocol, targetMultiaddr],
          ...options
        }),
        headers: options.headers
      })
    },

    close: async function close (protocol: string, options: P2PCloseOptions = {}): Promise<void> {
      await client.post('p2p/close', {
        signal: options.signal,
        searchParams: toUrlSearchParams({
          protocol,
          ...options
        }),
        headers: options.headers
      })
    }
  }
}
