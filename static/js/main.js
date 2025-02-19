// Import calendar module
import { CalendarApp } from './calendar/index.js';

document.addEventListener('DOMContentLoaded', function () {
    // Variables and Elements
    const sidebarElement = document.querySelector('.sidebar');
    const toggleBtn = document.querySelector('#toggleSidebar');
    const modal = document.querySelector('#eventModal');
    const eventForm = document.querySelector('#eventForm');
    let isDeleteMode = false;

    // Verify all required elements exist
    if (!sidebarElement || !toggleBtn || !modal || !eventForm) {
        console.error('Required elements not found');
        return;
    }

    // Initialize calendar and other variables
    let calendar;
    let activeEventId = null;
    let lastSavedState = null;

    // Setup event handlers for sidebar
    if (toggleBtn && sidebarElement) {
        toggleBtn.addEventListener('click', () => {
            sidebarElement.classList.toggle('closed');
        });
    }

    // Helper function to format date for input
    function formatDateForInput(date) {
        if (!date) return '';
        const d = new Date(date);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    }

    // Setup preview editable elements
    function setupPreviewEditableElements() {
        const previewTab = document.querySelector('.preview-tab');
        if (!previewTab) return;

        previewTab.querySelectorAll('[contenteditable="true"]').forEach(element => {
            if (!element.hasListener) {
                element.hasListener = true;
                element.addEventListener('input', () => {
                    const markdown = htmlToMarkdown(previewTab);
                    const description = document.getElementById('eventDescription');
                    if (description) {
                        description.value = markdown;
                        if (activeEventId) {
                            saveEventChanges();
                        }
                    }
                });

                element.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const markdown = htmlToMarkdown(previewTab);
                        const description = document.getElementById('eventDescription');
                        if (description) {
                            description.value = markdown + '\n';
                            updatePreview();
                        }
                    }
                });
            }
        });

        // Handle checkboxes in preview mode
        previewTab.querySelectorAll('.task-list-item-checkbox').forEach(checkbox => {
            if (!checkbox.hasListener) {
                checkbox.hasListener = true;
                checkbox.addEventListener('change', () => {
                    const markdown = htmlToMarkdown(previewTab);
                    const description = document.getElementById('eventDescription');
                    if (description) {
                        description.value = markdown;
                        if (activeEventId) {
                            saveEventChanges();
                        }
                    }
                });
            }
        });
    }

    // Move htmlToMarkdown function outside of initializeMarkdownEditor scope
    function htmlToMarkdown(element) {
        let markdown = '';
        let inList = false;

        function processNode(node) {
            if (node.nodeType === 3) { // Text node
                return node.textContent;
            }

            let content = '';
            if (node.tagName === 'UL') {
                Array.from(node.children).forEach(li => {
                    if (li.classList.contains('task-list-item')) {
                        const checkbox = li.querySelector('.task-list-item-checkbox');
                        const label = li.querySelector('.task-list-item-label');
                        content += `- [${checkbox && checkbox.checked ? 'x' : ' '}] ${label ? label.textContent.trim() : ''}\n`;
                    } else {
                        const span = li.querySelector('span');
                        content += `- ${span ? span.textContent.trim() : li.textContent.trim()}\n`;
                    }
                });
            } else if (node.tagName === 'H1') {
                content += `# ${node.textContent.trim()}\n\n`;
            } else if (node.tagName === 'H2') {
                content += `## ${node.textContent.trim()}\n\n`;
            } else if (node.tagName === 'H3') {
                content += `### ${node.textContent.trim()}\n\n`;
            } else if (node.tagName === 'BLOCKQUOTE') {
                content += `> ${node.textContent.trim()}\n\n`;
            } else if (node.tagName === 'TABLE') {
                const headers = Array.from(node.querySelectorAll('th')).map(th => th.textContent.trim());
                const rows = Array.from(node.querySelectorAll('tr')).slice(1)
                    .map(tr => Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim()));

                if (headers.length) {
                    content += `| ${headers.join(' | ')} |\n`;
                    content += `|${headers.map(() => '---').join('|')}|\n`;
                    rows.forEach(row => {
                        content += `| ${row.join(' | ')} |\n`;
                    });
                    content += '\n';
                }
            } else if (node.tagName === 'P') {
                content += `${node.textContent.trim()}\n\n`;
            } else {
                Array.from(node.childNodes).forEach(child => {
                    content += processNode(child);
                });
            }
            return content;
        }

        Array.from(element.childNodes).forEach(node => {
            markdown += processNode(node);
        });

        return markdown.trim();
    }

    // Initialize markdown editor
    function initializeMarkdownEditor() {
        const writeTab = document.querySelector('.write-tab');
        const previewTab = document.querySelector('.preview-tab');
        const tabBtns = document.querySelectorAll('.tab-btn');
        const description = document.getElementById('eventDescription');

        if (!writeTab || !previewTab || !description) {
            console.error('Markdown editor elements not found');
            return;
        }

        // Set up marked options with custom renderer
        const renderer = new marked.Renderer();

        // Custom checkbox renderer with improved handling
        renderer.listitem = function (text, task, checked) {
            if (task) {
                return `<li class="task-list-item">
                            <input type="checkbox" class="task-list-item-checkbox" ${checked ? 'checked' : ''}>
                            <span class="task-list-item-label" contenteditable="true">${text.replace(/^\[[ x]\]\s*/, '')}</span>
                        </li>`;
            }
            return `<li><span contenteditable="true">${text}</span></li>`;
        };

        marked.setOptions({
            renderer: renderer,
            breaks: true,
            gfm: true,
            headerIds: true,
            sanitize: false,
            taskLists: true
        });

        // Define commands array
        const commands = [
            { text: 'todo', description: 'Create a todo list', template: '- [ ] ' },
            { text: 'list', description: 'Create a bullet list', template: '- ' },
            { text: 'num', description: 'Create a numbered list', template: '1. ' },
            { text: 'head1', description: 'Add heading 1', template: '# ' },
            { text: 'head2', description: 'Add heading 2', template: '## ' },
            { text: 'head3', description: 'Add heading 3', template: '### ' },
            { text: 'code', description: 'Add a code block', template: '```\n\n```' },
            { text: 'quote', description: 'Add a quote', template: '> ' },
            { text: 'link', description: 'Add a link', template: '[text](url)' },
            { text: 'hr', description: 'Add a horizontal rule', template: '---\n' },
            { text: 'table', description: 'Add a table', template: '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |' }
        ];

        // Function to update preview with current markdown
        function updatePreview() {
            const markdown = description.value || '';
            previewTab.innerHTML = marked.parse(markdown);
            setupPreviewEditableElements();

            if (activeEventId) {
                saveEventChanges();
            }
        }

        // Improved command popup handling
        function showCommandPopup(cursorPosition) {
            const existingPopup = document.querySelector('.command-popup');
            if (existingPopup) {
                existingPopup.remove();
            }

            const popup = document.createElement('div');
            popup.className = 'command-popup';

            commands.forEach((cmd, index) => {
                const item = document.createElement('div');
                item.className = 'command-item' + (index === 0 ? ' selected' : '');
                item.innerHTML = `
                    <span class="command-name">/${cmd.text}</span>
                    <span class="command-description">${cmd.description}</span>
                `;
                item.addEventListener('click', () => {
                    insertCommand(cmd.template);
                });
                popup.appendChild(item);
            });

            // Position popup near cursor
            const rect = description.getBoundingClientRect();
            const lineHeight = parseInt(window.getComputedStyle(description).lineHeight);
            const coords = getCaretCoordinates(description, cursorPosition);

            popup.style.position = 'absolute';
            popup.style.top = `${rect.top + coords.top + lineHeight}px`;
            popup.style.left = `${rect.left + coords.left}px`;

            document.body.appendChild(popup);
        }

        // Helper function to get caret coordinates
        function getCaretCoordinates(element, position) {
            const div = document.createElement('div');
            const text = element.value.slice(0, position);

            // Copy styles that affect text layout
            const styles = window.getComputedStyle(element);
            div.style.cssText = `
                position: absolute;
                visibility: hidden;
                height: auto;
                width: ${element.offsetWidth}px;
                white-space: pre-wrap;
                overflow-wrap: break-word;
                font-family: ${styles.fontFamily};
                font-size: ${styles.fontSize};
                font-weight: ${styles.fontWeight};
                line-height: ${styles.lineHeight};
                padding: ${styles.padding};
            `;

            div.textContent = text;
            document.body.appendChild(div);

            const coordinates = {
                top: div.offsetHeight,
                left: div.offsetWidth
            };

            document.body.removeChild(div);
            return coordinates;
        }

        // Improved command insertion
        function insertCommand(template) {
            const cursorPos = description.selectionStart;
            const text = description.value;
            const beforeCursor = text.slice(0, cursorPos);
            const afterCursor = text.slice(cursorPos);
            const lastNewline = beforeCursor.lastIndexOf('\n');
            const lineStart = beforeCursor.slice(0, lastNewline + 1);

            // Remove the '/' character that triggered the command
            const newText = lineStart + template + afterCursor;
            description.value = newText;
            description.focus();

            // Set cursor position
            if (template.includes('\n\n')) {
                description.selectionStart = description.selectionEnd = cursorPos + template.indexOf('\n') + 1;
            } else {
                description.selectionStart = description.selectionEnd = lineStart.length + template.length;
            }

            // Update preview
            updatePreview();

            // Remove command popup
            const popup = document.querySelector('.command-popup');
            if (popup) popup.remove();
        }

        // Handle textarea input with improved command handling
        let previewTimeout;
        description.addEventListener('input', (e) => {
            const value = e.target.value;
            const cursorPosition = e.target.selectionStart;

            // Check if we should show command popup
            const textBeforeCursor = value.substring(0, cursorPosition);
            const lastLine = textBeforeCursor.split('\n').pop();

            if (lastLine === '/') {
                showCommandPopup(cursorPosition);
            } else {
                const popup = document.querySelector('.command-popup');
                if (popup && !lastLine.startsWith('/')) {
                    popup.remove();
                }
            }

            // Update preview with debounce
            clearTimeout(previewTimeout);
            previewTimeout = setTimeout(updatePreview, 200);
        });

        // Handle preview/write toggle
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                if (btn.dataset.tab === 'write') {
                    writeTab.classList.add('active');
                    previewTab.classList.remove('active');
                } else {
                    writeTab.classList.remove('active');
                    previewTab.classList.add('active');
                    updatePreview();
                }
            });
        });
    }

    // Initialize storage
    function initializeStorage() {
        if (!localStorage.getItem('calendarEvents')) {
            localStorage.setItem('calendarEvents', JSON.stringify([]));
        }
    }

    // Initialize storage on load
    initializeStorage();

    // Initialize calendar
    try {
        const calendarEl = document.getElementById('calendar');
        if (calendarEl) {
            calendar = new CalendarApp(calendarEl);
        }
    } catch (error) {
        console.error('Error initializing calendar:', error);
    }

    // Helper function to get event state for comparison
    function getEventState(event) {
        if (!event) return null;
        return {
            title: event.title || 'Untitled',
            start: event.start?.toISOString(),
            end: event.end?.toISOString(),
            allDay: event.allDay || false,
            className: event.classNames?.[0] || 'event-work',
            description: event.extendedProps?.description || '',
            priority: event.extendedProps?.priority || 'medium',
            recurring: event.extendedProps?.recurring || 'none',
            reminder: event.extendedProps?.reminder || '30'
        };
    }

    // Helper function to set form values
    function setFormValues(event) {
        if (!event) return;

        const form = document.getElementById('eventForm');
        form.dataset.eventId = event.id;

        // Mevcut tarihleri koru
        const start = event.start ? new Date(event.start) : new Date();
        const end = event.end ? new Date(event.end) : new Date(start.getTime() + 3600000); // 1 saat ekle

        // Form değerlerini ayarla
        form.querySelector('#eventTitle').value = event.title || 'Untitled';
        form.querySelector('#eventDescription').value = event.extendedProps?.description || '';
        form.querySelector('#eventStart').value = formatDateForInput(start);
        form.querySelector('#eventEnd').value = formatDateForInput(end);
        form.querySelector('#eventCategory').value = event.classNames?.[0] || 'event-work';
        form.querySelector('#eventPriority').value = event.extendedProps?.priority || 'medium';
        form.querySelector('#eventRecurring').value = event.extendedProps?.recurring || 'none';
        form.querySelector('#eventReminder').value = event.extendedProps?.reminder || '30';
        form.querySelector('#eventAllDay').checked = event.allDay;

        // Renk seçiciyi güncelle
        const backgroundColor = event.backgroundColor || getColorForEventClass(event.classNames?.[0]);
        const customColorInput = document.querySelector('.custom-color-input');
        if (customColorInput) {
            customColorInput.value = backgroundColor;
        }

        // Delete butonunu göster
        const deleteBtn = document.getElementById('deleteEventBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'block';
        }
    }

    // Function to get form data
    function getFormData() {
        const form = document.getElementById('eventForm');

        // Tarihleri al
        const startInput = form.querySelector('#eventStart').value;
        const endInput = form.querySelector('#eventEnd').value;
        const isAllDay = form.querySelector('#eventAllDay').checked;

        // Form verilerini döndür
        return {
            title: form.querySelector('#eventTitle').value || 'Untitled',
            description: form.querySelector('#eventDescription').value || '',
            start: startInput,
            end: endInput,
            allDay: isAllDay,
            category: form.querySelector('#eventCategory').value,
            priority: form.querySelector('#eventPriority').value,
            recurring: form.querySelector('#eventRecurring').value,
            reminder: form.querySelector('#eventReminder').value
        };
    }

    // Save changes to event
    async function saveEventChanges() {
        if (!activeEventId) return;

        const event = calendar.getEventById(activeEventId);
        if (!event) return;

        const formData = getFormData();

        // Etkinliği güncelle
        event.setProp('title', formData.title || 'Untitled');
        event.setProp('classNames', [formData.category]);
        event.setAllDay(formData.allDay);

        // Tarihleri güncelle
        if (formData.start) {
            event.setStart(new Date(formData.start));
        }
        if (formData.end) {
            event.setEnd(new Date(formData.end));
        }

        // Extended özellikleri güncelle
        event.setExtendedProp('description', formData.description);
        event.setExtendedProp('priority', formData.priority);
        event.setExtendedProp('reminder', formData.reminder);
        event.setExtendedProp('recurring', formData.recurring);

        // Renk güncelleme
        const customColorInput = document.querySelector('.custom-color-input');
        if (customColorInput) {
            const color = customColorInput.value;
            event.setProp('backgroundColor', color);
            event.setProp('borderColor', color);
        }

        // Değişiklikleri kaydet
        await saveEvents();

        // API'ye güncelleme gönder
        try {
            await syncEventWithAPI(event, 'update');
        } catch (error) {
            console.error('API güncelleme hatası:', error);
        }
    }

    // Generate recurring events
    function generateRecurringEvents(sourceEvent, formData) {
        const events = [];
        const startDate = new Date(formData.start);
        const endDate = new Date(formData.end);
        const duration = endDate.getTime() - startDate.getTime();

        let currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + 1); // Start from next day

        const untilDate = new Date(startDate);
        untilDate.setMonth(untilDate.getMonth() + 3); // Generate for 3 months

        while (currentDate <= untilDate) {
            switch (formData.recurring) {
                case 'daily':
                    const dailyStart = new Date(currentDate);
                    dailyStart.setHours(startDate.getHours(), startDate.getMinutes());
                    const dailyEnd = new Date(dailyStart.getTime() + duration);
                    events.push(createRecurringEvent(dailyStart, dailyEnd, formData));
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;

                case 'weekly':
                    if (currentDate.getDay() === startDate.getDay()) {
                        const weeklyStart = new Date(currentDate);
                        weeklyStart.setHours(startDate.getHours(), startDate.getMinutes());
                        const weeklyEnd = new Date(weeklyStart.getTime() + duration);
                        events.push(createRecurringEvent(weeklyStart, weeklyEnd, formData));
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;

                case 'monthly':
                    if (currentDate.getDate() === startDate.getDate()) {
                        const monthlyStart = new Date(currentDate);
                        monthlyStart.setHours(startDate.getHours(), startDate.getMinutes());
                        const monthlyEnd = new Date(monthlyStart.getTime() + duration);
                        events.push(createRecurringEvent(monthlyStart, monthlyEnd, formData));
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                    break;
            }
        }

        return events;
    }

    // Create a recurring event instance
    function createRecurringEvent(start, end, formData) {
        return {
            title: formData.title,
            start: new Date(start),
            end: new Date(end),
            allDay: formData.allDay,
            className: [formData.category],
            extendedProps: {
                description: formData.description,
                priority: formData.priority,
                recurring: formData.recurring,
                reminder: formData.reminder,
                isRecurring: true // Flag to identify recurring instances
            }
        };
    }

    // Handle recurring events
    function handleRecurringEvents(sourceEvent, formData) {
        if (!sourceEvent || !formData) return;

        // Remove existing recurring instances
        calendar.getEvents()
            .filter(e => e.groupId === sourceEvent.id)
            .forEach(e => e.remove());

        // If recurring is set to none, just return after removing existing instances
        if (formData.recurring === 'none') {
            return;
        }

        // Create new recurring instances
        const events = generateRecurringEvents(sourceEvent, formData);
        events.forEach(eventData => {
            if (eventData.start && eventData.end) {  // Only create if dates are valid
                calendar.addEvent({
                    ...eventData,
                    id: `recurring-${sourceEvent.id}-${Date.now()}-${Math.random()}`,
                    groupId: sourceEvent.id
                });
            }
        });

        saveEvents();
    }

    // Delete Event
    window.deleteEvent = function () {
        if (!activeEventId) return;

        const event = calendar.getEventById(activeEventId);
        if (!event) return;

        // API'den sil
        syncEventWithAPI(event, 'delete').catch(error => {
            console.error('API silme hatası:', error);
        });

        // Remove all recurring instances of this event
        if (event.groupId) {
            calendar.getEvents()
                .filter(e => e.groupId === event.groupId)
                .forEach(e => e.remove());
        }

        // Remove any events that were created from this event
        calendar.getEvents()
            .filter(e => e.groupId === event.id)
            .forEach(e => e.remove());

        // Remove the event itself
        event.remove();

        closeModal();
        saveEvents();
    }

    // Load events from localStorage
    async function loadEvents() {
        try {
            // Önce localStorage'dan yükle
            const savedEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
            if (!Array.isArray(savedEvents)) {
                throw new Error('Geçersiz veri formatı');
            }

            // Mevcut tüm etkinlikleri temizle
            calendar.removeAllEvents();

            // Etkinlikleri ekle
            savedEvents.forEach(eventData => {
                if (eventData && eventData.start && eventData.end) {
                    try {
                        const event = {
                            ...eventData,
                            start: new Date(eventData.start),
                            end: new Date(eventData.end),
                            backgroundColor: eventData.backgroundColor || getColorForEventClass(eventData.className?.[0])
                        };

                        calendar.addEvent(event);

                        // Yinelenen etkinlikleri kontrol et
                        if (!eventData.extendedProps?.isRecurring && eventData.extendedProps?.recurring !== 'none') {
                            handleRecurringEvents(calendar.getEventById(eventData.id), {
                                ...eventData,
                                start: new Date(eventData.start),
                                end: new Date(eventData.end)
                            });
                        }
                    } catch (eventError) {
                        console.error('Etkinlik yüklenirken hata:', eventError);
                    }
                }
            });

            // JSON dosyasından da yükle ve birleştir
            try {
                const response = await fetch('/api/events');
                if (response.ok) {
                    const jsonEvents = await response.json();
                    if (Array.isArray(jsonEvents)) {
                        jsonEvents.forEach(eventData => {
                            if (!savedEvents.some(e => e.id === eventData.id)) {
                                if (eventData && eventData.start && eventData.end) {
                                    const event = {
                                        ...eventData,
                                        start: new Date(eventData.start),
                                        end: new Date(eventData.end),
                                        backgroundColor: eventData.backgroundColor || getColorForEventClass(eventData.className?.[0])
                                    };
                                    calendar.addEvent(event);
                                }
                            }
                        });
                    }
                }
            } catch (jsonError) {
                console.error('JSON dosyasından yükleme hatası:', jsonError);
            }
        } catch (error) {
            console.error('Etkinlikler yüklenirken hata:', error);
            localStorage.setItem('calendarEvents', JSON.stringify([]));
            saveEventsToJSON();
        }
    }

    // Save events to JSON file
    async function saveEventsToJSON() {
        try {
            const events = calendar.getEvents()
                .filter(event => event && !event.extendedProps?.isRecurring) // Ana etkinlikleri al
                .map(event => ({
                    id: event.id,
                    notionId: event.extendedProps?.notionId || event.id,
                    title: event.title || 'Untitled',
                    start: event.start?.toISOString(),
                    end: event.end?.toISOString(),
                    allDay: event.allDay,
                    className: event.classNames || ['event-work'],
                    backgroundColor: event.backgroundColor || '#6366f1',
                    borderColor: event.borderColor || event.backgroundColor || '#6366f1',
                    extendedProps: {
                        description: event.extendedProps?.description || '',
                        priority: event.extendedProps?.priority || 'medium',
                        recurring: event.extendedProps?.recurring || 'none',
                        reminder: event.extendedProps?.reminder || '30',
                    }
                }));

            // API'ye kaydetme isteği gönder
            const response = await fetch('/api/save-events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ events })
            });

            if (!response.ok) {
                throw new Error('Etkinlikler JSON dosyasına kaydedilemedi');
            }

            const result = await response.json();
            if (result.success) {
                console.log('Etkinlikler JSON dosyasına kaydedildi');
            }
        } catch (error) {
            console.error('JSON kaydetme hatası:', error);
        }
    }

    // Save events to localStorage and JSON
    async function saveEvents() {
        try {
            const eventMap = new Map();

            calendar.getEvents()
                .filter(event => event && !event.extendedProps?.isRecurring)
                .forEach(event => {
                    try {
                        if (event.start && event.end) {
                            eventMap.set(event.id, {
                                id: event.id,
                                notionId: event.extendedProps?.notionId || event.id,
                                title: event.title || 'Untitled',
                                start: event.start?.toISOString(),
                                end: event.end?.toISOString(),
                                allDay: event.allDay,
                                className: event.classNames || ['event-work'],
                                backgroundColor: event.backgroundColor || getColorForEventClass(event.classNames?.[0]),
                                borderColor: event.borderColor || event.backgroundColor || getColorForEventClass(event.classNames?.[0]),
                                extendedProps: {
                                    description: event.extendedProps?.description || '',
                                    priority: event.extendedProps?.priority || 'medium',
                                    recurring: event.extendedProps?.recurring || 'none',
                                    reminder: event.extendedProps?.reminder || '30',
                                }
                            });
                        }
                    } catch (eventError) {
                        console.error('Etkinlik kaydedilirken hata:', eventError);
                    }
                });

            const events = Array.from(eventMap.values());

            // localStorage'a kaydet
            localStorage.setItem('calendarEvents', JSON.stringify(events));

            // JSON dosyasına kaydet
            await saveEventsToJSON();

            // Takvimi yenile
            await loadEvents();
        } catch (error) {
            console.error('Etkinlikler kaydedilirken hata:', error);
        }
    }

    // Color picker functionality
    function initializeColorPicker() {
        const colorPicker = document.querySelector('.color-picker');
        if (!colorPicker) return;

        // Handle color swatch selection
        colorPicker.addEventListener('click', (e) => {
            const swatch = e.target.closest('.color-swatch');
            if (swatch) {
                // Update UI
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');

                // Update custom color input to match
                const customColorInput = document.querySelector('.custom-color-input');
                if (customColorInput) {
                    customColorInput.value = swatch.dataset.color;
                }

                // Update event color
                if (activeEventId) {
                    const event = calendar.getEventById(activeEventId);
                    if (event) {
                        event.setProp('backgroundColor', swatch.dataset.color);
                        event.setProp('borderColor', swatch.dataset.color);
                        saveEvents(); // Save changes immediately
                    }
                }
            }
        });

        // Handle custom color input
        const customColorInput = colorPicker.querySelector('.custom-color-input');
        if (customColorInput) {
            customColorInput.addEventListener('input', (e) => {
                // Update event color
                if (activeEventId) {
                    const event = calendar.getEventById(activeEventId);
                    if (event) {
                        event.setProp('backgroundColor', e.target.value);
                        event.setProp('borderColor', e.target.value);
                        saveEvents(); // Save changes immediately
                    }
                }

                // Remove selection from other swatches
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            });
        }
    }

    // Helper function to get color for event class
    function getColorForEventClass(className) {
        const colorMap = {
            'event-work': '#6366f1',
            'event-personal': '#10b981',
            'event-meeting': '#ec4899',
            'event-deadline': '#ef4444'
        };
        return colorMap[className] || '#6366f1';
    }

    // Hızlı etkinlik ekleme için input alanını ayarla
    const quickEventInput = document.getElementById('quickEventInput');
    if (quickEventInput) {
        quickEventInput.addEventListener('keypress', async function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                console.log('Enter basıldı');

                const title = this.value.trim();
                if (!title) return;

                console.log('Calendar nesnesi:', calendar);

                // Bugünün tarihini al
                const now = new Date();
                const start = new Date(now);
                start.setHours(0, 0, 0, 0); // Günün başlangıcı

                // Bitiş zamanını günün sonuna ayarla
                const end = new Date(start);
                end.setHours(23, 59, 59, 999);

                // Yeni etkinlik oluştur
                const newEventId = 'event-' + Date.now();
                const newEvent = {
                    id: newEventId,
                    title: title,
                    start: start,
                    end: end,
                    allDay: true,
                    className: ['event-quick'],
                    backgroundColor: '#94a3b8',
                    borderColor: '#94a3b8',
                    extendedProps: {
                        description: 'Hızlı eklenen etkinlik',
                        priority: 'medium',
                        recurring: 'none',
                        reminder: '0',
                        isQuickEvent: true,
                        status: 'pending'
                    }
                };

                try {
                    let calendarEvent;

                    // CalendarApp sınıfının calendar özelliğini kullan
                    if (calendar && calendar.calendar) {
                        console.log('CalendarApp üzerinden ekleniyor');
                        calendarEvent = calendar.calendar.addEvent(newEvent);
                    } else {
                        console.log('Doğrudan calendar üzerinden ekleniyor');
                        calendarEvent = calendar.addEvent(newEvent);
                    }

                    if (calendarEvent) {
                        console.log('Etkinlik eklendi:', calendarEvent);

                        // API'ye ekle
                        try {
                            await syncEventWithAPI(calendarEvent, 'add');
                        } catch (apiError) {
                            console.error('API hatası:', apiError);
                            calendarEvent.remove();
                            return;
                        }

                        // Değişiklikleri kaydet
                        await saveEvents();
                        console.log('Etkinlik başarıyla kaydedildi');
                    } else {
                        console.error('Etkinlik eklenemedi');
                    }
                } catch (error) {
                    console.error('Etkinlik eklenirken hata:', error);
                }

                // Input'u temizle
                this.value = '';
            }
        });
    }

    // API işlemleri için yardımcı fonksiyonlar
    async function syncEventWithAPI(event, action = 'add') {
        try {
            let url, method, data;

            switch (action) {
                case 'add':
                    url = '/api/events';
                    method = 'POST';
                    data = {
                        event: {
                            title: event.title,
                            start: event.start.toISOString(),
                            end: event.end.toISOString()
                        }
                    };
                    break;

                case 'update':
                    url = `/api/events/${event.id}`;
                    method = 'PUT';
                    data = {
                        event: {
                            title: event.title,
                            start: event.start.toISOString(),
                            end: event.end.toISOString()
                        }
                    };
                    break;

                case 'delete':
                    url = `/api/events/${event.id}`;
                    method = 'DELETE';
                    data = null;
                    break;
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: data ? JSON.stringify(data) : null
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'API senkronizasyon hatası');
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API senkronizasyon hatası:', error);
            throw error;
        }
    }

    // API'den tüm etkinlikleri getir
    async function loadEventsFromAPI() {
        try {
            const response = await fetch('/api/events');
            if (!response.ok) {
                throw new Error('API\'den etkinlikler alınamadı');
            }

            const data = await response.json();
            if (data.success && data.events) {
                // Mevcut etkinlikleri temizle
                calendar.removeAllEvents();

                // Yeni etkinlikleri ekle
                data.events.forEach(event => {
                    calendar.addEvent(event);
                });
            }
        } catch (error) {
            console.error('Etkinlikleri yükleme hatası:', error);
        }
    }

    // Ayarları yükle ve uygula
    function loadAndApplySettings() {
        const settings = JSON.parse(localStorage.getItem('calendarSettings')) || defaultSettings;

        // Renk paletini uygula
        Object.entries(settings.colorPalette).forEach(([category, color]) => {
            const style = document.createElement('style');
            style.textContent = `
                .${category} {
                    background-color: ${color} !important;
                    border-color: ${color} !important;
                }
            `;
            document.head.appendChild(style);
        });

        // Temayı uygula
        applyTheme(settings.theme);
    }

    // Temayı uygula
    function applyTheme(theme) {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }

    // Initialize all components
    document.addEventListener('DOMContentLoaded', function () {
        try {
            initializeMarkdownEditor();
            initializeColorPicker();
            loadAndApplySettings();
        } catch (error) {
            console.error('Error initializing components:', error);
        }
    });

    async function handleDateSelect(selectInfo) {
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
                activeEventId = newEventId;
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
                form.querySelector('#eventStart').value = formatDateForInput(event.start);
                form.querySelector('#eventEnd').value = formatDateForInput(event.end);

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
                    calendar.addEvent(event);
                    calendar.unselect();
                    await saveEvents();
                } catch (error) {
                    console.error('Etkinlik oluşturulurken hata:', error);
                }
            }
        }
    }

    // Bildirim izinlerini kontrol et ve iste
    if ('Notification' in window) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission().then(function (permission) {
                if (permission === 'granted') {
                    console.log('Bildirim izni alındı');
                }
            });
        }
    }
});