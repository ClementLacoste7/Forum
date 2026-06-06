import { renderHome, renderPost, renderNewPost } from "./posts.js"
import { renderProfile } from "./profile.js"
import { renderAuth } from "./auth.js"
import { api } from "./api.js"

let currentCategory = null

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

async function renderSidebar() {
  const token = localStorage.getItem("access_token")

  document.getElementById("link-home")?.addEventListener("click", () => navigate("/"))
  document.getElementById("link-profile")?.addEventListener("click", () => {
    if (token) navigate("/profile")
    else navigate("/login")
  })
  document.getElementById("link-new-post")?.addEventListener("click", () => {
    if (token) navigate("/new-post")
    else navigate("/login")
  })
  document.getElementById("sidebar-new-post")?.addEventListener("click", () => {
    if (token) navigate("/new-post")
    else navigate("/login")
  })

  // Load categories from API
  try {
    const categories = await api.get("/categories")
    const list = document.getElementById("category-list")
    if (!list) return

    list.innerHTML = `<li class="category-item active" data-category="null">Tous les sujets</li>`
      + categories.map(c => `
        <li class="category-item" data-category="${c.Name}">${c.Name}</li>
      `).join("")

    list.querySelectorAll(".category-item").forEach(item => {
      item.addEventListener("click", () => {
        list.querySelectorAll(".category-item").forEach(i => i.classList.remove("active"))
        item.classList.add("active")
        currentCategory = item.dataset.category === "null" ? null : item.dataset.category
        renderHome(currentCategory)
      })
    })
  } catch (err) {
    console.error("Erreur chargement catégories", err)
  }
}

function matchRoute(path) {
  if (path.startsWith("/post/")) {
    const id = path.split("/")[2]
    return () => renderPost(id)
  }
  return null
}

const routes = {
  "/":                renderHome,
  "/profile":         renderProfile,
  "/login":           renderAuth,
  "/register":        renderAuth,
  "/new-post":        renderNewPost,
  "/forgot-password": renderAuth,
  "/reset-password":  renderAuth,
}                             

export function navigate(path) {
  window.history.pushState({}, "", path)
  render(path)
}

function render(path) {
  renderNavbar()
  renderSidebar()
  const fn = routes[path] || matchRoute(path) || (() => renderHome(currentCategory))
  document.getElementById("main-content").innerHTML = ""
  fn()
}

window.addEventListener("popstate", () => render(window.location.pathname))
document.addEventListener("DOMContentLoaded", () => render(window.location.pathname))

           