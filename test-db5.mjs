import postgres from 'postgres';
import fs from 'fs';

const url = 'postgresql://postgres.kguskfklfrfoomsnxwkt:Indramayu999@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require';

async function run() {
    let result = '';
    try {
        const sql = postgres(url, { prepare: false, connect_timeout: 10 });
        await sql`SELECT 1 as test`;
        result = 'OK';
        await sql.end();
    } catch (e) {
        result = 'FAIL: ' + e.message;
    }
    fs.writeFileSync('db-results2.txt', result);
}
run();
