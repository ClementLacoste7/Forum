import { renderHome, renderPost, renderNewPost } from "./posts.js"
import { renderProfile } from "./profile.js"
import { renderAuth } from "./auth.js"

// Update navbar based on auth state
function renderNavbar() {
  const token = localStorage.getItem("access_token")
  const nav = document.getElementById("nav-links")

  nav.innerHTML = token ? `
    <a href="/" onclick="return false;" id="nav-home">Accueil</a>
    <a href="/profile" onclick="return false;" id="nav-profile">Mon profil</a>
    <button id="nav-logout">Déconnexion</button>
  ` : `
    <a href="/login" onclick="return false;" id="nav-login">Connexion</a>
    <a href="/register" onclick="return false;" id="nav-register">Inscription</a>
  `

  document.getElementById("nav-home")?.addEventListener("click", () => navigate("/"))
  document.getElementById("nav-profile")?.addEventListener("click", () => navigate("/profile"))
  document.getElementById("nav-login")?.addEventListener("click", () => navigate("/login"))
  document.getElementById("nav-register")?.addEventListener("click", () => navigate("/register"))
  document.getElementById("nav-logout")?.addEventListener("click", () => {
    localStorage.removeItem("access_token")
    navigate("/")
  })

  // Logo click
  document.querySelector(".nav-logo").addEventListener("click", () => navigate("/"))
}

// Match dynamic routes like /post/123
function matchRoute(path) {
  if (path.startsWith("/post/")) {
    const id = path.split("/")[2]
    return () => renderPost(id)
  }
  return null
}

const routes = {
  "/":         renderHome,
  "/profile":  renderProfile,
  "/login":    renderAuth,
  "/register": renderAuth,
  "/new-post": renderNewPost,
}

export function navigate(path) {
  window.history.pushState({}, "", path)
  render(path)
}

function render(path) {
  renderNavbar()
  const fn = routes[path] || matchRoute(path) || renderHome
  document.getElementById("main-content").innerHTML = ""
  fn()
}

window.addEventListener("popstate", () => render(window.location.pathname))
document.addEventListener("DOMContentLoaded", () => render(window.location.pathname))