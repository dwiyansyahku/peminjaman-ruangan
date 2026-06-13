import postgres from 'postgres';
import fs from 'fs';

const connections = [
    {
        name: 'Pooler tx ap-1',
        url: 'postgresql://postgres.kguskfklfrfoomsnxwkt:indramayu123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require'
    },
    {
        name: 'Pooler tx ap-2',
        url: 'postgresql://postgres.kguskfklfrfoomsnxwkt:indramayu123@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require'
    },
    {
        name: 'Pooler tx pooler.supabase.com',
        url: 'postgresql://postgres.kguskfklfrfoomsnxwkt:indramayu123@pooler.supabase.com:6543/postgres?sslmode=require'
    }
];

async function run() {
    let results = [];
    for (const conn of connections) {
        try {
            const sql = postgres(conn.url, { prepare: false, connect_timeout: 10 });
            await sql`SELECT 1 as test`;
            results.push({ name: conn.name, status: 'OK' });
            await sql.end();
        } catch (e) {
            results.push({ name: conn.name, status: 'FAIL', error: e.message });
        }
    }
    fs.writeFileSync('db-results.json', JSON.stringify(results, null, 2));
}
run();
