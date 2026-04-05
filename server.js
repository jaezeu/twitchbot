require('dotenv').config();

const tmi = require('tmi.js');
const path = require('node:path');
const { loadConfig } = require('./config');
const { createMessageHandler, DEFAULT_STATE } = require('./commands');
const { createJsonFileStore } = require('./storage');

const config = loadConfig();
const store = createJsonFileStore(path.join(__dirname, 'data', 'bot-state.json'), DEFAULT_STATE);

const client = new tmi.Client({
    connection: {
        reconnect: true
    },
    channels: [config.targetChannel],
    identity: {
		username: config.botUsername,
		password: config.oauthToken
	}
});

client.on('connected', (address, port) => {
    console.log(`Connected to ${address}:${port}`);
});

client.on('disconnected', (reason) => {
    console.error(`Disconnected: ${reason}`);
});

client.on('reconnect', () => {
    console.warn('Reconnecting to Twitch chat...');
});

client.on('notice', (channel, msgid, message) => {
    console.warn(`Notice in ${channel} (${msgid}): ${message}`);
});

client.on('connected', () => {
    console.log(`Logged in as ${config.botUsername}`);
});

client.on('message', createMessageHandler(client, config.botUsername, { store }));

client.connect().catch((error) => {
    console.error('Failed to connect to Twitch chat:', error);
    process.exit(1);
});