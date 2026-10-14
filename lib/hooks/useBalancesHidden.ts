import { useSyncExternalStore } from 'react'

/**
 * "Hide balances": one app-wide setting, persisted in localStorage so it survives refreshes,
 * shared by every component through useSyncExternalStore so it holds across page changes,
 * and synced across tabs via the `storage` event.
 *
 * localStorage can throw (private mode, blocked storage); then the setting still works for
 * the session, it just isn't remembered.
 */

const KEY = 'acme.hideBalances'
const listeners = new Set<() => void>()
let memory = false

function read(): boolean {
  try {
    return window.localStorage.getItem(KEY) === '1'
  } catch {
    return memory
  }
}

export function setBalancesHidden(hidden: boolean) {
  memory = hidden
  try {
    if (hidden) window.localStorage.setItem(KEY, '1')
    else window.localStorage.removeItem(KEY)
  } catch {
    // Not persisted; `memory` keeps it for this session.
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** The server can't see localStorage, so it renders amounts visible; the client then applies the setting. */
const getServerSnapshot = () => false

export function useBalancesHidden() {
  return useSyncExternalStore(subscribe, read, getServerSnapshot)
}
