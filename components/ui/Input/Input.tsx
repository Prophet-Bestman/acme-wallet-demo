import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '@/lib/cx'
import { Field, fieldDescriptionId } from '../Field'
import { Icon, type IconName } from '../Icon'
import styles from './Input.module.css'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label: string
  hideLabel?: boolean
  hint?: ReactNode
  error?: string
  leadingIcon?: IconName
  fieldClassName?: string
}

export function Input({
  label,
  hideLabel,
  hint,
  error,
  leadingIcon,
  fieldClassName,
  className,
  id: idProp,
  ...rest
}: InputProps) {
  const generatedId = useId()
  const id = idProp ?? generatedId
  return (
    <Field id={id} label={label} hideLabel={hideLabel} hint={hint} error={error} className={fieldClassName}>
      <div className={styles.control}>
        {leadingIcon && <Icon name={leadingIcon} size={16} className={styles.icon} />}
        <input
          className={cx(styles.input, leadingIcon && styles.withIcon, error && styles.invalid, className)}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? fieldDescriptionId(id) : undefined}
          {...rest}
        />
      </div>
    </Field>
  )
}
