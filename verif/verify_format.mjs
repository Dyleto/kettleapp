/**
 * How a recorded set reads back.
 *
 * The work comes first, the load second — "12 reps · 26 kg", the order it is
 * said out loud. The load used to lead, which read as "26 kg × 12": the
 * number you actually did came last, behind the number you chose.
 *
 * Four shapes, and a tail of cases where one of the two values is missing.
 * They are pure string formatting, so they are checked here rather than
 * through a browser: a suite that drives the app to read one line back would
 * cost thirty seconds to prove what a function call proves in a millisecond.
 *
 * What makes this worth a suite at all: these forms break silently. Nothing
 * crashes when "3 × 26 kg" starts meaning three repetitions instead of three
 * sets — it just quietly says something false.
 */
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ok, failureCount } from './common.mjs';

// The formatter is TypeScript, and this bench is plain Node: we bundle the
// one module rather than drag a whole test runner in for it.
const dir = mkdtempSync(join(tmpdir(), 'kettle-format-'));
const out = join(dir, 'performedFormat.mjs');
await build({
  entryPoints: ['../src/features/client/performedFormat.ts'],
  bundle: true,
  format: 'esm',
  outfile: out,
  logLevel: 'silent',
});
const { formatPerformedSets: format } = await import(out);

const reads = (label, sets, expected) =>
  ok(
    label,
    format(sets) === expected,
    JSON.stringify(format(sets)) + ' vs ' + JSON.stringify(expected)
  );

// ── The four shapes ─────────────────────────────────────────────────────
console.log('\n── the work leads, the load follows');
reads('one set', [{ weight: 26, reps: 12 }], '12 reps · 26 kg');
reads(
  '  → several identical sets: the count leads the work',
  [
    { weight: 26, reps: 12 },
    { weight: 26, reps: 12 },
    { weight: 26, reps: 12 },
  ],
  '3 × 12 reps · 26 kg'
);
reads(
  '  → same load, fewer reps each time',
  [
    { weight: 26, reps: 12 },
    { weight: 26, reps: 10 },
    { weight: 26, reps: 8 },
  ],
  '12 + 10 + 8 reps · 26 kg'
);
reads(
  '  → everything else, set by set',
  [
    { weight: 26, reps: 12 },
    { weight: 24, reps: 10 },
  ],
  '12 × 26 kg · 10 × 24 kg'
);

// ── The count and the reps must never be confused ───────────────────────
//
// This is what the word "reps" buys. With the work in front of the load, a
// bare number before a load means repetitions — so a set count in that
// position has to name its own unit, or "3 × 26 kg" says three repetitions
// at 26 kg when three sets were done.
console.log('\n── a number before a load always means repetitions');
reads('a load held, one set', [{ weight: 26 }], '26 kg');
reads(
  '  → the same load over three sets says "séries"',
  [{ weight: 26 }, { weight: 26 }, { weight: 26 }],
  '3 séries · 26 kg'
);
reads(
  '  → and three sets of twelve stays a count of sets',
  [
    { weight: 26, reps: 12 },
    { weight: 26, reps: 12 },
    { weight: 26, reps: 12 },
  ],
  '3 × 12 reps · 26 kg'
);

// ── One of the two missing ──────────────────────────────────────────────
console.log('\n── what was not recorded is not invented');
reads('reps with no load', [{ reps: 12 }], '12 reps');
reads(
  '  → over three sets',
  [{ reps: 12 }, { reps: 12 }, { reps: 12 }],
  '3 × 12 reps'
);
reads('a timed exercise', [{ duration: 45, weight: 16 }], '45s · 16 kg');
reads(
  '  → timed, with no load',
  [{ duration: 45 }, { duration: 45 }, { duration: 45 }],
  '3 × 45s'
);
reads('nothing at all', [], null);
reads('  → an empty set says nothing either', [{}], null);

// ── An empty set truncates ──────────────────────────────────────────────
console.log('\n── an empty set stops the exercise there');
reads(
  'what follows an empty set did not happen',
  [{ weight: 26, reps: 12 }, {}, { weight: 99, reps: 99 }],
  '12 reps · 26 kg'
);
reads(
  '  → a missing rep count inside a set is held open',
  [{ weight: 26, reps: 12 }, { weight: 26 }],
  '12 + — reps · 26 kg'
);

process.exit(failureCount() ? 1 : 0);
