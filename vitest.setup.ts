import '@testing-library/jest-dom/vitest'

// jsdom lacks pointer-capture and scrollIntoView, which Radix Select calls when it opens.
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}

// "Hide balances" persists in localStorage; don't let one test's choice leak into the next.
afterEach(() => window.localStorage.clear())
