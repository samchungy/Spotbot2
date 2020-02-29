# Spotbot2

# Naming Conventions
- DAL will use the terms load and store.
- APIs will use the terms create, fetch and send
- Controllers will use the term get and set
- Files shall use kebap-case convention.

# Changelog

Spotbot is now serverless :o 

- Individual Channel Separation (Requires different spotify accounts)
  - Adds the ability to have multiple Spotbot instances in a single Slack Workspace to control different playlists/spotify accounts
  - Feel free to add Spotbot to other channels.

- Updated all UI to use Slack Block Kit.

- New /control command!
  - Becomes a central hub for all control based features. (Play/Pause/Skip/Reset)
  - Dynamically updates a current playing panel on control button presses.
  - Added the ability to Jump to the Start of the playlist and Clear Songs > 1 day old.
  - Added the ability to toggle shuffle and repeat.
  - /play, /pause, /reset now also bring up the Control menu for status information.

- Spotify added wildcard search to search by default (yay)

- /current
  - Removed /current playlist, /current track. The link to the playlist is now embedded in /current.
  - Upgraded detection of back to playlist state.
  - Added information about the current playing track's position in the playlist + next song. (This will not work if there are multiple instances of the specific track in the playlist)
  - If the current song is blacklisted, the song will be skipped and removed from the playlist

- /whom
  - If song is blacklisted, the song will be skipped and removed from the playlist.

- /reset
  - Added the ability to keep up to 100 songs added in the past 30 minutes before reset command is used.
  - Added the ability to jump to the start of the playlist on reset.

- /find
  - Added duration of songs to search panels.
  - removed /findpop

- /skip
  - Blacklisted songs can now be skipped immediately.
  - Running /skip while an existing skip is in place now adds a vote.

- /removetracks
  - Now can remove multiple songs at once.

- Admin
  - Removed /spotbot auth and moved it into /spotbot settings.
  - Removed admin add/remove commands and moved it into /spotbot settings
  - Manage blacklisted songs in /spotbot blacklist. You can add songs which were skipped, recently played or currently playing.


