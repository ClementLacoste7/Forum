import { api } from "./api.js"
import { navigate } from "./router.js"
import { initEditor, getEditorContent } from "./editor.js"

// Render list of all posts on home page
export async function renderHome() {
  document.getElementById("main-content").innerHTML = `
    <div class="posts-container">
      <div class="posts-header">
        <h2>Posts récents</h2>
        ${localStorage.getItem("access_token") ? `<button id="new-post-btn">+ Nouveau post</button>` : ""}
      </div>
      <div id="posts-list">Chargement...</div>
    </div>
  `

  document.getElementById("new-post-btn")?.addEventListener("click", () => navigate("/new-post"))

  try {
    const posts = await api.get("/posts")
    const list = document.getElementById("posts-list")

    if (!posts.length) {
      list.innerHTML = "<p>Aucun post pour l'instant.</p>"
      return
    }

    list.innerHTML = posts.map(p => `
      <div class="post-card" data-id="${p.ID}">
        <h3>${p.Title}</h3>
        <p class="post-meta">Par ${p.User?.Username || "Inconnu"}</p>
        <div class="post-preview">${p.Content.substring(0, 150)}...</div>
        <button class="read-more" data-id="${p.ID}">Lire la suite</button>
      </div>
    `).join("")

    document.querySelectorAll(".read-more").forEach(btn => {
      btn.addEventListener("click", () => navigate(`/post/${btn.dataset.id}`))
    })

  } catch (err) {
    document.getElementById("main-content").innerHTML = "<p>Erreur de chargement.</p>"
  }
}

// Render single post with likes
export async function renderPost(id) {
  document.getElementById("main-content").innerHTML = "<p>Chargement...</p>"

  try {
    const post = await api.get(`/posts/${id}`)

    document.getElementById("main-content").innerHTML = `
      <div class="post-full">
        <button id="back-btn">← Retour</button>
        <h2>${post.Title}</h2>
        <p class="post-meta">Par ${post.User?.Username || "Inconnu"}</p>
        <div class="post-content">${post.Content}</div>
        <div class="likes-section">
          <button class="like-btn" data-like="true">Like</button>
          <button class="like-btn" data-like="false">Dislike</button>
        </div>
        <div id="comments-section"></div>
      </div>
    `

    document.getElementById("back-btn").addEventListener("click", () => navigate("/"))

    document.querySelectorAll(".like-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        try {
          await api.post("/likes", { post_id: post.ID, is_like: btn.dataset.like === "true" })
        } catch (err) {
          if (!localStorage.getItem("access_token")) navigate("/login")
        }
      })
    })

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
      <input id="post-title" type="text" placeholder="Titre" />
      <div id="editor-container"></div>
      <button id="post-submit">Publier</button>
    </div>
  `

  initEditor("editor-container")

  document.getElementById("post-submit").addEventListener("click", async () => {
    const title = document.getElementById("post-title").value
    const content = getEditorContent()

    if (!title.trim() || !content.trim()) return alert("Titre et contenu requis")

    try {
      await api.post("/posts", { title, content })
      navigate("/")
    } catch (err) {
      alert(err.message || "Erreur")
    }
  })
}