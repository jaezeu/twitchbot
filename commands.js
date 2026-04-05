function formatDuration(durationMs) {
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
        .map((value) => String(value).padStart(2, '0'))
        .join(':');
}

function isPrivilegedUser(tags) {
    return Boolean(tags.mod || tags.badges?.broadcaster === '1');
}

const DEFAULT_STATE = {
    quotes: [],
    counters: {},
    shoutoutTemplate: 'Go check out https://twitch.tv/{channel} and give them a follow.'
};

function createInMemoryStore(initialState) {
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

async function readState(store, fallbackState) {
    try {
        return await store.getState();
    } catch {
        return JSON.parse(JSON.stringify(fallbackState));
    }
}

function createCommands(client, { startedAt, now, store }) {
    const commands = {
        commands: {
            cooldownMs: 3000,
            handler: async (channel) => {
                const commandList = Object.keys(commands)
                    .map((commandName) => `!${commandName}`)
                    .join(', ');

                await client.say(channel, `Available commands: ${commandList}`);
            }
        },
        hello: {
            cooldownMs: 5000,
            handler: async (channel, tags) => {
                const displayName = tags['display-name'] || tags.username;
                await client.say(channel, `Hello, ${displayName}.`);
            }
        },
        ping: {
            cooldownMs: 3000,
            handler: async (channel) => {
                await client.say(channel, 'Pong.');
            }
        },
        quote: {
            cooldownMs: 3000,
            handler: async (channel, tags, args) => {
                const state = await readState(store, DEFAULT_STATE);
                const quotes = state.quotes || [];

                if (quotes.length === 0) {
                    await client.say(channel, `@${tags.username} no quotes yet. Mods can add with !addquote <text>.`);
                    return;
                }

                const requestedIndex = Number.parseInt(args[0], 10);
                const quoteIndex = Number.isInteger(requestedIndex)
                    ? requestedIndex - 1
                    : Math.floor(Math.random() * quotes.length);
                const quoteText = quotes[quoteIndex];

                if (!quoteText) {
                    await client.say(channel, `@${tags.username} quote #${requestedIndex} does not exist.`);
                    return;
                }

                await client.say(channel, `Quote #${quoteIndex + 1}: ${quoteText}`);
            }
        },
        addquote: {
            cooldownMs: 3000,
            modOnly: true,
            handler: async (channel, tags, args) => {
                const quoteText = args.join(' ').trim();

                if (!quoteText) {
                    await client.say(channel, `@${tags.username} usage: !addquote <text>`);
                    return;
                }

                const state = await readState(store, DEFAULT_STATE);
                const nextState = {
                    ...state,
                    quotes: [...(state.quotes || []), quoteText]
                };

                await store.saveState(nextState);
                await client.say(channel, `Quote #${nextState.quotes.length} added.`);
            }
        },
        counter: {
            cooldownMs: 2000,
            handler: async (channel, tags, args) => {
                const counterName = args[0]?.toLowerCase();

                if (!counterName) {
                    await client.say(channel, `@${tags.username} usage: !counter <name>`);
                    return;
                }

                const state = await readState(store, DEFAULT_STATE);
                const currentValue = state.counters?.[counterName] || 0;
                const nextValue = currentValue + 1;
                const nextState = {
                    ...state,
                    counters: {
                        ...(state.counters || {}),
                        [counterName]: nextValue
                    }
                };

                await store.saveState(nextState);
                await client.say(channel, `${counterName}: ${nextValue}`);
            }
        },
        setcounter: {
            cooldownMs: 3000,
            modOnly: true,
            handler: async (channel, tags, args) => {
                const counterName = args[0]?.toLowerCase();
                const counterValue = Number.parseInt(args[1], 10);

                if (!counterName || !Number.isInteger(counterValue) || counterValue < 0) {
                    await client.say(channel, `@${tags.username} usage: !setcounter <name> <non-negative number>`);
                    return;
                }

                const state = await readState(store, DEFAULT_STATE);
                const nextState = {
                    ...state,
                    counters: {
                        ...(state.counters || {}),
                        [counterName]: counterValue
                    }
                };

                await store.saveState(nextState);
                await client.say(channel, `${counterName} set to ${counterValue}.`);
            }
        },
        lurk: {
            cooldownMs: 10000,
            handler: async (channel, tags) => {
                const displayName = tags['display-name'] || tags.username;
                await client.say(channel, `Thanks for lurking, ${displayName}. Enjoy the stream.`);
            }
        },
        unlurk: {
            cooldownMs: 10000,
            handler: async (channel, tags) => {
                const displayName = tags['display-name'] || tags.username;
                await client.say(channel, `Welcome back, ${displayName}.`);
            }
        },
        uptime: {
            cooldownMs: 5000,
            handler: async (channel) => {
                await client.say(channel, `Bot uptime: ${formatDuration(now() - startedAt)}.`);
            }
        },
        permit: {
            cooldownMs: 8000,
            modOnly: true,
            handler: async (channel, tags, args) => {
                const target = args[0]?.replace(/^@/, '');

                if (!target) {
                    await client.say(channel, `@${tags.username} usage: !permit <user>`);
                    return;
                }

                await client.say(channel, `@${target} you are permitted to post one link for the next 60 seconds.`);
            }
        },
        shoutout: {
            cooldownMs: 10000,
            modOnly: true,
            handler: async (channel, tags, args) => {
                const target = args[0]?.replace(/^@/, '');

                if (!target) {
                    await client.say(channel, `@${tags.username} usage: !shoutout <channel>`);
                    return;
                }

                const state = await readState(store, DEFAULT_STATE);
                const template = state.shoutoutTemplate || DEFAULT_STATE.shoutoutTemplate;
                const message = template.replaceAll('{channel}', target);

                await client.say(channel, message);
            }
        },
        setso: {
            cooldownMs: 3000,
            modOnly: true,
            handler: async (channel, tags, args) => {
                const template = args.join(' ').trim();

                if (!template || !template.includes('{channel}')) {
                    await client.say(channel, `@${tags.username} usage: !setso <message with {channel}>`);
                    return;
                }

                const state = await readState(store, DEFAULT_STATE);
                const nextState = {
                    ...state,
                    shoutoutTemplate: template
                };

                await store.saveState(nextState);
                await client.say(channel, 'Shoutout template updated.');
            }
        }
    };

    return commands;
}

function createMessageHandler(client, botUsername, options = {}) {
    const now = options.now || Date.now;
    const startedAt = options.startedAt || now();
    const log = options.log || console.log;
    const logError = options.logError || console.error;
    const store = options.store || createInMemoryStore(DEFAULT_STATE);
    const commandCooldowns = new Map();
    const commands = createCommands(client, { startedAt, now, store });

    function isOnCooldown(commandName, username, cooldownMs) {
        const cooldownKey = `${commandName}:${username}`;
        const currentTime = now();
        const nextAvailableAt = commandCooldowns.get(cooldownKey) ?? 0;

        if (nextAvailableAt > currentTime) {
            return true;
        }

        commandCooldowns.set(cooldownKey, currentTime + cooldownMs);
        return false;
    }

    return async (channel, tags, message, self) => {
        const username = tags.username?.toLowerCase() || '';
        const normalizedMessage = message.trim();

        if (self || username === botUsername) {
            return;
        }

        log(`${tags['display-name'] || tags.username}: ${message}`);

        if (!normalizedMessage.startsWith('!')) {
            return;
        }

        const [commandToken, ...args] = normalizedMessage.slice(1).split(/\s+/);
        const commandName = commandToken.toLowerCase();
        const command = commands[commandName];

        if (!command) {
            return;
        }

        if (command.modOnly && !isPrivilegedUser(tags)) {
            await client.say(channel, `@${tags.username} you do not have permission to use !${commandName}.`);
            return;
        }

        if (isOnCooldown(commandName, username, command.cooldownMs)) {
            return;
        }

        try {
            await command.handler(channel, tags, args);
        } catch (error) {
            logError(`Command !${commandName} failed:`, error);
        }
    };
}

module.exports = {
    createCommands,
    createInMemoryStore,
    createMessageHandler,
    DEFAULT_STATE,
    formatDuration,
    isPrivilegedUser
};