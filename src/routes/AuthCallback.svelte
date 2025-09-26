<script lang="ts">
  import { onMount } from 'svelte'
  import { auth } from '../auth.svelte'

  onMount(async () => {
    auth.parseLoginCallback()
  })
</script>
