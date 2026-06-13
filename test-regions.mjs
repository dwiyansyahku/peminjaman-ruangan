import postgres from "postgres";

const regions = [
    "aws-0-ap-southeast-1",
    "aws-0-ap-southeast-2",
    "aws-0-ap-southeast-3",
    "aws-0-us-east-1",
    "aws-0-us-west-1",
    "aws-0-eu-central-1"
];

async function check() {
    for (const region of regions) {
        const connectionString = `postgresql://postgres.kguskfklfrfoomsnxwkt:Indramayu999@${region}.pooler.supabase.com:6543/postgres?sslmode=require`;

        try {
            const client = postgres(connectionString, { prepare: false, connect_timeout: 3 });
            await client`select 1`;
            console.log(`Success on ${region}!`);
            process.exit(0);
        } catch (e) {
            console.log(`Failed on ${region}: ${e.message}`);
        }
    }
}
check();
