export function readSessionValue(key) {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeSessionValue(key, value) {
  try {
    window.sessionStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}
