// @ts-nocheck
require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

const dbUrl = process.env.DATABASE_URL;
const sql = postgres(dbUrl, { ssl: 'require' });

async function run() {
    try {
        const res = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'rooms' AND column_name IN ('open_hour', 'close_hour')`;
        console.log('Operational columns found:');
        res.forEach(r => console.log(r.column_name));
        if (res.length < 2) {
            console.log('MISSING COLUMNS DETECTED');
        } else {
            console.log('COLUMNS EXIST');
        }
    } catch (err) {
        console.error(err.message);
    } finally {
        await sql.end();
    }
}
run();
