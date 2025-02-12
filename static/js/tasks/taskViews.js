class TaskViews {
    constructor() {
        this.draggedElement = null;
        this.initializeDragAndDrop();
    }

    initializeDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-item') || e.target.classList.contains('kanban-task')) {
                this.draggedElement = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.id);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-item') || e.target.classList.contains('kanban-task')) {
                e.target.classList.remove('dragging');
                this.draggedElement = null;
            }
        });

        // Kanban sütunları için drop event'leri
        document.querySelectorAll('.kanban-tasks').forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = this.getDragAfterElement(column, e.clientY);
                const draggable = this.draggedElement;
                if (afterElement == null) {
                    column.appendChild(draggable);
                } else {
                    column.insertBefore(draggable, afterElement);
                }
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData('text/plain');
                const task = taskManager.tasks.find(t => t.id === parseInt(taskId));
                if (task) {
                    task.status = column.closest('.kanban-column').dataset.status;
                    taskManager.saveData();
                }
            });
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging), .kanban-task:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // Liste görünümü için ek özellikler
    initializeListView() {
        const listView = document.querySelector('.list-view');

        // Sıralama seçenekleri
        const sortOptions = document.createElement('div');
        sortOptions.className = 'sort-options';
        sortOptions.innerHTML = `
            <select class="sort-select">
                <option value="priority">Önceliğe Göre</option>
                <option value="dueDate">Tarihe Göre</option>
                <option value="title">İsme Göre</option>
            </select>
        `;

        listView.insertBefore(sortOptions, listView.firstChild);

        // Sıralama event listener'ı
        sortOptions.querySelector('.sort-select').addEventListener('change', (e) => {
            this.sortTasks(e.target.value);
        });
    }

    sortTasks(criteria) {
        const tasks = taskManager.tasks;

        switch (criteria) {
            case 'priority':
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'dueDate':
                tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                break;
            case 'title':
                tasks.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }

        taskManager.renderTasks();
    }

    // Kanban görünümü için ek özellikler
    initializeKanbanView() {
        const kanbanView = document.querySelector('.kanban-view');

        // Sütun başlıklarına görev sayısı ekleme
        const updateColumnCounts = () => {
            document.querySelectorAll('.kanban-column').forEach(column => {
                const status = column.dataset.status;
                const count = taskManager.tasks.filter(task => task.status === status).length;
                const header = column.querySelector('h3');
                header.textContent = `${this.getStatusTitle(status)} (${count})`;
            });
        };

        // Görev eklendiğinde veya taşındığında sayıları güncelle
        const observer = new MutationObserver(updateColumnCounts);
        document.querySelectorAll('.kanban-tasks').forEach(column => {
            observer.observe(column, { childList: true });
        });
    }

    getStatusTitle(status) {
        return {
            'todo': 'Yapılacak',
            'in-progress': 'Devam Ediyor',
            'done': 'Tamamlandı'
        }[status];
    }
}

// TaskViews instance'ını oluştur
window.taskViews = new TaskViews();

// TaskManager'a view'ları başlatma metodları ekle
TaskManager.prototype.initializeViews = function () {
    window.taskViews.initializeListView();
    window.taskViews.initializeKanbanView();
}; 