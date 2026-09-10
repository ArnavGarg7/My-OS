// @ts-check
/**
 * Secret scan (Stage C / hardening). Greps every git-tracked text file for real credential patterns
 * so a live key can never be committed. Runs in CI without any dependencies. Uses specific provider
 * prefixes + private-key blocks (low false-positive); `.env` is gitignored so it isn't scanned, and
 * `.env.example` carries only empty placeholders. Exit 1 on any finding.
 *
 *   node scripts/secret-scan.mjs
 */
import { execSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";

const root = process.cwd();

/** Provider-specific secret signatures — deliberately narrow to avoid false positives. */
const PATTERNS = [
  { name: "OpenAI key", re: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { name: "Anthropic key", re: /\bsk-ant-[A-Za-z0-9-]{20,}\b/ },
  { name: "Google API key", re: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "GitHub token", re: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/ },
  { name: "Slack token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "AWS access key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Private key block", re: /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/ },
  { name: "Google OAuth client secret", re: /\bGOCSPX-[A-Za-z0-9_-]{20,}\b/ },
];

// Files that legitimately contain example/pattern text (this scanner + docs describing patterns).
const ALLOWLIST = [/scripts\/secret-scan\.mjs$/];

const files = execSync("git ls-files", { cwd: root, encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .filter((f) => !ALLOWLIST.some((re) => re.test(f)));

/** @type {{file:string; line:number; kind:string}[]} */
const findings = [];
for (const file of files) {
  if (/\.(png|jpg|jpeg|gif|webp|ico|pdf|woff2?|ttf|lock)$/i.test(file)) continue;
  let text;
  try {
    if (statSync(file).size > 2_000_000) continue;
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    for (const { name, re } of PATTERNS) {
      if (re.test(line)) findings.push({ file, line: i + 1, kind: name });
    }
  });
}

console.log("Secret scan\n===========");
console.log(`Scanned ${files.length} tracked files.`);
if (findings.length === 0) {
  console.log("No committed secrets found. ✓");
  process.exit(0);
}
for (const f of findings) console.log(`  LEAK: ${f.kind} in ${f.file}:${f.line}`);
console.log(`\n${findings.length} potential secret(s) committed — remove and rotate them.`);
process.exit(1);
