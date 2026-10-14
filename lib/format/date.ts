const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

// Intl throws a RangeError on an invalid Date; one bad timestamp shouldn't crash a list.
const safeFormat = (formatter: Intl.DateTimeFormat, iso: string) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : formatter.format(date)
}

/** "Wed, 30 Sep 2026" */
export const formatDate = (iso: string) => safeFormat(dateFormatter, iso)

/** "14:22" */
export const formatTime = (iso: string) => safeFormat(timeFormatter, iso)

/** "Wed, 30 Sep 2026, 14:22" */
export const formatDateTime = (iso: string) => safeFormat(dateTimeFormatter, iso)
