import type { Router } from 'chuchi';
import NotFound from './NotFound.svelte';

export function register(router: Router) {
	router.register('/', () => import('./index/Index.svelte'));
}

export { NotFound };
