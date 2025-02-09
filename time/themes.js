// Tema tanımlamaları
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

// Tema uygulama fonksiyonu
function applyTheme(theme, container, timeDisplay, seconds, pomodoroTimer) {
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

// Dışa aktarma
export { themes, applyTheme }; 