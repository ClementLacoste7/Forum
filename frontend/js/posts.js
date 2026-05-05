import { api } from "./api.js"
import { navigate } from "./router.js"

export async function renderHome() {
  document.getElementById("main-content").innerHTML = 
    <div class="posts-container">
      <h2>Posts récents</h2>
      <div id="posts-list">Chargement...</div>
    </div>
  
  try {
    const posts = await api.get("/posts")
    const list = document.getElementById("posts-list")

    if (!posts.length) {
      list.innerHTML = "<p>Aucun post pour l'instant.</p>"
      return
    }

    list.innerHTML = posts.map(p => 
      <div class="post-card" data-id="${p.ID}">
        <h3>${p.Title}</h3>
        <p class="post-meta">Par ${p.User.Username}</p>
        <div class="post-preview">${p.Content.substring(0, 150)}...</div>
        <button onclick="navigate('/post/${p.ID}')">Lire la suite</button>
      </div>
    ).join("")

  } catch (err) {
    document.getElementById("posts-list").innerHTML = "<p>Erreur de chargement.</p>"
  }
}