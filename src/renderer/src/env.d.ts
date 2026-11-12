/// <reference types="vite/client" />

import type { MingyueAPI } from '../../shared/types'

declare global {
  interface Window {
    mingyue: MingyueAPI
  }
}

export {}
