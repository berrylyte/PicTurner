document.addEventListener('DOMContentLoaded', function() {
    console.log('Script loaded and running');

    // Get DOM elements
    const folderButton = document.getElementById('folder-button');
    const imageElement = document.getElementById('current-image');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const playPauseButton = document.getElementById('play-pause');
    const minutesInput = document.getElementById('minutes');
    const secondsInput = document.getElementById('seconds');
    const timerDisplay = document.getElementById('timer');
    const folderPathInput = document.getElementById('folder-path');
    const resetButton = document.getElementById('reset-button');
    // for sound effect
    const soundToggle = document.getElementById('sound-toggle');
    const volumeSlider = document.getElementById('volume-slider');
    const countdownSound = document.getElementById('countdown-sound');
    // get session log
    const sessionLogElement = document.getElementById('session-log'); 
    // quick time setting
    const quickTimeRadios = document.querySelectorAll('.time-radio');
    // shuffle mode
    const shuffleButton = document.getElementById('shuffle-button');

    // State variables
    let imageFiles = []; // This will now act as the current playlist
    let currentImageIndex = 0;
    let countdown = null; // Replaces timerInterval for better control
    let remainingTime = 0; // Tracks the current countdown time
    let isPlaying = false;
    let dirHandle = null;  // Store directory handle
    let logFileHandle = null;  // Store log file handle
    let playLog = {
        lastPlayed: null,
        playCount: {}
    };
    let sessionStats = {}; // Add this line to track session stats
    let wakeLock = null;   // To save Screen Lock info
    let originalImageFiles = []; // To store the full list of files in their original order
    let isShuffling = false; // New state for shuffle mode

    // --- Audio Control Logic ---
    // Function to set the audio volume from the slider's value
    function setVolume() {
        // The slider value is 0-100, but audio volume is 0.0-1.0
        countdownSound.volume = volumeSlider.value / 100;
    }

    // Add event listener for the volume slider
    volumeSlider.addEventListener('input', setVolume);

    // Set the initial volume when the script loads
    setVolume();


    // Function to read or create log file
    async function initializeLog() {
        try {
            // Try to get the log file
            try {
                logFileHandle = await dirHandle.getFileHandle('slideshow_log.json');
                // Read existing log
                const file = await logFileHandle.getFile();
                const content = await file.text();
                playLog = JSON.parse(content);
                console.log('Loaded existing log:', playLog);
            } catch (e) {
                // Log file doesn't exist, create new one
                logFileHandle = await dirHandle.getFileHandle('slideshow_log.json', { create: true });
                await saveLog();
                console.log('Created new log file');
            }
        } catch (err) {
            console.error('Error initializing log:', err);
        }
    }

    // Function to save log
    async function saveLog() {
        try {
            const writable = await logFileHandle.createWritable();
            await writable.write(JSON.stringify(playLog, null, 2));
            await writable.close();
            console.log('Log saved successfully');
        } catch (err) {
            console.error('Error saving log:', err);
        }
    }

    // Function to record play count
    function recordPlayCount(fileName) {
        if (!playLog.playCount[fileName]) {
            playLog.playCount[fileName] = 0;
        }
        playLog.playCount[fileName]++;
        playLog.lastPlayed = fileName;
        // The saveLog() call is now removed.
    }

    // --- Screen Wake Lock Control Logic ---
    const requestWakeLock = async () => {
      // check if browser support Wake Lock API
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Screen Wake Lock has been acquired');

          // when lock has been released
          wakeLock.addEventListener('release', () => {
            console.log('Screen Wake Lock was released');
            wakeLock = null; // set variable to null
          });

        } catch (err) {
          console.error(`Failed to acquire wake lock: ${err.name}, ${err.message}`);
        }
      } else {
        console.warn('This browser not support Screen Wake Lock API.');
      }
    };

    // release wake lock
    const releaseWakeLock = () => {
      // check wakelock is null, prevent duo-release
      if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
      }
    };

    // --- Playlist Generation Logic ---
    function generatePlaylist() {
        if (originalImageFiles.length === 0) {
            imageFiles = [];
            return;
        }

        const allFilesWithCount = originalImageFiles.map(file => ({
            file: file,
            count: playLog.playCount[file.name] || 0
        }));

        let unplayedFiles = allFilesWithCount.filter(item => item.count === 0);

        let filesToPlay;
        if (unplayedFiles.length > 0) {
            filesToPlay = unplayedFiles.map(item => item.file);
        } else {
            let minCount = Infinity;
            allFilesWithCount.forEach(item => {
                if (item.count < minCount) {
                    minCount = item.count;
                }
            });
            filesToPlay = allFilesWithCount
                .filter(item => item.count === minCount)
                .map(item => item.file);
        }

        if (isShuffling) {
            for (let i = filesToPlay.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [filesToPlay[i], filesToPlay[j]] = [filesToPlay[j], filesToPlay[i]];
            }
        }

        imageFiles = filesToPlay;
        currentImageIndex = 0;
        console.log(`Generated new playlist with ${imageFiles.length} images.`);
    }

    // Timer control functions
    let displayDuration = 0;  // Track how long current image has been displayed

    // replace startSlideshow(), stopSlideshow(), and restartSlideshow()
    // three new functions with remaining time:
    async function play() {
        if (imageFiles.length === 0) return;

        await requestWakeLock();// request wake lock

        if (remainingTime <= 0) { // Checks if we need to start a new countdown
            const minutes = parseInt(minutesInput.value) || 0;
            const seconds = parseInt(secondsInput.value) || 0;
            remainingTime = minutes * 60 + seconds;
            displayDuration = 0;
        }

        isPlaying = true;
        playPauseButton.textContent = 'Pause';
        
        clearInterval(countdown); // Prevent multiple timers
        countdown = setInterval(() => {
            remainingTime--;
            displayDuration++;
            updateTimerDisplay(remainingTime);

            // Check if the timer is at 3 seconds and if the sound is enabled
            if (remainingTime === 3 && soundToggle.checked) {
                countdownSound.play();
            }
            

            if (remainingTime <= 0) { // When timer finishes
                if (displayDuration >= 5){
                    // V V V ADD THIS LINE FOR TESTING V V V
                    console.log(`Logging image in shuffle mode: ${isShuffling}`, imageFiles[currentImageIndex].name);
                    
                    recordPlayCount(imageFiles[currentImageIndex].name);
                    logSessionActivity();
                }

                currentImageIndex++; // Move to the next image in the current playlist

                // If the playlist is finished, generate a new one
                if (currentImageIndex >= imageFiles.length) {
                    console.log("Playlist exhausted. Generating a new one.");
                    generatePlaylist();
                    
                    // If the new playlist is empty, stop playback
                    if (imageFiles.length === 0) {
                        pause();
                        console.log("All images have been played an equal number of times.");
                        imageElement.src = "";
                        imageElement.alt = "All images have been played. Please select a new folder or reset the log.";
                        return;
                    }
                }
                
                showImage(currentImageIndex);
                clearInterval(countdown);
                play(); // Continue with the next image
            }
        }, 1000);
    }

    function pause() {
        isPlaying = false;
        playPauseButton.textContent = 'Play';
        clearInterval(countdown);
        // The 'remainingTime' variable automatically saves the current time

        releaseWakeLock();// release the wakelock
        saveLog();
    }

    function resetTimer() {
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        remainingTime = minutes * 60 + seconds;
        displayDuration = 0;
        updateTimerDisplay(remainingTime);

        if (isPlaying) { // If it was playing, restart the interval with the new time
            play();
        }
    }

    function updateTimerDisplay(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        console.log('Timer updated:', timerDisplay.textContent);
    }

    // This function updates the session log display on the screen.
    function updateSessionLogDisplay() {
        // Clear the previous content
        sessionLogElement.innerHTML = '';

        // Add a title to the log
        const title = document.createElement('h4');
        title.textContent = 'Session Log'; // This is the title for the log panel
        sessionLogElement.appendChild(title);

        // Create and add a paragraph for each statistic
        for (const duration in sessionStats) {
            const count = sessionStats[duration];
            const statText = document.createElement('p');
            statText.textContent = `${duration}: ${count} images`;
            sessionLogElement.appendChild(statText);
        }
    }

    // This function logs the completion of an image view.
    function logSessionActivity() {
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;

        // Create a key for the duration, e.g., "30s" or "1m 30s"
        let durationKey;
        if (minutes === 0) {
            durationKey = `${seconds}s`;
        } else if (seconds === 0) {
            durationKey = `${minutes}m`;
        } else {
            durationKey = `${minutes}m ${seconds}s`;
        }

        // If this is the first time for this duration, initialize it.
        if (!sessionStats[durationKey]) {
            sessionStats[durationKey] = 0;
        }
        
        // Increment the count and update the display.
        sessionStats[durationKey]++;
        updateSessionLogDisplay();
    }

    // Play/Pause button handler
    playPauseButton.addEventListener('click', () => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    });

    // shufflebutton handler
    shuffleButton.addEventListener('click', () => {
        isShuffling = !isShuffling; // Toggle the shuffle state
        shuffleButton.textContent = isShuffling ? 'Shuffle Mode On' : 'Turn on Shuffle play'; // Update button text
        console.log(`Shuffle mode is now ${isShuffling ? 'ON' : 'OFF'}`);
        
        // Add or remove the 'shuffle-on' class to change the button's color
        if (isShuffling) {
            shuffleButton.classList.add('shuffle-on');
        } else {
            shuffleButton.classList.remove('shuffle-on');
        }

        // Regenerate the playlist with the new shuffle setting
        generatePlaylist();

        // Update the view if images are loaded
        if (imageFiles.length > 0) {
            showImage(0); // Show the first image of the new playlist
            resetTimer();
            if (isPlaying) {
                play();
            }
        }
    });

    // Add a listener for the new Reset button
    resetButton.addEventListener('click', resetTimer);

    // Change the time input listeners
    minutesInput.addEventListener('change', resetTimer);
    secondsInput.addEventListener('change', resetTimer);

    // Change the navigateImage function
    function navigateImage(direction) {
        if (imageFiles.length === 0) return;

        if (displayDuration >= 5) {
            recordPlayCount(imageFiles[currentImageIndex].name);
        }
        saveLog();

        let newIndex = currentImageIndex + direction;
        const numImages = imageFiles.length;
        currentImageIndex = (newIndex % numImages + numImages) % numImages;

        showImage(currentImageIndex);
        resetTimer(); // This cleanly resets the timer for the new image
    }

    // Time input handlers
    minutesInput.addEventListener('change', () => {
        console.log('Minutes changed:', minutesInput.value);
        if (isPlaying) {
            restartSlideshow();
        }
    });

    secondsInput.addEventListener('change', () => {
        console.log('Seconds changed:', secondsInput.value);
        if (isPlaying) {
            restartSlideshow();
        }
    });

    // Show image function
    function showImage(index) {
        if (imageFiles.length === 0) return;
        
        currentImageIndex = index;
        const file = imageFiles[index];
        console.log('Showing image:', file.name);
        
        const url = URL.createObjectURL(file);
        imageElement.src = url;

        // Clean up previous URL
        imageElement.onload = function() {
            URL.revokeObjectURL(this.src);
        };

        console.log(`Showing image ${index + 1} of ${imageFiles.length}`);
    }

    // Process image files
    function processImageFiles(files) {
        const validFiles = files.filter(file => file.type.startsWith('image/'));
        console.log('Found valid images:', validFiles.length);

        if (validFiles.length > 0) {
            // Store all files in the master list
            originalImageFiles = validFiles;
            
            // Generate the first playlist from the master list
            generatePlaylist();

            if (isPlaying) {
                pause();
            }

            // Try to find the last played image to start from there
            if (playLog.lastPlayed) {
                const lastIndex = imageFiles.findIndex(file => file.name === playLog.lastPlayed);
                if (lastIndex !== -1) {
                    currentImageIndex = lastIndex;
                }
            }
            
            showImage(currentImageIndex);
            resetTimer();
        }
    }

    // Navigation buttons 
    prevButton.onclick = () => navigateImage(-1);
    nextButton.onclick = () => navigateImage(1);

    // Folder button click handler
    folderButton.onclick = async function() {
        try {
            dirHandle = await window.showDirectoryPicker();
            folderPathInput.value = dirHandle.name;
            const files = []; 
            
            // Initialize log first
            await initializeLog();
            
            // Then collect files
            async function getFilesRecursively(handle) {
                for await (const entry of handle.values()) {
                    if (entry.kind === 'file' && !entry.name.endsWith('slideshow_log.json')) {
                        const file = await entry.getFile();
                        files.push(file);
                    } else if (entry.kind === 'directory') {
                        await getFilesRecursively(entry);
                    }  
                }
            }

            await getFilesRecursively(dirHandle);
            processImageFiles(files);
            
            // Start from last played image if exists
            if (playLog.lastPlayed && imageFiles.length > 0) {
                const lastIndex = imageFiles.findIndex(file => file.name === playLog.lastPlayed);
                if (lastIndex !== -1) {
                    currentImageIndex = lastIndex;
                    showImage(currentImageIndex);
                }
            }
            
        } catch (err) {
            console.log('Folder selection cancelled or error:', err);
            folderPathInput.value = 'No folder selected';
        }
    };

    // --- Event Listener for Quick Time Radio Buttons ---
    quickTimeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // "this" refers to the selected radio button
            if (this.checked) {
                // Get the time values from the data attributes
                const minutes = this.dataset.minutes;
                const seconds = this.dataset.seconds;

                // Update the input fields
                minutesInput.value = minutes;
                secondsInput.value = seconds;

                // Call resetTimer() to apply the change immediately
                resetTimer();
            }
        });
    });

    // --- Event Listener for Page Visibility ---
    // If the slideshow is playing, re-acquire the lock when the user switches back to the tab.
    document.addEventListener('visibilitychange', async () => {
    // Check if the page is visible, if the wakeLock is null, and if the slideshow is in a playing state.
    if (wakeLock === null && document.visibilityState === 'visible' && isPlaying) {
        console.log('Page is visible, re-acquiring wake lock');
        await requestWakeLock();
    }
    });

    updateSessionLogDisplay();

    // Add this event listener to save the log when the user closes the tab
    window.addEventListener('beforeunload', (event) => {
        // We only need to save if there's a valid log file handle
        if (logFileHandle) {
            saveLog();
        }
    });

    updateSessionLogDisplay();
}); 