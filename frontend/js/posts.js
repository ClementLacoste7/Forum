import { api } from "./api.js"
import { navigate } from "./router.js"
import { initEditor, getEditorContent } from "./editor.js"
import { renderComments } from "./comments.js"

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
}

export async function renderHome(category = null) {
  document.getElementById("main-content").innerHTML = `<div id="posts-list">Loading...</div>`

  try {
    const posts = await api.get("/posts")
    const list = document.getElementById("posts-list")

    const filtered = category
      ? posts.filter(p => p.Categories?.some(c => c.Name === category))
      : posts

    if (!filtered.length) {
      list.innerHTML = `
        <div class="empty-state">
          <p>No posts yet.</p>
          ${localStorage.getItem("access_token") ? `<button class="btn-primary" id="new-post-empty">Create the first post</button>` : ""}
        </div>
      `
      document.getElementById("new-post-empty")?.addEventListener("click", () => navigate("/new-post"))
      return
    }

    list.innerHTML = filtered.map(p => `
      <div class="post-card" data-id="${p.ID}">
        <div class="post-card-votes">
          <span class="vote-count">${p.Likes?.length || 0}</span>
        </div>
        <div class="post-card-body">
          <div class="post-card-tags">
            ${p.Categories?.map(c => `<span class="tag" data-category="${c.Name}">${c.Name}</span>`).join("") || ""}
          </div>
          <h3 class="post-card-title" data-id="${p.ID}">${p.Title}</h3>
          <p class="post-card-preview">${p.Content.replace(/<[^>]*>/g, "").substring(0, 150)}...</p>
          <div class="post-card-meta">
            <span class="post-author">By <strong>${p.User?.Username || "Unknown"}</strong></span>
            <span class="post-date">${formatDate(p.CreatedAt)}</span>
            <span class="post-comments">💬 ${p.Comments?.length || 0} comments</span>
          </div>
        </div>
        ${p.ImagePath ? `<img src="${p.ImagePath}" class="post-card-image" />` : ""}
      </div>
    `).join("")

    document.querySelectorAll(".post-card-title").forEach(el => {
      el.addEventListener("click", () => navigate(`/post/${el.dataset.id}`))
    })

    document.querySelectorAll(".post-card-tags .tag").forEach(tag => {
      tag.style.cursor = "pointer"
      tag.addEventListener("click", () => renderHome(tag.dataset.category))
    })

  } catch (err) {
    document.getElementById("main-content").innerHTML = "<p>Failed to load posts.</p>"
  }
}

export async function renderPost(id) {
  document.getElementById("main-content").innerHTML = "<p>Loading...</p>"

  try {
    const post = await api.get(`/posts/${id}`)

    let likeCount = 0
    let dislikeCount = 0
    try {
      const likes = await api.get(`/likes?post_id=${post.ID}`)
      likeCount = likes.filter(l => l.IsLike).length
      dislikeCount = likes.filter(l => !l.IsLike).length
    } catch {}

    document.getElementById("main-content").innerHTML = `
      <div class="post-full">
        <button class="btn-back" id="back-btn">← Back</button>
        <div class="post-full-header">
          <div class="post-tags">
            ${post.Categories?.map(c => `<span class="tag">${c.Name}</span>`).join("") || ""}
          </div>
          <h2>${post.Title}</h2>
          <div class="post-full-meta">
            <span>By <strong>${post.User?.Username || "Unknown"}</strong></span>
            <span>${formatDate(post.CreatedAt)}</span>
          </div>
        </div>
        ${post.ImagePath ? `<img src="${post.ImagePath}" class="post-image" />` : ""}
        <div class="post-content">${post.Content}</div>
        <div class="likes-section">
          <button class="like-btn" data-like="true">Like <span id="like-count">${likeCount}</span></button>
          <button class="like-btn" data-like="false">Dislike <span id="dislike-count">${dislikeCount}</span></button>
        </div>
        <div id="comments-section"></div>
      </div>
    `

    document.getElementById("back-btn").addEventListener("click", () => navigate("/"))

    document.querySelectorAll(".like-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        if (!localStorage.getItem("access_token")) return navigate("/login")
        try {
          await api.post("/likes", { post_id: post.ID, is_like: btn.dataset.like === "true" })
          const likes = await api.get(`/likes?post_id=${post.ID}`)
          document.getElementById("like-count").textContent = likes.filter(l => l.IsLike).length
          document.getElementById("dislike-count").textContent = likes.filter(l => !l.IsLike).length
        } catch {}
      })
    })

    renderComments(post.ID)

  } catch (err) {
    document.getElementById("main-content").innerHTML = "<p>Post not found.</p>"
  }
}

export async function renderNewPost() {
  if (!localStorage.getItem("access_token")) return navigate("/login")

  let categories = []
  try {
    categories = await api.get("/categories")
  } catch (err) {
    alert("Failed to load categories")
    return
  }

  document.getElementById("main-content").innerHTML = `
    <div class="new-post-form">
      <h2>New Post</h2>
      <div id="post-error" class="error-msg"></div>
      <input id="post-title" type="text" placeholder="Post title *" />
      <div class="categories-select">
        <p class="categories-label">Categories *</p>
        <div class="categories-checkboxes">
          ${categories.map(c => `
            <label class="category-checkbox">
              <input type="checkbox" value="${c.Name}" />
              ${c.Name}
            </label>
          `).join("")}
        </div>
      </div>
      <div id="editor-container"></div>
      <div class="image-upload-box">
        <label class="image-upload-label">
          Image (optional, max 20MB)
          <input type="file" id="post-image" accept=".png,.jpg,.jpeg,.gif" />
        </label>
        <div id="image-preview"></div>
      </div>
      <button class="btn-primary" id="post-submit">Publish</button>
    </div>
  `

  initEditor("editor-container")

  document.getElementById("post-image").addEventListener("change", (e) => {
    const file = e.target.files[0]
    if (!file) return
    const preview = document.getElementById("image-preview")
    const url = URL.createObjectURL(file)
    preview.innerHTML = `<img src="${url}" class="image-preview-img" />`
  })

  document.getElementById("post-submit").addEventListener("click", async () => {
    const title = document.getElementById("post-title").value.trim()
    const content = getEditorContent()
    const selected = [...document.querySelectorAll(".categories-checkboxes input:checked")]
      .map(el => el.value)
    const imageFile = document.getElementById("post-image").files[0]
    const errorEl = document.getElementById("post-error")
    errorEl.textContent = ""

    if (!title) { errorEl.textContent = "Title is required."; return }
    if (!content.trim()) { errorEl.textContent = "Content is required."; return }
    if (!selected.length) { errorEl.textContent = "Select at least one category."; return }

    const formData = new FormData()
    formData.append("title", title)
    formData.append("content", content)
    selected.forEach(cat => formData.append("categories", cat))
    if (imageFile) formData.append("image", imageFile)

    try {
      const token = localStorage.getItem("access_token")
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error(await res.text())
      navigate("/")
    } catch (err) {
      errorEl.textContent = err.message || "An error occurred."
    }
  })
}