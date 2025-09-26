<script lang="ts">
  import type { Snippet } from 'svelte'
  import { p } from '../router'
  import { auth } from '../auth.svelte'

  let { children }: { children: Snippet } = $props()
</script>

<div class="wrapper">
  <header>
    <a href="/">sv-router Auth</a>
    <nav>
      <a href={p('/protected')}>Protected</a>
      {#if auth.username}
        <a href="/profile">{auth.username}</a>
        <button onclick={auth.logout}>Logout</button>
      {:else}
        <button onclick={auth.redirectToLogin}>Login</button>
      {/if}
    </nav>
  </header>
  <main>
    {@render children()}
  </main>
</div>

<style>
  header {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #333;
  }
</style>
