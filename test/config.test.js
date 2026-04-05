const test = require('node:test');
const assert = require('node:assert/strict');

const { loadConfig } = require('../config');

test('loadConfig returns normalized config values', () => {
    const config = loadConfig({
        TWITCH_TARGET_CHANNEL: 'jaz',
        TWITCH_BOT_USERNAME: 'JazBot',
        TWITCH_OAUTH_TOKEN: 'oauth:token123'
    });

    assert.deepEqual(config, {
        targetChannel: 'jaz',
        botUsername: 'jazbot',
        oauthToken: 'oauth:token123'
    });
});

test('loadConfig throws when environment variables are missing', () => {
    assert.throws(
        () => loadConfig({ TWITCH_TARGET_CHANNEL: 'jaz' }),
        /Missing required environment variables/
    );
});

test('loadConfig throws when oauth token is invalid', () => {
    assert.throws(
        () => loadConfig({
            TWITCH_TARGET_CHANNEL: 'jaz',
            TWITCH_BOT_USERNAME: 'JazBot',
            TWITCH_OAUTH_TOKEN: 'token123'
        }),
        /TWITCH_OAUTH_TOKEN must start with "oauth:"/
    );
});