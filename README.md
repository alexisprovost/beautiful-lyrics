# About the fork
This fork changes the lyrics font to rubiko-sans and increases the lyrics card's height.


# Beautiful Lyrics
🌟 Starring the project helps this extension get seen by more people - which means more Beautiful Lyrics! 

[![Github Version](https://img.shields.io/github/v/release/surfbryce/beautiful-lyrics)](https://github.com/surfbryce/beautiful-lyrics/) [![Github Stars badge](https://img.shields.io/github/stars/surfbryce/beautiful-lyrics?style=social)](https://github.com/surfbryce/beautiful-lyrics/) [![Discord Badge](https://dcbadge.limes.pink/api/server/884XC8Fsfa?style=flat)](https://discord.com/invite/884XC8Fsfa)

![Thumbnail](./Marketing/Marketplace/Thumbnail.gif)
# A New and More Beautiful Spotify Lyrics Experience

## Karaoke Lyrics for EVERYONE
If you don't have Premium, Spotify won't give you any lyrics.

Beautiful Lyrics provides Lyrics to _EVERYONE_ for **FREE**.
Beautiful Lyrics supports **Karaoke**, _Line_, and Statically synced lyrics with
additional features like **Background Vocals** and **Side Vocals**.

## Fullscreen for EVERYONE
Did you know _Spotify doesn't give its fullscreen mode to non-premium users_?

With Beautiful Lyrics **EVERYBODY** gets an extremely beautiful **Fullscreen Mode** with all the great features that the other views give!

### New Lyric Views
Brand new **Page, Cinema, and Fullscreen Views** that replace Spotifys own
versions and help improve your immersion in the song you are listening to!

### Dynamic Backgrounds
A new Dynamic Background that beautifully blends the Cover-Art colors for the Sidebar, Page, and Cinema/Fullscreen Views

### Lyric Romanization
If you're a fan of **Chinese, Japanese, or Korean songs** but want to see the lyrics phonetically spelled than just toggle the **Romanization** feature! The toggle is *per supported language* so you can **pick and choose which ones are romanized**!

### Auto-Updates
Never worry about Updating ever! **Beautiful Lyrics is ALWAYS Up-to-Date because it Auto-Updates as _SOON_ as an update is available!** This means that if you make an issue/suggestion - it could be added and working for you (and everyone else) minutes later!

## Need help? Check the Wiki!
[![GitHub Wiki Link](https://img.shields.io/badge/wiki-documentation-forestgreen)](https://github.com/surfbryce/beautiful-lyrics/wiki)

## Building from Source

### Prerequisites
- [Deno](https://deno.land/) (v1.40+)
- [Spicetify](https://spicetify.app/) installed and configured

### Build & Install (Development)
```bash
cd Extension
deno task store-locally
```
This builds the extension and copies it directly to your Spicetify extensions folder. Restart Spotify to apply.

### Build Only (For Manual Installation)
```bash
cd Extension
deno task release
```
This creates `Extension/Builds/Release/beautiful-lyrics.mjs`.

### Manual Installation on Another Computer
1. Copy `beautiful-lyrics.mjs` to your Spicetify extensions folder:
   - **Windows:** `%APPDATA%\spicetify\Extensions\`
   - **macOS:** `~/.config/spicetify/Extensions/`
   - **Linux:** `~/.config/spicetify/Extensions/`

2. Enable the extension:
   ```bash
   spicetify config extensions beautiful-lyrics.mjs
   spicetify apply
   ```

3. Restart Spotify

## Have an Issue/Idea? Join the Discord and send them there!
