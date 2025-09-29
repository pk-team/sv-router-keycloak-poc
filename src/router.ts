import { createRouter } from 'sv-router'
import Home from './routes/Home.svelte'
import Protected from './routes/Protected.svelte'
import BaseLayout from './components/BaseLayout.svelte'
// AuthCallback component removed - using hooks instead
import Cookies from 'js-cookie'
import { auth } from './auth.svelte'
import UserProfile from './routes/UserProfile.svelte'


const authUrl = import.meta.env.VITE_KEYCLOAK_URL

export const { p, navigate, isActive, route } = createRouter({
	'/': Home,
	'/protected': { '/': Protected, meta: { requireAuth: true } },
	'/profile': { '/': UserProfile, meta: { requireAuth: true } },
	'/redirect': {
		'/': () => import('./routes/AuthCallback.svelte'), // Use the existing minimal component
		hooks: {
			async beforeLoad() {
				// Handle OAuth callback before any component loads
				console.log('Processing OAuth callback at /redirect')
				await auth.parseLoginCallback()
				// parseLoginCallback() will automatically navigate to '/' on success
				// so we don't need to return anything here
			},
			afterLoad() {
				// Update document title after successful login callback processing
				document.title = "logged in"
			},
		},
	},
	layout: BaseLayout,
	hooks: {
		beforeLoad: async () => {
			console.log(route.pathname, (route.meta as any).requireAuth)
			
			await auth.init()
			
		},
		afterLoad: () => {
			if ((route.meta as any).requireAuth && !auth.username) {
				auth.redirectToLogin()
			}
		}
	}
})
