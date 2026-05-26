import { renderHome, renderPost, renderNewPost } from "./posts.js"
import { renderProfile } from "./profile.js"
import { renderAuth } from "./auth.js"

function renderNavbar() {
  const token = localStorage.getItem("access_token")
  const nav = document.getElementById("nav-links")

  nav.innerHTML = token ? `
    <a id="nav-home">Accueil</a>
    <a id="nav-profile">Mon profil</a>
    <button id="nav-logout">Déconnexion</button>
  ` : `
    <a id="nav-login">Connexion</a>
    <a id="nav-register">Inscription</a>
  `

  document.getElementById("nav-home")?.addEventListener("click", () => navigate("/"))
  document.getElementById("nav-profile")?.addEventListener("click", () => navigate("/profile"))
  document.getElementById("nav-login")?.addEventListener("click", () => navigate("/login"))
  document.getElementById("nav-register")?.addEventListener("click", () => navigate("/register"))
  document.getElementById("nav-logout")?.addEventListener("click", () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    navigate("/")
  })

  document.querySelector(".nav-logo")?.addEventListener("click", () => navigate("/"))
}

function renderSidebar() {
  const token = localStorage.getItem("access_token")

  // Left sidebar nav links
  document.getElementById("link-home")?.addEventListener("click", () => navigate("/"))
  document.getElementById("link-profile")?.addEventListener("click", () => {
    if (token) navigate("/profile")
    else navigate("/login")
  })
  document.getElementById("link-new-post")?.addEventListener("click", () => {
    if (token) navigate("/new-post")
    else navigate("/login")
  })

  // Right sidebar create post button
  document.getElementById("sidebar-new-post")?.addEventListener("click", () => {
    if (token) navigate("/new-post")
    else navigate("/login")
  })

  // Category filters
  document.querySelectorAll(".category-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".category-item").forEach(i => i.classList.remove("active"))
      item.classList.add("active")
      // TODO: filter posts by category
    })
  })
}

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
  renderSidebar()
  const fn = routes[path] || matchRoute(path) || renderHome
  document.getElementById("main-content").innerHTML = ""
  fn()
}

window.addEventListener("popstate", () => render(window.location.pathname))
document.addEventListener("DOMContentLoaded", () => render(window.location.pathname))