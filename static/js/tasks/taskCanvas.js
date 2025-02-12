class TaskCanvas {
    constructor() {
        this.canvas = document.getElementById('taskCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.tasks = [];
        this.draggedTask = null;
        this.hoveredTask = null;
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };
        this.isDragging = false;
        this.isPanning = false;

        this.initializeCanvas();
        this.addEventListeners();
    }

    initializeCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
        this.render();
    }

    addEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        const task = this.getTaskAtPosition(pos);

        if (task) {
            this.draggedTask = task;
            this.isDragging = true;
        } else {
            this.isPanning = true;
            this.lastMousePos = pos;
        }
    }

    handleMouseMove(e) {
        const pos = this.getMousePos(e);

        if (this.isDragging && this.draggedTask) {
            this.draggedTask.x = (pos.x - this.offset.x) / this.scale;
            this.draggedTask.y = (pos.y - this.offset.y) / this.scale;
            this.render();
        } else if (this.isPanning) {
            this.offset.x += pos.x - this.lastMousePos.x;
            this.offset.y += pos.y - this.lastMousePos.y;
            this.lastMousePos = pos;
            this.render();
        } else {
            const hoveredTask = this.getTaskAtPosition(pos);
            if (this.hoveredTask !== hoveredTask) {
                this.hoveredTask = hoveredTask;
                this.render();
            }
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        this.isPanning = false;
        this.draggedTask = null;
    }

    handleWheel(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);
        const zoom = e.deltaY < 0 ? 1.1 : 0.9;

        // Fare pozisyonuna göre zoom yap
        this.offset.x = pos.x - (pos.x - this.offset.x) * zoom;
        this.offset.y = pos.y - (pos.y - this.offset.y) * zoom;
        this.scale *= zoom;

        this.render();
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    getTaskAtPosition(pos) {
        const transformedPos = {
            x: (pos.x - this.offset.x) / this.scale,
            y: (pos.y - this.offset.y) / this.scale
        };

        return this.tasks.find(task => {
            return transformedPos.x >= task.x &&
                transformedPos.x <= task.x + task.width &&
                transformedPos.y >= task.y &&
                transformedPos.y <= task.y + task.height;
        });
    }

    updateTasks(tasks) {
        this.tasks = tasks.map((task, index) => {
            // Eğer task'ın pozisyonu yoksa, grid düzeninde yerleştir
            if (!task.x || !task.y) {
                const col = index % 3;
                const row = Math.floor(index / 3);
                return {
                    ...task,
                    x: col * 250 + 50,
                    y: row * 150 + 50,
                    width: 200,
                    height: 100
                };
            }
            return task;
        });
        this.render();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid çiz
        this.drawGrid();

        // Transform uygula
        this.ctx.save();
        this.ctx.translate(this.offset.x, this.offset.y);
        this.ctx.scale(this.scale, this.scale);

        // Bağlantıları çiz
        this.drawConnections();

        // Taskları çiz
        this.tasks.forEach(task => this.drawTask(task));

        this.ctx.restore();
    }

    drawGrid() {
        const gridSize = 50 * this.scale;
        const offsetX = this.offset.x % gridSize;
        const offsetY = this.offset.y % gridSize;

        this.ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
        this.ctx.lineWidth = 1;

        // Dikey çizgiler
        for (let x = offsetX; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        // Yatay çizgiler
        for (let y = offsetY; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawConnections() {
        this.tasks.forEach(task => {
            if (task.dependencies) {
                task.dependencies.forEach(depId => {
                    const depTask = this.tasks.find(t => t.id === depId);
                    if (depTask) {
                        this.drawConnection(task, depTask);
                    }
                });
            }
        });
    }

    drawConnection(task1, task2) {
        const start = {
            x: task1.x + task1.width / 2,
            y: task1.y + task1.height / 2
        };
        const end = {
            x: task2.x + task2.width / 2,
            y: task2.y + task2.height / 2
        };

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);

        // Bezier eğrisi için kontrol noktaları
        const cp1x = start.x + (end.x - start.x) / 2;
        const cp1y = start.y;
        const cp2x = start.x + (end.x - start.x) / 2;
        const cp2y = end.y;

        this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, end.x, end.y);

        this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Ok başı çiz
        this.drawArrowhead(end, Math.atan2(end.y - cp2y, end.x - cp2x));
    }

    drawArrowhead(pos, angle) {
        const size = 10;
        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        this.ctx.rotate(angle);
        this.ctx.beginPath();
        this.ctx.moveTo(-size, -size / 2);
        this.ctx.lineTo(0, 0);
        this.ctx.lineTo(-size, size / 2);
        this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.6)';
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawTask(task) {
        const isHovered = task === this.hoveredTask;
        const isDragged = task === this.draggedTask;

        // Gölge
        if (isHovered || isDragged) {
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 5;
            this.ctx.shadowOffsetY = 5;
        }

        // Arka plan
        this.ctx.fillStyle = isDragged ? '#e8f0fe' : '#ffffff';
        this.ctx.strokeStyle = task.priority === 'high' ? '#f56c6c' :
            task.priority === 'medium' ? '#e6a23c' : '#67c23a';
        this.ctx.lineWidth = 2;

        // Yuvarlak köşeli dikdörtgen
        const radius = 8;
        this.ctx.beginPath();
        this.ctx.moveTo(task.x + radius, task.y);
        this.ctx.lineTo(task.x + task.width - radius, task.y);
        this.ctx.quadraticCurveTo(task.x + task.width, task.y, task.x + task.width, task.y + radius);
        this.ctx.lineTo(task.x + task.width, task.y + task.height - radius);
        this.ctx.quadraticCurveTo(task.x + task.width, task.y + task.height, task.x + task.width - radius, task.y + task.height);
        this.ctx.lineTo(task.x + radius, task.y + task.height);
        this.ctx.quadraticCurveTo(task.x, task.y + task.height, task.x, task.y + task.height - radius);
        this.ctx.lineTo(task.x, task.y + radius);
        this.ctx.quadraticCurveTo(task.x, task.y, task.x + radius, task.y);
        this.ctx.closePath();

        this.ctx.fill();
        this.ctx.stroke();

        // Gölgeyi sıfırla
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        // Başlık
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText(task.title, task.x + 10, task.y + 25, task.width - 20);

        // Açıklama
        this.ctx.fillStyle = '#606266';
        this.ctx.font = '12px Arial';
        const description = task.description.length > 50 ?
            task.description.substring(0, 47) + '...' :
            task.description;
        this.ctx.fillText(description, task.x + 10, task.y + 45, task.width - 20);

        // Etiketler
        let tagX = task.x + 10;
        const tagY = task.y + task.height - 25;
        task.tags.forEach(tag => {
            const tagWidth = this.ctx.measureText(tag).width + 10;
            if (tagX + tagWidth < task.x + task.width - 10) {
                this.ctx.fillStyle = '#f0f2f5';
                this.ctx.fillRect(tagX, tagY - 10, tagWidth, 20);
                this.ctx.fillStyle = '#606266';
                this.ctx.fillText(tag, tagX + 5, tagY + 4);
                tagX += tagWidth + 5;
            }
        });
    }
}

// Canvas görünümü için global instance
window.taskCanvas = new TaskCanvas();

// TaskManager'a canvas görünümü için metod ekle
TaskManager.prototype.renderCanvasView = function () {
    window.taskCanvas.updateTasks(this.tasks);
}; 