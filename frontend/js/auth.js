import { api } from "./api.js"
import { navigate } from "./router.js"

function generateCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  return { question: `${a} + ${b}`, answer: a + b }
}

let captcha = generateCaptcha()

export async function renderAuth() {
  const path = window.location.pathname
  const isLogin = path === "/login"
  const isForgot = path === "/forgot-password"
  const isReset = path === "/reset-password"

  if (isForgot) { renderForgotPassword(); return }
  if (isReset) { renderResetPassword(); return }

  captcha = generateCaptcha()

  document.getElementById("main-content").innerHTML = `
    <div class="auth-form">
      <h2>${isLogin ? "Connexion" : "Inscription"}</h2>
      <div id="auth-error" class="error-msg"></div>
      <div class="input-group">
        <input id="email" type="email" placeholder="Email *" required />
      </div>
      ${!isLogin ? `
        <div class="input-group">
          <input id="username" type="text" placeholder="Pseudo *" required />
        </div>
      ` : ""}
      <div class="input-group">
        <input id="password" type="password" placeholder="Mot de passe *" required />
      </div>
      ${!isLogin ? `
        <div class="captcha-box">
          <label>Combien font <strong>${captcha.question}</strong> ? *</label>
          <input id="captcha-input" type="number" placeholder="Réponse *" required />
        </div>
      ` : ""}
      ${isLogin ? `<p class="input-hint">Connectez-vous avec votre adresse email</p>` : `<p class="input-hint">Tous les champs sont obligatoires</p>`}
      <button class="btn-primary" id="submit-btn">${isLogin ? "Se connecter" : "S'inscrire"}</button>
      ${isLogin ? `<p class="auth-link"><a id="forgot-link" href="/forgot-password">Mot de passe oublié ?</a></p>` : ""}
    </div>
  `

  document.getElementById("forgot-link")?.addEventListener("click", (e) => {
    e.preventDefault()
    navigate("/forgot-password")
  })

  document.getElementById("submit-btn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim()
    const password = document.getElementById("password").value.trim()
    const errorEl = document.getElementById("auth-error")
    errorEl.textContent = ""

    if (!email || !password) {
      errorEl.textContent = "Tous les champs sont obligatoires."
      return
    }

    try {
      if (isLogin) {
        const data = await api.post("/auth/login", { email, password })
        localStorage.setItem("access_token", data.access_token)
        localStorage.setItem("refresh_token", data.refresh_token)
        navigate("/")
      } else {
        const username = document.getElementById("username").value.trim()
        const captchaAnswer = parseInt(document.getElementById("captcha-input").value)

        if (!username) {
          errorEl.textContent = "Le pseudo est obligatoire."
          return
        }

        if (captchaAnswer !== captcha.answer) {
          errorEl.textContent = "Mauvaise réponse au captcha."
          captcha = generateCaptcha()
          document.querySelector(".captcha-box label").innerHTML = `Combien font <strong>${captcha.question}</strong> ? *`
          return
        }

        await api.post("/auth/register", { email, username, password })
        navigate("/login")
      }
    } catch (err) {
      errorEl.textContent = err.message || "Erreur"
    }
  })
}

async function renderForgotPassword() {
  document.getElementById("main-content").innerHTML = `
    <div class="auth-form">
      <h2>Mot de passe oublié</h2>
      <div id="auth-error" class="error-msg"></div>
      <div id="auth-success" class="success-msg"></div>
      <input id="email" type="email" placeholder="Votre email *" required />
      <button class="btn-primary" id="submit-btn">Envoyer le lien</button>
      <p class="auth-link"><a id="login-link" href="/login">Retour à la connexion</a></p>
    </div>
  `

  document.getElementById("login-link")?.addEventListener("click", (e) => {
    e.preventDefault()
    navigate("/login")
  })

  document.getElementById("submit-btn").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim()
    const errorEl = document.getElementById("auth-error")
    const successEl = document.getElementById("auth-success")
    errorEl.textContent = ""
    successEl.textContent = ""

    if (!email) {
      errorEl.textContent = "L'email est obligatoire."
      return
    }

    try {
      await api.post("/auth/forgot-password", { email })
      successEl.textContent = "Si ce compte existe, un email a été envoyé."
    } catch (err) {
      errorEl.textContent = err.message || "Erreur"
    }
  })
}

async function renderResetPassword() {
  const token = new URLSearchParams(window.location.search).get("token")

  document.getElementById("main-content").innerHTML = `
    <div class="auth-form">
      <h2>Nouveau mot de passe</h2>
      <div id="auth-error" class="error-msg"></div>
      <div id="auth-success" class="success-msg"></div>
      <input id="password" type="password" placeholder="Nouveau mot de passe *" required />
      <button class="btn-primary" id="submit-btn">Réinitialiser</button>
    </div>
  `

  document.getElementById("submit-btn").addEventListener("click", async () => {
    const password = document.getElementById("password").value.trim()
    const errorEl = document.getElementById("auth-error")
    const successEl = document.getElementById("auth-success")
    errorEl.textContent = ""
    successEl.textContent = ""

    if (!password) {
      errorEl.textContent = "Le mot de passe est obligatoire."
      return
    }

    try {
      await api.post("/auth/reset-password", { token, password })
      successEl.textContent = "Mot de passe mis à jour, vous pouvez vous connecter."
      setTimeout(() => navigate("/login"), 2000)
    } catch (err) {
      errorEl.textContent = err.message || "Token invalide ou expiré."
    }
  })
}