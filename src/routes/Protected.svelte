<script lang="ts">
    import { auth } from "../auth.svelte"
</script>

{#if auth.username}
    <h1>Protected Route</h1>
{/if}