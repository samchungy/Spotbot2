# Spotbot2

# Naming Conventions
- DAL will use the terms load and store.
- APIs will use the terms create, fetch and send
- Controllers will use the term get and set
- Files shall use kebap-case convention.

# Changelog
- New /control command!
  - Becomes a central hub for all control based features. (Play/Pause/Skip/Reset)
  - Dynamically updates a current playing panel on control button presses.
  - Added the ability to toggle shuffle and repeat.
  - Added the ability to Jump to the Start of the playlist and Clear Songs > 1 day.

- Individual Channel Separation (Requires different spotify accounts)
  - Adds the ability to have multiple Spotbot instances in a single Slack Workspace to control different playlists
  - Added a global settings panel to manage all Spotbot instances running in channels

- Updated all UI to use Slack Block Kit

- /current
  - Removed /current playlist, /current track. The link to the playlist is now embedded in /current calls
  - Added information about the current playing track's position in the playlist. (Will not work if there are multiple instances of the specific track in the playlist)

- /find
  - Added duration of songs to find panel.


