document.addEventListener('DOMContentLoaded', function () {
    // Mod değiştirme işlemleri
    const modeSwitch = document.getElementById('modeSwitch');
    const clockDisplay = document.getElementById('clockDisplay');
    const pomodoroDisplay = document.getElementById('pomodoroDisplay');
    let currentMode = 'clock'; // 'clock' veya 'pomodoro'

    // İlk yükleme için görünürlük ayarları
    clockDisplay.style.display = 'flex';
    pomodoroDisplay.style.display = 'none';

    modeSwitch.addEventListener('click', () => {
        if (currentMode === 'clock') {
            clockDisplay.style.display = 'none';
            pomodoroDisplay.style.display = 'flex';
            modeSwitch.innerHTML = '<i class="fas fa-clock"></i><span>Saat</span>';
            currentMode = 'pomodoro';
        } else {
            clockDisplay.style.display = 'flex';
            pomodoroDisplay.style.display = 'none';
            modeSwitch.innerHTML = '<i class="fas fa-clock"></i><span>Pomodoro</span>';
            currentMode = 'clock';
        }
    });

    // Pomodoro işlemleri
    let pomodoroWorker;
    let pomodoroTime = 25 * 60; // 25 dakika
    let isBreak = false;
    const pomodoroTimer = document.querySelector('.pomodoro-timer');
    const startPomodoroBtn = document.getElementById('startPomodoro');
    const resetPomodoroBtn = document.getElementById('resetPomodoro');
    const workDurationInput = document.getElementById('workDuration');
    const breakDurationInput = document.getElementById('breakDuration');

    function updatePomodoroTimer() {
        const minutes = Math.floor(pomodoroTime / 60);
        const seconds = pomodoroTime % 60;
        pomodoroTimer.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        // Stil güncelleme
        pomodoroDisplay.classList.toggle('work', !isBreak);
        pomodoroDisplay.classList.toggle('break', isBreak);
    }

    let startTime = null;
    function startPomodoro() {
        if (!pomodoroWorker) {
            startTime = new Date(); // Başlangıç zamanını kaydet
            pomodoroWorker = new Worker('/static/js/time/pomodoro-worker.js');

            pomodoroWorker.onmessage = function (e) {
                if (e.data.type === 'tick') {
                    pomodoroTime = e.data.time;
                    updatePomodoroTimer();
                } else if (e.data.type === 'complete') {
                    const endTime = new Date();

                    // Aktiviteyi kaydet
                    pomodoroStats.addActivity(
                        isBreak ? 'break' : 'work',
                        startTime,
                        endTime
                    );

                    isBreak = !isBreak;
                    if (isBreak) {
                        pomodoroTime = breakDurationInput.value * 60;
                        new Notification('Çalışma süresi bitti!', {
                            body: 'Mola zamanı geldi.',
                            icon: '/static/img/notification.png'
                        });
                    } else {
                        pomodoroTime = workDurationInput.value * 60;
                        new Notification('Mola süresi bitti!', {
                            body: 'Çalışma zamanı geldi.',
                            icon: '/static/img/notification.png'
                        });
                    }

                    updatePomodoroTimer();
                    startPomodoro(); // Otomatik olarak sonraki aşamayı başlat
                }
            };

            pomodoroWorker.postMessage({ action: 'start', time: pomodoroTime });
            startPomodoroBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            pomodoroWorker.postMessage({ action: 'pause' });
            pomodoroWorker.terminate();
            pomodoroWorker = null;

            // Duraklatıldığında aktiviteyi kaydet
            if (startTime) {
                const endTime = new Date();
                pomodoroStats.addActivity(
                    isBreak ? 'break' : 'work',
                    startTime,
                    endTime
                );
                startTime = null;
            }

            startPomodoroBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    function resetPomodoro() {
        if (pomodoroWorker) {
            pomodoroWorker.terminate();
            pomodoroWorker = null;
        }
        isBreak = false;
        pomodoroTime = workDurationInput.value * 60;
        updatePomodoroTimer();
        startPomodoroBtn.innerHTML = '<i class="fas fa-play"></i>';
    }

    startPomodoroBtn.addEventListener('click', startPomodoro);
    resetPomodoroBtn.addEventListener('click', resetPomodoro);

    // Süre ayarlama butonları
    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            const target = btn.dataset.target;
            const input = document.getElementById(`${target}Duration`);
            const currentValue = parseInt(input.value);

            if (action === 'increase') {
                input.value = Math.min(currentValue + 1, parseInt(input.max));
            } else {
                input.value = Math.max(currentValue - 1, parseInt(input.min));
            }

            if (!pomodoroWorker && ((target === 'work' && !isBreak) || (target === 'break' && isBreak))) {
                pomodoroTime = input.value * 60;
                updatePomodoroTimer();
            }
        });
    });

    [workDurationInput, breakDurationInput].forEach(input => {
        input.addEventListener('change', () => {
            if (!pomodoroWorker && ((input.id === 'workDuration' && !isBreak) || (input.id === 'breakDuration' && isBreak))) {
                pomodoroTime = input.value * 60;
                updatePomodoroTimer();
            }
        });
    });

    // Saat gösterimi
    function updateTime() {
        const now = new Date();
        const use24Hour = document.getElementById('use24Hour').checked;
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        if (!use24Hour && hours > 12) {
            hours -= 12;
        }
        hours = String(hours).padStart(2, '0');

        document.getElementById('time').textContent = `${hours}:${minutes}`;
        document.getElementById('seconds').textContent = seconds;
    }

    // Her saniye saati güncelle
    updateTime();
    setInterval(updateTime, 1000);

    // Tab işlemleri
    const tabs = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    let activeTab = null;

    function toggleTab(tabId) {
        const targetTab = document.getElementById(tabId);
        const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);

        // Önceki aktif tab'ı kapat
        if (activeTab) {
            const currentTab = document.getElementById(activeTab);
            const currentBtn = document.querySelector(`[data-tab="${activeTab}"]`);
            currentTab.style.display = 'none';
            currentTab.classList.remove('active');
            currentBtn.classList.remove('active');
        }

        // Yeni tab'ı aç veya kapat
        if (activeTab !== tabId) {
            targetTab.style.display = 'block';
            targetTab.classList.add('active');
            targetBtn.classList.add('active');
            activeTab = tabId;
        } else {
            activeTab = null;
        }
    }

    // Tab dışına tıklandığında kapat
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.tab-content') && !e.target.closest('.nav-btn')) {
            if (activeTab) {
                const currentTab = document.getElementById(activeTab);
                const currentBtn = document.querySelector(`[data-tab="${activeTab}"]`);
                currentTab.style.display = 'none';
                currentTab.classList.remove('active');
                currentBtn.classList.remove('active');
                activeTab = null;
            }
        }
    });

    // ESC tuşuna basıldığında aktif tab'ı kapat
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeTab) {
            const currentTab = document.getElementById(activeTab);
            const currentBtn = document.querySelector(`[data-tab="${activeTab}"]`);
            currentTab.style.display = 'none';
            currentTab.classList.remove('active');
            currentBtn.classList.remove('active');
            activeTab = null;
        }
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleTab(tab.dataset.tab);
        });
    });

    // Özelleştirme işlemleri
    const timeDisplay = document.querySelector('.time-display');
    const seconds = document.getElementById('seconds');
    const showSeconds = document.getElementById('showSeconds');
    const use24Hour = document.getElementById('use24Hour');
    const fontSelect = document.getElementById('fontSelect');
    const fontWeight = document.getElementById('fontWeight');
    const letterSpacing = document.getElementById('letterSpacing');
    const colorPicker = document.getElementById('colorPicker');
    const secondsColorPicker = document.getElementById('secondsColorPicker');
    const opacity = document.getElementById('opacity');
    const sizeSlider = document.getElementById('sizeSlider');
    const secondsSize = document.getElementById('secondsSize');
    const effectIntensity = document.getElementById('effectIntensity');
    const animationScale = document.getElementById('animationScale');
    const colorPresets = document.querySelectorAll('.color-preset');
    const effectBtns = document.querySelectorAll('.effect-btn');
    const animationBtns = document.querySelectorAll('.animation-btn');
    const patternBgColorPicker = document.getElementById('patternBgColorPicker');

    // Temel ayarlar
    showSeconds.addEventListener('change', (e) => {
        seconds.classList.toggle('show', e.target.checked);
        saveSettings();
    });

    use24Hour.addEventListener('change', () => {
        updateTime();
        saveSettings();
    });

    // Yazı tipi ayarları
    fontSelect.addEventListener('change', (e) => {
        const selectedFont = e.target.value;

        // Google Fonts'tan font yükleme
        if (!document.querySelector(`link[href*="${selectedFont}"]`)) {
            const fontName = selectedFont.replace(/[']/g, '').split(',')[0].trim();
            const link = document.createElement('link');
            link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
            link.rel = 'stylesheet';
            document.head.appendChild(link);

            // Font yüklenene kadar bekle
            link.onload = () => {
                timeDisplay.style.fontFamily = `'${selectedFont}', sans-serif`;
                saveSettings();
            };
        } else {
            timeDisplay.style.fontFamily = `'${selectedFont}', sans-serif`;
            saveSettings();
        }
    });

    fontWeight.addEventListener('change', (e) => {
        timeDisplay.style.fontWeight = e.target.value;
        saveSettings();
    });

    letterSpacing.addEventListener('input', (e) => {
        timeDisplay.style.letterSpacing = `${e.target.value}px`;
        updateValueDisplay(e.target);
        saveSettings();
    });

    // Renk ayarları
    colorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        timeDisplay.style.color = color.startsWith('#') ? color : '#' + color.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
        saveSettings();
    });

    secondsColorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        seconds.style.color = color.startsWith('#') ? color : '#' + color.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
        saveSettings();
    });

    opacity.addEventListener('input', (e) => {
        timeDisplay.style.opacity = e.target.value / 100;
        updateValueDisplay(e.target, '%');
        saveSettings();
    });

    // Boyut ayarları
    function updateSize(value) {
        timeDisplay.style.fontSize = `${value}px`;
        sizeSlider.value = value;
        document.getElementById('sizeValue').textContent = `${value}px`;
        saveSettings();
    }

    sizeSlider.addEventListener('input', (e) => {
        updateSize(e.target.value);
    });

    secondsSize.addEventListener('input', (e) => {
        seconds.style.fontSize = `${e.target.value}%`;
        updateValueDisplay(e.target, '%');
        saveSettings();
    });

    document.getElementById('decreaseSize').addEventListener('click', () => {
        const currentSize = parseInt(sizeSlider.value);
        if (currentSize > parseInt(sizeSlider.min)) {
            updateSize(currentSize - 10);
        }
    });

    document.getElementById('increaseSize').addEventListener('click', () => {
        const currentSize = parseInt(sizeSlider.value);
        if (currentSize < parseInt(sizeSlider.max)) {
            updateSize(currentSize + 10);
        }
    });

    // Efekt ayarları
    let currentEffect = 'none';
    effectBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const effect = btn.dataset.effect;

            // Aktif efekt butonunu güncelle
            effectBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Önceki efekti kaldır
            timeDisplay.classList.remove(`effect-${currentEffect}`);
            pomodoroTimer.classList.remove(`effect-${currentEffect}`);

            // Yeni efekti uygula
            if (effect !== 'none') {
                timeDisplay.classList.add(`effect-${effect}`);
                pomodoroTimer.classList.add(`effect-${effect}`);
            }

            currentEffect = effect;
            saveSettings();
        });
    });

    effectIntensity.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--effect-intensity', e.target.value);
        updateValueDisplay(e.target);
        saveSettings();
    });

    // Animasyon ayarları
    let currentAnimation = 'none';
    animationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const animation = btn.dataset.animation;
            animationBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            timeDisplay.classList.remove(`animation-${currentAnimation}`);
            pomodoroTimer.classList.remove(`animation-${currentAnimation}`);

            if (animation !== 'none') {
                timeDisplay.classList.add(`animation-${animation}`);
                pomodoroTimer.classList.add(`animation-${animation}`);
            }

            currentAnimation = animation;
            saveSettings();
        });
    });

    animationScale.addEventListener('input', (e) => {
        const scale = e.target.value;
        document.documentElement.style.setProperty('--animation-scale', scale);
        updateValueDisplay(e.target);

        // Animasyonu yeniden başlat
        if (currentAnimation !== 'none') {
            timeDisplay.classList.remove(`animation-${currentAnimation}`);
            setTimeout(() => {
                timeDisplay.classList.add(`animation-${currentAnimation}`);
            }, 10);
        }

        saveSettings();
    });

    // Yardımcı fonksiyonlar
    function updateValueDisplay(input, suffix = '') {
        const display = input.parentElement.querySelector('.value-display');
        if (display) {
            display.textContent = input.value + suffix;
        }
    }

    // Arka plan ayarları
    const backgroundType = document.getElementById('backgroundType');
    const solidColorOption = document.getElementById('solidColorOption');
    const gradientOption = document.getElementById('gradientOption');
    const patternOption = document.getElementById('patternOption');
    const bgColorPicker = document.getElementById('bgColorPicker');
    const gradientStart = document.getElementById('gradientStart');
    const gradientEnd = document.getElementById('gradientEnd');
    const gradientDirection = document.getElementById('gradientDirection');
    const patternBtns = document.querySelectorAll('.pattern-btn');
    const patternColor = document.getElementById('patternColor');
    const patternSize = document.getElementById('patternSize');

    let currentPattern = 'none';

    backgroundType.addEventListener('change', (e) => {
        solidColorOption.style.display = 'none';
        gradientOption.style.display = 'none';
        patternOption.style.display = 'none';

        switch (e.target.value) {
            case 'solid':
                solidColorOption.style.display = 'block';
                updateBackground();
                break;
            case 'gradient':
                gradientOption.style.display = 'block';
                updateBackground();
                break;
            case 'pattern':
                patternOption.style.display = 'block';
                updateBackground();
                break;
        }
        saveSettings();
    });

    function updateBackground() {
        const container = document.querySelector('.time-container');
        container.classList.remove('pattern-dots', 'pattern-grid', 'pattern-lines', 'pattern-waves');
        container.style.background = '';
        container.style.backgroundImage = '';

        switch (backgroundType.value) {
            case 'theme':
                if (currentTheme !== 'none') {
                    applyTheme(currentTheme);
                }
                break;
            case 'solid':
                container.style.backgroundColor = bgColorPicker.value;
                break;
            case 'gradient':
                if (gradientDirection.value === 'circle') {
                    container.style.backgroundImage = `radial-gradient(circle, ${gradientStart.value}, ${gradientEnd.value})`;
                } else {
                    container.style.backgroundImage = `linear-gradient(${gradientDirection.value}, ${gradientStart.value}, ${gradientEnd.value})`;
                }
                break;
            case 'pattern':
                if (currentPattern !== 'none') {
                    // Arka plan rengini ayarla
                    container.style.backgroundColor = patternBgColorPicker.value;

                    // Desen için CSS değişkenlerini ayarla
                    document.documentElement.style.setProperty('--pattern-color', patternColor.value);
                    document.documentElement.style.setProperty('--pattern-size', `${patternSize.value}px`);

                    // Deseni ekle
                    let patternStyle;
                    switch (currentPattern) {
                        case 'dots':
                            patternStyle = `radial-gradient(var(--pattern-color) 2px, transparent 2px)`;
                            container.style.backgroundImage = patternStyle;
                            container.style.backgroundSize = `var(--pattern-size) var(--pattern-size)`;
                            break;
                        case 'grid':
                            patternStyle = `linear-gradient(to right, var(--pattern-color) 1px, transparent 1px),
                                          linear-gradient(to bottom, var(--pattern-color) 1px, transparent 1px)`;
                            container.style.backgroundImage = patternStyle;
                            container.style.backgroundSize = `var(--pattern-size) var(--pattern-size)`;
                            break;
                        case 'lines':
                            patternStyle = `linear-gradient(45deg, var(--pattern-color) 1px, transparent 1px)`;
                            container.style.backgroundImage = patternStyle;
                            container.style.backgroundSize = `var(--pattern-size) var(--pattern-size)`;
                            break;
                        case 'waves':
                            patternStyle = `radial-gradient(circle at 100% 50%, transparent 20%, var(--pattern-color) 21%, var(--pattern-color) 34%, transparent 35%, transparent),
                                          radial-gradient(circle at 0% 50%, transparent 20%, var(--pattern-color) 21%, var(--pattern-color) 34%, transparent 35%, transparent)`;
                            container.style.backgroundImage = patternStyle;
                            container.style.backgroundSize = `var(--pattern-size) var(--pattern-size)`;
                            break;
                    }
                }
                break;
            case 'image':
                if (currentImage) {
                    container.style.background = `url(${currentImage})`;
                    container.style.backgroundSize = imageFit.value;
                    container.style.backgroundPosition = 'center';
                    container.style.backgroundRepeat = 'no-repeat';
                    container.style.opacity = imageOpacity.value / 100;
                }
                break;
        }
    }

    [bgColorPicker, gradientStart, gradientEnd, gradientDirection, patternColor, patternSize, patternBgColorPicker].forEach(element => {
        element.addEventListener('input', () => {
            updateBackground();
            saveSettings();
        });
    });

    patternBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const pattern = btn.dataset.pattern;
            patternBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPattern = pattern;
            updateBackground();
            saveSettings();
        });
    });

    // Tema işlemleri
    const themeBtns = document.querySelectorAll('.theme-btn');
    let currentTheme = 'none';

    const themes = {
        'dark-minimal': {
            background: '#121212',
            color: '#ffffff',
            secondsColor: '#808080'
        },
        'dark-blue': {
            background: '#1a1b26',
            color: '#a9b1d6',
            secondsColor: '#7aa2f7'
        },
        'dark-purple': {
            background: '#1e1e2e',
            color: '#cdd6f4',
            secondsColor: '#cba6f7'
        },
        'dark-green': {
            background: '#1e2326',
            color: '#d4be98',
            secondsColor: '#a9b665'
        },
        'dark-red': {
            background: '#1f1f1f',
            color: '#e4b3b3',
            secondsColor: '#e95678'
        },
        'dark-ocean': {
            background: '#0f1419',
            color: '#a0b9d8',
            secondsColor: '#5ccfe6'
        },
        'dark-monochrome': {
            background: '#0d0d0d',
            color: '#d9d9d9',
            secondsColor: '#666666'
        },
        'dark-cyberpunk': {
            background: 'linear-gradient(45deg, #120458, #000000)',
            color: '#00ff9f',
            secondsColor: '#ff00ff'
        },
        'dark-matrix': {
            background: '#000000',
            color: '#00ff41',
            secondsColor: '#008f11'
        },
        'dark-synthwave': {
            background: 'linear-gradient(45deg, #241734, #2a1f3d)',
            color: '#ff61d8',
            secondsColor: '#7a5fff'
        },
        'dark-nord': {
            background: '#2e3440',
            color: '#eceff4',
            secondsColor: '#88c0d0'
        },
        'dark-dracula': {
            background: '#282a36',
            color: '#f8f8f2',
            secondsColor: '#bd93f9'
        },
        'dark-gruvbox': {
            background: '#282828',
            color: '#ebdbb2',
            secondsColor: '#b8bb26'
        },
        'dark-monokai': {
            background: '#272822',
            color: '#f8f8f2',
            secondsColor: '#a6e22e'
        },
        'dark-solarized': {
            background: '#002b36',
            color: '#839496',
            secondsColor: '#2aa198'
        },
        'light-minimal': {
            background: '#f5f5f5',
            color: '#333333',
            secondsColor: '#666666'
        },
        'modern-dark': {
            background: '#1f2937',
            color: '#f3f4f6',
            secondsColor: '#60a5fa'
        },
        'modern-light': {
            background: '#f3f4f6',
            color: '#1f2937',
            secondsColor: '#3b82f6'
        },
        'night-sky': {
            background: 'linear-gradient(45deg, #0f2027, #203a43, #2c5364)',
            color: '#e0e0e0',
            secondsColor: '#4a9fff'
        },
        'midnight-bloom': {
            background: 'linear-gradient(to right, #0f172a, #1e293b)',
            color: '#e2e8f0',
            secondsColor: '#38bdf8'
        },
        'deep-space': {
            background: 'linear-gradient(to right, #0a192f, #112240, #1a365d)',
            color: '#64ffda',
            secondsColor: '#5ccfee'
        },
        'nordic-frost': {
            background: 'linear-gradient(45deg, #E5E9F0, #ECEFF4)',
            color: '#2E3440',
            secondsColor: '#5E81AC'
        },
        'pastel-dream': {
            background: 'linear-gradient(45deg, #ffd1dc, #b8e1ff)',
            color: '#4a5568',
            secondsColor: '#805ad5'
        },
        'cherry-blossom': {
            background: 'linear-gradient(45deg, #ffd6e0, #ffb6c1)',
            color: '#800020',
            secondsColor: '#c71585'
        },
        'bamboo-forest': {
            background: 'linear-gradient(to right, #d4e4bc, #96b85c)',
            color: '#2d3a12',
            secondsColor: '#5a7324'
        },
        'autumn-breeze': {
            background: 'linear-gradient(45deg, #f9b17a, #f7ce68)',
            color: '#7c2d12',
            secondsColor: '#b45309'
        },
        'desert-night': {
            background: 'linear-gradient(45deg, #451952, #662549, #AE445A)',
            color: '#F39F5A',
            secondsColor: '#E8BCB9'
        },
        'neon-city': {
            background: 'linear-gradient(to right, #2a0e61, #ff1361)',
            color: '#00fff5',
            secondsColor: '#fff700'
        },
        'cyber': {
            background: 'linear-gradient(45deg, #000428, #004e92)',
            color: '#00ff00',
            secondsColor: '#ff00ff'
        },
        'retro': {
            background: 'linear-gradient(45deg, #c31432, #240b36)',
            color: '#ff00ff',
            secondsColor: '#00ffff'
        },
        'matrix': {
            background: '#000000',
            color: '#39ff14',
            secondsColor: '#00ff00'
        },
        'synthwave': {
            background: 'linear-gradient(45deg, #241734, #2a1f3d, #31274a)',
            color: '#ff00ff',
            secondsColor: '#00ffff',
            pattern: {
                type: 'grid',
                color: 'rgba(255, 0, 255, 0.1)',
                size: '30'
            }
        },
        'minimal-dots': {
            background: '#1a1a1a',
            color: '#ffffff',
            secondsColor: '#808080',
            pattern: {
                type: 'dots',
                color: 'rgba(255, 255, 255, 0.1)',
                size: '20'
            }
        },
        'minimal-grid': {
            background: '#1a1a1a',
            color: '#ffffff',
            secondsColor: '#808080',
            pattern: {
                type: 'grid',
                color: 'rgba(255, 255, 255, 0.1)',
                size: '30'
            }
        },
        'light-dots': {
            background: '#ffffff',
            color: '#2c3e50',
            secondsColor: '#3498db',
            pattern: {
                type: 'dots',
                color: 'rgba(44, 62, 80, 0.1)',
                size: '20'
            }
        },
        'light-grid': {
            background: '#ffffff',
            color: '#2c3e50',
            secondsColor: '#3498db',
            pattern: {
                type: 'grid',
                color: 'rgba(44, 62, 80, 0.1)',
                size: '30'
            }
        },
        'tech-lines': {
            background: '#0f172a',
            color: '#38bdf8',
            secondsColor: '#818cf8',
            pattern: {
                type: 'lines',
                color: 'rgba(56, 189, 248, 0.1)',
                size: '25'
            }
        },
        'ocean-waves': {
            background: '#134e5e',
            color: '#ffffff',
            secondsColor: '#71b280',
            pattern: {
                type: 'waves',
                color: 'rgba(113, 178, 128, 0.2)',
                size: '40'
            }
        },
        'sunset-gradient': {
            background: 'linear-gradient(45deg, #ff512f, #dd2476)',
            color: '#ffffff',
            secondsColor: '#ffd700'
        },
        'purple-haze': {
            background: 'linear-gradient(45deg, #4a154b, #9333ea)',
            color: '#e879f9',
            secondsColor: '#c084fc'
        },
        'emerald-city': {
            background: 'linear-gradient(45deg, #064e3b, #059669)',
            color: '#34d399',
            secondsColor: '#6ee7b7'
        },
        'golden-hour': {
            background: 'linear-gradient(45deg, #92400e, #b45309)',
            color: '#fbbf24',
            secondsColor: '#fcd34d'
        },
        'arctic-aurora': {
            background: 'linear-gradient(45deg, #1e293b, #334155)',
            color: '#38bdf8',
            secondsColor: '#818cf8',
            pattern: {
                type: 'waves',
                color: 'rgba(56, 189, 248, 0.1)',
                size: '40'
            }
        },
        'midnight-oil': {
            background: '#18181b',
            color: '#d4d4d8',
            secondsColor: '#71717a',
            pattern: {
                type: 'lines',
                color: 'rgba(212, 212, 216, 0.1)',
                size: '30'
            }
        },
        'dark-grid-blue': {
            background: '#0a1929',
            color: '#4fc3f7',
            secondsColor: '#29b6f6',
            pattern: {
                type: 'grid',
                color: 'rgba(66, 165, 245, 0.15)',
                size: '30'
            }
        },
        'dark-dots-blue': {
            background: '#0d1b2a',
            color: '#48cae4',
            secondsColor: '#90e0ef',
            pattern: {
                type: 'dots',
                color: 'rgba(72, 202, 228, 0.15)',
                size: '20'
            }
        },
        'dark-lines-blue': {
            background: '#0f172a',
            color: '#38bdf8',
            secondsColor: '#7dd3fc',
            pattern: {
                type: 'lines',
                color: 'rgba(56, 189, 248, 0.1)',
                size: '25'
            }
        },
        'dark-waves-blue': {
            background: '#111827',
            color: '#60a5fa',
            secondsColor: '#93c5fd',
            pattern: {
                type: 'waves',
                color: 'rgba(96, 165, 250, 0.1)',
                size: '40'
            }
        },
        'starry-night': {
            background: 'url("/static/images/themes/starry-night.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#ffffff',
            secondsColor: '#ffd700'
        },
        'northern-lights': {
            background: 'url("/static/images/themes/aurora.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#a5f3fc',
            secondsColor: '#22d3ee'
        },
        'misty-forest': {
            background: 'url("/static/images/themes/misty-forest.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#d1fae5',
            secondsColor: '#34d399'
        },
        'rainy-city': {
            background: 'url("/static/images/themes/rainy-city.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#e5e7eb',
            secondsColor: '#9ca3af'
        },
        'dark-grid-purple': {
            background: '#1a1625',
            color: '#d8b4fe',
            secondsColor: '#c084fc',
            pattern: {
                type: 'grid',
                color: 'rgba(216, 180, 254, 0.15)',
                size: '30'
            }
        },
        'dark-dots-green': {
            background: '#022c22',
            color: '#34d399',
            secondsColor: '#6ee7b7',
            pattern: {
                type: 'dots',
                color: 'rgba(52, 211, 153, 0.15)',
                size: '20'
            }
        },
        'dark-grid-cyber': {
            background: '#0a001f',
            color: '#00ff9f',
            secondsColor: '#ff00ff',
            pattern: {
                type: 'grid',
                color: 'rgba(0, 255, 159, 0.15)',
                size: '30'
            }
        },
        'dark-dots-neon': {
            background: '#1a0b2e',
            color: '#ff61d8',
            secondsColor: '#7a5fff',
            pattern: {
                type: 'dots',
                color: 'rgba(255, 97, 216, 0.15)',
                size: '20'
            }
        },
        'dark-lines-cyber': {
            background: '#000428',
            color: '#00ffff',
            secondsColor: '#ff00ff',
            pattern: {
                type: 'lines',
                color: 'rgba(0, 255, 255, 0.15)',
                size: '25'
            }
        },
        'dark-waves-neon': {
            background: '#1a1a2e',
            color: '#ff2a6d',
            secondsColor: '#05d9e8',
            pattern: {
                type: 'waves',
                color: 'rgba(255, 42, 109, 0.15)',
                size: '40'
            }
        }
    };

    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            themeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTheme = theme;
            applyTheme(theme);
            saveSettings();
        });
    });

    function applyTheme(theme) {
        const container = document.querySelector('.time-container');
        const timeDisplay = document.querySelector('.time-display');
        const seconds = document.getElementById('seconds');
        const pomodoroTimer = document.querySelector('.pomodoro-timer');

        if (themes[theme]) {
            const themeData = themes[theme];

            // Önce tüm pattern sınıflarını temizle
            container.classList.remove('pattern-dots', 'pattern-grid', 'pattern-lines', 'pattern-waves');
            container.style.background = '';
            container.style.backgroundImage = '';

            // Eğer arka plan gradient içeriyorsa
            if (typeof themeData.background === 'string' && themeData.background.includes('gradient')) {
                container.style.backgroundImage = themeData.background;
            } else {
                container.style.backgroundColor = themeData.background;
            }

            // Saat ve pomodoro renklerini ayarla
            timeDisplay.style.color = themeData.color;
            seconds.style.color = themeData.secondsColor;
            pomodoroTimer.style.color = themeData.color;

            // Pomodoro durumlarına göre renkleri güncelle
            document.documentElement.style.setProperty('--pomodoro-work-color', themeData.color);
            document.documentElement.style.setProperty('--pomodoro-break-color', themeData.secondsColor);

            // Eğer temada pattern varsa uygula
            if (themeData.pattern) {
                const pattern = themeData.pattern;
                document.documentElement.style.setProperty('--pattern-color', pattern.color);
                document.documentElement.style.setProperty('--pattern-size', `${pattern.size}px`);

                let patternStyle;
                switch (pattern.type) {
                    case 'dots':
                        patternStyle = `radial-gradient(${pattern.color} 2px, transparent 2px)`;
                        break;
                    case 'grid':
                        patternStyle = `linear-gradient(to right, ${pattern.color} 1px, transparent 1px),
                                      linear-gradient(to bottom, ${pattern.color} 1px, transparent 1px)`;
                        break;
                    case 'lines':
                        patternStyle = `linear-gradient(45deg, ${pattern.color} 1px, transparent 1px)`;
                        break;
                    case 'waves':
                        patternStyle = `radial-gradient(circle at 100% 50%, transparent 20%, ${pattern.color} 21%, ${pattern.color} 34%, transparent 35%, transparent),
                                      radial-gradient(circle at 0% 50%, transparent 20%, ${pattern.color} 21%, ${pattern.color} 34%, transparent 35%, transparent)`;
                        break;
                }

                container.style.backgroundImage = patternStyle;
                container.style.backgroundSize = `${pattern.size}px ${pattern.size}px`;
            }

            if (theme === 'cyber' || theme === 'retro') {
                container.classList.add(`theme-${theme}`);
            } else {
                container.classList.remove('theme-cyber', 'theme-retro');
            }
        }
    }

    // Görsel yükleme işlemleri
    const bgImageInput = document.getElementById('bgImageInput');
    const bgImagePreview = document.getElementById('bgImagePreview');
    const imageFit = document.getElementById('imageFit');
    const imageOpacity = document.getElementById('imageOpacity');
    let currentImage = null;

    bgImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentImage = e.target.result;
                bgImagePreview.style.backgroundImage = `url(${currentImage})`;
                updateBackground();
                saveSettings();
            };
            reader.readAsDataURL(file);
        }
    });

    [imageFit, imageOpacity].forEach(element => {
        element.addEventListener('input', () => {
            updateBackground();
            if (element === imageOpacity) {
                updateValueDisplay(element, '%');
            }
            saveSettings();
        });
    });

    // Ayarları kaydet
    function saveSettings() {
        const settings = {
            showSeconds: showSeconds.checked,
            use24Hour: use24Hour.checked,
            font: timeDisplay.style.fontFamily,
            fontWeight: timeDisplay.style.fontWeight,
            letterSpacing: timeDisplay.style.letterSpacing,
            color: timeDisplay.style.color,
            secondsColor: seconds.style.color,
            opacity: timeDisplay.style.opacity,
            size: timeDisplay.style.fontSize,
            secondsSize: seconds.style.fontSize,
            effect: currentEffect,
            effectIntensity: effectIntensity.value,
            animation: currentAnimation,
            animationScale: animationScale.value,
            backgroundType: backgroundType.value,
            backgroundColor: bgColorPicker.value,
            gradientStart: gradientStart.value,
            gradientEnd: gradientEnd.value,
            gradientDirection: gradientDirection.value,
            pattern: currentPattern,
            patternColor: patternColor.value,
            patternBgColor: patternBgColorPicker.value,
            patternSize: patternSize.value,
            theme: currentTheme,
            imageFit: imageFit.value,
            imageOpacity: imageOpacity.value,
            currentImage: currentImage,
            workDuration: workDurationInput.value,
            breakDuration: breakDurationInput.value
        };
        localStorage.setItem('timeSettings', JSON.stringify(settings));
    }

    // Kaydedilmiş ayarları yükle
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('timeSettings'));
        if (settings) {
            // Temel ayarlar
            showSeconds.checked = settings.showSeconds;
            seconds.classList.toggle('show', settings.showSeconds);
            use24Hour.checked = settings.use24Hour;

            // Yazı tipi
            if (settings.font) {
                timeDisplay.style.fontFamily = settings.font;
                fontSelect.value = settings.font;
            }
            if (settings.fontWeight) {
                timeDisplay.style.fontWeight = settings.fontWeight;
                fontWeight.value = settings.fontWeight;
            }
            if (settings.letterSpacing) {
                timeDisplay.style.letterSpacing = settings.letterSpacing;
                letterSpacing.value = parseInt(settings.letterSpacing);
                updateValueDisplay(letterSpacing);
            }

            // Renk
            if (settings.color) {
                const color = settings.color;
                const hexColor = color.startsWith('#') ? color : '#' + color.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
                timeDisplay.style.color = hexColor;
                colorPicker.value = hexColor;
            }
            if (settings.secondsColor) {
                const color = settings.secondsColor;
                const hexColor = color.startsWith('#') ? color : '#' + color.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
                seconds.style.color = hexColor;
                secondsColorPicker.value = hexColor;
            }
            if (settings.opacity) {
                timeDisplay.style.opacity = settings.opacity;
                opacity.value = settings.opacity * 100;
                updateValueDisplay(opacity, '%');
            }

            // Boyut
            if (settings.size) {
                const size = parseInt(settings.size);
                updateSize(size);
            }
            if (settings.secondsSize) {
                seconds.style.fontSize = settings.secondsSize;
                secondsSize.value = parseInt(settings.secondsSize);
                updateValueDisplay(secondsSize, '%');
            }

            // Efekt
            if (settings.effect) {
                const effectBtn = document.querySelector(`[data-effect="${settings.effect}"]`);
                if (effectBtn) {
                    currentEffect = settings.effect;
                    effectBtn.classList.add('active');
                    if (settings.effect !== 'none') {
                        timeDisplay.classList.add(`effect-${settings.effect}`);
                        pomodoroTimer.classList.add(`effect-${settings.effect}`);
                    }
                }
            }
            if (settings.effectIntensity) {
                effectIntensity.value = settings.effectIntensity;
                document.documentElement.style.setProperty('--effect-intensity', settings.effectIntensity);
                updateValueDisplay(effectIntensity);
            }

            // Animasyon
            if (settings.animation) {
                const animationBtn = document.querySelector(`[data-animation="${settings.animation}"]`);
                if (animationBtn) {
                    currentAnimation = settings.animation;
                    animationBtn.classList.add('active');
                    if (settings.animation !== 'none') {
                        timeDisplay.classList.add(`animation-${settings.animation}`);
                        pomodoroTimer.classList.add(`animation-${settings.animation}`);
                    }
                }
            }
            if (settings.animationScale) {
                animationScale.value = settings.animationScale;
                document.documentElement.style.setProperty('--animation-scale', settings.animationScale);
                updateValueDisplay(animationScale);
            }

            // Arka plan ayarları
            if (settings.backgroundType) {
                backgroundType.value = settings.backgroundType;
                backgroundType.dispatchEvent(new Event('change'));
            }
            if (settings.backgroundColor) {
                bgColorPicker.value = settings.backgroundColor;
            }
            if (settings.gradientStart) {
                gradientStart.value = settings.gradientStart;
            }
            if (settings.gradientEnd) {
                gradientEnd.value = settings.gradientEnd;
            }
            if (settings.gradientDirection) {
                gradientDirection.value = settings.gradientDirection;
            }
            if (settings.pattern) {
                const patternBtn = document.querySelector(`[data-pattern="${settings.pattern}"]`);
                if (patternBtn) patternBtn.click();
            }
            if (settings.patternColor) {
                patternColor.value = settings.patternColor;
            }
            if (settings.patternSize) {
                patternSize.value = settings.patternSize;
                updateValueDisplay(patternSize, 'px');
            }
            if (settings.patternBgColor) {
                patternBgColorPicker.value = settings.patternBgColor;
            }

            // Tema ayarları
            if (settings.theme) {
                const themeBtn = document.querySelector(`[data-theme="${settings.theme}"]`);
                if (themeBtn) {
                    currentTheme = settings.theme;
                    themeBtn.classList.add('active');
                    if (settings.backgroundType === 'theme') {
                        applyTheme(settings.theme);
                    }
                }
            }

            // Görsel ayarları
            if (settings.currentImage) {
                currentImage = settings.currentImage;
                bgImagePreview.style.backgroundImage = `url(${currentImage})`;
            }
            if (settings.imageFit) {
                imageFit.value = settings.imageFit;
            }
            if (settings.imageOpacity) {
                imageOpacity.value = settings.imageOpacity;
                updateValueDisplay(imageOpacity, '%');
            }

            // Pomodoro ayarları
            if (settings.workDuration) {
                workDurationInput.value = settings.workDuration;
                if (!pomodoroWorker && !isBreak) {
                    pomodoroTime = settings.workDuration * 60;
                    updatePomodoroTimer();
                }
            }

            if (settings.breakDuration) {
                breakDurationInput.value = settings.breakDuration;
            }

            updateBackground();
        }
    }

    // Sayfa yüklendiğinde ayarları yükle
    loadSettings();

    // Pomodoro İstatistikleri
    let pomodoroStats = {
        loadStats: function () {
            const stats = localStorage.getItem('pomodoroStats');
            return stats ? JSON.parse(stats) : {};
        },

        saveStats: function (date, workTime, breakTime, sets) {
            const stats = this.loadStats();
            if (!stats[date]) {
                stats[date] = {
                    workTime: 0,
                    breakTime: 0,
                    sets: 0,
                    activities: []
                };
            }
            stats[date].workTime = workTime;
            stats[date].breakTime = breakTime;
            stats[date].sets = sets;
            localStorage.setItem('pomodoroStats', JSON.stringify(stats));
            this.updateStatsDisplay();
        },

        addActivity: function (type, startTime, endTime) {
            const date = this.formatDate(new Date());
            const stats = this.loadStats();
            if (!stats[date]) {
                stats[date] = {
                    workTime: 0,
                    breakTime: 0,
                    sets: 0,
                    activities: []
                };
            }
            if (!stats[date].activities) {
                stats[date].activities = [];
            }

            const duration = Math.floor((endTime - startTime) / 1000 / 60); // dakika cinsinden
            stats[date].activities.push({
                type,
                startTime: startTime.toLocaleTimeString('tr-TR'),
                endTime: endTime.toLocaleTimeString('tr-TR'),
                duration
            });

            if (type === 'work') {
                stats[date].workTime += duration;
                stats[date].sets += 1;
            } else {
                stats[date].breakTime += duration;
            }

            localStorage.setItem('pomodoroStats', JSON.stringify(stats));
            this.updateStatsDisplay();
        },

        updateActivityList: function (date) {
            const activityList = document.getElementById('activityList');
            const stats = this.loadStats();
            const dayStats = stats[date] || { activities: [] };

            // Aktiviteleri kronolojik sırayla sırala
            const sortedActivities = [...dayStats.activities].sort((a, b) => {
                const timeA = new Date(`${date} ${a.startTime}`);
                const timeB = new Date(`${date} ${b.startTime}`);
                return timeB - timeA; // En son aktivite en üstte
            });

            activityList.innerHTML = '';
            sortedActivities.forEach(activity => {
                const item = document.createElement('div');
                item.className = `activity-item ${activity.type}`;

                const icon = activity.type === 'work' ? 'fa-clock' : 'fa-coffee';
                const title = activity.type === 'work' ? 'Çalışma' : 'Mola';

                item.innerHTML = `
                <div class="activity-icon">
                    <i class="fas ${icon}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">${title}</div>
                    <div class="activity-time">${activity.startTime} - ${activity.endTime}</div>
                </div>
                <div class="activity-duration">${activity.duration} dk</div>
            `;

                activityList.appendChild(item);
            });

            // JSON dosyasına kaydet
            this.saveToJsonFile(stats);
        },

        saveToJsonFile: async function (stats) {
            try {
                const response = await fetch('/save_pomodoro_stats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(stats)
                });

                if (!response.ok) {
                    console.error('İstatistikler kaydedilemedi');
                }
            } catch (error) {
                console.error('İstatistikler kaydedilirken hata oluştu:', error);
            }
        },

        formatDate: function (date) {
            return new Date(date).toISOString().split('T')[0];
        },

        getDateStats: function (date) {
            const stats = this.loadStats();
            return stats[date] || { workTime: 0, breakTime: 0, sets: 0 };
        },

        calculateComparison: function (today, yesterday) {
            if (yesterday === 0) return { diff: 0, increase: true };
            const diff = ((today - yesterday) / yesterday) * 100;
            return {
                diff: Math.abs(Math.round(diff)),
                increase: diff > 0
            };
        },

        updateStatsDisplay: function () {
            const today = this.formatDate(new Date());
            const yesterday = this.formatDate(new Date(Date.now() - 86400000));

            const todayStats = this.getDateStats(today);
            const yesterdayStats = this.getDateStats(yesterday);

            // Toplam çalışma süresi
            document.getElementById('totalWorkTime').textContent = `${Math.round(todayStats.workTime)} dk`;
            const workComparison = this.calculateComparison(todayStats.workTime, yesterdayStats.workTime);
            document.getElementById('workComparison').innerHTML = `
            <span class="diff ${workComparison.increase ? 'increase' : 'decrease'}">
                ${workComparison.diff}% ${workComparison.increase ? '↑' : '↓'}
            </span>
            <span class="vs">vs dün</span>
        `;

            // Tamamlanan setler
            document.getElementById('completedSets').textContent = todayStats.sets;
            const setsComparison = this.calculateComparison(todayStats.sets, yesterdayStats.sets);
            document.getElementById('setsComparison').innerHTML = `
            <span class="diff ${setsComparison.increase ? 'increase' : 'decrease'}">
                ${setsComparison.diff}% ${setsComparison.increase ? '↑' : '↓'}
            </span>
            <span class="vs">vs dün</span>
        `;

            // Aktivite listesini güncelle
            this.updateActivityList(today);

            // Grafik güncelleme
            this.updateChart();
        },

        updateChart: function () {
            const ctx = document.getElementById('weeklyChart').getContext('2d');
            const dates = [];
            const workData = [];
            const breakData = [];

            // Son 7 günün verilerini al
            for (let i = 6; i >= 0; i--) {
                const date = this.formatDate(new Date(Date.now() - i * 86400000));
                const stats = this.getDateStats(date);
                dates.push(new Date(date).toLocaleDateString('tr-TR', { weekday: 'short' }));
                workData.push(Math.round(stats.workTime / 60));
                breakData.push(Math.round(stats.breakTime / 60));
            }

            if (window.weeklyChart) {
                window.weeklyChart.destroy();
            }

            window.weeklyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Çalışma (dk)',
                        data: workData,
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                        backgroundColor: 'rgba(var(--primary-color-rgb), 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Mola (dk)',
                        data: breakData,
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--secondary-color'),
                        backgroundColor: 'rgba(var(--secondary-color-rgb), 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(var(--text-primary-rgb), 0.1)'
                            },
                            ticks: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(var(--text-primary-rgb), 0.1)'
                            },
                            ticks: {
                                color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary')
                            }
                        }
                    }
                }
            });
        }
    };

    // Pomodoro timer tamamlandığında istatistikleri güncelle
    function updatePomodoroStats(isWorkTime) {
        const today = pomodoroStats.formatDate(new Date());
        const stats = pomodoroStats.getDateStats(today);

        if (isWorkTime) {
            stats.workTime += workDuration * 60;
            stats.sets += 1;
        } else {
            stats.breakTime += breakDuration * 60;
        }

        pomodoroStats.saveStats(today, stats.workTime, stats.breakTime, stats.sets);
    }

    // Sayfa yüklendiğinde istatistikleri göster
    document.addEventListener('DOMContentLoaded', function () {
        pomodoroStats.updateStatsDisplay();

        // Tarih seçici butonları
        document.getElementById('prevDay').addEventListener('click', function () {
            // Önceki gün istatistiklerini göster
        });

        document.getElementById('nextDay').addEventListener('click', function () {
            // Sonraki gün istatistiklerini göster
        });
    });
}); 