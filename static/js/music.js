document.addEventListener('DOMContentLoaded', function () {
    // Elementleri seç
    const audioPlayer = document.getElementById('audioPlayer');
    const audioFileInput = document.getElementById('audioFileInput');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const repeatBtn = document.getElementById('repeatBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const progressBar = document.getElementById('progressBar');
    const currentTrackDisplay = document.getElementById('currentTrack');
    const trackDuration = document.getElementById('trackDuration');
    const playlist = document.getElementById('playlist');
    const playlistCount = document.getElementById('playlistCount');

    // Tema kontrolü
    const themeSelect = document.getElementById('musicThemeSelect');
    if (themeSelect) {
        themeSelect.addEventListener('change', function () {
            document.documentElement.setAttribute('data-theme', this.value);
            localStorage.setItem('musicTheme', this.value);
        });

        const savedTheme = localStorage.getItem('musicTheme') || 'light';
        themeSelect.value = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Çalma listesi ve durum değişkenleri
    let playlistItems = [];
    let currentTrackIndex = 0;
    let isRepeat = false;

    // Yerel depolamadan çalma listesini yükle
    function loadPlaylist() {
        const savedPlaylist = localStorage.getItem('audioPlaylist');
        if (savedPlaylist) {
            playlistItems = JSON.parse(savedPlaylist);
            playlistItems.forEach((item, index) => {
                addToPlaylistUI(item.name, index);
            });
            updatePlaylistCount();
        }
    }

    // Çalma listesini kaydet
    function savePlaylist() {
        localStorage.setItem('audioPlaylist', JSON.stringify(playlistItems));
    }

    // Müzik dosyası ekleme
    audioFileInput.addEventListener('change', function (e) {
        const files = Array.from(e.target.files);

        files.forEach(file => {
            if (file.type.startsWith('audio/')) {
                const url = URL.createObjectURL(file);
                playlistItems.push({
                    name: file.name,
                    url: url
                });
                addToPlaylistUI(file.name, playlistItems.length - 1);
            }
        });

        updatePlaylistCount();
        savePlaylist();

        if (playlistItems.length === 1) {
            loadTrack(0);
        }
    });

    // Playlist UI'a şarkı ekleme
    function addToPlaylistUI(name, index) {
        const item = document.createElement('div');
        item.className = 'playlist-item';
        item.innerHTML = `
            <div class="track-info">
                <i class="fas fa-music"></i>
                <span>${name}</span>
            </div>
        `;

        item.addEventListener('click', () => {
            loadTrack(index);
            audioPlayer.play();
        });
        playlist.appendChild(item);
    }

    // Şarkı yükleme
    function loadTrack(index) {
        if (playlistItems[index]) {
            currentTrackIndex = index;
            audioPlayer.src = playlistItems[index].url;
            currentTrackDisplay.textContent = playlistItems[index].name;
            highlightActiveTrack();
        }
    }

    // Aktif şarkıyı vurgulama
    function highlightActiveTrack() {
        const items = playlist.getElementsByClassName('playlist-item');
        Array.from(items).forEach((item, index) => {
            item.classList.toggle('active', index === currentTrackIndex);
        });
    }

    // Oynat/Duraklat
    playPauseBtn.addEventListener('click', function () {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            audioPlayer.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    });

    // Durdur
    stopBtn.addEventListener('click', function () {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    });

    // Önceki şarkı
    prevBtn.addEventListener('click', function () {
        if (currentTrackIndex > 0) {
            loadTrack(currentTrackIndex - 1);
            audioPlayer.play();
        }
    });

    // Sonraki şarkı
    nextBtn.addEventListener('click', function () {
        if (currentTrackIndex < playlistItems.length - 1) {
            loadTrack(currentTrackIndex + 1);
            audioPlayer.play();
        }
    });

    // Tekrarlama
    repeatBtn.addEventListener('click', function () {
        isRepeat = !isRepeat;
        repeatBtn.classList.toggle('active');
        audioPlayer.loop = isRepeat;
    });

    // Ses kontrolü
    volumeSlider.addEventListener('input', function () {
        audioPlayer.volume = this.value / 100;
    });

    // İlerleme çubuğu güncelleme
    audioPlayer.addEventListener('timeupdate', function () {
        const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
        progressBar.style.width = progress + '%';
        updateTrackDuration();
    });

    // Süre gösterimi güncelleme
    function updateTrackDuration() {
        const current = formatTime(audioPlayer.currentTime);
        const total = formatTime(audioPlayer.duration);
        trackDuration.textContent = `${current} / ${total}`;
    }

    // Süre formatı
    function formatTime(seconds) {
        if (isNaN(seconds)) return "00:00";
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Playlist sayacı güncelleme
    function updatePlaylistCount() {
        playlistCount.textContent = `${playlistItems.length} şarkı`;
    }

    // Şarkı bittiğinde
    audioPlayer.addEventListener('ended', function () {
        if (!isRepeat && currentTrackIndex < playlistItems.length - 1) {
            loadTrack(currentTrackIndex + 1);
            audioPlayer.play();
        }
    });

    // Başlangıçta çalma listesini yükle
    loadPlaylist();
}); 