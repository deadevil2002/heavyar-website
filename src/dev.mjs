import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { Readable } from 'node:stream';
import { handleRequest } from './handler.mjs';

const port = Number(process.env.PORT || 3000);
const basePath = (process.env.BASE_PATH || '/heavyar-website').replace(/\/+$/, '');
const rootPath = normalize(new URL('..', import.meta.url).pathname);
const allowed = new Set(['/delete-account.js', '/styles.css', '/script.js', '/site.webmanifest', '/refund.html', '/safety.html', '/providers-terms.html', '/contact.html', '/assets/site.css', '/assets/site.js', '/assets/images/logo.png', '/assets/images/banner.jpg', '/assets/images/hero.webp', '/assets/cert/sbc-certificate.png', '/assets/social/heavyar-og.jpg', '/assets/icons/favicon.ico', '/assets/icons/favicon-32.png', '/assets/icons/icon-192.png', '/assets/icons/icon-512.png', '/assets/icons/apple-touch-icon.png', '/assets/icons/brand.png']);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.ico': 'image/x-icon', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json; charset=utf-8' };
const earlyAccessFixture = ['on', 'off'].includes(process.env.DEV_EARLY_ACCESS || '') ? process.env.DEV_EARLY_ACCESS : null;
const seoFixtureName = /^[A-Za-z0-9_-]+\.json$/.test(process.env.DEV_SEO_FIXTURE || '') ? process.env.DEV_SEO_FIXTURE : null;

async function devFetch(input, init) {
  const target = new URL(typeof input === 'string' ? input : input.url);
  if (earlyAccessFixture && target.pathname === '/api/early-access/config') {
    return Response.json({ enabled: earlyAccessFixture === 'on' });
  }
  if (earlyAccessFixture && target.pathname === '/api/early-access/register') {
    if (earlyAccessFixture !== 'on') return Response.json({ success: false, error: 'Registration closed.' }, { status: 403 });
    const declared = Number(new Headers(init?.headers).get('content-length') || 0);
    if (declared > 4096) return Response.json({ success: false, error: 'Invalid request.' }, { status: 400 });
    let raw = '';
    try { raw = await new Response(init?.body).text(); } catch { return Response.json({ success: false, error: 'Invalid request.' }, { status: 400 }); }
    if (raw.length > 4096) return Response.json({ success: false, error: 'Invalid request.' }, { status: 400 });
    let value;
    try { value = JSON.parse(raw); } catch { return Response.json({ success: false, error: 'Invalid request.' }, { status: 400 }); }
    const keys = value && typeof value === 'object' && !Array.isArray(value) ? Object.keys(value) : [];
    const allowedKeys = ['email', 'name', 'country', 'language', 'consentMarketing'];
    const valid = keys.length > 0 && keys.every(key => allowedKeys.includes(key)) &&
      typeof value.email === 'string' && value.email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email) &&
      (value.name == null || (typeof value.name === 'string' && value.name.length <= 100)) &&
      (value.country == null || (typeof value.country === 'string' && value.country.length <= 100)) &&
      (value.language == null || ['ar', 'en'].includes(value.language)) &&
      (value.consentMarketing == null || typeof value.consentMarketing === 'boolean');
    return valid ? Response.json({ success: true, message: 'Registration request accepted.' }) : Response.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }
  if (seoFixtureName && target.pathname === '/api/seo/published') {
    const fixture = await readFile(join(rootPath, 'tests', 'fixtures', seoFixtureName), 'utf8');
    return new Response(fixture, { headers: { 'Content-Type': 'application/json', ETag: '"dev-seo-fixture"' } });
  }
  return fetch(input, init);
}

async function asset(pathname) {
  if (!allowed.has(pathname)) return new Response('Not found', { status: 404 });
  const file = join(rootPath, pathname);
  await stat(file);
  if (pathname === '/site.webmanifest') {
    const manifest = JSON.parse(await readFile(file, 'utf8'));
    manifest.start_url = `${basePath}/`;
    manifest.icons = manifest.icons.map(icon => ({ ...icon, src: `${basePath}${icon.src}` }));
    return Response.json(manifest, { headers: { 'Content-Type': types['.webmanifest'] } });
  }
  if (pathname === '/assets/site.js') {
    const source = await readFile(file, 'utf8');
    return new Response(source.replaceAll("fetch('/api/", `fetch('${basePath}/api/`), { headers: { 'Content-Type': types['.js'] } });
  }
  if (pathname === '/site.webmanifest') {
    const source = await readFile(file, 'utf8');
    const manifest = JSON.parse(source);
    manifest.start_url = `${basePath}/`;
    manifest.icons = manifest.icons.map(icon => ({ ...icon, src: `${basePath}${icon.src}` }));
    return new Response(JSON.stringify(manifest), { headers: { 'Content-Type': types['.webmanifest'] } });
  }
  return new Response(Readable.toWeb(createReadStream(file)), { headers: { 'Content-Type': types[extname(file)] || 'application/octet-stream' } });
}

createServer(async (req, res) => {
  try {
    const origin = `http://${req.headers.host || `localhost:${port}`}`;
    const init = { method: req.method, headers: req.headers };
    if (!['GET', 'HEAD'].includes(req.method)) init.body = Readable.toWeb(req), init.duplex = 'half';
    const response = await handleRequest(new Request(new URL(req.url, origin), init), {}, {
      basePath, asset,
      enableDevApiProxy: true,
      fetcher: devFetch,
      legacyLoader: file => readFile(join(rootPath, file), 'utf8'),
    });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) Readable.fromWeb(response.body).pipe(res); else res.end();
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(error instanceof Error ? error.message : 'Server error');
  }
}).listen(port, '0.0.0.0', () => console.log(`Heavyar website listening on ${port}${basePath}/`));