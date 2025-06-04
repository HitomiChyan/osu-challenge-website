# osu Challenge Website

This project consists of a frontend interface and a Node.js backend located in `osu-backend`.

## Local setup

1. Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and fill in the required values:
   - `SESSION_SECRET` – any random string
   - `MONGODB_USER` – your MongoDB user name
   - `MONGODB_PASSWORD` – your MongoDB password
   - `MONGODB_DBNAME` – the database name to use

The backend reads these variables at startup to configure sessions and the MongoDB connection.

