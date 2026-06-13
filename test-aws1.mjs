import postgres from "postgres";

const connectionString = "postgresql://postgres.kguskfklfrfoomsnxwkt:Indramayu999@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require";

const client = postgres(connectionString, { prepare: false });

client`select 1 as ok`
    .then((res) => {
        console.log("Success on aws-1!", res);
        process.exit(0);
    })
    .catch((e) => {
        console.error("Full connection error on aws-1:");
        console.error(e);
        process.exit(1);
    });
