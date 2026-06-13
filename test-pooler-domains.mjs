import postgres from "postgres";

const regions = [
    "ap-southeast-2.pooler.supabase.com",
    "aws-ap-southeast-2.pooler.supabase.com",
    "supavisor.ap-southeast-2.supabase.com",
    "aws-0-ap-southeast-2.pooler.supabase.com"
];

async function check() {
    for (const host of regions) {
        const connectionString = `postgresql://postgres.kguskfklfrfoomsnxwkt:Indramayu999@${host}:6543/postgres?sslmode=require`;

        try {
            console.log(`Trying ${host}...`);
            const client = postgres(connectionString, { prepare: false, connect_timeout: 4 });
            await client`select 1`;
            console.log(`SUCCESS on ${host}!`);
            process.exit(0);
        } catch (e) {
            console.log(`Failed on ${host}: ${e.message}`);
        }
    }
}
check();
