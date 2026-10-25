// Lowercase letters, numbers and dashes only. Names written entirely in other scripts (such as Amharic)
// produce an empty slug, so the admin must type one.
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)