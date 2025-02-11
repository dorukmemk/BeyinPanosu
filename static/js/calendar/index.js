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
        this.setupQuickAdd();
        calendarInstance = this;
    }

    setupFormListeners() {
        const form = document.getElementById('eventForm');
        if (!form) return;

        // Durum değişikliği için listener
        const statusSelect = form.querySelector('#eventStatus');
        if (statusSelect) {
            statusSelect.addEventListener('change', async (e) => {
                if (this.activeEventId) {
                    const event = this.calendar.getEventById(this.activeEventId);
                    if (event) {
                        const status = e.target.value;
                        event.setExtendedProp('status', status);

                        // Mevcut durum simgesini kaldır
                        const eventEl = event.el;
                        if (eventEl) {
                            const oldIcon = eventEl.querySelector('.event-status-icon');
                            if (oldIcon) oldIcon.remove();

                            // Yeni durum simgesini ekle
                            const statusIcon = document.createElement('span');
                            statusIcon.className = `event-status-icon status-${status}`;

                            switch (status) {
                                case 'completed':
                                    statusIcon.innerHTML = '✓';
                                    statusIcon.title = 'Tamamlandı';
                                    eventEl.style.opacity = '0.7';
                                    break;
                                case 'in-progress':
                                    statusIcon.innerHTML = '⟳';
                                    statusIcon.title = 'Devam Ediyor';
                                    eventEl.style.opacity = '1';
                                    break;
                                case 'pending':
                                    statusIcon.innerHTML = '⌛';
                                    statusIcon.title = 'Beklemede';
                                    eventEl.style.opacity = '1';
                                    break;
                                case 'cancelled':
                                    statusIcon.innerHTML = '✕';
                                    statusIcon.title = 'İptal Edildi';
                                    eventEl.style.opacity = '0.5';
                                    eventEl.style.textDecoration = 'line-through';
                                    break;
                            }

                            const titleEl = eventEl.querySelector('.fc-event-title');
                            if (titleEl) {
                                titleEl.insertBefore(statusIcon, titleEl.firstChild);
                            }
                        }

                        await this.saveFormChanges();
                    }
                }
            });
        }

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

        // Tüm gün seçeneği için listener
        const allDayCheckbox = form.querySelector('#eventAllDay');
        if (allDayCheckbox) {
            allDayCheckbox.addEventListener('change', async (e) => {
                if (this.activeEventId) {
                    const event = this.calendar.getEventById(this.activeEventId);
                    if (event) {
                        event.setAllDay(e.target.checked);
                        await this.saveFormChanges();
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
        if (!form || !this.activeEventId) return;

        try {
            const event = this.calendar.getEventById(this.activeEventId);
            if (!event) return;

            const selectedColor = form.querySelector('.color-swatch.selected')?.getAttribute('data-color');
            const recurring = form.querySelector('#eventRecurring').value;
            const startInput = form.querySelector('#eventStart').value;
            const endInput = form.querySelector('#eventEnd').value;
            const isAllDay = form.querySelector('#eventAllDay').checked;
            const status = form.querySelector('#eventStatus').value;

            // Tarihleri düzgün şekilde ayarla
            let startDate = new Date(startInput);
            let endDate = new Date(endInput);

            // Tüm gün etkinliği için tarih düzenlemesi
            if (isAllDay) {
                // Yerel saat diliminde tarihleri ayarla
                startDate = new Date(
                    startDate.getFullYear(),
                    startDate.getMonth(),
                    startDate.getDate(),
                    0, 0, 0
                );

                endDate = new Date(
                    endDate.getFullYear(),
                    endDate.getMonth(),
                    endDate.getDate(),
                    23, 59, 59
                );
            }

            // Ana etkinlik verilerini hazırla
            const baseEvent = {
                id: this.activeEventId,
                title: form.querySelector('#eventTitle').value || 'Untitled',
                start: startDate,
                end: endDate,
                allDay: isAllDay,
                className: [form.querySelector('#eventCategory').value],
                backgroundColor: selectedColor || '#6366f1',
                borderColor: selectedColor || '#6366f1',
                extendedProps: {
                    description: form.querySelector('#eventDescription').value || '',
                    priority: form.querySelector('#eventPriority').value || 'medium',
                    recurring: recurring,
                    reminder: form.querySelector('#eventReminder').value || '30',
                    isRecurring: false,
                    recurringDays: [],
                    category: form.querySelector('#eventCategory').value,
                    status: status || 'pending'
                }
            };

            // Mevcut etkinliği güncelle
            event.setProp('title', baseEvent.title);
            event.setAllDay(baseEvent.allDay);
            event.setStart(baseEvent.start);
            event.setEnd(baseEvent.end);
            event.setProp('backgroundColor', baseEvent.backgroundColor);
            event.setProp('borderColor', baseEvent.borderColor);
            event.setProp('classNames', baseEvent.className);
            event.setExtendedProp('description', baseEvent.extendedProps.description);
            event.setExtendedProp('priority', baseEvent.extendedProps.priority);
            event.setExtendedProp('recurring', baseEvent.extendedProps.recurring);
            event.setExtendedProp('reminder', baseEvent.extendedProps.reminder);
            event.setExtendedProp('category', baseEvent.extendedProps.category);
            event.setExtendedProp('status', baseEvent.extendedProps.status);

            // EventManager'a kaydet
            await eventManager.saveEventChanges(baseEvent);

            // Tekrarlanan etkinlikleri güncelle
            if (recurring !== 'none') {
                await this.handleRecurringEvents(event, baseEvent);
            }

            // Etkinliği yeniden render et
            event.remove(); // Önce etkinliği kaldır
            const newEvent = this.calendar.addEvent(baseEvent); // Sonra yeniden ekle

            // Tüm gün etkinliği ise tarihleri tekrar ayarla
            if (isAllDay) {
                newEvent.setAllDay(true);
                newEvent.setStart(startDate);
                newEvent.setEnd(endDate);
            }

            // Takvimi yenile
            this.calendar.refetchEvents();

        } catch (error) {
            console.error('Form değişiklikleri kaydedilirken hata:', error);
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
            dayMaxEvents: 3,
            weekNumbers: true,
            navLinks: true,
            displayEventTime: true,
            displayEventEnd: true,
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
            eventDidMount: this.eventDidMount.bind(this)
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
                title: '',
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
                    reminder: '30',
                    isRecurring: false,
                    recurringDays: [],
                    category: 'default'
                }
            };

            // Form değerlerini sıfırla
            const form = document.getElementById('eventForm');
            if (form) {
                // Önceki event ID'sini temizle ve yenisini ata
                this.activeEventId = newEventId;
                form.dataset.eventId = newEventId;

                // Form değerlerini sıfırla
                form.querySelector('#eventTitle').value = '';
                form.querySelector('#eventDescription').value = '';
                form.querySelector('#eventCategory').value = 'event-work';
                form.querySelector('#eventPriority').value = 'medium';
                form.querySelector('#eventRecurring').value = 'none';
                form.querySelector('#eventReminder').value = '30';
                form.querySelector('#eventAllDay').checked = event.allDay;

                // Tarihleri ayarla
                form.querySelector('#eventStart').value = this.formatDateForInput(event.start);
                form.querySelector('#eventEnd').value = this.formatDateForInput(event.end);

                // Renk seçiciyi sıfırla
                const colorPicker = form.querySelector('.color-picker');
                if (colorPicker) {
                    colorPicker.querySelectorAll('.color-swatch').forEach(swatch => {
                        swatch.classList.remove('selected');
                    });
                    const defaultSwatch = colorPicker.querySelector('[data-color="#6366f1"]');
                    if (defaultSwatch) {
                        defaultSwatch.classList.add('selected');
                    }
                }

                // Etkinliği takvime ekle
                try {
                    const calendarEvent = this.calendar.addEvent(event);
                    this.calendar.unselect();

                    // EventManager'a kaydet
                    await eventManager.saveEventChanges(event);
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
        form.querySelector('#eventStatus').value = event.extendedProps?.status || 'pending';

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

    // Tüm gün etkinlikleri için özel ayarlar
    eventDidMount(info) {
        // Hızlı etkinlikler için özel stil
        if (info.event.extendedProps?.isQuickEvent) {
            info.el.style.height = '20px';
            info.el.style.fontSize = '0.8em';
            info.el.style.padding = '2px 4px';
            info.el.style.margin = '1px 0';
            info.el.style.opacity = '0.8';
        }

        // Durum göstergesi ekle
        const status = info.event.extendedProps?.status || 'pending';
        const statusIcon = document.createElement('span');
        statusIcon.className = `event-status-icon status-${status}`;

        // Durum simgelerini ekle
        switch (status) {
            case 'completed':
                statusIcon.innerHTML = '✓';
                statusIcon.title = 'Tamamlandı';
                info.el.style.opacity = '0.7';
                info.el.style.textDecoration = 'none';
                break;
            case 'in-progress':
                statusIcon.innerHTML = '⟳';
                statusIcon.title = 'Devam Ediyor';
                info.el.style.opacity = '1';
                info.el.style.textDecoration = 'none';
                break;
            case 'pending':
                statusIcon.innerHTML = '⌛';
                statusIcon.title = 'Beklemede';
                info.el.style.opacity = '1';
                info.el.style.textDecoration = 'none';
                break;
            case 'cancelled':
                statusIcon.innerHTML = '✕';
                statusIcon.title = 'İptal Edildi';
                info.el.style.opacity = '0.5';
                info.el.style.textDecoration = 'line-through';
                break;
        }

        // Önce eski simgeyi kaldır
        const oldIcon = info.el.querySelector('.event-status-icon');
        if (oldIcon) oldIcon.remove();

        // Yeni simgeyi ekle
        const titleEl = info.el.querySelector('.fc-event-title');
        if (titleEl) {
            titleEl.insertBefore(statusIcon, titleEl.firstChild);
        }

        // Tüm gün etkinlikleri için düzeltme
        if (info.event.allDay) {
            info.el.classList.add('fc-event-all-day');

            const startDate = new Date(info.event.start);
            const endDate = info.event.end ? new Date(info.event.end) : new Date(startDate);

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            info.event.setDates(startDate, endDate, { allDay: true });

            info.el.style.display = 'block';
            info.el.style.width = '100%';
        }
    }

    setupQuickAdd() {
        const quickAddInput = document.getElementById('quickEventInput');
        if (!quickAddInput) return;

        quickAddInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const title = quickAddInput.value.trim();
                if (!title) return;

                // Bugünün tarihini al
                const today = new Date();
                const start = new Date(today);
                start.setHours(0, 0, 0, 0); // Günün başlangıcı
                const end = new Date(today);
                end.setHours(23, 59, 59, 999); // Günün sonu

                // Aynı güne ait etkinlikleri kontrol et
                const existingEvents = this.calendar.getEvents().filter(event => {
                    const eventDate = new Date(event.start);
                    return eventDate.toDateString() === today.toDateString() && event.extendedProps?.isQuickEvent;
                });

                // Yeni etkinlik oluştur
                const newEventId = 'quick-event-' + Date.now();
                const event = {
                    id: newEventId,
                    title: title,
                    start: start,
                    end: end,
                    allDay: true,
                    className: ['event-quick', 'quick-event'],
                    backgroundColor: '#94a3b8',
                    borderColor: '#94a3b8',
                    extendedProps: {
                        description: 'Hızlı eklenen etkinlik',
                        priority: 'medium',
                        recurring: 'none',
                        reminder: '0',
                        isRecurring: false,
                        recurringDays: [],
                        category: 'event-other',
                        status: 'pending',
                        isQuickEvent: true
                    }
                };

                try {
                    // Etkinliği takvime ekle
                    const addedEvent = this.calendar.addEvent(event);

                    // Tam gün etkinliği olarak ayarla
                    addedEvent.setAllDay(true);

                    // EventManager'a kaydet
                    await eventManager.saveEventChanges(event);

                    // Input'u temizle
                    quickAddInput.value = '';

                    // Takvimi yenile
                    this.calendar.refetchEvents();
                } catch (error) {
                    console.error('Hızlı etkinlik eklenirken hata:', error);
                }
            }
        });
    }
}

// Takvimi başlat
document.addEventListener('DOMContentLoaded', () => {
    const calendarEl = document.getElementById('calendar');
    if (calendarEl) {
        new CalendarApp(calendarEl);
    }
}); 