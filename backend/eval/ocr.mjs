import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

export async function checkOcrAvailable() {
  try {
    const { stdout } = await run('tesseract', ['--list-langs']);
    const languages = stdout.split(/\s+/);
    const missing = ['eng', 'fil'].filter((language) => !languages.includes(language));
    if (missing.length) throw new Error(`Tesseract language data missing: ${missing.join(', ')}`);
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error('Tesseract OCR is not installed or not on PATH');
    throw error;
  }
}

export async function readScreenshot(path) {
  const { stdout } = await run('tesseract', [path, 'stdout', '--psm', '6', '-l', 'eng+fil'], { maxBuffer: 1024 * 1024 });
  const text = stdout.replace(/^\s*Synthetic order chat\s*/i, '').trim();
  if (!text) throw new Error('OCR returned no chat text');
  return text;
}

export async function readScreenshotBytes(bytes) {
  return new Promise((resolve, reject) => {
    const child = spawn('tesseract', ['stdin', 'stdout', '--psm', '6', '-l', 'eng+fil']);
    const child = spawn('tesseract', ['stdin', 'stdout', '--psm', '6', '-l', 'eng+tgl']);
    let output = '';
    let errors = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => { output += chunk; if (output.length > 1024 * 1024) child.kill(); });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => { errors += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve(output.trim()) : reject(new Error(`OCR exited ${code}: ${errors.slice(0, 100)}`)));
    child.stdin.end(bytes);
  });
}

const normalize = (text) => text.normalize('NFKC').toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');

export function characterAccuracy(expected, actual) {
  const left = normalize(expected);
  const right = normalize(actual);
  if (!left) return right ? 0 : 100;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    const current = [i];
    for (let j = 1; j <= right.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return 100 * Math.max(0, 1 - previous[right.length] / left.length);
}
