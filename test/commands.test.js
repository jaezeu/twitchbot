const test = require('node:test');
const assert = require('node:assert/strict');

const { createMessageHandler, DEFAULT_STATE, formatDuration, isPrivilegedUser } = require('../commands');

function createClient() {
    const messages = [];

    return {
        messages,
        client: {
            say: async (channel, message) => {
                messages.push({ channel, message });
            }
        }
    };
}

function createTags(overrides = {}) {
    return {
        username: 'viewer',
        'display-name': 'Viewer',
        badges: {},
        mod: false,
        ...overrides
    };
}

function createStore(initialState = DEFAULT_STATE) {
    let state = JSON.parse(JSON.stringify(initialState));

    return {
        async getState() {
            return JSON.parse(JSON.stringify(state));
        },
        async saveState(nextState) {
            state = JSON.parse(JSON.stringify(nextState));
        }
    };
}

test('formatDuration returns hh:mm:ss', () => {
    assert.equal(formatDuration(3723000), '01:02:03');
});

test('isPrivilegedUser detects moderators and broadcasters', () => {
    assert.equal(isPrivilegedUser(createTags({ mod: true })), true);
    assert.equal(isPrivilegedUser(createTags({ badges: { broadcaster: '1' } })), true);
    assert.equal(isPrivilegedUser(createTags()), false);
});

test('hello command replies to a user', async () => {
    const { client, messages } = createClient();
    const store = createStore();
    const handler = createMessageHandler(client, 'jazbot', {
        store,
        log: () => {},
        logError: () => {}
    });

    await handler('#jaz', createTags(), '!hello', false);

    assert.deepEqual(messages, [
        { channel: '#jaz', message: 'Hello, Viewer.' }
    ]);
});

test('commands command lists available commands', async () => {
    const { client, messages } = createClient();
    const store = createStore();
    const handler = createMessageHandler(client, 'jazbot', {
        store,
        log: () => {},
        logError: () => {}
    });

    await handler('#jaz', createTags(), '!commands', false);

    assert.equal(
        messages[0].message,
        'Available commands: !commands, !hello, !ping, !quote, !addquote, !counter, !setcounter, !lurk, !unlurk, !uptime, !permit, !shoutout, !setso'
    );
});

test('permit command requires moderator privileges', async () => {
    const { client, messages } = createClient();
    const store = createStore();
    const handler = createMessageHandler(client, 'jazbot', {
        store,
        log: () => {},
        logError: () => {}
    });

    await handler('#jaz', createTags(), '!permit @guest', false);

    assert.deepEqual(messages, [
        { channel: '#jaz', message: '@viewer you do not have permission to use !permit.' }
    ]);
});

test('permit command responds for moderators', async () => {
    const { client, messages } = createClient();
    const store = createStore();
    const handler = createMessageHandler(client, 'jazbot', {
        store,
        log: () => {},
        logError: () => {}
    });

    await handler('#jaz', createTags({ username: 'moduser', mod: true }), '!permit @guest', false);

    assert.deepEqual(messages, [
        { channel: '#jaz', message: '@guest you are permitted to post one link for the next 60 seconds.' }
    ]);
});

test('cooldown prevents repeated command spam until time advances', async () => {
    const { client, messages } = createClient();
    const store = createStore();
    let currentTime = 1000;
    const handler = createMessageHandler(client, 'jazbot', {
        store,
        now: () => currentTime,
        log: () => {},
        logError: () => {}
    });

    await handler('#jaz', createTags(), '!ping', false);
    await handler('#jaz', createTags(), '!ping', false);
    currentTime += 3000;
    await handler('#jaz', createTags(), '!ping', false);

    assert.deepEqual(messages, [
        { channel: '#jaz', message: 'Pong.' },
        { channel: '#jaz', message: 'Pong.' }
    ]);
});

test('shoutout strips the @ prefix from the target', async () => {
    const { client, messages } = createClient();
    const store = createStore();
    const handler = createMessageHandler(client, 'jazbot', {
        store,
        log: () => {},
        logError: () => {}
    });

    await handler('#jaz', createTags({ username: 'moduser', mod: true }), '!shoutout @friend', false);

    assert.deepEqual(messages, [
        { channel: '#jaz', message: 'Go check out https://twitch.tv/friend and give them a follow.' }
    ]);
});

test('self messages are ignored', async () => {
    const { client, messages } = createClient();
    const store = createStore();
    const handler = createMessageHandler(client, 'jazbot', {
        store,
        log: () => {},
        logError: () => {}
    });

    await handler('#jaz', createTags({ username: 'jazbot' }), '!ping', true);

    assert.deepEqual(messages, []);
});

test('addquote stores a quote and quote retrieves by index', async () => {
    const { client, messages } = createClient();
    const store = createStore();
    const handler = createMessageHandler(client, 'jazbot', {
        store,
        log: () => {},
        logError: () => {}
    });

    await handler('#jaz', createTags({ username: 'moduser', mod: true }), '!addquote Stay hydrated', false);
    await handler('#jaz', createTags(), '!quote 1', false);

    assert.deepEqual(messages, [
        { channel: '#jaz', message: 'Quote #1 added.' },
        { channel: '#jaz', message: 'Quote #1: Stay hydrated' }
    ]);
});

test('quote reports when no quotes exist', async () => {
    const { client, messages } = createClient();
    const store = createStore();
    const handler = createMessageHandler(client, 'jazbot', {
        store,
        log: () => {},
        logError: () => {}
    });

    await handler('#jaz', createTags(), '!quote', false);

    assert.deepEqual(messages, [
        { channel: '#jaz', message: '@viewer no quotes yet. Mods can add with !addquote <text>.' }
    ]);
});

test('counter increments and setcounter can override the value', async () => {
    const { client, messages } = createClient();
    const store = createStore();
    let currentTime = 1000;
    const handler = createMessageHandler(client, 'jazbot', {
        store,
        now: () => currentTime,
        log: () => {},
        logError: () => {}
    });

    await handler('#jaz', createTags(), '!counter deaths', false);
    currentTime += 2000;
    await handler('#jaz', createTags(), '!counter deaths', false);
    currentTime += 3000;
    await handler('#jaz', createTags({ username: 'moduser', mod: true }), '!setcounter deaths 10', false);
    currentTime += 2000;
    await handler('#jaz', createTags(), '!counter deaths', false);

    assert.deepEqual(messages, [
        { channel: '#jaz', message: 'deaths: 1' },
        { channel: '#jaz', message: 'deaths: 2' },
        { channel: '#jaz', message: 'deaths set to 10.' },
        { channel: '#jaz', message: 'deaths: 11' }
    ]);
});

test('setso customizes shoutout template', async () => {
    const { client, messages } = createClient();
    const store = createStore();
    const handler = createMessageHandler(client, 'jazbot', {
        store,
        log: () => {},
        logError: () => {}
    });

    await handler(
        '#jaz',
        createTags({ username: 'moduser', mod: true }),
        '!setso Check out {channel} for great vibes.',
        false
    );
    await handler('#jaz', createTags({ username: 'moduser', mod: true }), '!shoutout @friend', false);

    assert.deepEqual(messages, [
        { channel: '#jaz', message: 'Shoutout template updated.' },
        { channel: '#jaz', message: 'Check out friend for great vibes.' }
    ]);
});