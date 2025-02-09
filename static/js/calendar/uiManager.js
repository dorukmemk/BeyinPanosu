export class UIManager {
    constructor() {
        this.colorPicker = null;
        this.calendar = null;
    }

    formatDateForInput(date) {
        if (!date) return '';
        const d = new Date(date);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
    }

    initializeColorPicker(element) {
        if (!element) return;

        this.colorPicker = new Pickr({
            el: element,
            theme: 'classic',
            default: '#4a90e2',
            swatches: [
                '#4a90e2',
                '#50e3c2',
                '#f5a623',
                '#d0021b',
                '#7ed321',
                '#b8e986',
                '#bd10e0',
                '#9013fe'
            ],
            components: {
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    input: true,
                    save: true
                }
            }
        });

        return this.colorPicker;
    }

    getColorForEventClass(className) {
        const colorMap = {
            'work': '#4a90e2',
            'personal': '#50e3c2',
            'meeting': '#f5a623',
            'urgent': '#d0021b',
            'default': '#7ed321'
        };
        return colorMap[className] || colorMap.default;
    }

    handleResize() {
        if (this.calendar) {
            this.calendar.updateSize();
        }
    }

    fadeIn(element) {
        if (!element) return;
        element.style.opacity = 0;
        element.style.display = 'block';
        (function fade() {
            let val = parseFloat(element.style.opacity);
            if (!((val += .1) > 1)) {
                element.style.opacity = val;
                requestAnimationFrame(fade);
            }
        })();
    }

    fadeOut(element) {
        if (!element) return;
        element.style.opacity = 1;
        (function fade() {
            if ((element.style.opacity -= .1) < 0) {
                element.style.display = 'none';
            } else {
                requestAnimationFrame(fade);
            }
        })();
    }

    setCalendar(calendar) {
        this.calendar = calendar;
        window.addEventListener('resize', this.handleResize.bind(this));
    }
}

export default new UIManager(); 