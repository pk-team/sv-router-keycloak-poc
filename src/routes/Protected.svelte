<script lang="ts">
    import { auth } from "../auth.svelte"
</script>

{#if auth.username}
    <h2>Protected Route</h2>
{/if}