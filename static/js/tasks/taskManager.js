class TaskManager {
    constructor() {
        this.tasks = [];
        this.categories = [];
        this.tags = new Set();
        this.currentView = 'list';
        this.initializeEventListeners();
        this.loadData();
    }

    initializeEventListeners() {
        // View değiştirme butonları
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeView(e.target.dataset.view));
        });

        // Yeni görev ekleme
        const addTaskBtn = document.querySelector('.add-task-btn');
        const taskModal = document.querySelector('.task-modal');
        const closeModal = document.querySelector('.close-modal');
        const taskForm = document.getElementById('task-form');

        addTaskBtn.addEventListener('click', () => this.openModal(taskModal));
        closeModal.addEventListener('click', () => this.closeModal(taskModal));
        taskForm.addEventListener('submit', (e) => this.handleTaskSubmit(e));

        // Kategori ekleme
        const addCategoryBtn = document.querySelector('.add-category-btn');
        addCategoryBtn.addEventListener('click', () => this.addCategory());
    }

    loadData() {
        // Local storage'dan verileri yükle
        const savedTasks = localStorage.getItem('tasks');
        const savedCategories = localStorage.getItem('categories');

        if (savedTasks) {
            this.tasks = JSON.parse(savedTasks);
            this.updateTags();
            this.renderTasks();
        }

        if (savedCategories) {
            this.categories = JSON.parse(savedCategories);
            this.renderCategories();
        }
    }

    saveData() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        localStorage.setItem('categories', JSON.stringify(this.categories));
    }

    changeView(view) {
        // Aktif view butonunu güncelle
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // View container'ları güncelle
        document.querySelectorAll('.view-container').forEach(container => {
            container.classList.toggle('active', container.classList.contains(`${view}-view`));
        });

        this.currentView = view;
        this.renderTasks();
    }

    openModal(modal) {
        modal.style.display = 'block';
    }

    closeModal(modal) {
        modal.style.display = 'none';
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        const task = {
            id: Date.now(),
            title: formData.get('title'),
            description: formData.get('description'),
            priority: formData.get('priority'),
            dueDate: formData.get('dueDate'),
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
            status: 'todo',
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.updateTags();
        this.saveData();
        this.renderTasks();
        this.closeModal(document.querySelector('.task-modal'));
        e.target.reset();
    }

    updateTags() {
        this.tags = new Set(this.tasks.flatMap(task => task.tags));
        this.renderTags();
    }

    renderTags() {
        const tagsContainer = document.querySelector('.tags-container');
        tagsContainer.innerHTML = Array.from(this.tags)
            .map(tag => `<span class="tag">${tag}</span>`)
            .join('');
    }

    addCategory() {
        const categoryName = prompt('Kategori adı:');
        if (categoryName && categoryName.trim()) {
            const category = {
                id: Date.now(),
                name: categoryName.trim(),
                color: this.getRandomColor()
            };

            this.categories.push(category);
            this.saveData();
            this.renderCategories();
        }
    }

    renderCategories() {
        const categoryItems = document.querySelector('.category-items');
        categoryItems.innerHTML = this.categories
            .map(category => `
                <div class="category-item" style="border-left: 4px solid ${category.color}">
                    <span>${category.name}</span>
                    <button onclick="taskManager.deleteCategory(${category.id})">×</button>
                </div>
            `)
            .join('');
    }

    deleteCategory(categoryId) {
        this.categories = this.categories.filter(category => category.id !== categoryId);
        this.saveData();
        this.renderCategories();
    }

    renderTasks() {
        switch (this.currentView) {
            case 'list':
                this.renderListView();
                break;
            case 'kanban':
                this.renderKanbanView();
                break;
            case 'canvas':
                this.renderCanvasView();
                break;
        }
    }

    renderListView() {
        const listView = document.querySelector('.list-view');
        listView.innerHTML = this.tasks
            .map(task => `
                <div class="task-item" data-id="${task.id}">
                    <div class="task-header">
                        <h3>${task.title}</h3>
                        <span class="priority ${task.priority}">${task.priority}</span>
                    </div>
                    <p>${task.description}</p>
                    <div class="task-footer">
                        <div class="task-tags">
                            ${task.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                        <div class="task-due-date">${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}</div>
                    </div>
                </div>
            `)
            .join('');
    }

    renderKanbanView() {
        const kanbanView = document.querySelector('.kanban-view');
        const statuses = ['todo', 'in-progress', 'done'];

        kanbanView.innerHTML = `
            <div class="kanban-columns">
                ${statuses.map(status => `
                    <div class="kanban-column" data-status="${status}">
                        <h3>${this.getStatusTitle(status)}</h3>
                        <div class="kanban-tasks">
                            ${this.tasks
                .filter(task => task.status === status)
                .map(task => this.renderKanbanTask(task))
                .join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderKanbanTask(task) {
        return `
            <div class="kanban-task" data-id="${task.id}">
                <h4>${task.title}</h4>
                <div class="task-meta">
                    <span class="priority ${task.priority}"></span>
                    ${task.dueDate ? `<span class="due-date">${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
                </div>
            </div>
        `;
    }

    getStatusTitle(status) {
        const titles = {
            'todo': 'Yapılacak',
            'in-progress': 'Devam Ediyor',
            'done': 'Tamamlandı'
        };
        return titles[status];
    }

    getRandomColor() {
        const colors = [
            '#4a90e2', '#67c23a', '#e6a23c', '#f56c6c',
            '#9c27b0', '#795548', '#607d8b', '#009688'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}

// TaskManager instance'ını oluştur
const taskManager = new TaskManager();

// Global erişim için window objesine ekle
window.taskManager = taskManager; 