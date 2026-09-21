import { startServer } from "./src/app.js";

startServer().catch(e=>{
    console.error("fail to start server", e);
    process.exit(1);
});