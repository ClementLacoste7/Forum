import { api } from "./api.js"
import { navigate } from "./router.js"

export async function renderAuth() {
  const path = window.location.pathname
  const isLogin = path === "/login"

  document.getElementById("main-content").innerHTML = 
    <div class="auth-form">
      <h2>${isLogin ? "Connexion" : "Inscription"}</h2>
      <input id="email" type="email" placeholder="Email" />
      ${!isLogin ? <input id="username" type="text" placeholder="Pseudo" /> : ""}
      <input id="password" type="password" placeholder="Mot de passe" />
      <button id="submit-btn">${isLogin ? "Se connecter" : "S'inscrire"}</button>
    </div>
  

  document.getElementById("submit-btn").addEventListener("click", async () => {
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value

    try {
      if (isLogin) {
        const data = await api.post("/auth/login", { email, password })
        localStorage.setItem("access_token", data.access_token)
        navigate("/")
      } else {
        const username = document.getElementById("username").value
        await api.post("/auth/register", { email, username, password })
        navigate("/login")
      }
    } catch (err) {
      alert(err.message || "Erreur")
    }
  })
}

