const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const destDb = process.env.REGISTRY_DB_PATH || '/data/registry.db';
const srcDb = path.join(__dirname, 'data', 'registry.db');

console.log("Checking database at:", destDb);
if (!fs.existsSync(destDb)) {
    console.log("Database not found on persistent volume. Copying seed database from:", srcDb);
    try {
        const destDir = path.dirname(destDb);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(srcDb, destDb);
        console.log("Database successfully seeded to persistent volume.");
    } catch (err) {
        console.error("Failed to seed database:", err);
    }
} else {
    console.log("Database already exists on persistent volume. Skipping seed.");
}

console.log("Starting Next.js server...");
execSync('npx next start', { stdio: 'inherit' });
