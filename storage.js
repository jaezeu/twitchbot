const fs = require('node:fs/promises');
const path = require('node:path');

async function ensureFile(filePath, initialState) {
    try {
        await fs.access(filePath);
    } catch {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, `${JSON.stringify(initialState, null, 2)}\n`, 'utf8');
    }
}

async function readJsonFile(filePath, initialState) {
    await ensureFile(filePath, initialState);
    const fileContent = await fs.readFile(filePath, 'utf8');

    if (!fileContent.trim()) {
        return JSON.parse(JSON.stringify(initialState));
    }

    return JSON.parse(fileContent);
}

function createJsonFileStore(filePath, initialState) {
    return {
        async getState() {
            return readJsonFile(filePath, initialState);
        },
        async saveState(nextState) {
            await fs.mkdir(path.dirname(filePath), { recursive: true });
            await fs.writeFile(filePath, `${JSON.stringify(nextState, null, 2)}\n`, 'utf8');
        }
    };
}

module.exports = {
    createJsonFileStore
};