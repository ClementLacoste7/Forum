import { renderHome, renderPost, renderNewPost, renderEditPost } from "./posts.js"
import { renderProfile } from "./profile.js"
import { renderAuth } from "./auth.js"
import { api } from "./api.js"

let currentCategory = null

async function logout() {
  const refreshToken = localStorage.getItem("refresh_token")
  try {
    await api.post("/auth/logout", { refresh_token: refreshToken })
  } catch {}
  localStorage.removeItem("access_token")
  localStorage.removeItem("refresh_token")
  navigate("/")
}

function renderNavbar() {
  const token = localStorage.getItem("access_token")
  const nav = document.getElementById("nav-links")

  nav.innerHTML = token ? `
    <a id="nav-home">Home</a>
    <a id="nav-profile">My Profile</a>
    <button id="nav-logout">Sign out</button>
  ` : `
    <a id="nav-login">Sign in</a>
    <a id="nav-register">Sign up</a>
  `

  document.getElementById("nav-home")?.addEventListener("click", () => navigate("/"))
  document.getElementById("nav-profile")?.addEventListener("click", () => navigate("/profile"))
  document.getElementById("nav-login")?.addEventListener("click", () => navigate("/login"))
  document.getElementById("nav-register")?.addEventListener("click", () => navigate("/register"))
  document.getElementById("nav-logout")?.addEventListener("click", logout)

  document.querySelector(".nav-brand")?.addEventListener("click", () => navigate("/"))

  const searchInput = document.getElementById("search-input")
  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim()
    document.querySelectorAll(".post-card").forEach(card => {
      const title = card.querySelector(".post-card-title")?.textContent.toLowerCase() || ""
      card.style.display = title.includes(query) ? "" : "none"
    })
  })
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

  try {
    const categories = await api.get("/categories")
    const list = document.getElementById("category-list")
    if (!list) return

    list.innerHTML = `<li class="category-item active" data-category="null">All Topics</li>`
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
    console.error("Failed to load categories", err)
  }

  try {
    const stats = await api.get("/stats")
    const statPosts = document.getElementById("stat-posts")
    const statMembers = document.getElementById("stat-members")
    if (statPosts) statPosts.textContent = stats.posts
    if (statMembers) statMembers.textContent = stats.members
  } catch (err) {
    console.error("Failed to load stats", err)
  }
}

function matchRoute(path) {
  if (path.startsWith("/post/")) {
    const id = path.split("/")[2]
    return () => renderPost(id)
  }
  if (path.startsWith("/edit-post/")) {
    const id = path.split("/")[2]
    return () => renderEditPost(id)
  }
  return null
}

const routes = {
  "/":                () => renderHome(currentCategory),
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