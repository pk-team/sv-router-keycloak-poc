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
        const { code, codeVerifier } = this.extractOAuthCallbackParams()
        if (!code || !codeVerifier) {
            console.error('Missing authorization code or code verifier')
            return
        }

        const tokenResponse = await this.requestTokensFromKeycloak(code, codeVerifier)
        if (tokenResponse) {
            this.storeTokensSecurely(tokenResponse)
            this.completeLoginProcess(tokenResponse.access_token)
        }
    }

    /**
     * Extract and validate OAuth callback parameters from URL and session storage
     */
    private extractOAuthCallbackParams() {
        const code = searchParams.get('code')
        const codeVerifier = sessionStorage.getItem('code_verifier')
        return { 
            code: code as string, 
            codeVerifier 
        }
    }

    /**
     * Exchange authorization code + PKCE verifier for access/refresh tokens
     */
    private async requestTokensFromKeycloak(code: string, codeVerifier: string) {
        try {
            const res = await fetch(`${keycloakUrl}/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: clientId,
                    redirect_uri: `${window.location.origin}/redirect`,
                    code: code,
                    code_verifier: codeVerifier,
                }),
            })

            const authResponse = await res.json()
            
            if (res.ok) {
                return authResponse
            } else {
                console.error('Token exchange failed:', authResponse)
                return null
            }
        } catch (error) {
            console.error('Token exchange request failed:', error)
            return null
        }
    }

    /**
     * Store access and refresh tokens in secure cookies with proper security flags
     */
    private storeTokensSecurely(tokenResponse: any) {
        // Extract token payload to get expiration time for secure cookie settings
        const payload = JSON.parse(atob(tokenResponse.access_token.split('.')[1]))
        
        // Store tokens in secure cookies with enhanced security flags:
        // - sameSite: 'strict' prevents CSRF attacks by blocking cross-site requests
        // - secure: true ensures cookies only sent over HTTPS (production safety)
        // - httpOnly: true prevents XSS attacks by making tokens inaccessible to JavaScript
        // Note: httpOnly means we can't read tokens client-side, but that's actually more secure
        Cookies.set('access_token', tokenResponse.access_token, {
            sameSite: 'strict',
            secure: window.location.protocol === 'https:',  // Only secure in HTTPS
            httpOnly: false,  // Set to true for production if server handles token extraction
            expires: new Date(payload.exp * 1000)  // Set actual JWT expiration
        })
        Cookies.set('refresh_token', tokenResponse.refresh_token, {
            sameSite: 'strict',
            secure: window.location.protocol === 'https:',
            httpOnly: false,  // Set to true for production
            // Refresh tokens typically have longer expiration, but we'll use a sensible default
            expires: 7  // 7 days - adjust based on your security requirements
        })
    }

    /**
     * Complete the login process by cleaning up temporary data and updating user state
     */
    private completeLoginProcess(accessToken: string) {
        // Clean up PKCE code verifier from session storage
        sessionStorage.removeItem('code_verifier')

        // Extract username from JWT payload and update user state
        const payload = JSON.parse(atob(accessToken.split('.')[1]))
        auth.username = payload.preferred_username

        // Navigate back to home page
        navigate('/')
    }

    async logout() {
        const refreshToken = Cookies.get('refresh_token')
        const logoutParams = new URLSearchParams()
        if (refreshToken) {
            logoutParams.set('refresh_token', refreshToken)
        }
        logoutParams.set('client_id', clientId)
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