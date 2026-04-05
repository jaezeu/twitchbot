const REQUIRED_ENV_VARS = [
    'TWITCH_TARGET_CHANNEL',
    'TWITCH_BOT_USERNAME',
    'TWITCH_OAUTH_TOKEN'
];

function loadConfig(env = process.env) {
    const missingEnvVars = REQUIRED_ENV_VARS.filter((name) => !env[name]);

    if (missingEnvVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }

    if (!env.TWITCH_OAUTH_TOKEN.startsWith('oauth:')) {
        throw new Error('TWITCH_OAUTH_TOKEN must start with "oauth:"');
    }

    return {
        targetChannel: env.TWITCH_TARGET_CHANNEL,
        botUsername: env.TWITCH_BOT_USERNAME.toLowerCase(),
        oauthToken: env.TWITCH_OAUTH_TOKEN
    };
}

module.exports = {
    loadConfig
};