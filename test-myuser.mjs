import postgres from "postgres";

const connectionString = "postgresql://mytestuser.kguskfklfrfoomsnxwkt:TestUser123!@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?sslmode=require";

const client = postgres(connectionString, { prepare: false });

client`select 1 as ok`
    .then((res) => {
        console.log("Success with mytestuser", res);
        process.exit(0);
    })
    .catch((e) => {
        console.log("Error Code with mytestuser:", e.code);
        console.log("Error Message with mytestuser:", e.message);
        process.exit(1);
    });
