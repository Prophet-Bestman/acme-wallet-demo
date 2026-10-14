'use client'
import * as RadixSelect from '@radix-ui/react-select'
import { useId } from 'react'
import { cx } from '@/lib/cx'
import { Field, fieldLabelId } from '../Field'
import { Icon } from '../Icon'
import styles from './Select.module.css'

export interface SelectOption {
  /** Must not be '' (Radix reserves it for "no value"); use a sentinel like 'all'. */
  value: string
  label: string
}

export interface SelectProps {
  label: string
  hideLabel?: boolean
  options: readonly SelectOption[]
  value: string
  onValueChange: (value: string) => void
  id?: string
  disabled?: boolean
  fieldClassName?: string
  className?: string
}

/**
 * Radix Select for the styled popover in the design (a native <select> can't style its
 * open menu). Radix supplies the listbox semantics, keyboard support (arrows, Home/End,
 * type-ahead, Escape) and focus handling; this file only adds our label and styles.
 */
export function Select({
  label,
  hideLabel,
  options,
  value,
  onValueChange,
  id: idProp,
  disabled,
  fieldClassName,
  className,
}: SelectProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId

  return (
    <Field id={id} label={label} hideLabel={hideLabel} className={fieldClassName}>
      <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
        <RadixSelect.Trigger
          id={id}
          className={cx(styles.trigger, className)}
          aria-labelledby={fieldLabelId(id)}
        >
          <RadixSelect.Value />
          <RadixSelect.Icon className={styles.chevron}>
            <Icon name="chevron-down" size={16} />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className={styles.content} position="popper" sideOffset={6} align="start">
            <RadixSelect.Viewport className={styles.viewport}>
              {options.map((option) => (
                <RadixSelect.Item key={option.value} value={option.value} className={styles.item}>
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </Field>
  )
}
