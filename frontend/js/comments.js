import { api } from "./api.js"

// Render comments for a given post
export async function renderComments(postID) {
  const container = document.getElementById("comments-section")
  container.innerHTML = "<p>Chargement des commentaires...</p>"

  try {
    const comments = await api.get(`/comments?post_id=${postID}`)

    container.innerHTML = `
      <h3>Commentaires (${comments.length})</h3>
      <ul class="comments-list">
        ${comments.map(c => `
          <li class="comment">
            <strong>${c.User.Username}</strong>
            <p>${c.Content}</p>
          </li>
        `).join("") || "<li>Aucun commentaire.</li>"}
      </ul>
      <div class="add-comment">
        <textarea id="comment-input" placeholder="Ajouter un commentaire..."></textarea>
        <button id="comment-submit">Envoyer</button>
      </div>
    `

    document.getElementById("comment-submit").addEventListener("click", async () => {
      const content = document.getElementById("comment-input").value
      if (!content.trim()) return

      try {
        await api.post("/comments", { post_id: postID, content })
        renderComments(postID)
      } catch (err) {
        alert(err.message || "Erreur")
      }
    })

  } catch (err) {
    container.innerHTML = "<p>Erreur de chargement.</p>"
  }
}