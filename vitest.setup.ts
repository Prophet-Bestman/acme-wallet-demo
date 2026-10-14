import '@testing-library/jest-dom/vitest'

// jsdom lacks pointer-capture and scrollIntoView, which Radix Select calls when it opens.
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}
