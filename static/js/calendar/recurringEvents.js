import eventManager from './eventManager.js';

export class RecurringEventManager {
    generateRecurringEvents(sourceEvent, formData) {
        const events = [];
        const startDate = new Date(formData.start);
        const endDate = new Date(formData.end);
        const duration = endDate - startDate;

        // Bir ay boyunca tekrar eden etkinlikler oluştur
        const oneMonth = new Date(startDate);
        oneMonth.setMonth(oneMonth.getMonth() + 1);

        for (let date = new Date(startDate); date <= oneMonth; date.setDate(date.getDate() + 1)) {
            const dayOfWeek = date.getDay();

            if (formData.recurringDays.includes(dayOfWeek)) {
                const newStart = new Date(date);
                const newEnd = new Date(newStart.getTime() + duration);

                events.push(this.createRecurringEvent(newStart, newEnd, formData));
            }
        }

        return events;
    }

    createRecurringEvent(start, end, formData) {
        return {
            title: formData.title,
            start: start,
            end: end,
            description: formData.description,
            backgroundColor: formData.color,
            borderColor: formData.color,
            extendedProps: {
                description: formData.description,
                isRecurring: true,
                recurringDays: formData.recurringDays,
                category: formData.category
            }
        };
    }

    async handleRecurringEvents(sourceEvent, formData) {
        if (formData.isRecurring && formData.recurringDays?.length > 0) {
            const recurringEvents = this.generateRecurringEvents(sourceEvent, formData);

            // Tüm tekrarlanan etkinlikleri kaydet
            for (const event of recurringEvents) {
                await eventManager.saveEventChanges(event);
            }

            return recurringEvents;
        }

        return [sourceEvent];
    }
}

export default new RecurringEventManager(); 