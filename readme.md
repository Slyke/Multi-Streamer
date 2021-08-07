# Broadcaster

Small docker compose that will split video streams from OBS and allow streaming to Youtube and Twitch. Eventually it will be able to prepopulated Youtube and Twitch with your stream details (on a per game basis for example) and combine Youtube and Twitch chats into a single output.

## Setup:
1. Install docker-compose
2. Edit the `.env` file and place your details.
  - You can get your Youtube Stream Key on the Stream Settings page when live streaming (it's the hidden value).
  - You can get your Twitch Stream Key from your channel's 'Stream Key & Preferences' settings.
3. Run `docker-compose up` or `docker-compose up -d` for detatched mode
4. Set OBS to use Custom Stream and set the server to `rtmp://localhost:1935/live` and the stream key to `stream`.
5. Start streaming

## Stop
If you started in detatched mode, run `docker-compose down` to kill the process. Otherwise just press CTRL+C a few times, or close the console window.
