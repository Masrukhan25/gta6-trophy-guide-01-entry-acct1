import { readFileSync } from 'node:fs';
const data = JSON.parse(readFileSync(new URL('./app/data/trophies.json', import.meta.url)));
const research = readFileSync('/home/hatch/workspace/makefun/gta6-trophy-guide-01-research/trophies.md', 'utf8');
const sourceText = readFileSync('/home/hatch/workspace/makefun/gta6-trophy-guide-01-research/sources.md', 'utf8');
const roster = [...research.matchAll(/^## (\d+)\. (.+) — (\w+) — (Visible|Hidden)\n\n- \*\*Official description:\*\* "(.+)"$/gm)];
const ids = new Set(data.sources.map(source => source.n));
const errors = [];
if (data.trophies.length !== 55 || roster.length !== 55) errors.push(`Trophy count: app ${data.trophies.length}, research ${roster.length}`);
if (data.sources.length !== 18 || !data.sources.every(source => ids.has(source.n))) errors.push('Expected all 18 numbered sources');
for (const [i, match] of roster.entries()) {
  const [, number, name, grade, hidden, description] = match;
  const t = data.trophies[i];
  if (t.id !== +number || t.name !== name || t.grade !== grade.toLowerCase() || t.hidden !== (hidden === 'Hidden') || t.description !== description) errors.push(`Official fields mismatch at trophy ${number}`);
  if (!t.name || !t.description || !t.grade) errors.push(`Missing required field at trophy ${number}`);
  if (t.steps.length < 2) errors.push(`Fewer than two guide steps at trophy ${number}`);
  for (const [j, step] of t.steps.entries()) {
    if (!step.text || !step.cites?.length) errors.push(`Uncited or empty step ${number}.${j + 1}`);
    for (const cite of step.cites) if (!ids.has(cite)) errors.push(`Unknown source ${cite} at trophy ${number}`);
  }
}
const tally = Object.fromEntries(['platinum', 'gold', 'silver', 'bronze'].map(grade => [grade, data.trophies.filter(t => t.grade === grade).length]));
const expectedTally = { platinum: 1, gold: 2, silver: 6, bronze: 46 };
if (JSON.stringify(tally) !== JSON.stringify(expectedTally)) errors.push(`Grade split mismatch: ${JSON.stringify(tally)}`);
const sites = new Set([...sourceText.matchAll(/^### \[\d+\] .+? — ".+"\n- \*\*URL:\*\* https?:\/\/([^/]+)/gm)].map(m => m[1]));
if (sites.size !== 18) errors.push(`Research lists ${sites.size} distinct source hosts`);
const summary = { trophies: data.trophies.length, officialFieldsMatched: roster.length - errors.filter(e => e.startsWith('Official fields')).length, grades: tally, hidden: data.trophies.filter(t => t.hidden).length, sources: data.sources.length, sourceHosts: sites.size, citedSteps: data.trophies.reduce((n, t) => n + t.steps.length, 0), everyStepHasValidCitation: errors.every(e => !e.startsWith('Unknown source') && !e.startsWith('Uncited or empty step')), errors };
console.log(JSON.stringify(summary, null, 2));
if (errors.length) process.exit(1);
