// Inline migration using postgres package directly
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
}

const sql = postgres(dbUrl, { ssl: 'require' });

async function migrate() {
    try {
        await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS blocked_from TIMESTAMP`;
        console.log('✓ Added blocked_from column');
        await sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMP`;
        console.log('✓ Added blocked_until column');
        console.log('Migration complete!');
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

migrate();
