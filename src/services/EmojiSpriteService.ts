import twemoji from '@twemoji/api'

// =============================================================================
// EmojiSpriteService — renders every emoji in the app as a Twemoji SVG sprite
// (free, CC-BY 4.0) instead of the platform's native emoji font, so the game
// looks identical on every device and gets a consistent "game icon" feel.
//
// Works app-wide with zero per-component changes: a MutationObserver watches
// the DOM and re-parses only the nodes that actually changed.
// =============================================================================

const PARSE_OPTIONS: Parameters<typeof twemoji.parse>[1] = {
  folder: 'svg',
  ext: '.svg',
  className: 'emoji-sprite',
}

let observer: MutationObserver | null = null
let scheduled = false
const dirtyNodes = new Set<Node>()
let cdnFailures = 0
let cdnDisabled = false

// If the sprite CDN is unreachable (offline play, blocked network), swap the
// broken <img> back to the native emoji and, after repeated failures, stop
// parsing entirely for this session.
function handleSpriteError(e: Event) {
  const img = e.target as HTMLElement
  if (!(img instanceof HTMLImageElement) || !img.classList.contains('emoji-sprite')) return
  img.replaceWith(document.createTextNode(img.alt))
  if (++cdnFailures >= 10) cdnDisabled = true
}

function flush() {
  scheduled = false
  if (cdnDisabled) { dirtyNodes.clear(); return }
  for (const node of dirtyNodes) {
    if (node instanceof HTMLElement && node.isConnected) {
      twemoji.parse(node, PARSE_OPTIONS)
    }
  }
  dirtyNodes.clear()
}

function schedule(node: Node) {
  dirtyNodes.add(node)
  if (!scheduled) {
    scheduled = true
    requestAnimationFrame(flush)
  }
}

export function startEmojiSprites(root: HTMLElement = document.body): void {
  if (observer) return
  root.addEventListener('error', handleSpriteError, true)
  twemoji.parse(root, PARSE_OPTIONS)

  observer = new MutationObserver(mutations => {
    for (const m of mutations) {
      if (m.type === 'characterData' && m.target.parentElement) {
        schedule(m.target.parentElement)
      } else if (m.type === 'childList') {
        for (const added of m.addedNodes) {
          if (added instanceof HTMLElement) schedule(added)
          else if (added.nodeType === Node.TEXT_NODE && added.parentElement) schedule(added.parentElement)
        }
      }
    }
  })

  observer.observe(root, { childList: true, subtree: true, characterData: true })
}

export function stopEmojiSprites(): void {
  observer?.disconnect()
  observer = null
  dirtyNodes.clear()
}
