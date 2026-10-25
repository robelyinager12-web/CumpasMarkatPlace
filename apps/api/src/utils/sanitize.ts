// Single-line text: removes control characters, collapses whitespace, trims.
export const cleanText = (value: string) => value.replace(/\p{Cc}/gu, ' ').replace(/\s+/g, ' ').trim()

// Multi-line text: keeps line breaks, removes other control characters, limits blank lines.
export const cleanMultiline = (value: string) =>
  value
    .replace(/\r\n?/g, '\n')
    .replace(/[^\P{Cc}\n]/gu, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()