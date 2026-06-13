require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');

async function main() {
    const sqlContent = fs.readFileSync('./drizzle/0001_orange_starjammers.sql', 'utf8');
    const queries = sqlContent.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);

    const sql = postgres(process.env.DATABASE_URL, { prepare: false });

    try {
        console.log('Running migration...');
        for (const query of queries) {
            console.log('Executing:', query);
            await sql.unsafe(query);
        }
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sql.end();
    }
}

main();
