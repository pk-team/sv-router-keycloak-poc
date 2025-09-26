import { createRouter } from 'sv-router'
import Home from './routes/Home.svelte'
import Protected from './routes/Protected.svelte'
import BaseLayout from './components/BaseLayout.svelte'
import AuthCallback from './routes/AuthCallback.svelte'
import Cookies from 'js-cookie'
import { auth } from './auth.svelte'
import UserProfile from './routes/UserProfile.svelte'


const authUrl = import.meta.env.VITE_KEYCLOAK_URL

export const { p, navigate, isActive, route } = createRouter({
	'/': Home,
	'/protected': { '/': Protected, meta: { requireAuth: true } },
	'/profile': { '/': UserProfile, meta: { requireAuth: true } },
	'/redirect': AuthCallback,
	layout: BaseLayout,
	hooks: {
		beforeLoad: async () => {
			console.log(route.path, route.meta.requireAuth)
			
			await auth.init()
			
		},
		afterLoad: () => {
			if (route.meta.requireAuth && !auth.username) {
				auth.redirectToLogin()
			}
		}
	}
})
