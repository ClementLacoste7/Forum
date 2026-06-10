import { api } from "./api.js"
import { navigate } from "./router.js"

export async function renderProfile() {
  const token = localStorage.getItem("access_token")
  if (!token) return navigate("/login")

  document.getElementById("main-content").innerHTML = `
    <div class="profile-container">
      <h2>My Profile</h2>
      <div id="profile-error" class="error-msg"></div>
      <div id="profile-data">Loading...</div>
    </div>
  `

  try {
    const data = await api.get("/profile")
    renderProfileData(data)
  } catch (err) {
    document.getElementById("profile-data").innerHTML = "<p>Failed to load profile.</p>"
  }
}

async function renderProfileData(data) {
  document.getElementById("profile-data").innerHTML = `
    <div class="profile-info">
      <p><strong>Username:</strong> ${data.user.Username}</p>
      <p><strong>Email:</strong> ${data.user.Email}</p>
    </div>

    <h3>My Posts (${data.posts?.length || 0})</h3>
    <ul class="profile-list" id="profile-posts">
      ${data.posts?.length ? data.posts.map(p => `
        <li class="profile-list-item">
          <span class="profile-post-title" data-id="${p.ID}">${p.Title}</span>
          <button class="btn-delete-post" data-id="${p.ID}">Delete</button>
        </li>
      `).join("") : "<li>No posts yet.</li>"}
    </ul>

    <h3>My Comments (${data.comments?.length || 0})</h3>
    <ul class="profile-list">
      ${data.comments?.length ? data.comments.map(c => `
        <li class="profile-list-item">${c.Content}</li>
      `).join("") : "<li>No comments yet.</li>"}
    </ul>

    <h3>My Likes (${data.likes?.length || 0})</h3>
    <ul class="profile-list">
      ${data.likes?.length ? data.likes.map(l => `
        <li class="profile-list-item">${l.IsLike ? "Like" : "Dislike"} — Post #${l.PostID}</li>
      `).join("") : "<li>No likes yet.</li>"}
    </ul>

    <button id="logout-btn">Sign out</button>
  `

  document.querySelectorAll(".profile-post-title").forEach(el => {
    el.addEventListener("click", () => navigate(`/post/${el.dataset.id}`))
  })

  document.querySelectorAll(".btn-delete-post").forEach(btn => {
    btn.addEventListener("click", async () => {
      const li = btn.closest("li")
      li.innerHTML = `
        <span>Confirm deletion?</span>
        <button class="btn-confirm-delete" data-id="${btn.dataset.id}">Yes</button>
        <button class="btn-cancel-delete">Cancel</button>
      `

      li.querySelector(".btn-cancel-delete").addEventListener("click", async () => {
        const data = await api.get("/profile")
        renderProfileData(data)
      })

      li.querySelector(".btn-confirm-delete").addEventListener("click", async () => {
        try {
          await api.delete(`/posts/${btn.dataset.id}`)
          const data = await api.get("/profile")
          renderProfileData(data)
        } catch (err) {
          document.getElementById("profile-error").textContent = "Failed to delete post."
        }
      })
    })
  })

  document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    navigate("/")
  })
}