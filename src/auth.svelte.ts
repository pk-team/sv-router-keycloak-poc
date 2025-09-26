import { searchParams } from "sv-router"
import { navigate } from "./router"
import Cookies from "js-cookie"

let keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL
let clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID

class AuthService {
    username: string | null = $state(null)

    async init() {
        if (this.username) return

        const accessToken = Cookies.get('access_token')
        if (!accessToken) {
            return
        }

        try {
            const payload = JSON.parse(atob(accessToken.split('.')[1]))
            
            if (Number(payload.exp) < Math.floor(Date.now() / 1000)) {
                const refreshToken = Cookies.get('refresh_token')
                if (refreshToken) {
                    await this.refreshToken(refreshToken)
                } else {
                    Cookies.remove('access_token')
                }
            } else {
                this.username = payload.preferred_username
            }
        } catch (error) {
            Cookies.remove('access_token')
            Cookies.remove('refresh_token')
        }
    }

    async redirectToLogin() {
        const { codeVerifier, codeChallenge } = await auth.generatePKCE()
        const state = crypto.getRandomValues(new Uint8Array(16)).join('')

        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: 'http://localhost:5173/redirect',
            response_type: 'code',
            scope: 'openid profile email',
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
            state: state,
        })

        sessionStorage.setItem('code_verifier', codeVerifier)
        window.location.href = `${keycloakUrl}/auth?${params}`
    }

    async parseLoginCallback() {
        const code = searchParams.get('code')
        const codeVerifier = sessionStorage.getItem('code_verifier')

      if (codeVerifier) {
        const res = await fetch(`${keycloakUrl}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            code: code as string,
            redirect_uri: `${window.location.origin}/redirect`,
            code_verifier: codeVerifier,
          }),
        })

        const data = await res.json()

        if (res.ok) {
            Cookies.set('access_token', data.access_token, {sameSite: 'strict'})
            Cookies.set('refresh_token', data.refresh_token, {sameSite: 'strict'})
            sessionStorage.removeItem('code_verifier')

            const payload = JSON.parse(atob(data.access_token.split('.')[1]))
            auth.username = payload.preferred_username

            navigate('/')
        }
      }
    }

    async logout() {
        const logoutParams = new URLSearchParams({
            refresh_token: Cookies.get('refresh_token'),
            client_id: clientId
        })
        this.username = null
        Cookies.remove('access_token')
        Cookies.remove('refresh_token')
        sessionStorage.removeItem('code_verifier')

        window.location.href = `${keycloakUrl}/logout?${logoutParams}`
    }

    async refreshToken(refreshToken: string) {
        const res = await fetch(`${keycloakUrl}/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            }),
        })

        const data = await res.json()
        
        if (res.ok) {
            Cookies.set('access_token', data.access_token, {sameSite: 'strict'})
            Cookies.set('refresh_token', data.refresh_token, {sameSite: 'strict'})
        } else {
            this.username = null
            Cookies.remove('access_token')
            Cookies.remove('refresh_token')
            navigate('/')
        }
    }

    async getUserInfo(accessToken: string) {
        const res = await fetch(`${keycloakUrl}/userinfo`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        return await res.json()
    }

    private base64URLEncode(array: Uint8Array) {
        return btoa(String.fromCharCode(...array))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')
    }

    async generatePKCE() {
        const codeVerifier = this.base64URLEncode(crypto.getRandomValues(new Uint8Array(32)))

        const encoder = new TextEncoder()
        const data = encoder.encode(codeVerifier)
        const digest = await crypto.subtle.digest('SHA-256', data)
        const codeChallenge = this.base64URLEncode(new Uint8Array(digest))

        return { codeVerifier, codeChallenge }
    }
}

export const auth = new AuthService()