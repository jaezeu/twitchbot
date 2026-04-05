const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { createJsonFileStore } = require('../storage');

test('createJsonFileStore persists state to disk', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'twitchbot-store-'));
    const filePath = path.join(tempDir, 'bot-state.json');
    const initialState = {
        quotes: [],
        counters: {},
        shoutoutTemplate: 'Go check out https://twitch.tv/{channel} and give them a follow.'
    };

    const store = createJsonFileStore(filePath, initialState);
    const startState = await store.getState();

    assert.deepEqual(startState, initialState);

    const nextState = {
        quotes: ['First quote'],
        counters: { deaths: 3 },
        shoutoutTemplate: 'Follow {channel}'
    };

    await store.saveState(nextState);
    const persistedState = await store.getState();

    assert.deepEqual(persistedState, nextState);
});