
import { updateSystemSetting } from "./src/actions/settings";

async function test() {
    try {
        console.log("Testing semester update...");
        const res1 = await updateSystemSetting("semester", "Genap");
        console.log("Res1:", res1);
        
        console.log("Testing academic_year update...");
        const res2 = await updateSystemSetting("academic_year", "2025/2026");
        console.log("Res2:", res2);
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
