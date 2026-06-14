// Minimal ESM resolve hook: lets extensionless relative imports (used across
// the app's TypeScript sources) resolve to their .ts files when the gallery
// generator is run under `node --experimental-strip-types`.
import { register } from 'node:module'

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.(ts|tsx|js|mjs|cjs|json)$/i.test(specifier)) {
    try { return await next(specifier + '.ts', context) } catch { /* fall through */ }
  }
  return next(specifier, context)
}

// Self-register so this file can be used directly via --import.
register('./ts-resolve.mjs', import.meta.url)
