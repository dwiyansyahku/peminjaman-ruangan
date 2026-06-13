// @ts-nocheck
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('DATABASE_URL not found');
    process.exit(1);
}

const sql = postgres(dbUrl, { ssl: 'require' });

async function checkRoomsTable() {
    try {
        const res = await sql`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'rooms'`;
        console.log('Columns in rooms table:');
        res.forEach(c => {
            console.log(`- ${c.column_name} (${c.data_type}) - Nullable: ${c.is_nullable}`);
        });
    } catch (err) {
        console.error('Error checking rooms table:', err.message);
    } finally {
        await sql.end();
    }
}

checkRoomsTable();
