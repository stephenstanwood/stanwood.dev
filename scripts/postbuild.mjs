/**
 * Inject custom-domain rewrites BEFORE the filesystem handler in
 * Vercel's build output config. Vercel normally serves static files
 * before rewrites, so vercel.json rewrites never fire for `/`.
 * This script fixes that by placing host-based route rules earlier
 * in the routing pipeline.
 */
import { readFileSync, writeFileSync } from 'fs';

const configPath = '.vercel/output/config.json';
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

const domainRewrites = [
  { src: '^/$', has: [{ type: 'host', value: 'nbanow.app' }], dest: '/nba-now' },
  { src: '^/$', has: [{ type: 'host', value: 'www.nbanow.app' }], dest: '/nba-now' },
  { src: '^/$', has: [{ type: 'host', value: 'showswipe.app' }], dest: '/show-swipe' },
  { src: '^/$', has: [{ type: 'host', value: 'www.showswipe.app' }], dest: '/show-swipe' },
];

const fsIndex = config.routes.findIndex(r => r.handle === 'filesystem');
if (fsIndex >= 0) {
  config.routes.splice(fsIndex, 0, ...domainRewrites);
  writeFileSync(configPath, JSON.stringify(config, null, '\t'));
  console.log('postbuild: injected domain rewrites before filesystem handler');
} else {
  console.warn('postbuild: no filesystem handler found in config.json');
}
