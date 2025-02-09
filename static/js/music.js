document.addEventListener('DOMContentLoaded', function () {
    // Tema değiştirme
    const themeSelect = document.getElementById('musicThemeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', function () {
            document.documentElement.setAttribute('data-theme', this.value);
            localStorage.setItem('musicTheme', this.value);
        });

        // Kaydedilmiş temayı yükle
        const savedTheme = localStorage.getItem('musicTheme') || 'light';
        themeSelect.value = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // YouTube API'sini yükle
    let tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    let firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    // Müzik çalar değişkenleri
    let player;
    let currentVideoId = null;
    let playlist = [];
    let currentTrackIndex = 0;
    let isShuffled = false;
    let repeatMode = 'none'; // none, one, all

    // DOM elementleri
    const playBtn = document.getElementById('playBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const progressBar = document.querySelector('.progress-bar');
    const progress = document.querySelector('.progress');
    const currentTimeEl = document.getElementById('currentTime');
    const totalTimeEl = document.getElementById('totalTime');
    const playlistEl = document.getElementById('playlist');
    const searchInput = document.getElementById('searchMusic');
    const addMusicBtn = document.getElementById('addMusicBtn');

    // Mini player elementleri
    const miniPlayer = document.getElementById('miniPlayer');
    const miniPlayBtn = document.getElementById('miniPlayBtn');
    const miniNextBtn = document.getElementById('miniNextBtn');

    // YouTube Modal İşlemleri
    const youtubeModal = document.getElementById('youtubeModal');
    const addYoutubeBtn = document.getElementById('addYoutubeBtn');
    const modalClose = youtubeModal.querySelector('.modal-close');
    const youtubeUrl = document.getElementById('youtubeUrl');
    const checkVideo = document.getElementById('checkVideo');
    const addToPlaylist = document.getElementById('addToPlaylist');
    const videoPreview = document.getElementById('videoPreview');

    console.log('YouTube elementleri:', {
        youtubeModal,
        addYoutubeBtn,
        modalClose,
        youtubeUrl,
        checkVideo,
        addToPlaylist,
        videoPreview
    });

    // Global fonksiyon olarak tanımla
    window.onYouTubeIframeAPIReady = function () {
        player = new YT.Player('youtubePlayer', {
            height: '100%',
            width: '100%',
            videoId: '',
            playerVars: {
                'playsinline': 1,
                'controls': 0,
                'rel': 0
            },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
    };

    // Player hazır olduğunda
    function onPlayerReady(event) {
        // Kaydedilmiş playlist'i yükle
        loadSavedPlaylist();

        // Volume slider'ı ayarla
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value;
            player.setVolume(volume);
            document.querySelector('.volume-tooltip').textContent = `${volume}%`;
        });
    }

    // Player durumu değiştiğinde
    function onPlayerStateChange(event) {
        const playBtn = document.getElementById('playBtn');
        const miniPlayBtn = document.getElementById('miniPlayBtn');

        if (event.data === YT.PlayerState.PLAYING) {
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            miniPlayBtn.innerHTML = '<i class="fas fa-pause"></i>';
            startProgressUpdate();
        } else if (event.data === YT.PlayerState.PAUSED) {
            playBtn.innerHTML = '<i class="fas fa-play"></i>';
            miniPlayBtn.innerHTML = '<i class="fas fa-play"></i>';
            stopProgressUpdate();
        } else if (event.data === YT.PlayerState.ENDED) {
            handleVideoEnd();
        }
    }

    // Video bittiğinde
    function handleVideoEnd() {
        if (repeatMode === 'one') {
            player.playVideo();
        } else if (repeatMode === 'all') {
            playNext();
        } else if (currentTrackIndex < playlist.length - 1) {
            playNext();
        }
    }

    // Progress bar güncelleme
    let progressInterval;
    function startProgressUpdate() {
        progressInterval = setInterval(updateProgress, 1000);
    }

    function stopProgressUpdate() {
        clearInterval(progressInterval);
    }

    function updateProgress() {
        if (player && player.getCurrentTime && player.getDuration) {
            const currentTime = player.getCurrentTime();
            const duration = player.getDuration();
            const progress = (currentTime / duration) * 100;

            document.querySelector('.progress').style.width = `${progress}%`;
            document.getElementById('currentTime').textContent = formatTime(currentTime);
            document.getElementById('totalTime').textContent = formatTime(duration);
        }
    }

    // Video bilgilerini al
    async function getVideoDetails(videoId) {
        try {
            console.log('getVideoDetails çağrıldı, videoId:', videoId);

            const response = await fetch('/api/youtube/video-info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoId })
            });

            console.log('API yanıtı:', response);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API hatası:', errorText);
                throw new Error(`Video bilgileri alınamadı: ${errorText}`);
            }

            const data = await response.json();
            console.log('API verisi:', data);

            return {
                title: data.title,
                channelTitle: data.channelTitle,
                thumbnail: data.thumbnail,
                duration: formatDuration(data.duration),
                viewCount: data.viewCount,
                likeCount: data.likeCount
            };
        } catch (error) {
            console.error('getVideoDetails hatası:', error);
            throw error;
        }
    }

    // ISO 8601 süre formatını dönüştür
    function formatDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);

        const hours = (match[1] || '').replace('H', '');
        const minutes = (match[2] || '').replace('M', '');
        const seconds = (match[3] || '').replace('S', '');

        let result = '';

        if (hours) {
            result += `${hours}:`;
        }

        result += `${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;

        return result;
    }

    // YouTube URL'sinden video ID çıkar
    function getYouTubeVideoId(url) {
        console.log('URL kontrol ediliyor:', url);
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        const videoId = match ? match[1] : null;
        console.log('Bulunan video ID:', videoId);
        return videoId;
    }

    // Playlist'e video ekle
    async function addVideoToPlaylist(videoId) {
        try {
            console.log('addVideoToPlaylist çağrıldı, videoId:', videoId);
            const details = await getVideoDetails(videoId);
            console.log('Video detayları alındı:', details);

            const video = {
                id: videoId,
                title: details.title,
                artist: details.channelTitle,
                thumbnail: details.thumbnail,
                duration: details.duration
            };

            console.log('Playlist\'e eklenecek video:', video);
            playlist.push(video);
            savePlaylist();
            renderPlaylist();
            updatePlaylistCount();

            if (playlist.length === 1) {
                console.log('İlk video eklendi, oynatılıyor...');
                playTrack(0);
            }
        } catch (error) {
            console.error('addVideoToPlaylist hatası:', error);
            throw error;
        }
    }

    // Playlist'i kaydet
    function savePlaylist() {
        localStorage.setItem('musicPlaylist', JSON.stringify(playlist));
    }

    // Kaydedilmiş playlist'i yükle
    function loadSavedPlaylist() {
        const saved = localStorage.getItem('musicPlaylist');
        if (saved) {
            playlist = JSON.parse(saved);
            renderPlaylist();
            updatePlaylistCount();
        }
    }

    // Playlist'i görüntüle
    function renderPlaylist() {
        const playlistEl = document.getElementById('playlist');
        playlistEl.innerHTML = '';

        playlist.forEach((track, index) => {
            const item = document.createElement('div');
            item.className = `playlist-item ${index === currentTrackIndex ? 'active' : ''}`;
            item.innerHTML = `
                <img src="${track.thumbnail}" alt="${track.title}">
                <div class="playlist-item-info">
                    <span class="playlist-item-title">${track.title}</span>
                    <span class="playlist-item-artist">${track.artist}</span>
                </div>
                <span class="playlist-item-duration">${track.duration}</span>
            `;
            item.addEventListener('click', () => playTrack(index));
            playlistEl.appendChild(item);
        });
    }

    // Playlist sayısını güncelle
    function updatePlaylistCount() {
        document.getElementById('playlistCount').textContent = `${playlist.length} şarkı`;
    }

    // Şarkı çal
    function playTrack(index) {
        currentTrackIndex = index;
        const track = playlist[index];

        if (track) {
            player.loadVideoById(track.id);
            updateTrackInfo(track);
            renderPlaylist();
        }
    }

    // Şarkı bilgilerini güncelle
    function updateTrackInfo(track) {
        document.getElementById('trackTitle').textContent = track.title;
        document.getElementById('artistName').textContent = track.artist;
        document.getElementById('miniTrackTitle').textContent = track.title;
        document.getElementById('miniArtistName').textContent = track.artist;
        document.getElementById('miniThumbnail').src = track.thumbnail;
    }

    // Kontroller
    document.getElementById('playBtn').addEventListener('click', togglePlay);
    document.getElementById('miniPlayBtn').addEventListener('click', togglePlay);
    document.getElementById('prevBtn').addEventListener('click', playPrevious);
    document.getElementById('nextBtn').addEventListener('click', playNext);
    document.getElementById('miniNextBtn').addEventListener('click', playNext);
    document.getElementById('shuffleBtn').addEventListener('click', toggleShuffle);
    document.getElementById('repeatBtn').addEventListener('click', toggleRepeat);

    // YouTube modal kontrolleri
    addYoutubeBtn.addEventListener('click', () => {
        console.log('YouTube modal açılıyor');
        youtubeModal.classList.add('show');
        youtubeUrl.focus();
    });

    modalClose.addEventListener('click', () => {
        console.log('YouTube modal kapanıyor');
        youtubeModal.classList.remove('show');
        youtubeUrl.value = '';
        videoPreview.style.display = 'none';
        addToPlaylist.disabled = true;
    });

    // Modal dışına tıklandığında kapatma
    youtubeModal.addEventListener('click', (e) => {
        if (e.target === youtubeModal) {
            youtubeModal.classList.remove('show');
            youtubeUrl.value = '';
            videoPreview.style.display = 'none';
            addToPlaylist.disabled = true;
        }
    });

    // ESC tuşu ile modalı kapatma
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && youtubeModal.classList.contains('show')) {
            youtubeModal.classList.remove('show');
            youtubeUrl.value = '';
            videoPreview.style.display = 'none';
            addToPlaylist.disabled = true;
        }
    });

    checkVideo.addEventListener('click', async () => {
        console.log('Video kontrol ediliyor');
        const url = youtubeUrl.value.trim();
        const videoId = getYouTubeVideoId(url);

        if (videoId) {
            try {
                const videoDetails = await getVideoDetails(videoId);
                console.log('Video detayları:', videoDetails);
                displayVideoPreview(videoDetails);
                addToPlaylist.disabled = false;
            } catch (error) {
                console.error('Video detayları alınamadı:', error);
                alert('Video bilgileri alınamadı. Lütfen URL\'yi kontrol edin.');
            }
        } else {
            alert('Geçerli bir YouTube URL\'si giriniz.');
        }
    });

    addToPlaylist.addEventListener('click', async () => {
        console.log('Playlist\'e video ekleniyor');
        const url = youtubeUrl.value.trim();
        const videoId = getYouTubeVideoId(url);

        if (videoId) {
            try {
                const videoDetails = await getVideoDetails(videoId);
                addVideoToPlaylist(videoId);
                youtubeModal.classList.remove('show');
                youtubeUrl.value = '';
                videoPreview.style.display = 'none';
                addToPlaylist.disabled = true;
            } catch (error) {
                console.error('Video eklenirken hata:', error);
                alert('Video eklenirken bir hata oluştu.');
            }
        }
    });

    // Yardımcı fonksiyonlar
    function togglePlay() {
        if (player) {
            const state = player.getPlayerState();
            if (state === YT.PlayerState.PLAYING) {
                player.pauseVideo();
            } else {
                player.playVideo();
            }
        }
    }

    function playNext() {
        if (isShuffled) {
            const nextIndex = Math.floor(Math.random() * playlist.length);
            playTrack(nextIndex);
        } else {
            const nextIndex = (currentTrackIndex + 1) % playlist.length;
            playTrack(nextIndex);
        }
    }

    function playPrevious() {
        if (currentTrackIndex > 0) {
            playTrack(currentTrackIndex - 1);
        }
    }

    function toggleShuffle() {
        isShuffled = !isShuffled;
        document.getElementById('shuffleBtn').classList.toggle('active');
    }

    function toggleRepeat() {
        const modes = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(repeatMode);
        repeatMode = modes[(currentIndex + 1) % modes.length];

        const repeatBtn = document.getElementById('repeatBtn');
        repeatBtn.classList.toggle('active', repeatMode !== 'none');
        if (repeatMode === 'one') {
            repeatBtn.innerHTML = '<i class="fas fa-redo-alt"></i>';
        } else {
            repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
        }
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Arama ve sıralama
    document.getElementById('searchMusic').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const items = document.querySelectorAll('.playlist-item');

        items.forEach(item => {
            const title = item.querySelector('.playlist-item-title').textContent.toLowerCase();
            const artist = item.querySelector('.playlist-item-artist').textContent.toLowerCase();

            if (title.includes(searchTerm) || artist.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    document.getElementById('sortPlaylist').addEventListener('change', (e) => {
        const sortType = e.target.value;

        switch (sortType) {
            case 'date-desc':
                // En son eklenenler
                playlist.reverse();
                break;
            case 'date-asc':
                // İlk eklenenler
                playlist = [...playlist].reverse();
                break;
            case 'name-asc':
                playlist.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'name-desc':
                playlist.sort((a, b) => b.title.localeCompare(a.title));
                break;
        }

        savePlaylist();
        renderPlaylist();
    });

    // Başlangıç yüklemesi
    loadSavedPlaylist();

    // Video önizleme gösterme fonksiyonu
    function displayVideoPreview(details) {
        console.log('Video önizleme gösteriliyor:', details);
        const thumbnailPreview = document.getElementById('thumbnailPreview');
        const videoTitle = document.getElementById('videoTitle');
        const channelTitle = document.getElementById('channelTitle');
        const videoDuration = document.getElementById('videoDuration');

        videoPreview.style.display = 'grid';
        thumbnailPreview.src = details.thumbnail;
        videoTitle.textContent = details.title;
        channelTitle.textContent = details.channelTitle;
        videoDuration.textContent = details.duration;
    }
}); 