import type { KeystoneIPC } from '../packages/shared/contracts/ipc'

declare global {
  interface Window {
    keystone: KeystoneIPC
  }
}

export {}
