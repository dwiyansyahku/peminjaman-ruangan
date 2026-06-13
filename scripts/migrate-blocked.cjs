// @ts-nocheck
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

let dbUrl = '';
for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('DATABASE_URL=')) {
        dbUrl = trimmed.substring('DATABASE_URL='.length).replace(/^["']|["']$/g, '');
    }
}

if (!dbUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
}

// Write a small SQL runner using postgres package
const script = `
const postgres = require('postgres');
const sql = postgres(process.argv[2]);
sql\`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS blocked_from TIMESTAMP\`
  .then(() => sql\`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMP\`)
  .then(() => { console.log('Done!'); sql.end(); })
  .catch(e => { console.error(e.message); sql.end(); process.exit(1); });
`;

fs.writeFileSync('/tmp/run-migration.js', script);
try {
    const output = execSync(`node /tmp/run-migration.js "${dbUrl}"`, { encoding: 'utf-8' });
    console.log(output);
} catch (e) {
    console.error(e.message);
}
