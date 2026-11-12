import {readdirSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {Preview} from './Preview';

export const dynamic = 'force-dynamic';

const load = (dir: string) => {
  try {
    return readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(resolve(dir, f), 'utf8')));
  } catch {
    return [];
  }
};

export default function Page() {
  const root = resolve(process.cwd(), '../..');
  const specs = [...load(resolve(root, 'content/queue')), ...load(resolve(root, 'content/bank'))];
  return (
    <main style={{padding: 24}}>
      <h1 style={{margin: '0 0 4px'}}>HeyMariner Studio</h1>
      <p style={{margin: '0 0 20px', color: '#B8C7DB'}}>Preview of content specs with an estimated timeline. The real timing comes from the ElevenLabs voice-over in the pipeline.</p>
      <Preview specs={specs} />
    </main>
  );
}
