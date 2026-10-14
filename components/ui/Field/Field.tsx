import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import styles from './Field.module.css'

export interface FieldProps {
  /** id of the control; links the label to it. */
  id: string
  label: string
  hint?: ReactNode
  error?: string
  /** Visually hide the label (it is still rendered). */
  hideLabel?: boolean
  className?: string
  children: ReactNode
}

/** id of the hint/error text, for the control's aria-describedby. */
export const fieldDescriptionId = (id: string) => `${id}-description`

/** id of the label, for controls that `<label for>` can't name (e.g. a custom combobox). */
export const fieldLabelId = (id: string) => `${id}-label`

/** Label + control + hint/error. Used by Input and Select. */
export function Field({ id, label, hint, error, hideLabel, className, children }: FieldProps) {
  const descriptionId = fieldDescriptionId(id)
  return (
    <div className={cx(styles.field, className)}>
      <label id={fieldLabelId(id)} htmlFor={id} className={cx(styles.label, hideLabel && 'visually-hidden')}>
        {label}
      </label>
      {children}
      {error ? (
        <p id={descriptionId} className={styles.error}>
          {error}
        </p>
      ) : hint ? (
        <p id={descriptionId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
