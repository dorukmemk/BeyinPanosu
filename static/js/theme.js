// Tema yönetimi için sınıf
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        // Sayfa yüklendiğinde mevcut temayı uygula
        this.applyTheme(this.theme);

        // Tema değişikliği olaylarını dinle
        document.addEventListener('themeChange', (e) => {
            this.setTheme(e.detail.theme);
        });
    }

    // Temayı ayarla ve kaydet
    setTheme(newTheme) {
        this.theme = newTheme;
        localStorage.setItem('theme', newTheme);
        this.applyTheme(newTheme);
    }

    // Temayı uygula
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.body.setAttribute('data-theme', theme);

        // FullCalendar temasını güncelle
        const calendar = document.querySelector('.fc');
        if (calendar) {
            calendar.classList.remove('fc-theme-standard', 'fc-theme-dark');
            calendar.classList.add(`fc-theme-${theme}`);
        }

        // Özel olay gönder
        document.dispatchEvent(new CustomEvent('themeApplied', {
            detail: { theme }
        }));
    }

    // Mevcut temayı getir
    getCurrentTheme() {
        return this.theme;
    }

    // Temayı değiştir
    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }
}

// Tema yöneticisini oluştur
const themeManager = new ThemeManager();

// Tema değişikliği için yardımcı fonksiyon
function setTheme(theme) {
    document.dispatchEvent(new CustomEvent('themeChange', {
        detail: { theme }
    }));
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    // Tema seçici varsa
    const themeSelect = document.getElementById('theme');
    if (themeSelect) {
        // Mevcut temayı seç
        themeSelect.value = themeManager.getCurrentTheme();

        // Tema değişikliğini dinle
        themeSelect.addEventListener('change', (e) => {
            setTheme(e.target.value);
        });
    }

    // Tema değişikliği uygulandığında
    document.addEventListener('themeApplied', (e) => {
        // Renk paletini güncelle
        updateColorPalette(e.detail.theme);

        // LocalStorage'daki ayarları güncelle
        const settings = JSON.parse(localStorage.getItem('calendarSettings')) || {};
        settings.theme = e.detail.theme;
        localStorage.setItem('calendarSettings', JSON.stringify(settings));
    });
});

// Renk paletini güncelle
function updateColorPalette(theme) {
    const colorPalette = document.getElementById('colorPalette');
    if (!colorPalette) return;

    const colors = theme === 'dark' ? {
        'event-work': '#818cf8',
        'event-personal': '#34d399',
        'event-meeting': '#f472b6',
        'event-deadline': '#f87171',
        'event-quick': '#94a3b8'
    } : {
        'event-work': '#6366f1',
        'event-personal': '#10b981',
        'event-meeting': '#ec4899',
        'event-deadline': '#ef4444',
        'event-quick': '#94a3b8'
    };

    // Renk paletini güncelle
    Object.entries(colors).forEach(([category, color]) => {
        const swatch = colorPalette.querySelector(`[data-category="${category}"]`);
        if (swatch) {
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color;
        }
    });
} 