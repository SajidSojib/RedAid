import app from "./app";
import { prisma } from "./lib/prisma";

const PORT = process.env.PORT || 8000;

async function main() {
    try {
        await prisma.$connect();
        console.log("Connected to the database successfully.");

        app.listen(PORT, () => {
            console.log("Server is running on port ", PORT);
        });
    } catch (error) {
        console.error("Error during server startup:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();