# Ollo - Progressive Web App

A game and music player web application with full PWA support, background music playback, and offline functionality.

## 🚀 Features

### PWA Core Features
- ✅ **Service Worker** - Offline caching and background sync
- ✅ **Web App Manifest** - Installable with custom icons and shortcuts
- ✅ **Install Prompt** - Custom install button when PWA criteria are met
- ✅ **Offline Support** - Works without internet connection
- ✅ **Update Notifications** - Prompts users when new versions are available

### Music Player Features
- ✅ **Media Session API** - Lock screen controls and media notifications
- ✅ **Wake Lock API** - Prevents device sleep during playback
- ✅ **Background Playback** - Music continues when app is in background
- ✅ **Drag & Drop UI** - Minimizable, draggable player interface
- ✅ **Multiple Formats** - Support for MP3, M4A, WAV, OGG
- ✅ **Playlist Support** - M3U playlist files
- ✅ **Metadata Display** - Album art, lyrics, and song information

### Game Features
- ✅ **Session Persistence** - Games save state and can be resumed
- ✅ **Offline Play** - All games work without internet
- ✅ **Multiple Games** - Tic-Tac-Toe, Pelusas, Snakes & Ladders
- ✅ **Responsive Design** - Works on mobile and desktop

## 🛠️ Setup Instructions

### 1. Icon Generation
Since you need actual PNG icons for the PWA to work properly, follow these steps:

1. Open `generate-icons.html` in a modern browser
2. The page will automatically generate and download PNG icons in various sizes
3. Place the downloaded icons in the `icons/` folder

**Required icon sizes:**
- icon-16x16.png
- icon-32x32.png
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-180x180.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### 2. Local Development Server

The PWA requires HTTPS or localhost to work properly. Start a local server:

```bash
# Using Python
python -m http.server 8080

# Using Node.js
npx serve -s . -p 8080

# Using PHP
php -S localhost:8080
```

Then visit: `http://localhost:8080`

### 3. PWA Testing

Visit `http://localhost:8080/test-pwa.html` to test all PWA features:

- Service Worker registration
- Cache functionality
- Install prompt
- Media Session API
- Wake Lock API
- Network status

## 📱 Installation

### Desktop (Chrome/Edge)
1. Visit the website
2. Look for the install button (📱) in the top-right corner
3. Click "Install App" when prompted
4. The app will appear in your applications menu

### Mobile (Android/iOS)
1. Visit the website in Chrome (Android) or Safari (iOS)
2. Tap the share button
3. Select "Add to Home Screen" or "Install App"
4. The app icon will appear on your home screen

## 🎵 Music Player Usage

### Loading Music
1. Click the folder icon to select a music folder
2. Or let it auto-load the default playlist
3. The player will start automatically

### Background Playback
- Music continues playing when you switch apps
- Use lock screen controls to manage playback
- The player can be minimized and dragged around the screen

### Supported Features
- Shuffle and repeat modes
- Volume control
- Progress scrubbing
- Album art display (if available in file metadata)
- Synchronized lyrics (LRC files)

## 🎮 Games

### Tic-Tac-Toe
- Two-player game
- Session persistence - resume interrupted games
- Responsive design

### Pelusas (Custom Game)
- Session persistence with player names
- Score tracking
- Customizable gameplay

### Snakes & Ladders
- Classic board game
- Multi-player support
- Animated gameplay

## 🔧 Technical Details

### Service Worker Caching Strategy
- **Cache First** - Static assets (HTML, CSS, JS)
- **Network First** - API calls and dynamic content
- **Offline Fallback** - Custom offline page

### Session Storage
Games automatically save state using `sessionStorage`:
- Game board state
- Player information
- Current turn/progress
- Timestamps for cleanup

### Media Session Integration
- Lock screen controls
- Media notification display
- Keyboard shortcuts support
- Position state updates

## 🐛 Troubleshooting

### PWA Not Installing
1. Ensure you're using HTTPS or localhost
2. Check that all required icons exist
3. Verify manifest.json is accessible
4. Use browser dev tools to check for errors

### Background Music Not Working
1. User interaction is required before audio can play
2. Check browser permissions for media
3. Ensure Wake Lock API is supported
4. Test in different browsers

### Service Worker Issues
1. Clear browser cache and reload
2. Check dev tools > Application > Service Workers
3. Manually unregister and re-register if needed
4. Ensure sw.js is accessible from root

### Debug URLs
- Service Worker: `chrome://serviceworker-internals/`
- PWA Status: `chrome://flags/#enable-desktop-pwas`
- Media Session: `chrome://media-internals/`

## 🌐 Browser Support

### Full Support
- Chrome 67+ (Desktop & Mobile)
- Edge 79+ (Desktop & Mobile)
- Firefox 60+ (Desktop)
- Safari 14+ (iOS)

### Limited Support
- Firefox Mobile (no install prompt)
- Safari Desktop (no install prompt)
- Older browsers (graceful degradation)

## 📝 Files Structure

```
/
├── index.html              # Main application entry
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── offline.html            # Offline fallback page
├── test-pwa.html          # PWA testing page
├── generate-icons.html     # Icon generation utility
├── css/
│   ├── style.css          # Main styles
│   └── player.css         # Player-specific styles
├── js/
│   ├── app.js             # Main app logic + PWA registration
│   ├── player.js          # Music player with Media Session
│   ├── pelusas.js         # Pelusas game with session storage
│   ├── ticktac.js         # Tic-Tac-Toe with session storage
│   └── snl.js             # Snakes & Ladders game
├── icons/                 # PWA icons (generate these)
│   ├── icon-16x16.png
│   ├── icon-32x32.png
│   └── ... (all sizes)
└── public/
    └── aud/               # Audio files and playlist
        ├── playlist.json
        └── *.a            # Audio files
```

## 🚀 Deployment

### GitHub Pages
1. Push to GitHub repository
2. Enable GitHub Pages in repository settings
3. Ensure HTTPS is enabled
4. Update manifest.json start_url if needed

### Netlify/Vercel
1. Connect repository
2. Deploy automatically
3. Enable HTTPS (usually automatic)
4. Configure redirects if needed

### Custom Server
1. Ensure HTTPS is configured
2. Set proper MIME types for manifest.json
3. Configure service worker headers
4. Test on multiple devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test PWA functionality
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
