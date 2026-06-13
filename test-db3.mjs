import postgres from 'postgres';

const connections = [
    {
        name: 'Pooler tx ap-1',
        url: 'postgresql://postgres.kguskfklfrfoomsnxwkt:indramayu123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require'
    },
    {
        name: 'Direct connection',
        url: 'postgresql://postgres:indramayu123@db.kguskfklfrfoomsnxwkt.supabase.co:5432/postgres'
    }
];

async function run() {
    for (const conn of connections) {
        console.log(`\nTesting: ${conn.name}...`);
        try {
            const sql = postgres(conn.url, { prepare: false, connect_timeout: 10 });
            await sql`SELECT 1 as test`;
            console.log(`  OK`);
            await sql.end();
        } catch (e) {
            console.log(`  FAIL: ${e.message}`);
        }
    }
}
run();
