import assert from 'node:assert/strict';
import {test} from 'node:test';
import {estimateTimeline} from '../src/shared/estimate.ts';
import {TEMPLATES} from '../src/shared/templates.ts';
import type {ContentSpec} from '../src/shared/types.ts';
import {buildMetadata} from '../src/pipeline/metadata.ts';
import {dueSlot, loadBank} from '../src/pipeline/plan.ts';
import {PUBLISHERS, publishGate} from '../src/pipeline/publish/index.ts';
import {parseFeed, scoreItem, storyKey} from '../src/pipeline/research.ts';
import {validateSpec} from '../src/pipeline/spec.ts';
import {cueTimesFor, toSpoken} from '../src/pipeline/voice.ts';
import {config} from '../src/pipeline/lib.ts';

test('every bank spec is valid and verified', () => {
  const bank = loadBank();
  assert.ok(bank.length >= 10);
  for (const b of bank) {
    assert.deepEqual(validateSpec(b.spec), [], b.spec.id);
    assert.equal(b.spec.factCheck.status, 'verified');
  }
});

test('all 20 templates are registered', () => {
  assert.equal(Object.keys(TEMPLATES).length, 20);
});

test('validator rejects logo intros, missing sources and broken cues', () => {
  const good = loadBank()[0].spec;
  const bad: ContentSpec = JSON.parse(JSON.stringify(good));
  bad.scenes[0].kind = 'statement';
  bad.sources = [];
  bad.scenes[2].cues = ['words that are never spoken'];
  const e = validateSpec(bad).join(' | ');
  assert.match(e, /first scene must be a hook/);
  assert.match(e, /at least one source/);
  assert.match(e, /is not in the narration/);
});

test('pronunciation keeps display words and maps character spans', () => {
  const {spoken, spans} = toSpoken('CATZOC tells you, in ECDIS.');
  assert.equal(spoken, 'cat-zock tells you, in eck-diss.');
  assert.equal(spans[0].word, 'CATZOC');
  assert.equal(spoken.slice(spans[4].from, spans[4].to), 'eck-diss.');
});

test('cue times follow the spoken word', () => {
  const words = ['Plot', 'the', 'limits.', 'Secure', 'fuel.'].map((text, i) => ({text, start: 10 + i, end: 10.8 + i}));
  assert.deepEqual(cueTimesFor('Plot the limits. Secure fuel.', ['Plot', 'Secure'], words, 10), [0, 3]);
});

test('publish gate: all five conditions are required', () => {
  const yt = PUBLISHERS[0];
  const qcOk = {pass: true, publishable: true, checks: []};
  const keep = {...process.env};
  const set = (o: Record<string, string>) => Object.assign(process.env, o);
  set({DRY_RUN: 'true', AUTO_PUBLISH: 'true', YOUTUBE_CLIENT_ID: 'a', YOUTUBE_CLIENT_SECRET: 'b', YOUTUBE_REFRESH_TOKEN: 'c'});
  assert.equal(publishGate(qcOk, yt, false).allowed, false, 'dry run blocks');
  set({DRY_RUN: 'false', AUTO_PUBLISH: 'false'});
  assert.equal(publishGate(qcOk, yt, false).allowed, false, 'auto publish off blocks');
  set({AUTO_PUBLISH: 'true'});
  assert.equal(publishGate({pass: false, publishable: false, checks: []}, yt, false).allowed, false, 'failed QC blocks');
  assert.equal(publishGate(qcOk, yt, true).allowed, false, 'duplicate blocks');
  delete process.env.YOUTUBE_REFRESH_TOKEN;
  assert.equal(publishGate(qcOk, yt, false).allowed, false, 'missing credentials block');
  set({YOUTUBE_REFRESH_TOKEN: 'c'});
  assert.equal(publishGate(qcOk, yt, false).allowed, true);
  delete process.env.DRY_RUN;
  assert.equal(publishGate(qcOk, yt, false).allowed, false, 'DRY_RUN defaults to true');
  process.env = keep;
});

test('research: feed parsing, story key and scoring', () => {
  const xml = `<rss><channel><item><title><![CDATA[IMO adopts new SOLAS amendment on lifeboat safety]]></title><link>https://example.org/a?utm=1</link><pubDate>${new Date().toUTCString()}</pubDate><description>Seafarer safety &amp; training rules for crew.</description></item></channel></rss>`;
  const items = parseFeed(xml);
  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'IMO adopts new SOLAS amendment on lifeboat safety');
  assert.equal(storyKey('IMO adopts new SOLAS amendment'), storyKey('New SOLAS amendment adopts IMO'));
  const cfg = config<Parameters<typeof scoreItem>[1]>('scoring');
  const strong = scoreItem({...items[0], reliability: 1}, cfg).score;
  const weak = scoreItem({title: 'Sponsored: cruise deal of the week', summary: '', publishedAt: null, reliability: 0.5}, cfg).score;
  assert.ok(strong >= cfg.minScore, `strong=${strong}`);
  assert.ok(weak <= 20, `weak=${weak}`);
});

test('schedule: a slot is due only inside its window', () => {
  assert.equal(dueSlot(new Date('2026-01-05T05:20:00Z'))?.id, 'morning');
  assert.equal(dueSlot(new Date('2026-01-05T03:00:00Z')), null);
});

test('metadata differs per platform and respects limits', () => {
  const spec = loadBank()[0].spec;
  const m = buildMetadata(spec, estimateTimeline(spec), null, null);
  assert.ok(m.platforms.youtube.title.endsWith('#Shorts'));
  assert.ok(m.platforms.x.caption.length <= 280);
  assert.notEqual(m.platforms.linkedin.caption, m.platforms.tiktok.caption);
  assert.ok(m.platforms.youtube.caption.includes('Sources:'));
});
