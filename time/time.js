// themes.js'den tema fonksiyonlarını import et
import { themes, applyTheme } from './themes.js';

document.addEventListener('DOMContentLoaded', function () {
    // Mod değiştirme işlemleri
    const modeSwitch = document.getElementById('modeSwitch');
    const clockDisplay = document.getElementById('clockDisplay');
    const pomodoroDisplay = document.getElementById('pomodoroDisplay');
    let currentMode = 'clock'; // 'clock' veya 'pomodoro'

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
    let pomodoroInterval;
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

        // Son 3 saniye kala ses çal
        if (pomodoroTime <= 3 && pomodoroTime > 0) {
            playBeep();
        }

        // Stil güncelleme
        pomodoroDisplay.classList.toggle('work', !isBreak);
        pomodoroDisplay.classList.toggle('break', isBreak);
    }

    let startTime = null;
    function startPomodoro() {
        if (!pomodoroInterval) {
            startTime = new Date(); // Başlangıç zamanını kaydet
            pomodoroInterval = setInterval(() => {
                if (pomodoroTime > 0) {
                    pomodoroTime--;
                    updatePomodoroTimer();
                } else {
                    // Süre dolduğunda
                    clearInterval(pomodoroInterval);
                    pomodoroInterval = null;
                    const endTime = new Date(); // Bitiş zamanını kaydet

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
            }, 1000);
            startPomodoroBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            clearInterval(pomodoroInterval);
            pomodoroInterval = null;

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
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
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

            if (!pomodoroInterval && ((target === 'work' && !isBreak) || (target === 'break' && isBreak))) {
                pomodoroTime = input.value * 60;
                updatePomodoroTimer();
            }
        });
    });

    [workDurationInput, breakDurationInput].forEach(input => {
        input.addEventListener('change', () => {
            if (!pomodoroInterval && ((input.id === 'workDuration' && !isBreak) || (input.id === 'breakDuration' && isBreak))) {
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
        // Önceki aktif tab'ı kapat
        if (activeTab) {
            document.getElementById(activeTab).classList.remove('active');
            document.querySelector(`[data-tab="${activeTab}"]`).classList.remove('active');
        }

        // Yeni tab'ı aç veya kapat
        if (activeTab !== tabId) {
            document.getElementById(tabId).classList.add('active');
            document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
            activeTab = tabId;
        } else {
            activeTab = null;
        }
    }

    // Tab dışına tıklandığında kapat
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.tab-content') && !e.target.closest('.nav-btn')) {
            if (activeTab) {
                document.getElementById(activeTab).classList.remove('active');
                document.querySelector(`[data-tab="${activeTab}"]`).classList.remove('active');
                activeTab = null;
            }
        }
    });

    // ESC tuşuna basıldığında aktif tab'ı kapat
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && activeTab) {
            document.getElementById(activeTab).classList.remove('active');
            document.querySelector(`[data-tab="${activeTab}"]`).classList.remove('active');
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
        timeDisplay.style.color = e.target.value;
        saveSettings();
    });

    secondsColorPicker.addEventListener('input', (e) => {
        seconds.style.color = e.target.value;
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
                    applyTheme(currentTheme, container, timeDisplay, seconds, pomodoroTimer);
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

    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            themeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTheme = theme;
            const container = document.querySelector('.time-container');
            const timeDisplay = document.querySelector('.time-display');
            const seconds = document.getElementById('seconds');
            const pomodoroTimer = document.querySelector('.pomodoro-timer');
            applyTheme(theme, container, timeDisplay, seconds, pomodoroTimer);
            saveSettings();
        });
    });

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
                timeDisplay.style.color = settings.color;
                colorPicker.value = settings.color;
            }
            if (settings.secondsColor) {
                seconds.style.color = settings.secondsColor;
                secondsColorPicker.value = settings.secondsColor;
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
                if (!pomodoroInterval && !isBreak) {
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

            if (window.weeklyChart instanceof Chart) {
                window.weeklyChart.destroy();
            }

            window.weeklyChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Çalışma (saat)',
                        data: workData,
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
                        backgroundColor: 'rgba(var(--primary-color-rgb), 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'Mola (saat)',
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

    // Ses efektleri
    const beepSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + 'A'.repeat(1024));
    beepSound.volume = 0.5;

    function playBeep() {
        const beep = beepSound.cloneNode();
        beep.play();
    }

    // Pomodoro timer tamamlandığında istatistikleri güncelle
    function updatePomodoroStats(type, duration) {
        const today = pomodoroStats.formatDate(new Date());
        const stats = pomodoroStats.loadStats();

        if (!stats[today]) {
            stats[today] = {
                workTime: 0,
                breakTime: 0,
                sets: 0,
                activities: []
            };
        }

        if (type === 'work') {
            stats[today].workTime += duration;
            stats[today].sets += 1;
        } else {
            stats[today].breakTime += duration;
        }

        // İstatistikleri kaydet
        pomodoroStats.saveStats(today, stats[today].workTime, stats[today].breakTime, stats[today].sets);
    }

    // Sayfa yüklendiğinde istatistikleri yükle
    document.addEventListener('DOMContentLoaded', function () {
        pomodoroStats.updateStatsDisplay();

        // Tarih seçici butonları
        document.getElementById('prevDay').addEventListener('click', function () {
            const currentDate = new Date(document.getElementById('currentDate').getAttribute('data-date') || new Date());
            const prevDate = new Date(currentDate);
            prevDate.setDate(prevDate.getDate() - 1);

            document.getElementById('currentDate').textContent = prevDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
            document.getElementById('currentDate').setAttribute('data-date', prevDate.toISOString());
            pomodoroStats.updateStatsDisplay(pomodoroStats.formatDate(prevDate));
        });

        document.getElementById('nextDay').addEventListener('click', function () {
            const currentDate = new Date(document.getElementById('currentDate').getAttribute('data-date') || new Date());
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);

            const today = new Date();
            if (nextDate > today) return; // Gelecek tarihlere gitmeyi engelle

            document.getElementById('currentDate').textContent = nextDate.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
            document.getElementById('currentDate').setAttribute('data-date', nextDate.toISOString());
            pomodoroStats.updateStatsDisplay(pomodoroStats.formatDate(nextDate));
        });

        // Başlangıçta bugünün tarihini ayarla
        const today = new Date();
        document.getElementById('currentDate').textContent = today.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
        document.getElementById('currentDate').setAttribute('data-date', today.toISOString());
    });

    // YouTube API ile ilgili tüm kodları kaldırıp yerine basit müzik çalar kodlarını ekleyelim
    const audioPlayer = document.getElementById('audioPlayer');
    const audioFileInput = document.getElementById('audioFileInput');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const stopBtn = document.getElementById('stopBtn');
    const currentTrack = document.getElementById('currentTrack');

    audioFileInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            audioPlayer.src = url;
            currentTrack.textContent = file.name;
        }
    });

    playPauseBtn.addEventListener('click', function () {
        if (audioPlayer.paused) {
            audioPlayer.play();
            playPauseBtn.textContent = 'Duraklat';
        } else {
            audioPlayer.pause();
            playPauseBtn.textContent = 'Oynat';
        }
    });

    stopBtn.addEventListener('click', function () {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
        playPauseBtn.textContent = 'Oynat';
    });
}); 