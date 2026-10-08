export { cn } from "cn"

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getSlugFromClass(name: string): string {
  const match = name.match(/^Class\s+(\d+)$/i)
  if (match && match[1]) {
    return match[1]
  }
  return slugify(name)
}
