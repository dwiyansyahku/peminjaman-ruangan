import postgres from 'postgres';

// Test both connection strings
const connections = [
    {
        name: 'Pooler ap-southeast-2',
        url: 'postgresql://postgres.kguskfklfrfoomsnxwkt:indramayu123@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require'
    },
    {
        name: 'Direct connection',
        url: 'postgresql://postgres:indramayu123@db.kguskfklfrfoomsnxwkt.supabase.co:5432/postgres'
    },
    {
        name: 'Pooler ap-southeast-1 (original)',
        url: 'postgresql://postgres.kguskfklfrfoomsnxwkt:indramayu123@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?sslmode=require'
    }
];

for (const conn of connections) {
    console.log(`\nTesting: ${conn.name}...`);
    try {
        const sql = postgres(conn.url, { prepare: false, connect_timeout: 10 });
        const result = await sql`SELECT 1 as test`;
        console.log(`  ✅ SUCCESS`);
        await sql.end();
    } catch (e) {
        console.log(`  ❌ FAILED: ${e.message} (code: ${e.code})`);
    }
}

process.exit(0);
