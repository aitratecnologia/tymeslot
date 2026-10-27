/**
 * Aitra Cal: dashboard theme switch (system / light / dark).
 *
 * The dark theme itself is pure CSS (assets/css/aitra/dark.css) and follows
 * the OS by default. This file only adds an explicit choice:
 *   - sets html[data-aitra-theme="light" | "dark"] (absent = follow the OS);
 *   - remembers it in localStorage;
 *   - injects a small button before the user menu in the dashboard top bar.
 *
 * No upstream template is edited, so the button is added from here. LiveView
 * re-renders the top bar from the server and drops nodes it does not know,
 * so a MutationObserver puts the button back when that happens. The choice is
 * applied when this module runs (after the HTML is parsed): with a forced
 * theme that differs from the OS there can be a brief flash on a full page
 * load, never on LiveView navigation.
 */

const KEY = "aitra-theme"
const MODES = ["system", "light", "dark"]
const BUTTON_ID = "aitra-theme-toggle"
const ANCHOR = '#dashboard-root [data-tour="user-menu"]'

const ICONS = {
  system:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25A2.25 2.25 0 0 1 5.25 3h13.5A2.25 2.25 0 0 1 21 5.25Z"/></svg>',
  light:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>',
  dark:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"/></svg>'
}

const LABELS = {
  en: {system: "Theme: follow system", light: "Theme: light", dark: "Theme: dark"},
  pt: {system: "Tema: seguir o sistema", light: "Tema: claro", dark: "Tema: escuro"}
}

function labels() {
  const lang = (document.documentElement.lang || "en").slice(0, 2).toLowerCase()
  return LABELS[lang] || LABELS.en
}

function stored() {
  try {
    const value = window.localStorage.getItem(KEY)
    return MODES.includes(value) ? value : "system"
  } catch (_error) {
    return "system"
  }
}

function save(mode) {
  try {
    if (mode === "system") window.localStorage.removeItem(KEY)
    else window.localStorage.setItem(KEY, mode)
  } catch (_error) {
    // Private mode or storage disabled: the choice lasts for this page only.
  }
}

function apply(mode) {
  const root = document.documentElement
  if (mode === "system") delete root.dataset.aitraTheme
  else root.dataset.aitraTheme = mode
}

function render(button, mode) {
  const label = labels()[mode]
  button.innerHTML = ICONS[mode]
  button.setAttribute("aria-label", label)
  button.title = label
  button.dataset.mode = mode
}

function createButton() {
  const button = document.createElement("button")
  button.type = "button"
  button.id = BUTTON_ID
  button.className = "aitra-theme-toggle"
  button.addEventListener("click", () => {
    const next = MODES[(MODES.indexOf(stored()) + 1) % MODES.length]
    save(next)
    apply(next)
    render(button, next)
  })
  return button
}

let button = null

function ensureButton() {
  const anchor = document.querySelector(ANCHOR)
  if (!anchor) return
  if (button && button.isConnected && button.nextElementSibling === anchor) return
  button = button || createButton()
  anchor.before(button)
  render(button, stored())
}

let scheduled = false

function scheduleEnsure() {
  if (scheduled) return
  scheduled = true
  window.requestAnimationFrame(() => {
    scheduled = false
    ensureButton()
  })
}

apply(stored())

// Another tab changed the choice.
window.addEventListener("storage", event => {
  if (event.key !== KEY) return
  const mode = stored()
  apply(mode)
  if (button) render(button, mode)
})

function start() {
  ensureButton()
  new MutationObserver(scheduleEnsure).observe(document.body, {childList: true, subtree: true})
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start)
else start()
