import fs from 'fs/promises';
import command from 'node:child_process';
import util from 'node:util';
import { Router } from 'chuchi';

const exec = util.promisify(command.exec);

// the host the pages are rendered for
const HOST = 'chnobli.com';

async function main() {
	console.info('build client');
	await exec('npx vite build --outDir dist-client --ssrManifest');

	console.info('build server');
	await exec('npx vite build --outDir dist-server --ssr src/server.ts');

	console.info('create dist');
	await fs.rm('dist', { force: true, recursive: true });
	await fs.cp('dist-client/', 'dist/', { recursive: true });
	await fs.rm('dist/index.html');
	await fs.rm('dist/.vite', { force: true, recursive: true });

	const indexHtml = await fs.readFile('dist-client/index.html', 'utf8');
	const ssrManifest = JSON.parse(
		await fs.readFile('dist-client/.vite/ssr-manifest.json', 'utf8'),
	);

	// @ts-ignore only exists during the build
	const server = await import('./dist-server/server.js');

	const router = new Router();
	server.routes.register(router);

	// every page with a fixed uri gets its own index.html
	for (const route of router.routes) {
		const uri = route.uri;
		if (typeof uri !== 'string')
			throw new Error("only string uri's are supported");

		const { status, fields } = await server.render(
			{ method: 'GET', uri, headers: { host: HOST } },
			{ ssrManifest },
		);
		if (status !== 200)
			throw new Error(`expected status 200 for ${uri}, got ${status}`);

		const path = 'dist' + uri.replace(/\/$/, '') + '/index.html';
		await fs.mkdir(path.slice(0, path.lastIndexOf('/')), {
			recursive: true,
		});
		await fs.writeFile(path, fill(indexHtml, fields));
		console.log('create file', path);
	}

	await fs.rm('dist-client', { force: true, recursive: true });
	await fs.rm('dist-server', { force: true, recursive: true });

	console.log('ready in dist');
}

function fill(html, fields) {
	for (const field in fields) {
		html = html.replace(`<!--ssr-${field}-->`, fields[field]);
	}
	return html;
}

main();
