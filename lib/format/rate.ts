const largeRate = new Intl.NumberFormat('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const smallRate = new Intl.NumberFormat('en-NG', { maximumSignificantDigits: 4 })

/**
 * An exchange rate for display: "1,523.45" for rates ≥ 1, four significant figures below
 * that so tiny rates (NGN → USD ≈ 0.000652) don't round to "0.00".
 */
export const formatRate = (rate: number) => (rate >= 1 ? largeRate : smallRate).format(rate)
