'use client'
import { useEffect, useEffectEvent, useRef } from 'react'
import type { User } from '@/types/api'
import { Avatar, Icon } from '@/components/ui'
import { useDisclosure } from '@/lib/hooks'
import { useMe } from '@/lib/query/hooks'
import styles from './UserMenu.module.css'

const TIER_LABELS: Record<User['tier'], string> = {
  basic: 'Basic',
  verified: 'Verified',
  premium: 'Premium',
}

export function UserMenu() {
  const { isOpen: open, toggle, onClose } = useDisclosure()
  const { data: user } = useMe()
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Close on a click outside, or on Escape (returning focus to the trigger).
  const handlePointerDown = useEffectEvent((event: PointerEvent) => {
    if (!menuRef.current?.contains(event.target as Node)) onClose()
  })
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== 'Escape') return
    onClose()
    triggerRef.current?.focus()
  })
  useEffect(() => {
    if (!open) return
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={menuRef} className={styles.menu}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={toggle}
        aria-expanded={open}
        // Starts with the visible first name; still named on mobile, where the name is hidden.
        aria-label={user ? `${user.firstName}, account menu` : 'Account menu'}
      >
        <Avatar src={user?.avatarUrl ?? null} alt="" size="sm" />
        <span className={styles.name}>{user?.firstName}</span>
        <Icon name="chevron-down" size={16} />
      </button>
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.fullName}>
            {user?.firstName} {user?.lastName}
          </div>
          <div className={styles.email}>{user?.email}</div>
          {user && <div className={styles.tier}>{TIER_LABELS[user.tier]} account</div>}
        </div>
      )}
    </div>
  )
}
