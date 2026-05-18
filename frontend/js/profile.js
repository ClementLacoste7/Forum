import { api } from "./api.js"
import { navigate } from "./router.js"

export async function renderProfile() {
  const token = localStorage.getItem("access_token")
  if (!token) return navigate("/login")

  document.getElementById("main-content").innerHTML = `
    <div class="profile-container">
      <h2>Mon profil</h2>
      <div id="profile-data">Chargement...</div>
    </div>
  `

  try {
    const data = await api.get("/profile")

    document.getElementById("profile-data").innerHTML = `
      <div class="profile-info">
        <p><strong>Pseudo :</strong> ${data.user.Username}</p>
        <p><strong>Email :</strong> ${data.user.Email}</p>
      </div>

      <h3>Mes posts (${data.posts?.length || 0})</h3>
      <ul class="profile-list">
        ${data.posts?.length ? data.posts.map(p => `
          <li class="profile-list-item">
            <span class="profile-post-title" data-id="${p.ID}">${p.Title}</span>
          </li>
        `).join("") : "<li>Aucun post</li>"}
      </ul>

      <h3>Mes commentaires (${data.comments?.length || 0})</h3>
      <ul class="profile-list">
        ${data.comments?.length ? data.comments.map(c => `
          <li class="profile-list-item">${c.Content}</li>
        `).join("") : "<li>Aucun commentaire</li>"}
      </ul>

      <h3>Mes likes (${data.likes?.length || 0})</h3>
      <ul class="profile-list">
        ${data.likes?.length ? data.likes.map(l => `
          <li class="profile-list-item">${l.IsLike ? "👍" : "👎"} Post #${l.PostID}</li>
        `).join("") : "<li>Aucun like</li>"}
      </ul>

      <button id="logout-btn">Se déconnecter</button>
    `

    // Navigate to post on click
    document.querySelectorAll(".profile-post-title").forEach(el => {
      el.style.cursor = "pointer"
      el.style.color = "#1a1a2e"
      el.addEventListener("click", () => navigate(`/post/${el.dataset.id}`))
    })

    document.getElementById("logout-btn").addEventListener("click", () => {
      localStorage.removeItem("access_token")
      navigate("/")
    })

  } catch (err) {
    document.getElementById("profile-data").innerHTML = "<p>Erreur de chargement.</p>"
  }
}
