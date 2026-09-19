import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const dist = new URL('../dist/', import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(new URL('src/', dist), { recursive: true });
await cp(new URL('assets/', root), new URL('assets/', dist), { recursive: true });
for (const file of ['delete-account.js', 'styles.css', 'script.js', 'site.webmanifest', 'favicon.ico', 'favicon-32.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png']) {
  try { await cp(new URL(file, root), new URL(file, dist)); } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}
for (const file of ['index.html', 'privacy.html', 'terms.html', 'delete-account.html', 'refund.html', 'safety.html', 'providers-terms.html', 'faq.html', 'contact.html']) {
  await cp(new URL(file, root), new URL(file, dist));
}
for (const file of ['seo.mjs', 'fallback.mjs', 'legacy-source.mjs', 'legacy.mjs', 'handler.mjs', 'site.mjs']) await cp(new URL(`src/${file}`, root), new URL(`src/${file}`, dist));
for (const file of ['_worker.js', '_routes.json']) await cp(new URL(file, root), new URL(file, dist));

// Static fallback files are useful when Pages assets are inspected directly;
// runtime requests are rendered by the advanced-mode Worker.
const template = await readFile(new URL('index.html', root), 'utf8');
await writeFile(new URL('baseline-index.html', dist), template);
console.log('Built dist/');