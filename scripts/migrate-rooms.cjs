// @ts-nocheck
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const dbUrl = process.env.DATABASE_URL;
const sql = postgres(dbUrl, { ssl: 'require' });

async function migrate() {
    try {
        console.log('Starting migration for rooms table...');

        // Add open_hour if not exists
        await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS open_hour TEXT NOT NULL DEFAULT '07:00'`;
        console.log('✓ open_hour added');

        // Add close_hour if not exists
        await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS close_hour TEXT NOT NULL DEFAULT '18:00'`;
        console.log('✓ close_hour added');

        // Add facilities if not exists
        await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS facilities TEXT`;
        console.log('✓ facilities added');

        // Add description if not exists
        await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS description TEXT`;
        console.log('✓ description added');

        // Add image_url if not exists
        await sql`ALTER TABLE rooms ADD COLUMN IF NOT EXISTS image_url TEXT`;
        console.log('✓ image_url added');

        console.log('Migration complete!');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await sql.end();
    }
}
migrate();
