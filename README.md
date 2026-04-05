# Twitch Bot

This repository contains a Twitch chat bot built with tmi.js.

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

## Running Locally

```bash
npm install
npm start
```

## Validation

```bash
npm test
```

This runs syntax checks and the Node test suite.
