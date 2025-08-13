
// Global variables
let audioPlayer, playPauseBtn, playIcon, pauseIcon, nextBtn, prevBtn, shuffleBtn, repeatBtn;
let songTitleDisplay, artistNameDisplay, fileSelector, songsList, songsHeader, songsArrow, sortBtn;
let progressBar, currentTimeDisplay, durationTimeDisplay, volumeBar, albumArt;
let lyricsHeader, lyricsArrow, lyricsContainer, lyricsContent;
let playlistsHeader, playlistsList, playlistsArrow;

let playableSongs = [];
let allFilesMap = new Map();
let availableSongs = [];
let availablePlaylists = [];
let currentSongIndex = 0;
let isPlaying = false;
let isShuffled = false;
let isRepeating = false;
let originalOrder = [];
let parsedLyrics = [];

// Function to format time in MM:SS
function formatTime(time) {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Function to parse filename to extract title and artist
function parseFilename(filename) {
    const cleanFilename = filename.split('.').slice(0, -1).join('.');
    const parts = cleanFilename.split(' - ');
    if (parts.length === 2) {
        return { title: parts[0], artist: parts[1] };
    }
    return { title: cleanFilename, artist: 'Unknown Artist' };
}

// Function to get metadata (album art, etc.)
function getMetadata(file) {
    return new Promise((resolve, reject) => {
        if (typeof jsmediatags === 'undefined') {
            console.warn("jsmediatags library not loaded, skipping metadata");
            resolve({});
            return;
        }
        jsmediatags.read(file, {
            onSuccess: (tags) => resolve(tags.tags),
            onError: (error) => {
                console.error("Error reading tags:", error);
                resolve({}); // Default to empty tags on error
            }
        });
    });
}

// Function to get lyrics from a file
function getLyrics(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
    });
}

// Function to parse LRC file content
function parseLrc(content) {
    const lines = content.split('\n');
    const lyrics = [];
    lines.forEach(line => {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = parseInt(match[3].padEnd(3, '0'));
            const time = minutes * 60 + seconds + milliseconds / 1000;
            const text = match[4].trim();
            lyrics.push({ time, text });
        }
    });
    return lyrics;
}

// Function to load and play a song
async function loadSong(index) {
    if (playableSongs.length === 0) return;
    
    const song = playableSongs[index];
    const { title, artist } = parseFilename(song.name);
    songTitleDisplay.textContent = title;
    artistNameDisplay.textContent = artist;
    audioPlayer.src = song.src;
    audioPlayer.load();
    currentSongIndex = index;

    // Display album art and lyrics
    displayAlbumArt(song.tags?.picture);
    displayLyrics(song.lyrics);
    
    highlightCurrentSong();

    // Update Media Session metadata
    updateMediaSession(song);
    if (isPlaying) {
        audioPlayer.play();
    }
}

// Function to update the Media Session API with current song info
function updateMediaSession(song) {
    if ('mediaSession' in navigator) {
        const { title, artist } = parseFilename(song.name);
        let albumArtImage = [];
        if (song.tags && song.tags.picture) {
            const url = `data:${song.tags.picture.format};base64,${btoa(String.fromCharCode(...song.tags.picture.data))}`;
            albumArtImage.push({
                src: url,
                sizes: '200x200',
                type: song.tags.picture.format
            });
        } else {
            albumArtImage.push({
                src: 'https://placehold.co/200x200/4A5568/E2E8F0?text=No+Album+Art',
                sizes: '200x200',
                type: 'image/png'
            });
        }
        
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            album: song.tags?.album || '',
            artwork: albumArtImage
        });

        // Set up the action handlers
        navigator.mediaSession.setActionHandler('play', () => {
            playPause();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            playPause();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            prevSong();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            nextSong();
        });
    }
}

// Function to display album art
function displayAlbumArt(picture) {
    if (picture) {
        const url = `data:${picture.format};base64,${btoa(String.fromCharCode(...picture.data))}`;
        albumArt.src = url;
    } else {
        albumArt.src = 'https://placehold.co/200x200/4A5568/E2E8F0?text=No+Album+Art';
    }
}

// Function to display lyrics
function displayLyrics(lyrics) {
    if (lyrics && lyrics.length > 0) {
        parsedLyrics = lyrics;
        lyricsContent.innerHTML = '';
        lyrics.forEach((line, index) => {
            const p = document.createElement('p');
            p.textContent = line.text;
            p.className = 'text-center my-1 transition-transform duration-300';
            p.dataset.index = index;
            lyricsContent.appendChild(p);
        });
    } else {
        parsedLyrics = [];
        lyricsContent.innerHTML = '<p class="text-center text-sm text-gray-400">No lyrics available.</p>';
    }
}

// Function to render the songs list in the UI
function renderSongsList(songsArray) {
    songsList.innerHTML = ''; // Clear existing list
    if (songsArray.length === 0) {
        songsList.innerHTML = '<li class="p-3 text-center text-gray-400">Load a folder to see your songs.</li>';
        return;
    }
    songsArray.forEach((song, index) => {
        const li = document.createElement('li');
        const { title, artist } = parseFilename(song.name);
        li.className = 'p-3 cursor-pointer hover:bg-gray-600 transition-colors duration-200';
        li.dataset.index = index;
        li.innerHTML = `
            <p class="font-semibold truncate">${title}</p>
            <p class="text-sm text-gray-400 truncate">${artist}</p>
        `;
        li.addEventListener('click', () => {
            loadSong(index);
        });
        songsList.appendChild(li);
    });
    highlightCurrentSong();
}

// Function to render the playlists in the UI
function renderPlaylists(playlistsArray) {
    playlistsList.innerHTML = '';
    if (playlistsArray.length === 0) {
         playlistsList.innerHTML = '<li class="p-3 text-center text-gray-400">No playlists found.</li>';
         return;
    }
    playlistsArray.forEach((playlistFile) => {
        const li = document.createElement('li');
        const playlistName = playlistFile.name.split('.').slice(0, -1).join('.');
        li.className = 'p-3 cursor-pointer hover:bg-gray-600 transition-colors duration-200';
        li.textContent = playlistName;
        li.addEventListener('click', () => {
            loadPlaylist(playlistFile);
        });
        playlistsList.appendChild(li);
    });
}

// Function to load a playlist from an .m3u file
async function loadPlaylist(playlistFile) {
    const content = await getLyrics(playlistFile); // Using getLyrics as a generic file reader
    if (!content) return;
    
    const lines = content.split('\n');
    const newPlaylist = [];
    const supportedExtensions = ['.mp3', '.m4a', '.wav', '.ogg'];

    for (const line of lines) {
        const trimmedLine = line.trim();
        // Skip comments and empty lines
        if (trimmedLine.startsWith('#') || trimmedLine === '') {
            continue;
        }
        // Check if the file exists in our map
        if (allFilesMap.has(trimmedLine)) {
            const file = allFilesMap.get(trimmedLine);
            const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
            if (supportedExtensions.includes(extension)) {
                const song = {
                    name: file.name,
                    file: file,
                    src: URL.createObjectURL(file)
                };
                newPlaylist.push(song);
            }
        } else {
            console.warn(`File not found in folder: ${trimmedLine}`);
        }
    }
    
    if (newPlaylist.length > 0) {
        // Fetch metadata and lyrics for all songs in the new playlist
        const processPromises = newPlaylist.map(async (song) => {
            song.tags = await getMetadata(song.file);
            const baseName = song.name.split('.').slice(0, -1).join('.');
            const lrcFileName = baseName + '.lrc';
            if (allFilesMap.has(lrcFileName)) {
                const lrcFile = allFilesMap.get(lrcFileName);
                const lrcContent = await getLyrics(lrcFile);
                song.lyrics = parseLrc(lrcContent);
            }
        });
        await Promise.all(processPromises);

        playableSongs = newPlaylist;
        originalOrder = [...playableSongs];
        currentSongIndex = 0;
        renderSongsList(playableSongs);
        loadSong(currentSongIndex);
    }
}

// Function to highlight the currently playing song in the list
function highlightCurrentSong() {
    document.querySelectorAll('#songs-list li').forEach((li, index) => {
        if (index === currentSongIndex) {
            li.classList.add('bg-purple-600', 'text-white');
            li.classList.remove('hover:bg-gray-600');
            // Scroll the element into view
            li.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            li.classList.remove('bg-purple-600', 'text-white');
            li.classList.add('hover:bg-gray-600');
        }
    });
}

// Function to toggle play/pause
function playPause() {
    if (playableSongs.length === 0) return;
    if (isPlaying) {
        audioPlayer.pause();
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
        }
    } else {
        audioPlayer.play();
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
        }
    }
    isPlaying = !isPlaying;
}

// Function to play the next song
function nextSong() {
    if (playableSongs.length === 0) return;
    currentSongIndex = (currentSongIndex + 1) % playableSongs.length;
    loadSong(currentSongIndex);
}

// Function to play the previous song
function prevSong() {
    if (playableSongs.length === 0) return;
    currentSongIndex = (currentSongIndex - 1 + playableSongs.length) % playableSongs.length;
    loadSong(currentSongIndex);
}

// Function to toggle shuffle mode
function toggleShuffle() {
    isShuffled = !isShuffled;
    shuffleBtn.classList.toggle('text-purple-400', isShuffled);
    
    if (playableSongs.length > 0) {
        // Remember the currently playing song object
        const currentSong = playableSongs[currentSongIndex];

        if (isShuffled) {
            // Fisher-Yates shuffle algorithm
            for (let i = playableSongs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [playableSongs[i], playableSongs[j]] = [playableSongs[j], playableSongs[i]];
            }
        } else {
            // Revert to original order
            playableSongs = [...originalOrder];
        }
        
        // Find the new index of the current song after shuffling or reverting
        currentSongIndex = playableSongs.indexOf(currentSong);

        renderSongsList(playableSongs);
        loadSong(currentSongIndex); // Keep the current song playing
    }
}

// Function to sort the playlist alphabetically
function sortPlaylist() {
    if (playableSongs.length > 0) {
        playableSongs.sort((a, b) => {
            const titleA = parseFilename(a.name).title.toLowerCase();
            const titleB = parseFilename(b.name).title.toLowerCase();
            if (titleA < titleB) return -1;
            if (titleA > titleB) return 1;
            return 0;
        });
        originalOrder = [...playableSongs]; // Update original order for shuffling
        renderSongsList(playableSongs);
        loadSong(currentSongIndex); // Keep the current song playing
    }
}

// Function to toggle repeat mode
function toggleRepeat() {
    isRepeating = !isRepeating;
    repeatBtn.classList.toggle('text-purple-400', isRepeating);
}

// Event listener for when a song ends
function setupAudioEventListeners() {
    audioPlayer.addEventListener('ended', () => {
        if (isRepeating) {
            audioPlayer.play(); // Replay the same song
        } else {
            nextSong();
        }
    });

    // Event listener for when the song's metadata is loaded
    audioPlayer.addEventListener('loadedmetadata', () => {
        const duration = audioPlayer.duration;
        progressBar.max = duration;
        durationTimeDisplay.textContent = formatTime(duration);
    });

    // Event listener to update the progress bar and current time as the song plays
    audioPlayer.addEventListener('timeupdate', () => {
        const currentTime = audioPlayer.currentTime;
        progressBar.value = currentTime;
        currentTimeDisplay.textContent = formatTime(currentTime);

        // Update lyrics
        if (parsedLyrics.length > 0) {
            const currentLyricIndex = parsedLyrics.findIndex((line, index) => {
                const nextLineTime = index + 1 < parsedLyrics.length ? parsedLyrics[index + 1].time : Infinity;
                return currentTime >= line.time && currentTime < nextLineTime;
            });
            if (currentLyricIndex !== -1) {
                document.querySelectorAll('#lyrics-content p').forEach((p) => {
                    p.classList.remove('lyric-active');
                });
                const activeLyric = document.querySelector(`#lyrics-content p[data-index="${currentLyricIndex}"]`);
                if (activeLyric) {
                    activeLyric.classList.add('lyric-active');
                    activeLyric.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    });
}

// Function to setup UI event listeners
function setupUIEventListeners() {
    // Event listener for when the user selects a folder
    fileSelector.addEventListener('change', async (event) => {
        const files = event.target.files;
        if (files.length === 0) return;
        
        const supportedAudioExtensions = ['.mp3', '.m4a', '.wav', '.ogg'];
        const allFileArray = Array.from(files);
        
        // Clear previous data
        allFilesMap.clear();
        availableSongs = [];
        availablePlaylists = [];
        
        // Map all files by name for easy lookup
        allFileArray.forEach(file => {
            allFilesMap.set(file.name, file);
            const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
            if (supportedAudioExtensions.includes(extension)) {
                availableSongs.push({ name: file.name, file: file, src: URL.createObjectURL(file) });
            } else if (extension === '.m3u') {
                availablePlaylists.push(file);
            }
        });

        // Fetch metadata and lyrics for all available songs
        const processPromises = availableSongs.map(async (song) => {
            song.tags = await getMetadata(song.file);
            const baseName = song.name.split('.').slice(0, -1).join('.');
            const lrcFileName = baseName + '.lrc';
            if (allFilesMap.has(lrcFileName)) {
                const lrcFile = allFilesMap.get(lrcFileName);
                const lrcContent = await getLyrics(lrcFile);
                song.lyrics = parseLrc(lrcContent);
            }
        });

        await Promise.all(processPromises);

        if (availableSongs.length > 0) {
            // Initially populate with all songs
            playableSongs = [...availableSongs];
            originalOrder = [...playableSongs];
            currentSongIndex = 0;
            loadSong(currentSongIndex);
            renderSongsList(playableSongs);
            playPause(); // Start playing the first song if not already playing
        } else {
            songTitleDisplay.textContent = "No music files found.";
            artistNameDisplay.textContent = "";
            songsList.innerHTML = '<li class="p-3 text-center text-gray-400">No music files found.</li>';
        }
        
        renderPlaylists(availablePlaylists);
    });

    // Event listener for collapsible songs list header
    songsHeader.addEventListener('click', () => {
        songsList.classList.toggle('hidden');
        songsArrow.classList.toggle('rotate-180');
    });

    // Event listener for collapsible playlists header
    playlistsHeader.addEventListener('click', () => {
        playlistsList.classList.toggle('hidden');
        playlistsArrow.classList.toggle('rotate-180');
    });

    // Event listener for collapsible lyrics header
    lyricsHeader.addEventListener('click', () => {
        lyricsContainer.classList.toggle('hidden');
        lyricsArrow.classList.toggle('rotate-180');
    });

    // Event listener for seeking functionality
    progressBar.addEventListener('input', () => {
        if (playableSongs.length > 0) {
            audioPlayer.currentTime = progressBar.value;
        }
    });

    // Event listener for volume control
    volumeBar.addEventListener('input', (event) => {
        audioPlayer.volume = event.target.value;
    });

    // Add event listeners to the buttons
    playPauseBtn.addEventListener('click', playPause);
    nextBtn.addEventListener('click', nextSong);
    prevBtn.addEventListener('click', prevSong);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);
    sortBtn.addEventListener('click', sortPlaylist);
}

// Function to set up the Media Session action handlers once
function setupMediaSession() {
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => {
            playPause();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
            playPause();
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
            prevSong();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
            nextSong();
        });
    }
}

// Initial state
export function initializePlayer() {
    // Get all necessary DOM elements
    audioPlayer = document.getElementById('audio-player');
    playPauseBtn = document.getElementById('play-pause-btn');
    playIcon = document.getElementById('play-icon');
    pauseIcon = document.getElementById('pause-icon');
    nextBtn = document.getElementById('next-btn');
    prevBtn = document.getElementById('prev-btn');
    shuffleBtn = document.getElementById('shuffle-btn');
    repeatBtn = document.getElementById('repeat-btn');
    songTitleDisplay = document.getElementById('song-title');
    artistNameDisplay = document.getElementById('artist-name');
    fileSelector = document.getElementById('file-selector');
    songsList = document.getElementById('songs-list');
    songsHeader = document.getElementById('songs-header');
    songsArrow = document.getElementById('songs-arrow');
    sortBtn = document.getElementById('sort-btn');
    progressBar = document.getElementById('progress-bar');
    currentTimeDisplay = document.getElementById('current-time');
    durationTimeDisplay = document.getElementById('duration-time');
    volumeBar = document.getElementById('volume-bar');
    albumArt = document.getElementById('album-art');
    lyricsHeader = document.getElementById('lyrics-header');
    lyricsArrow = document.getElementById('lyrics-arrow');
    lyricsContainer = document.getElementById('lyrics-container');
    lyricsContent = document.getElementById('lyrics-content');
    playlistsHeader = document.getElementById('playlists-header');
    playlistsList = document.getElementById('playlists-list');
    playlistsArrow = document.getElementById('playlists-arrow');

    // Initialize UI state
    songTitleDisplay.textContent = "No song selected";
    artistNameDisplay.textContent = "";
    audioPlayer.volume = volumeBar.value;
    renderSongsList([]);
    renderPlaylists([]);
    
    // Setup event listeners
    setupAudioEventListeners();
    setupUIEventListeners();
    setupMediaSession();
};