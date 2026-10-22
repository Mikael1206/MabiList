import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { fixtures } from './fixtures.mjs';

const directory = join(dirname(fileURLToPath(import.meta.url)), 'generated');
const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function wrap(message, limit = 57) {
  const words = message.split(/\s+/);
  const lines = [''];
  for (const word of words) {
    const last = lines.length - 1;
    if (`${lines[last]} ${word}`.trim().length > limit) lines.push(word);
    else lines[last] = `${lines[last]} ${word}`.trim();
  }
  return lines;
}

function screenshot(fixture) {
  let y = 80;
  const bubbles = fixture.messages.map((message) => {
    const buyer = message.startsWith('Buyer:');
    const lines = wrap(message.replace(/^(Buyer|Seller): /, ''));
    const height = 39 + lines.length * 28;
    const x = buyer ? 125 : 35;
    const color = buyer ? '#d9f4df' : '#ffffff';
    const output = `<rect x="${x}" y="${y}" width="690" height="${height}" rx="18" fill="${color}"/>
      <text x="${x + 22}" y="${y + 29}" font-size="18" font-weight="bold" fill="#315b45">${buyer ? 'BUYER' : 'SELLER'}</text>
      ${lines.map((line, index) => `<text x="${x + 22}" y="${y + 58 + index * 28}" font-size="22" fill="#182420">${escape(line)}</text>`).join('')}`;
    y += height + 16;
    return output;
  });
  const height = y + 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="${height}" viewBox="0 0 850 ${height}">
    <rect width="850" height="${height}" fill="#e8edea"/>
    <rect width="850" height="59" fill="#185c47"/>
    <text x="28" y="39" font-size="25" font-family="DejaVu Sans" fill="white">Synthetic order chat</text>
    <g font-family="DejaVu Sans">${bubbles.join('')}</g>
  </svg>`;
}

await mkdir(directory, { recursive: true });
for (const fixture of fixtures) {
  const svg = screenshot(fixture);
  const svgPath = join(directory, `${fixture.id}.svg`);
  await writeFile(svgPath, svg);
}
await writeFile(join(directory, 'manifest.json'), JSON.stringify({ count: fixtures.length, ids: fixtures.map((f) => f.id) }, null, 2));
console.log(`Wrote ${fixtures.length} synthetic SVG chat fixtures in ${directory}`);
