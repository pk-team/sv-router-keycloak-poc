<script lang="ts">
    import { onMount } from "svelte"
    import { auth } from "../auth.svelte"
    import Cookies from "js-cookie"

    let userInfo = $state(null)

    onMount(async () => {
        if (auth.username) {
            userInfo = await auth.getUserInfo(Cookies.get("access_token"))
        }
    })
</script>

{#if auth.username && userInfo}
    <h1>User Profile</h1>
    <pre>{JSON.stringify(userInfo,null,2)}</pre>
{/if}