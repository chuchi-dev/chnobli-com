<script>
	import './app.scss';

	const { page } = $props();

	const Component = $derived($page.component);
</script>

{#key Component}
	<Component {...$page.props} />
{/key}
