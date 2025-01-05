document.addEventListener('DOMContentLoaded', function() {
    console.log('Script loaded and running');

    // Get DOM elements
    const dropZone = document.getElementById('drop-zone');
    const folderButton = document.getElementById('folder-button');
    const imageElement = document.getElementById('current-image');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const playPauseButton = document.getElementById('play-pause');
    const minutesInput = document.getElementById('minutes');
    const secondsInput = document.getElementById('seconds');
    const timerDisplay = document.getElementById('timer');
    const folderPathInput = document.getElementById('folder-path');

    // State variables
    let imageFiles = [];
    let currentImageIndex = 0;
    let timerInterval = null;
    let isPlaying = false;
    let dirHandle = null;  // Store directory handle
    let logFileHandle = null;  // Store log file handle
    let playLog = {
        lastPlayed: null,
        playCount: {}
    };

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
        saveLog();
    }

    // Timer control functions
    let displayDuration = 0;  // Track how long current image has been displayed

    function startSlideshow() {
        if (imageFiles.length === 0) {
            console.log('No images to display');
            return;
        }

        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        const totalSeconds = minutes * 60 + seconds;

        if (totalSeconds <= 0) {
            console.log('Please set a valid time');
            return;
        }

        console.log(`Starting slideshow with interval: ${minutes}m ${seconds}s`);
        isPlaying = true;
        playPauseButton.textContent = 'Pause';

        let remainingSeconds = totalSeconds;
        displayDuration = 0;
        updateTimerDisplay(remainingSeconds);

        timerInterval = setInterval(() => {
            remainingSeconds--;
            displayDuration++;
            updateTimerDisplay(remainingSeconds);

            if (remainingSeconds <= 0) {
                // Record play count if displayed for more than 30 seconds
                if (displayDuration >= 30) {
                    recordPlayCount(imageFiles[currentImageIndex].name);
                }
                
                // Move to next image
                currentImageIndex = (currentImageIndex + 1) % imageFiles.length;
                showImage(currentImageIndex);
                // Reset timers
                remainingSeconds = totalSeconds;
                displayDuration = 0;
            }
        }, 1000);
    }

    function stopSlideshow() {
        console.log('Stopping slideshow');
        isPlaying = false;
        playPauseButton.textContent = 'Play';
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function updateTimerDisplay(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        console.log('Timer updated:', timerDisplay.textContent);
    }

    // Play/Pause button handler
    playPauseButton.addEventListener('click', () => {
        console.log('Play/Pause clicked, current state:', isPlaying);
        if (isPlaying) {
            stopSlideshow();
        } else {
            startSlideshow();
        }
    });

    // Time input handlers
    minutesInput.addEventListener('change', () => {
        console.log('Minutes changed:', minutesInput.value);
        if (isPlaying) {
            stopSlideshow();
            startSlideshow();
        }
    });

    secondsInput.addEventListener('change', () => {
        console.log('Seconds changed:', secondsInput.value);
        if (isPlaying) {
            stopSlideshow();
            startSlideshow();
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
        console.log('Processing files:', files.length);
        const validFiles = files.filter(file => {
            console.log('Checking file:', file.name, 'type:', file.type);
            return file.type.startsWith('image/');
        });
        
        console.log('Found valid images:', validFiles.length);
        
        if (validFiles.length > 0) {
            imageFiles = validFiles;
            showImage(0);
            // Stop any existing slideshow
            if (isPlaying) {
                stopSlideshow();
                startSlideshow();
            }
        }
    }

    // Navigation buttons
    prevButton.onclick = function() {
        if (imageFiles.length === 0) return;
        if (displayDuration >= 30) {
            recordPlayCount(imageFiles[currentImageIndex].name);
        }
        let newIndex = currentImageIndex - 1;
        if (newIndex < 0) newIndex = imageFiles.length - 1;
        showImage(newIndex);
        if (isPlaying) {
            stopSlideshow();
            startSlideshow();
        }
        displayDuration = 0;
    };

    nextButton.onclick = function() {
        if (imageFiles.length === 0) return;
        if (displayDuration >= 30) {
            recordPlayCount(imageFiles[currentImageIndex].name);
        }
        let newIndex = currentImageIndex + 1;
        if (newIndex >= imageFiles.length) newIndex = 0;
        showImage(newIndex);
        if (isPlaying) {
            stopSlideshow();
            startSlideshow();
        }
        displayDuration = 0;
    };

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

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
        console.log('Drop event occurred');

        const items = Array.from(e.dataTransfer.items);
        console.log('Dropped items:', items.length);

        let files = [];
        let pendingDirectories = 0;

        function handleEntry(entry) {
            if (entry.isFile) {
                entry.file((file) => {
                    console.log('Found file:', file.name);
                    files.push(file);
                    if (pendingDirectories === 0) {
                        processImageFiles(files);
                    }
                });
            } else if (entry.isDirectory) {
                pendingDirectories++;
                const reader = entry.createReader();
                
                function readNextBatch() {
                    reader.readEntries((entries) => {
                        if (entries.length > 0) {
                            entries.forEach(handleEntry);
                            readNextBatch(); // Continue reading if there might be more entries
                        } else {
                            pendingDirectories--;
                            if (pendingDirectories === 0) {
                                console.log('All directories processed, total files:', files.length);
                                processImageFiles(files);
                            }
                        }
                    }, (error) => {
                        console.error('Error reading directory:', error);
                        pendingDirectories--;
                        if (pendingDirectories === 0) {
                            processImageFiles(files);
                        }
                    });
                }
                
                readNextBatch();
            }
        }

        for (const item of items) {
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    console.log('Processing entry:', entry.name, 'isDirectory:', entry.isDirectory);
                    handleEntry(entry);
                }
            }
        }
    });
}); 