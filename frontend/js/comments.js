import { api } from "./api.js"
import { navigate } from "./router.js"

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
}

export async function renderComments(postID) {
  const container = document.getElementById("comments-section")
  container.innerHTML = "<p>Chargement des commentaires...</p>"

  try {
    const comments = await api.get(`/comments?post_id=${postID}`)
    const isLoggedIn = !!localStorage.getItem("access_token")

    container.innerHTML = `
      <h3>Commentaires (${comments.length})</h3>
      <ul class="comments-list">
        ${comments.length ? comments.map(c => `
          <li class="comment">
            <div class="comment-meta">
              <strong>${c.User?.Username || "Inconnu"}</strong>
              <span class="comment-date">${formatDate(c.CreatedAt)}</span>
            </div>
            <p>${c.Content}</p>
          </li>
        `).join("") : "<li class='comment'>Aucun commentaire.</li>"}
      </ul>
      ${isLoggedIn ? `
        <div class="add-comment">
          <textarea id="comment-input" placeholder="Ajouter un commentaire..."></textarea>
          <button class="btn-primary" id="comment-submit">Envoyer</button>
        </div>
      ` : `<p class="login-hint"><a id="login-link" href="/login">Connectez-vous</a> pour commenter.</p>`}
    `

    document.getElementById("comment-submit")?.addEventListener("click", async () => {
      const content = document.getElementById("comment-input").value
      if (!content.trim()) return
      try {
        await api.post("/comments", { post_id: postID, content })
        renderComments(postID)
      } catch (err) {
        alert(err.message || "Erreur")
      }
    })

    document.getElementById("login-link")?.addEventListener("click", (e) => {
      e.preventDefault()
      navigate("/login")
    })

  } catch (err) {
    container.innerHTML = "<p>Erreur de chargement.</p>"
  }
}
