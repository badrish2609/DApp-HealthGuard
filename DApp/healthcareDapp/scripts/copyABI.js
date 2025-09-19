const fs = require("fs");
const path = require("path");

const source = path.join(__dirname, "../build/contracts/Healthcare.json");
const destination = path.join(__dirname, "../client/src/abi/Healthcare.json");

// Create the destination folder if it doesn't exist
const dir = path.dirname(destination);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Copy the file
fs.copyFileSync(source, destination);
console.log("✅ ABI copied to client/src/abi/Healthcare.json");
