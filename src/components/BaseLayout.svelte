<script lang="ts">
  import type { Snippet } from 'svelte'
  import { p } from '../router'
  import { auth } from '../auth.svelte'

  let { children }: { children: Snippet } = $props()
</script>

<div class="wrapper">
  <header>
    <a href="/"><h3>sv-router Auth</h3></a>
    <nav>
      <a href={p('/protected')}>Protected</a>
      {#if auth.username}
        <a href="/profile">{auth.username}</a>
        <button onclick={auth.logout}>Logout</button>
      {:else}
        <button onclick={auth.redirectToLogin}>
          <span>Login</span>
          <svg class="icon" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="000"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg>
        </button>
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
    padding: 1rem 2rem;
    border-bottom: 1px solid #333;
  }

  nav {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
</style>
