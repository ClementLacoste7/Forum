import { renderHome, renderPost, renderNewPost } from "./posts.js"
import { renderProfile } from "./profile.js"
import { renderAuth } from "./auth.js"

// Match dynamic routes like /post/123
function matchRoute(path) {
  if (path.startsWith("/post/")) {
    const id = path.split("/")[2]
    return () => renderPost(id)
  }
  return null
}

const routes = {
  "/":          renderHome,
  "/profile":   renderProfile,
  "/login":     renderAuth,
  "/register":  renderAuth,
  "/new-post":  renderNewPost,
}

export function navigate(path) {
  window.history.pushState({}, "", path)
  render(path)
}

function render(path) {
  const fn = routes[path] || matchRoute(path) || renderHome
  document.getElementById("main-content").innerHTML = ""
  fn()
}

window.addEventListener("popstate", () => render(window.location.pathname))
document.addEventListener("DOMContentLoaded", () => render(window.location.pathname))