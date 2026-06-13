import { readFileSync } from 'fs';

// Read .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const lines = envContent.split('\n');
let dbUrl = '';
for (const line of lines) {
    if (line.startsWith('DATABASE_URL=')) {
        dbUrl = line.replace('DATABASE_URL=', '').trim().replace(/^["']|["']$/g, '');
    }
}

if (!dbUrl) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
}

// Use built-in fetch approach via pg
import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: dbUrl });

await client.connect();
try {
    await client.query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS blocked_from TIMESTAMP`);
    await client.query(`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMP`);
    console.log('Migration successful: added blocked_from and blocked_until columns to announcements');
} catch (err) {
    console.error('Migration error:', err.message);
} finally {
    await client.end();
}
