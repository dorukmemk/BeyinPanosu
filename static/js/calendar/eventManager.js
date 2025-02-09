// Event Management Functions
export class EventManager {
    constructor() {
        this.events = [];
        this.calendar = null;
    }

    async loadEvents() {
        try {
            const savedEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
            this.events = savedEvents;
            return savedEvents;
        } catch (error) {
            console.error('Error loading events:', error);
            return [];
        }
    }

    async saveEvents() {
        try {
            localStorage.setItem('calendarEvents', JSON.stringify(this.events));
            return true;
        } catch (error) {
            console.error('Error saving events:', error);
            return false;
        }
    }

    async saveEventChanges(event) {
        try {
            // Mevcut etkinlikleri al
            const events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');

            // Etkinliği formatla
            const formattedEvent = this.formatEvent(event);

            // Etkinliği güncelle veya ekle
            const existingEventIndex = events.findIndex(e => e.id === formattedEvent.id);

            if (existingEventIndex !== -1) {
                // Mevcut etkinliği güncelle
                events[existingEventIndex] = formattedEvent;
            } else {
                // Yeni etkinlik ekle
                events.push(formattedEvent);
            }

            // localStorage'ı güncelle
            localStorage.setItem('calendarEvents', JSON.stringify(events));

            // Sınıf içindeki events array'ini güncelle
            this.events = events;

            return true;
        } catch (error) {
            console.error('Etkinlik kaydedilirken hata:', error);
            return false;
        }
    }

    async deleteEvent(eventId) {
        if (!eventId) {
            throw new Error('Etkinlik ID\'si gerekli');
        }

        try {
            // Mevcut etkinlikleri al
            const events = JSON.parse(localStorage.getItem('calendarEvents') || '[]');

            // Etkinliği filtrele
            const updatedEvents = events.filter(event => event.id !== eventId);

            // localStorage'ı güncelle
            localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));

            // Sınıf içindeki events array'ini güncelle
            this.events = updatedEvents;

            return true;
        } catch (error) {
            console.error('Etkinlik silinirken hata:', error);
            throw new Error('Etkinlik silinemedi');
        }
    }

    formatEvent(event) {
        // Tarihleri düzgün şekilde işle
        let start = event.start;
        let end = event.end;

        // String ise Date objesine çevir
        if (typeof start === 'string') {
            start = new Date(start);
        }
        if (typeof end === 'string') {
            end = new Date(end);
        }

        // Date objesi değilse ve timestamp ise Date objesine çevir
        if (!(start instanceof Date) && typeof start === 'number') {
            start = new Date(start);
        }
        if (!(end instanceof Date) && typeof end === 'number') {
            end = new Date(end);
        }

        return {
            id: event.id,
            title: event.title || 'Untitled',
            start: start instanceof Date ? start.toISOString() : null,
            end: end instanceof Date ? end.toISOString() : null,
            allDay: event.allDay || false,
            className: event.className || ['event-work'],
            backgroundColor: event.backgroundColor || '#6366f1',
            borderColor: event.borderColor || '#6366f1',
            extendedProps: {
                description: event.extendedProps?.description || '',
                priority: event.extendedProps?.priority || 'medium',
                recurring: event.extendedProps?.recurring || 'none',
                reminder: event.extendedProps?.reminder || '30',
                isRecurring: event.extendedProps?.isRecurring || false,
                recurringDays: event.extendedProps?.recurringDays || [],
                category: event.extendedProps?.category || 'default'
            }
        };
    }

    formatEvents(events) {
        return events.map(event => this.formatEvent(event));
    }

    mergeEvents(localEvents, apiEvents) {
        const eventMap = new Map();

        // Önce local etkinlikleri ekle
        localEvents.forEach(event => {
            eventMap.set(event.id, event);
        });

        // API etkinliklerini ekle/güncelle
        apiEvents.forEach(event => {
            const existingEvent = eventMap.get(event.id);
            if (existingEvent) {
                // Eğer API'deki etkinlik daha yeniyse güncelle
                const apiDate = new Date(event.updatedAt || event.createdAt);
                const localDate = new Date(existingEvent.updatedAt || existingEvent.createdAt);
                if (apiDate > localDate) {
                    eventMap.set(event.id, event);
                }
            } else {
                eventMap.set(event.id, event);
            }
        });

        return Array.from(eventMap.values());
    }

    getEventState(event) {
        return this.formatEvent(event);
    }

    setCalendar(calendar) {
        this.calendar = calendar;
    }
}

export default new EventManager(); 