const BASE_URL = "/api"

function getToken() {
  return localStorage.getItem("access_token")
}

async function request(method, endpoint, body = null) {
  const headers = { "Content-Type": "application/json" }
  const token = getToken()
  if (token) headers["Authorization"] = `Bearer ${token}`

  const res = await fetch(BASE_URL + endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  if (!res.ok) throw await res.json()
  return res.json()
}

export const api = {
  get:    (url)         => request("GET", url),
  post:   (url, body)   => request("POST", url, body),
  put:    (url, body)   => request("PUT", url, body),
  delete: (url)         => request("DELETE", url),
}
