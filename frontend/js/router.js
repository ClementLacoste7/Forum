import { renderHome } from "./posts.js"
import { renderProfile } from "./profile.js"
import { renderAuth } from "./auth.js"

const routes = {
  "/":        renderHome,
  "/profile": renderProfile,
  "/login":   renderAuth,
  "/register": renderAuth,
}

export function navigate(path) {
  window.history.pushState({}, "", path)
  render(path)
}

function render(path) {
  const fn = routes[path] || renderHome
  document.getElementById("main-content").innerHTML = ""
  fn()
}

window.navigate = navigate
window.addEventListener("popstate", () => render(window.location.pathname))
render(window.location.pathname)