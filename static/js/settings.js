document.addEventListener('DOMContentLoaded', function () {
    // Ayarları localStorage'dan yükle
    loadSettings();

    // Renk paletini oluştur
    initializeColorPalette();

    // Ayarları kaydet butonu için event listener
    document.getElementById('saveSettings').addEventListener('click', async function () {
        await saveSettings();
        window.location.reload(); // Sayfayı yenile
    });

    // Form elemanları için değişiklik takibi
    const formElements = document.querySelectorAll('input, select');
    formElements.forEach(element => {
        element.addEventListener('change', () => {
            // Değişiklik olduğunda kaydet butonunu aktif et
            const saveButton = document.getElementById('saveSettings');
            saveButton.classList.add('bg-indigo-500');
            saveButton.classList.add('animate-pulse');
        });
    });

    // Tema değişikliğini anında uygula
    document.getElementById('theme').addEventListener('change', function (e) {
        applyTheme(e.target.value);
    });

    // Çalışma saatleri kontrolü
    const workHoursStart = document.getElementById('workHoursStart');
    const workHoursEnd = document.getElementById('workHoursEnd');

    workHoursStart.addEventListener('change', function () {
        if (workHoursEnd.value && this.value >= workHoursEnd.value) {
            showNotification('Başlangıç saati bitiş saatinden önce olmalıdır', 'error');
            this.value = defaultSettings.workHoursStart;
        }
    });

    workHoursEnd.addEventListener('change', function () {
        if (workHoursStart.value && this.value <= workHoursStart.value) {
            showNotification('Bitiş saati başlangıç saatinden sonra olmalıdır', 'error');
            this.value = defaultSettings.workHoursEnd;
        }
    });
});

// Varsayılan ayarlar
const defaultSettings = {
    defaultView: 'dayGridMonth',
    workHoursStart: '09:00',
    workHoursEnd: '18:00',
    weekStart: '1',
    defaultDuration: '60',
    defaultReminder: '30',
    defaultCategory: 'event-work',
    theme: 'light',
    colorPalette: {
        'event-work': '#6366f1',
        'event-personal': '#10b981',
        'event-meeting': '#ec4899',
        'event-deadline': '#ef4444',
        'event-quick': '#94a3b8'
    },
    notionToken: '',
    notionDatabaseId: ''
};

// Ayarları yükle
function loadSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('calendarSettings')) || defaultSettings;

        // Eksik ayarları varsayılan değerlerle tamamla
        Object.keys(defaultSettings).forEach(key => {
            if (!(key in settings)) {
                settings[key] = defaultSettings[key];
            }
        });

        // Form elemanlarını doldur
        Object.keys(settings).forEach(key => {
            const element = document.getElementById(key);
            if (element && key !== 'colorPalette') {
                element.value = settings[key];
            }
        });

        // Ayarları kaydet ve temayı uygula
        localStorage.setItem('calendarSettings', JSON.stringify(settings));
        applyTheme(settings.theme);
    } catch (error) {
        console.error('Ayarlar yüklenirken hata:', error);
        // Hata durumunda varsayılan ayarları kullan
        localStorage.setItem('calendarSettings', JSON.stringify(defaultSettings));
        applyTheme(defaultSettings.theme);
    }
}

// Renk paletini oluştur
function initializeColorPalette() {
    const colorPalette = document.getElementById('colorPalette');
    if (!colorPalette) return;

    const settings = JSON.parse(localStorage.getItem('calendarSettings')) || defaultSettings;
    const colors = settings.colorPalette || defaultSettings.colorPalette;

    colorPalette.innerHTML = ''; // Mevcut renkleri temizle

    for (const [category, color] of Object.entries(colors)) {
        const colorSwatch = document.createElement('div');
        colorSwatch.className = 'color-swatch animate-fade-in';
        colorSwatch.innerHTML = `
            <div class="color-preview" style="background-color: ${color}"></div>
            <input type="color" class="hidden" value="${color}" data-category="${category}">
            <span class="text-sm font-medium">${getCategoryName(category)}</span>
        `;

        colorSwatch.addEventListener('click', function () {
            const input = this.querySelector('input[type="color"]');
            input.click();
        });

        const colorInput = colorSwatch.querySelector('input[type="color"]');
        colorInput.addEventListener('change', function (e) {
            const category = this.dataset.category;
            const color = e.target.value;
            this.previousElementSibling.style.backgroundColor = color;
            updateColorPalette(category, color);
        });

        colorPalette.appendChild(colorSwatch);
    }
}

// Renk paletini güncelle
function updateColorPalette(category, color) {
    const settings = JSON.parse(localStorage.getItem('calendarSettings')) || defaultSettings;
    settings.colorPalette = settings.colorPalette || {};
    settings.colorPalette[category] = color;
    localStorage.setItem('calendarSettings', JSON.stringify(settings));

    // Kaydet butonunu aktifleştir
    const saveButton = document.getElementById('saveSettings');
    saveButton.classList.add('bg-indigo-500');
    saveButton.classList.add('animate-pulse');
}

// Kategori adını döndür
function getCategoryName(category) {
    const names = {
        'event-work': 'İş',
        'event-personal': 'Kişisel',
        'event-meeting': 'Toplantı',
        'event-deadline': 'Son Tarih',
        'event-quick': 'Hızlı'
    };
    return names[category] || category;
}

// Ayarları kaydet
function saveSettings() {
    try {
        const settings = {};

        // Form elemanlarından değerleri al
        Object.keys(defaultSettings).forEach(key => {
            const element = document.getElementById(key);
            if (element && key !== 'colorPalette') {
                settings[key] = element.value;
            }
        });

        // Renk paletini koru
        settings.colorPalette = JSON.parse(localStorage.getItem('calendarSettings'))?.colorPalette || defaultSettings.colorPalette;

        // Ayarları kaydet
        localStorage.setItem('calendarSettings', JSON.stringify(settings));
        applyTheme(settings.theme);
    } catch (error) {
        console.error('Ayarlar kaydedilirken hata:', error);
    }
}

// Ayarları doğrula
function validateSettings(settings) {
    // Çalışma saatleri kontrolü
    if (settings.workHoursStart >= settings.workHoursEnd) {
        showNotification('Başlangıç saati bitiş saatinden önce olmalıdır', 'error');
        return false;
    }

    // Varsayılan süre kontrolü
    if (settings.defaultDuration < 15 || settings.defaultDuration > 1440) {
        showNotification('Varsayılan süre 15-1440 dakika arasında olmalıdır', 'error');
        return false;
    }

    return true;
}

// Renk paleti ayarlarını al
function getColorPaletteSettings() {
    const colorInputs = document.querySelectorAll('#colorPalette input[type="color"]');
    const colors = {};

    colorInputs.forEach(input => {
        colors[input.dataset.category] = input.value;
    });

    return colors;
}

// Temayı uygula
function applyTheme(theme) {
    const root = document.documentElement;
    const body = document.body;

    if (theme === 'dark') {
        root.classList.add('dark');
        body.classList.add('dark');
        body.classList.add('bg-gray-900');
        body.classList.remove('bg-gray-100');
    } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
        body.classList.remove('bg-gray-900');
        body.classList.add('bg-gray-100');
    }
}

// Bildirim göster
function showNotification(message, type = 'success') {
    // Varolan bildirimleri kaldır
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.remove();
    });

    const notification = document.createElement('div');
    notification.className = `notification ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-fade-in`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Bildirimi göster
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Bildirimi kaldır
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
} 