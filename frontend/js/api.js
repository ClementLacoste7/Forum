const BASE_URL = "/api"

function getToken() {
  return localStorage.getItem("access_token")
}

function getRefreshToken() {
  return localStorage.getItem("refresh_token")
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error("no refresh token")

  const res = await fetch(BASE_URL + "/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!res.ok) {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    throw new Error("session expired")
  }

  const data = await res.json()
  localStorage.setItem("access_token", data.access_token)
  return data.access_token
}

async function request(method, endpoint, body = null, retry = true) {
  const headers = { "Content-Type": "application/json" }
  const token = getToken()
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(BASE_URL + endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  if (res.status === 401 && retry && token) {
    try {
      await refreshAccessToken()
      return request(method, endpoint, body, false)
    } catch {
      window.location.href = "/login"
      return
    }
  }

  if (res.status === 204) return null

  // Read body once
  const text = await res.text()

  if (!res.ok) {
    try {
      throw JSON.parse(text)
    } catch {
      throw new Error(text)
    }
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const api = {
  get:    (url)       => request("GET", url),
  post:   (url, body) => request("POST", url, body),
  put:    (url, body) => request("PUT", url, body),
  delete: (url)       => request("DELETE", url),
}