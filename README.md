# Twitch Bot

This repository contains a Twitch chat bot built with tmi.js.

## Prerequisites

- Node.js 20+
- npm 10+
- A Twitch account for the bot
- A Twitch OAuth token for chat access

## Features

- Command-based replies instead of responding to every message
- Startup validation for required environment variables
- Connection and notice logging for easier debugging
- Per-user cooldowns to reduce spam
- Role-restricted moderator command support
- Built-in test coverage for config loading and command handling
- Persistent JSON-backed bot data for quotes, counters, and shoutout template

## Required Environment Variables

Create a `.env` file with the following values:

```env
TWITCH_TARGET_CHANNEL=your_channel_name
TWITCH_BOT_USERNAME=your_bot_username
TWITCH_OAUTH_TOKEN=oauth:your_token_here
```

`TWITCH_OAUTH_TOKEN` must include the `oauth:` prefix.

## Setup

1. Install dependencies.
2. Create `.env` with your bot credentials.
3. Start the bot.

```bash
npm install
npm start
```

## Commands

- `!commands`
- `!hello`
- `!ping`
- `!quote [number]`
- `!addquote <text>` for moderators or the broadcaster
- `!counter <name>`
- `!setcounter <name> <number>` for moderators or the broadcaster
- `!lurk`
- `!unlurk`
- `!uptime`
- `!permit <user>` for moderators or the broadcaster
- `!shoutout <channel>` for moderators or the broadcaster
- `!setso <message with {channel}>` for moderators or the broadcaster

Bot state is stored in `data/bot-state.json` and survives restarts.

## Data And Security Notes

- Do not commit your `.env` file.

## Validation

```bash
npm test
```

This runs syntax checks and the Node test suite.
