export async function renderEditPost(id) {
  if (!localStorage.getItem("access_token")) return navigate("/login")

  let post, categories
  try {
    [post, categories] = await Promise.all([
      api.get(`/posts/${id}`),
      api.get("/categories")
    ])
  } catch (err) {
    document.getElementById("main-content").innerHTML = "<p>Failed to load post.</p>"
    return
  }

  document.getElementById("main-content").innerHTML = `
    <div class="new-post-form">
      <h2>Edit Post</h2>
      <div id="post-error" class="error-msg"></div>
      <input id="post-title" type="text" value="${post.Title}" placeholder="Post title *" />
      <div class="categories-select">
        <p class="categories-label">Categories *</p>
        <div class="categories-checkboxes">
          ${categories.map(c => `
            <label class="category-checkbox">
              <input type="checkbox" value="${c.Name}"
                ${post.Categories?.some(pc => pc.Name === c.Name) ? "checked" : ""} />
              ${c.Name}
            </label>
          `).join("")}
        </div>
      </div>
      <div id="editor-container"></div>
      <div class="image-upload-box">
        ${post.ImagePath ? `<img src="${post.ImagePath}" class="image-preview-img" id="current-image" />` : ""}
        <label class="image-upload-label">
          Replace image (optional)
          <input type="file" id="post-image" accept=".png,.jpg,.jpeg,.gif" />
        </label>
        <div id="image-preview"></div>
      </div>
      <button class="btn-primary" id="post-submit">Save changes</button>
      <button class="btn-back" id="cancel-btn">Cancel</button>
    </div>
  `

  const editor = initEditor("editor-container")
  editor.root.innerHTML = post.Content

  document.getElementById("post-image").addEventListener("change", (e) => {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    document.getElementById("image-preview").innerHTML = `<img src="${url}" class="image-preview-img" />`
    const current = document.getElementById("current-image")
    if (current) current.style.display = "none"
  })

  document.getElementById("cancel-btn").addEventListener("click", () => navigate("/profile"))

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
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      })
      if (!res.ok) throw new Error(await res.text())
      navigate("/profile")
    } catch (err) {
      errorEl.textContent = err.message || "An error occurred."
    }
  })
}