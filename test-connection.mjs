import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

sql`SELECT current_timestamp`.then((res) => {
    console.log("Connection successful:", res[0]);
    process.exit(0);
}).catch((err) => {
    console.error("Connection failed:");
    console.error(err);
    process.exit(1);
});
