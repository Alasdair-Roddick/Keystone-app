import type { KeystoneIPC } from '../packages/shared/ipc'

declare global {
  interface Window {
    keystone: KeystoneIPC
  }
}
