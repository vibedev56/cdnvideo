document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('video');
    const playPauseButton = document.getElementById('play-pause');
    const fullscreenButton = document.getElementById('fullscreen');
    const currentTimeDisplay = document.getElementById('current-time');
    const durationDisplay = document.getElementById('duration');
    const progressBar = document.querySelector('.progress-bar');
    const progressFilled = document.querySelector('.progress-filled');
    const bufferedBar = document.querySelector('.buffered-bar');
    const videoWrapper = document.querySelector('.video-wrapper');
    const customControls = document.querySelector('.custom-controls');
    const currentPositionDisplay = document.getElementById('current-position');
    const bufferLengthDisplay = document.getElementById('buffer-length');
    
    const videoSrc = 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8';
    
    if (Hls.isSupported()) {
        const hls = new Hls({
            maxBufferLength: 30,
            maxMaxBufferLength: 60,
            maxBufferSize: 60 * 1000 * 1000,
            maxBufferHole: 0.5,
            lowBufferWatchdogPeriod: 0.5,
            highBufferWatchdogPeriod: 3
        });
        
        hls.loadSource(videoSrc);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
            console.log('HLS manifest loaded');
            playPauseButton.classList.add('paused');
            
            setInterval(updateBufferInfo, 1000);
        });
        
        hls.on(Hls.Events.ERROR, function(event, data) {
            console.error('HLS error:', data);
            
            if (data.fatal) {
                switch(data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        console.log('Fatal network error encountered, trying to recover...');
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.log('Fatal media error encountered, trying to recover...');
                        hls.recoverMediaError();
                        break;
                    default:
                        console.log('Fatal error, cannot recover');
                        hls.destroy();
                        break;
                }
            } else {
                if (data.type === Hls.ErrorTypes.MEDIA_ERROR && 
                    data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
                    console.log('Buffer stalled, attempting to recover...');
                    if (video.currentTime < video.duration - 0.5) {
                        video.currentTime += 0.1;
                    }
                }
            }
        });
        
        hls.on(Hls.Events.LEVEL_SWITCHED, function(event, data) {
            console.log('Quality level switched to:', data.level);
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoSrc;
        video.addEventListener('loadedmetadata', function() {
            console.log('Native HLS support');
            playPauseButton.classList.add('paused');
        });
    }
    
    playPauseButton.addEventListener('click', togglePlayPause);
    video.addEventListener('click', togglePlayPause);
    
    function togglePlayPause() {
        if (video.paused || video.ended) {
            video.play();
            playPauseButton.classList.remove('paused');
            playPauseButton.classList.add('playing');
        } else {
            video.pause();
            playPauseButton.classList.remove('playing');
            playPauseButton.classList.add('paused');
        }
    }
    
    video.addEventListener('timeupdate', updateTimeDisplay);
    video.addEventListener('durationchange', updateTimeDisplay);
    
    function updateTimeDisplay() {
        const currentTime = formatTime(video.currentTime);
        const duration = formatTime(video.duration);
        
        currentTimeDisplay.textContent = currentTime;
        durationDisplay.textContent = duration;
        currentPositionDisplay.textContent = currentTime;
        
        const percent = (video.currentTime / video.duration) * 100;
        progressFilled.style.width = `${percent}%`;
    }
    
    function updateBufferInfo() {
        if (video.buffered.length > 0) {
            const bufferedEnd = video.buffered.end(video.buffered.length - 1);
            const duration = video.duration;
            const bufferedPercent = (bufferedEnd / duration) * 100;
            
            bufferedBar.style.width = `${bufferedPercent}%`;
            
            const bufferLength = bufferedEnd - video.currentTime;
            bufferLengthDisplay.textContent = `${bufferLength.toFixed(1)} сек`;
        }
    }
    
    progressBar.addEventListener('click', seek);
    
    function seek(e) {
        const progressBarRect = progressBar.getBoundingClientRect();
        const seekTime = ((e.clientX - progressBarRect.left) / progressBarRect.width) * video.duration;
        video.currentTime = seekTime;
    }
    
    fullscreenButton.addEventListener('click', toggleFullscreen);
    
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            if (videoWrapper.requestFullscreen) {
                videoWrapper.requestFullscreen();
            } else if (videoWrapper.webkitRequestFullscreen) {
                videoWrapper.webkitRequestFullscreen();
            } else if (videoWrapper.msRequestFullscreen) {
                videoWrapper.msRequestFullscreen();
            }
            videoWrapper.classList.add('fullscreen');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            videoWrapper.classList.remove('fullscreen');
        }
    }
    
    document.addEventListener('fullscreenchange', updateFullscreenStatus);
    document.addEventListener('webkitfullscreenchange', updateFullscreenStatus);
    document.addEventListener('mozfullscreenchange', updateFullscreenStatus);
    document.addEventListener('MSFullscreenChange', updateFullscreenStatus);
    
    function updateFullscreenStatus() {
        if (document.fullscreenElement) {
            videoWrapper.classList.add('fullscreen');
        } else {
            videoWrapper.classList.remove('fullscreen');
        }
    }
    
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    
    videoWrapper.addEventListener('mousemove', showControls);
    videoWrapper.addEventListener('mouseleave', hideControls);
    
    let controlsTimeout;
    
    function showControls() {
        customControls.classList.add('active');
        clearTimeout(controlsTimeout);
        
        controlsTimeout = setTimeout(hideControls, 3000);
    }
    
    function hideControls() {
        if (!video.paused) {
            customControls.classList.remove('active');
        }
    }
    
    video.addEventListener('ended', function() {
        playPauseButton.classList.remove('playing');
        playPauseButton.classList.add('paused');
    });
    
    video.addEventListener('waiting', function() {
        console.log('Video is waiting for more data...');
    });
    
    video.addEventListener('stalled', function() {
        console.log('Video playback has stalled');
        if (video.currentTime < video.duration - 0.5) {
            setTimeout(() => {
                video.currentTime += 0.1;
            }, 1000);
        }
    });
});