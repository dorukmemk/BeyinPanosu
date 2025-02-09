// Import local modules
import eventManager from './eventManager.js';
import recurringEventManager from './recurringEvents.js';
import uiManager from './uiManager.js';

// Modal işlemleri için yardımcı fonksiyonlar
function closeModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.style.opacity = 0;
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Global olarak tanımla
window.closeModal = closeModal;

// Global calendar instance
let calendarInstance = null;

// Silme işlevi
function handleEventDelete() {
    if (!calendarInstance?.activeEventId) {
        console.error('Silinecek etkinlik bulunamadı');
        return;
    }

    const eventId = calendarInstance.activeEventId;
    const event = calendarInstance.calendar.getEventById(eventId);

    if (!event) {
        console.error('Etkinlik bulunamadı');
        return;
    }

    if (confirm('Bu etkinliği silmek istediğinizden emin misiniz?')) {
        // Önce tekrarlanan etkinlikleri sil
        const events = calendarInstance.calendar.getEvents();
        events.forEach(e => {
            if (e.extendedProps?.parentEventId === eventId || e.id === eventId) {
                e.remove();
            }
        });

        // localStorage'dan da sil
        let storedEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
        storedEvents = storedEvents.filter(e =>
            e.id !== eventId && e.extendedProps?.parentEventId !== eventId
        );
        localStorage.setItem('calendarEvents', JSON.stringify(storedEvents));

        closeModal();
        calendarInstance.loadEvents();
    }
}

// Modal dışına tıklandığında kapatma
document.addEventListener('click', (e) => {
    const modal = document.getElementById('eventModal');
    if (modal && e.target === modal) {
        closeModal();
    }
});

// Sayfa yüklendiğinde silme butonunu ayarla
document.addEventListener('DOMContentLoaded', () => {
    const deleteBtn = document.getElementById('deleteEventBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', handleEventDelete);
    }
});

export class CalendarApp {
    constructor(calendarEl, options = {}) {
        this.calendarEl = calendarEl;
        this.options = options;
        this.calendar = null;
        this.activeEventId = null;
        this.isBulkDeleteMode = false;
        this.selectedForDelete = new Set();
        this.initialize();
        this.setupFormListeners();
        this.setupBulkDelete();
        calendarInstance = this;
    }

    setupFormListeners() {
        const form = document.getElementById('eventForm');
        if (!form) return;

        // Renk seçici işlevselliği
        const colorPicker = form.querySelector('.color-picker');
        if (colorPicker) {
            colorPicker.addEventListener('click', async (e) => {
                const swatch = e.target.closest('.color-swatch');
                if (swatch) {
                    // Önceki seçimi kaldır
                    colorPicker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                    // Yeni seçimi işaretle
                    swatch.classList.add('selected');

                    // Etkinlik rengini güncelle
                    if (this.activeEventId) {
                        const event = this.calendar.getEventById(this.activeEventId);
                        if (event) {
                            const color = swatch.getAttribute('data-color');
                            event.setProp('backgroundColor', color);
                            event.setProp('borderColor', color);
                            await this.saveFormChanges();
                        }
                    }
                }
            });
        }

        // Kategori değişikliği
        const categorySelect = form.querySelector('#eventCategory');
        if (categorySelect) {
            categorySelect.addEventListener('change', async () => {
                if (this.activeEventId) {
                    const event = this.calendar.getEventById(this.activeEventId);
                    if (event) {
                        const category = categorySelect.value;
                        event.setProp('classNames', [category]);
                        await this.saveFormChanges();
                    }
                }
            });
        }

        // Form elemanlarına change listener ekle
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', async () => {
                if (this.activeEventId) {
                    await this.saveFormChanges();
                }
            });
        });
    }

    async saveFormChanges() {
        const form = document.getElementById('eventForm');
        if (!form) return;

        try {
            const selectedColor = form.querySelector('.color-swatch.selected')?.getAttribute('data-color');
            const recurring = form.querySelector('#eventRecurring').value;
            const startDate = new Date(form.querySelector('#eventStart').value);
            const endDate = new Date(form.querySelector('#eventEnd').value);

            // Ana etkinlik verilerini hazırla
            const baseEvent = {
                id: this.activeEventId,
                title: form.querySelector('#eventTitle').value || 'Untitled',
                start: startDate,
                end: endDate,
                allDay: form.querySelector('#eventAllDay').checked,
                className: [form.querySelector('#eventCategory').value],
                backgroundColor: selectedColor || '#6366f1',
                borderColor: selectedColor || '#6366f1',
                extendedProps: {
                    description: form.querySelector('#eventDescription').value || '',
                    priority: form.querySelector('#eventPriority').value || 'medium',
                    recurring: recurring,
                    reminder: form.querySelector('#eventReminder').value || '30',
                    isRecurring: false
                }
            };

            // Mevcut tüm etkinlikleri al
            let allEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');

            // Ana etkinlik ve onun tekrarlarını kaldır
            allEvents = allEvents.filter(event =>
                event.id !== this.activeEventId &&
                event.extendedProps?.parentEventId !== this.activeEventId
            );

            // Takvimden de kaldır
            this.calendar.getEvents().forEach(event => {
                if (event.id === this.activeEventId ||
                    event.extendedProps?.parentEventId === this.activeEventId) {
                    event.remove();
                }
            });

            // Ana etkinliği ekle
            allEvents.push(baseEvent);

            // Tekrarlanan etkinlikleri oluştur
            if (recurring !== 'none') {
                const duration = endDate.getTime() - startDate.getTime();
                let currentDate = new Date(startDate);
                currentDate.setDate(currentDate.getDate() + 1); // Ana etkinlikten sonraki gün başla

                // Bitiş tarihini belirle
                const endRecurring = new Date(startDate);
                switch (recurring) {
                    case 'daily':
                        endRecurring.setDate(endRecurring.getDate() + 7); // 1 hafta
                        break;
                    case 'weekly':
                        endRecurring.setDate(endRecurring.getDate() + 28); // 4 hafta
                        break;
                    case 'monthly':
                        endRecurring.setMonth(endRecurring.getMonth() + 3); // 3 ay
                        break;
                    case 'yearly':
                        endRecurring.setFullYear(endRecurring.getFullYear() + 1); // 1 yıl
                        break;
                }

                // Tekrarlanan etkinlikleri oluştur
                while (currentDate <= endRecurring) {
                    const newEvent = {
                        ...baseEvent,
                        id: 'recurring-' + this.activeEventId + '-' + currentDate.getTime(),
                        start: new Date(currentDate),
                        end: new Date(currentDate.getTime() + duration),
                        extendedProps: {
                            ...baseEvent.extendedProps,
                            parentEventId: this.activeEventId,
                            isRecurring: true
                        }
                    };

                    allEvents.push(newEvent);

                    // Sonraki tarihe geç
                    switch (recurring) {
                        case 'daily':
                            currentDate.setDate(currentDate.getDate() + 1);
                            break;
                        case 'weekly':
                            currentDate.setDate(currentDate.getDate() + 7);
                            break;
                        case 'monthly':
                            currentDate.setMonth(currentDate.getMonth() + 1);
                            break;
                        case 'yearly':
                            currentDate.setFullYear(currentDate.getFullYear() + 1);
                            break;
                    }
                }
            }

            // localStorage'ı güncelle
            localStorage.setItem('calendarEvents', JSON.stringify(allEvents));

            // Takvimi yenile
            await this.loadEvents();

        } catch (error) {
            console.error('Değişiklikler kaydedilirken hata:', error);
            alert('Değişiklikler kaydedilirken bir hata oluştu!');
        }
    }

    async initialize() {
        // Takvimi oluştur
        this.calendar = new FullCalendar.Calendar(this.calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            locale: 'tr',
            firstDay: 1,
            editable: true,
            droppable: true,
            selectable: true,
            selectMirror: true,
            dayMaxEvents: true,
            weekNumbers: true,
            navLinks: true,
            ...this.options,

            // Event handlers
            select: this.handleDateSelect.bind(this),
            eventClick: this.handleEventClick.bind(this),
            eventDrop: this.handleEventDrop.bind(this),
            eventResize: this.handleEventResize.bind(this),

            // Otomatik değişiklikleri engelle
            eventDragStart: function (info) {
                info.el.style.opacity = '0.5';
            },

            eventDragStop: function (info) {
                info.el.style.opacity = '1';
            },

            // Tüm gün etkinlikleri için özel ayarlar
            eventDidMount: function (info) {
                // Hızlı etkinlikler için özel stil
                if (info.event.extendedProps?.isQuickEvent) {
                    info.el.style.height = '20px';
                    info.el.style.fontSize = '0.8em';
                    info.el.style.padding = '2px 4px';
                    info.el.style.margin = '1px 0';
                    info.el.style.opacity = '0.8';
                }

                if (info.event.allDay) {
                    const startDate = new Date(info.event.start);
                    const endDate = info.event.end ? new Date(info.event.end) : new Date(startDate);

                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);

                    info.event.setDates(startDate, endDate, {
                        allDay: true
                    });

                    info.el.classList.add('fc-event-all-day');
                }
            }
        });

        // Yöneticilere takvim referansını ver
        eventManager.setCalendar(this.calendar);
        uiManager.setCalendar(this.calendar);

        // Etkinlikleri yükle
        await this.loadEvents();

        // Takvimi render et
        this.calendar.render();
    }

    async loadEvents() {
        try {
            const events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
            this.calendar.removeAllEvents();
            events.forEach(event => {
                // Tarihleri düzelt
                event.start = new Date(event.start);
                event.end = new Date(event.end);
                this.calendar.addEvent(event);
            });
        } catch (error) {
            console.error('Etkinlikler yüklenirken hata:', error);
        }
    }

    async handleDateSelect(selectInfo) {
        // Modal'ı aç ve form değerlerini ayarla
        const modal = document.getElementById('eventModal');
        if (modal) {
            modal.style.opacity = 0;
            modal.style.display = 'block';
            setTimeout(() => {
                modal.style.opacity = 1;
            }, 10);

            // Yeni etkinliği oluştur
            const newEventId = 'new-event-' + Date.now();
            const event = {
                id: newEventId,
                title: 'Untitled',
                start: selectInfo.start,
                end: selectInfo.end || new Date(selectInfo.start.getTime() + 3600000),
                allDay: selectInfo.allDay,
                className: ['event-work'],
                backgroundColor: '#6366f1',
                borderColor: '#6366f1',
                extendedProps: {
                    description: '',
                    priority: 'medium',
                    recurring: 'none',
                    reminder: '30'
                }
            };

            // Form değerlerini ayarla
            const form = document.getElementById('eventForm');
            if (form) {
                this.activeEventId = newEventId;
                form.dataset.eventId = newEventId;

                // Form değerlerini ayarla
                form.querySelector('#eventTitle').value = event.title;
                form.querySelector('#eventCategory').value = 'event-work';
                form.querySelector('#eventPriority').value = 'medium';
                form.querySelector('#eventRecurring').value = 'none';
                form.querySelector('#eventReminder').value = '30';
                form.querySelector('#eventAllDay').checked = event.allDay;

                // Tarihleri ayarla
                form.querySelector('#eventStart').value = this.formatDateForInput(event.start);
                form.querySelector('#eventEnd').value = this.formatDateForInput(event.end);

                // Etkinliği kaydet ve takvime ekle
                try {
                    await eventManager.saveEventChanges(event);
                    this.calendar.unselect();
                    await this.loadEvents();
                } catch (error) {
                    console.error('Etkinlik oluşturulurken hata:', error);
                }
            }
        }
    }

    async handleEventClick(clickInfo) {
        const event = clickInfo.event;
        if (!event) return;

        // Eğer bu bir tekrarlanan etkinlik ise, ana etkinliği bul
        const parentId = event.extendedProps?.parentEventId;
        if (parentId) {
            const parentEvent = this.calendar.getEventById(parentId);
            if (parentEvent) {
                this.activeEventId = parentEvent.id;
            } else {
                this.activeEventId = event.id;
            }
        } else {
            this.activeEventId = event.id;
        }

        const modal = document.getElementById('eventModal');
        if (!modal) return;

        modal.style.opacity = 0;
        modal.style.display = 'block';
        setTimeout(() => {
            modal.style.opacity = 1;
        }, 10);

        const form = document.getElementById('eventForm');
        if (!form) return;

        form.dataset.eventId = this.activeEventId;

        // Form alanlarını doldur
        form.querySelector('#eventTitle').value = event.title || 'Untitled';
        form.querySelector('#eventDescription').value = event.extendedProps?.description || '';
        form.querySelector('#eventCategory').value = event.classNames?.[0] || 'event-work';
        form.querySelector('#eventPriority').value = event.extendedProps?.priority || 'medium';
        form.querySelector('#eventRecurring').value = event.extendedProps?.recurring || 'none';
        form.querySelector('#eventReminder').value = event.extendedProps?.reminder || '30';
        form.querySelector('#eventAllDay').checked = event.allDay;

        // Renk seçiciyi güncelle
        const colorPicker = form.querySelector('.color-picker');
        if (colorPicker) {
            const currentColor = event.backgroundColor || '#6366f1';
            colorPicker.querySelectorAll('.color-swatch').forEach(swatch => {
                if (swatch.getAttribute('data-color') === currentColor) {
                    swatch.classList.add('selected');
                } else {
                    swatch.classList.remove('selected');
                }
            });
        }

        // Tarihleri ayarla
        const start = event.start ? new Date(event.start) : new Date();
        const end = event.end ? new Date(event.end) : new Date(start.getTime() + 3600000);
        form.querySelector('#eventStart').value = this.formatDateForInput(start);
        form.querySelector('#eventEnd').value = this.formatDateForInput(end);
    }

    async handleEventDrop(dropInfo) {
        const event = dropInfo.event;
        await eventManager.saveEventChanges(event);
    }

    async handleEventResize(resizeInfo) {
        const event = resizeInfo.event;
        await eventManager.saveEventChanges(event);
    }

    formatDateForInput(date) {
        if (!date) return '';
        const d = new Date(date);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
    }

    async deleteEvent() {
        if (!this.activeEventId) return;

        try {
            // Önce localStorage'dan sil
            let events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
            events = events.filter(event => event.id !== this.activeEventId);
            localStorage.setItem('calendarEvents', JSON.stringify(events));

            // Takvimden sil
            const event = this.calendar.getEventById(this.activeEventId);
            if (event) {
                event.remove();
            }

            // Modalı kapat
            closeModal();

            // Takvimi yenile
            this.calendar.refetchEvents();

        } catch (error) {
            console.error('Silme işlemi sırasında hata:', error);
            alert('Etkinlik silinirken bir hata oluştu');
        }
    }

    // Modal işlemleri için yardımcı fonksiyonlar
    showModal() {
        const modal = document.getElementById('eventModal');
        if (modal) {
            modal.style.opacity = 0;
            modal.style.display = 'block';
            setTimeout(() => {
                modal.style.opacity = 1;
            }, 10);
        }
    }

    hideModal() {
        const modal = document.getElementById('eventModal');
        if (modal) {
            modal.style.opacity = 0;
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    setupBulkDelete() {
        const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
        if (!bulkDeleteBtn) return;

        bulkDeleteBtn.addEventListener('click', () => {
            this.isBulkDeleteMode = !this.isBulkDeleteMode;
            bulkDeleteBtn.classList.toggle('active');
            document.body.classList.toggle('bulk-delete-mode');

            if (!this.isBulkDeleteMode) {
                // Toplu silme modundan çıkıldığında seçili etkinlikleri sil
                if (this.selectedForDelete.size > 0) {
                    if (confirm(`${this.selectedForDelete.size} etkinliği silmek istediğinizden emin misiniz?`)) {
                        this.bulkDeleteEvents();
                    }
                }
                this.clearBulkDeleteSelection();
            }
        });

        // Event click handler'ı güncelle
        const originalEventClick = this.calendar.getOption('eventClick');
        this.calendar.setOption('eventClick', (info) => {
            if (this.isBulkDeleteMode) {
                // Toplu silme modunda etkinlik seçimi
                const eventEl = info.el;
                const eventId = info.event.id;

                if (this.selectedForDelete.has(eventId)) {
                    this.selectedForDelete.delete(eventId);
                    eventEl.classList.remove('selected-for-delete');
                } else {
                    this.selectedForDelete.add(eventId);
                    eventEl.classList.add('selected-for-delete');
                }
            } else {
                // Normal mod - etkinlik düzenleme
                this.handleEventClick(info);
            }
        });
    }

    clearBulkDeleteSelection() {
        this.selectedForDelete.clear();
        document.querySelectorAll('.fc-event').forEach(el => {
            el.classList.remove('selected-for-delete');
        });
    }

    async bulkDeleteEvents() {
        if (this.selectedForDelete.size === 0) return;

        try {
            // localStorage'dan etkinlikleri al
            let allEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');

            // Seçili etkinlikleri ve onların tekrarlarını filtrele
            const idsToDelete = new Set(this.selectedForDelete);
            allEvents = allEvents.filter(event => {
                const shouldDelete = idsToDelete.has(event.id) ||
                    (event.extendedProps?.parentEventId && idsToDelete.has(event.extendedProps.parentEventId));
                return !shouldDelete;
            });

            // localStorage'ı güncelle
            localStorage.setItem('calendarEvents', JSON.stringify(allEvents));

            // Takvimden seçili etkinlikleri kaldır
            this.selectedForDelete.forEach(eventId => {
                const event = this.calendar.getEventById(eventId);
                if (event) {
                    // Ana etkinlik ise tekrarlarını da sil
                    this.calendar.getEvents().forEach(e => {
                        if (e.id === eventId || e.extendedProps?.parentEventId === eventId) {
                            e.remove();
                        }
                    });
                }
            });

            // Seçimleri temizle
            this.clearBulkDeleteSelection();
            this.isBulkDeleteMode = false;
            document.body.classList.remove('bulk-delete-mode');
            document.getElementById('bulkDeleteBtn')?.classList.remove('active');

            // Takvimi yenile
            await this.loadEvents();

        } catch (error) {
            console.error('Toplu silme sırasında hata:', error);
            alert('Etkinlikler silinirken bir hata oluştu!');
        }
    }
}

// Takvimi başlat
document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
        new CalendarApp(calendarEl);
    }
}); 