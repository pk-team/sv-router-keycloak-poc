<script>
  import { onMount } from 'svelte'
  import { auth } from '../auth.svelte.ts'

  onMount(() => {
    auth.parseLoginCallback()
  })
</script>
