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
      <h2>${isLogin ? "Sign In" : "Sign Up"}</h2>
      <div id="auth-error" class="error-msg"></div>
      <div class="input-group">
        <input id="email" type="email" placeholder="Email *" required />
      </div>
      ${!isLogin ? `
        <div class="input-group">
          <input id="username" type="text" placeholder="Username *" required />
        </div>
      ` : ""}
      <div class="input-group">
        <input id="password" type="password" placeholder="Password *" required />
      </div>
      ${!isLogin ? `
        <div class="captcha-box">
          <label>What is <strong>${captcha.question}</strong>? *</label>
          <input id="captcha-input" type="number" placeholder="Answer *" required />
        </div>
      ` : ""}
      ${isLogin ? `<p class="input-hint">Sign in with your email address</p>` : `<p class="input-hint">All fields are required</p>`}
      <button class="btn-primary" id="submit-btn">${isLogin ? "Sign In" : "Sign Up"}</button>
      ${isLogin ? `<p class="auth-link"><a id="forgot-link" href="/forgot-password">Forgot your password?</a></p>` : ""}
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
      errorEl.textContent = "All fields are required."
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
          errorEl.textContent = "Username is required."
          return
        }

        if (captchaAnswer !== captcha.answer) {
          errorEl.textContent = "Wrong captcha answer."
          captcha = generateCaptcha()
          document.querySelector(".captcha-box label").innerHTML = `What is <strong>${captcha.question}</strong>? *`
          return
        }

        await api.post("/auth/register", { email, username, password })
        navigate("/login")
      }
    } catch (err) {
      errorEl.textContent = err.message || "An error occurred."
    }
  })
}

async function renderForgotPassword() {
  document.getElementById("main-content").innerHTML = `
    <div class="auth-form">
      <h2>Forgot Password</h2>
      <div id="auth-error" class="error-msg"></div>
      <div id="auth-success" class="success-msg"></div>
      <input id="email" type="email" placeholder="Your email *" required />
      <button class="btn-primary" id="submit-btn">Send reset link</button>
      <p class="auth-link"><a id="login-link" href="/login">Back to sign in</a></p>
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
      errorEl.textContent = "Email is required."
      return
    }

    try {
      await api.post("/auth/forgot-password", { email })
      successEl.textContent = "If this account exists, a reset email has been sent."
    } catch (err) {
      errorEl.textContent = err.message || "An error occurred."
    }
  })
}

async function renderResetPassword() {
  const token = new URLSearchParams(window.location.search).get("token")

  document.getElementById("main-content").innerHTML = `
    <div class="auth-form">
      <h2>New Password</h2>
      <div id="auth-error" class="error-msg"></div>
      <div id="auth-success" class="success-msg"></div>
      <input id="password" type="password" placeholder="New password *" required />
      <button class="btn-primary" id="submit-btn">Reset password</button>
    </div>
  `

  document.getElementById("submit-btn").addEventListener("click", async () => {
    const password = document.getElementById("password").value.trim()
    const errorEl = document.getElementById("auth-error")
    const successEl = document.getElementById("auth-success")
    errorEl.textContent = ""
    successEl.textContent = ""

    if (!password) {
      errorEl.textContent = "Password is required."
      return
    }

    try {
      await api.post("/auth/reset-password", { token, password })
      successEl.textContent = "Password updated, you can now sign in."
      setTimeout(() => navigate("/login"), 2000)
    } catch (err) {
      errorEl.textContent = err.message || "Invalid or expired token."
    }
  })
}