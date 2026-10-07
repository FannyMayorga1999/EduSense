/**
 * Reference-counted scroll lock for overlays (modals, drawers).
 *
 * The app never scrolls on `body`: the real scroll container is
 * `.ed-shell__main`, so locking only `document.body` lets wheel events
 * fall through short dialogs to the page behind. Locks nest safely
 * (e.g. the status modal on top of the student drawer).
 *
 * @author Fanny Mayorga | @date 06-10-2026
 */

let lockCount = 0
let previousBodyOverflow = ''
let previousMainOverflow = ''

function mainScroller(): HTMLElement | null {
  return document.querySelector<HTMLElement>('.ed-shell__main')
}

export function lockScroll(): void {
  if (lockCount === 0) {
    const main = mainScroller()
    previousBodyOverflow = document.body.style.overflow
    previousMainOverflow = main?.style.overflow ?? ''
    document.body.style.overflow = 'hidden'
    if (main !== null) {
      main.style.overflow = 'hidden'
    }
  }
  lockCount += 1
}

export function unlockScroll(): void {
  if (lockCount === 0) {
    return
  }
  lockCount -= 1
  if (lockCount === 0) {
    const main = mainScroller()
    document.body.style.overflow = previousBodyOverflow
    if (main !== null) {
      main.style.overflow = previousMainOverflow
    }
  }
}
