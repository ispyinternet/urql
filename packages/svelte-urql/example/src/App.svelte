<script>
  import { setClient, query } from '../..';

  setClient({ url: "https://0ufyz.sse.codesandbox.io" });

  let i = 0;

  let pause = true;
  let first = 0;
  const todos = query({
    query: `
      query ($first: Int!, $skip: Int) {
      todos(first: $first, skip: $skip) {
        id
      }
    }`,
    pause
  });

  $: todos.execute({ pause, variables: { first } });
</script>

{#if $todos.fetching} Loading... {:else if $todos.error} Oh no! {$todos.error.message} {:else if !$todos.data} No data {:else}
<ul>
  {#each $todos.data.todos as todo}
  <li>{todo.text}</li>
  {/each}
</ul>
{/if}

<button on:click="{() => pause = false}">Execute</button>
<button on:click="{() => first+=10}">next</button>
<button on:click="{() => pause = true}">pause</button>
