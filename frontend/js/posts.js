import { api } from "./api.js"
import { navigate } from "./router.js"
import { initEditor, getEditorContent } from "./editor.js"
import { renderComments } from "./comments.js"

// Format date
function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
}

// Render list of all posts on home page
export async function renderHome() {
  document.getElementById("main-content").innerHTML = `<div id="posts-list">Chargement...</div>`

  try {
    const posts = await api.get("/posts")
    const list = document.getElementById("posts-list")

    if (!posts.length) {
      list.innerHTML = `
        <div class="empty-state">
          <p>Aucun post pour l'instant.</p>
          ${localStorage.getItem("access_token") ? `<button class="btn-primary" id="new-post-empty">Créer le premier post</button>` : ""}
        </div>
      `
      document.getElementById("new-post-empty")?.addEventListener("click", () => navigate("/new-post"))
      return
    }

    list.innerHTML = posts.map(p => `
      <div class="post-card" data-id="${p.ID}">
        <div class="post-card-votes">
          <span class="vote-count">${p.Likes?.length || 0}</span>
        </div>
        <div class="post-card-body">
          <div class="post-card-tags">
            ${p.Categories?.map(c => `<span class="tag">${c.Name}</span>`).join("") || ""}
          </div>
          <h3 class="post-card-title" data-id="${p.ID}">${p.Title}</h3>
          <p class="post-card-preview">${p.Content.replace(/<[^>]*>/g, "").substring(0, 150)}...</p>
          <div class="post-card-meta">
            <span class="post-author">Par <strong>${p.User?.Username || "Inconnu"}</strong></span>
            <span class="post-date">${formatDate(p.CreatedAt)}</span>
            <span class="post-comments">💬 ${p.Comments?.length || 0} commentaires</span>
          </div>
        </div>
      </div>
    `).join("")

    document.querySelectorAll(".post-card-title").forEach(el => {
      el.addEventListener("click", () => navigate(`/post/${el.dataset.id}`))
    })

  } catch (err) {
    document.getElementById("main-content").innerHTML = "<p>Erreur de chargement.</p>"
  }
}

// Render single post with likes and comments
export async function renderPost(id) {
  document.getElementById("main-content").innerHTML = "<p>Chargement...</p>"

  try {
    const post = await api.get(`/posts/${id}`)

    document.getElementById("main-content").innerHTML = `
      <div class="post-full">
        <button class="btn-back" id="back-btn">← Retour</button>
        <div class="post-full-header">
          <div class="post-tags">
            ${post.Categories?.map(c => `<span class="tag">${c.Name}</span>`).join("") || ""}
          </div>
          <h2>${post.Title}</h2>
          <div class="post-full-meta">
            <span>Par <strong>${post.User?.Username || "Inconnu"}</strong></span>
            <span>${formatDate(post.CreatedAt)}</span>
          </div>
        </div>
        <div class="post-content">${post.Content}</div>
        <div class="likes-section">
          <button class="like-btn" data-like="true">👍 Like</button>
          <button class="like-btn" data-like="false">👎 Dislike</button>
        </div>
        <div id="comments-section"></div>
      </div>
    `

    document.getElementById("back-btn").addEventListener("click", () => navigate("/"))

    document.querySelectorAll(".like-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        try {
          await api.post("/likes", { post_id: post.ID, is_like: btn.dataset.like === "true" })
        } catch {
          if (!localStorage.getItem("access_token")) navigate("/login")
        }
      })
    })

    renderComments(post.ID)

  } catch (err) {
    document.getElementById("main-content").innerHTML = "<p>Post introuvable.</p>"
  }
}

// Render new post form with rich text editor
export async function renderNewPost() {
  if (!localStorage.getItem("access_token")) return navigate("/login")

  document.getElementById("main-content").innerHTML = `
    <div class="new-post-form">
      <h2>Nouveau post</h2>
      <input id="post-title" type="text" placeholder="Titre du post" />
      <input id="post-categories" type="text" placeholder="Catégories (ex: Tech, Gaming)" />
      <div id="editor-container"></div>
      <button class="btn-primary" id="post-submit">Publier</button>
    </div>
  `

  initEditor("editor-container")

  document.getElementById("post-submit").addEventListener("click", async () => {
    const title = document.getElementById("post-title").value
    const content = getEditorContent()
    const categories = document.getElementById("post-categories").value
      .split(",").map(c => c.trim()).filter(Boolean)

    if (!title.trim() || !content.trim()) return alert("Titre et contenu requis")

    try {
      await api.post("/posts", { title, content, categories })
      navigate("/")
    } catch (err) {
      alert(err.message || "Erreur")
    }
  })
}