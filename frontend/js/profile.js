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
      <p><strong>Pseudo :</strong> ${data.user.Username}</p>
      <p><strong>Email :</strong> ${data.user.Email}</p>

      <h3>Mes posts (${data.posts.length})</h3>
      <ul>
        ${data.posts.map(p => `<li>${p.Title}</li>`).join("") || "<li>Aucun post</li>"}
      </ul>

      <h3>Mes commentaires (${data.comments.length})</h3>
      <ul>
        ${data.comments.map(c => `<li>${c.Content}</li>`).join("") || "<li>Aucun commentaire</li>"}
      </ul>

      <button id="logout-btn">Se déconnecter</button>
    `

    document.getElementById("logout-btn").addEventListener("click", () => {
      localStorage.removeItem("access_token")
      navigate("/login")
    })

  } catch (err) {
    document.getElementById("profile-data").innerHTML = "<p>Erreur de chargement.</p>"
  }
}