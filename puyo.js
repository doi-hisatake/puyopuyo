class PuyoGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        
        this.GRID_WIDTH = 6;
        this.GRID_HEIGHT = 12;
        this.CELL_SIZE = 40;
        
        this.grid = Array(this.GRID_HEIGHT).fill().map(() => Array(this.GRID_WIDTH).fill(0));
        this.score = 0;
        this.gameRunning = false;
        
        this.colors = {
            0: '#000000', // 空
            1: '#ff0000', // 赤
            2: '#0000ff', // 青
            3: '#00ff00', // 緑
            4: '#ffff00', // 黄
            5: '#ff00ff'  // 紫
        };
        
        this.currentPuyo = null;
        this.nextPuyo = null;
        
        this.initializeGame();
        this.setupEventListeners();
    }
    
    initializeGame() {
        this.generateNewPuyo();
        this.gameRunning = true;
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || !this.currentPuyo) return;
            
            switch(e.code) {
                case 'ArrowLeft':
                    this.movePuyo(-1, 0);
                    break;
                case 'ArrowRight':
                    this.movePuyo(1, 0);
                    break;
                case 'ArrowDown':
                    this.movePuyo(0, 1);
                    break;
                case 'KeyZ':
                    this.rotatePuyo();
                    break;
            }
        });
    }
    
    generateNewPuyo() {
        this.currentPuyo = {
            x: Math.floor(this.GRID_WIDTH / 2) - 1,
            y: 0,
            color1: Math.floor(Math.random() * 4) + 1,
            color2: Math.floor(Math.random() * 4) + 1,
            rotation: 0
        };
        
        if (this.isCollision(this.currentPuyo, 0, 0)) {
            this.gameOver();
        }
    }
    
    movePuyo(dx, dy) {
        if (this.isCollision(this.currentPuyo, dx, dy)) {
            if (dy > 0) {
                this.placePuyo();
                return false;
            }
            return false;
        }
        
        this.currentPuyo.x += dx;
        this.currentPuyo.y += dy;
        return true;
    }
    
    rotatePuyo() {
        const oldRotation = this.currentPuyo.rotation;
        this.currentPuyo.rotation = (this.currentPuyo.rotation + 1) % 4;
        
        if (this.isCollision(this.currentPuyo, 0, 0)) {
            this.currentPuyo.rotation = oldRotation;
        }
    }
    
    isCollision(puyo, dx, dy) {
        const newX = puyo.x + dx;
        const newY = puyo.y + dy;
        
        const positions = this.getPuyoPositions(newX, newY, puyo.rotation);
        
        for (let pos of positions) {
            if (pos.x < 0 || pos.x >= this.GRID_WIDTH || 
                pos.y >= this.GRID_HEIGHT || 
                (pos.y >= 0 && this.grid[pos.y][pos.x] !== 0)) {
                return true;
            }
        }
        return false;
    }
    
    getPuyoPositions(x, y, rotation) {
        const positions = [{x, y}];
        
        switch(rotation) {
            case 0: positions.push({x, y: y - 1}); break;
            case 1: positions.push({x: x + 1, y}); break;
            case 2: positions.push({x, y: y + 1}); break;
            case 3: positions.push({x: x - 1, y}); break;
        }
        
        return positions;
    }
    
    placePuyo() {
        const positions = this.getPuyoPositions(this.currentPuyo.x, this.currentPuyo.y, this.currentPuyo.rotation);
        
        if (positions[0].y >= 0) {
            this.grid[positions[0].y][positions[0].x] = this.currentPuyo.color1;
        }
        if (positions[1].y >= 0) {
            this.grid[positions[1].y][positions[1].x] = this.currentPuyo.color2;
        }
        
        this.applyGravity();
        this.checkChains();
        this.generateNewPuyo();
    }
    
    applyGravity() {
        for (let x = 0; x < this.GRID_WIDTH; x++) {
            let writePos = this.GRID_HEIGHT - 1;
            for (let y = this.GRID_HEIGHT - 1; y >= 0; y--) {
                if (this.grid[y][x] !== 0) {
                    this.grid[writePos][x] = this.grid[y][x];
                    if (writePos !== y) {
                        this.grid[y][x] = 0;
                    }
                    writePos--;
                }
            }
        }
    }
    
    checkChains() {
        let chainFound = true;
        let totalCleared = 0;
        
        while (chainFound) {
            chainFound = false;
            const toRemove = [];
            const visited = Array(this.GRID_HEIGHT).fill().map(() => Array(this.GRID_WIDTH).fill(false));
            
            for (let y = 0; y < this.GRID_HEIGHT; y++) {
                for (let x = 0; x < this.GRID_WIDTH; x++) {
                    if (this.grid[y][x] !== 0 && !visited[y][x]) {
                        const group = this.findConnectedGroup(x, y, this.grid[y][x], visited);
                        if (group.length >= 4) {
                            toRemove.push(...group);
                            chainFound = true;
                        }
                    }
                }
            }
            
            for (let pos of toRemove) {
                this.grid[pos.y][pos.x] = 0;
            }
            
            if (chainFound) {
                totalCleared += toRemove.length;
                this.applyGravity();
            }
        }
        
        if (totalCleared > 0) {
            this.score += totalCleared * 10;
            this.scoreElement.textContent = `スコア: ${this.score}`;
        }
    }
    
    findConnectedGroup(startX, startY, color, visited) {
        const group = [];
        const stack = [{x: startX, y: startY}];
        
        while (stack.length > 0) {
            const {x, y} = stack.pop();
            
            if (x < 0 || x >= this.GRID_WIDTH || y < 0 || y >= this.GRID_HEIGHT || 
                visited[y][x] || this.grid[y][x] !== color) {
                continue;
            }
            
            visited[y][x] = true;
            group.push({x, y});
            
            stack.push({x: x + 1, y}, {x: x - 1, y}, {x, y: y + 1}, {x, y: y - 1});
        }
        
        return group;
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let y = 0; y < this.GRID_HEIGHT; y++) {
            for (let x = 0; x < this.GRID_WIDTH; x++) {
                if (this.grid[y][x] !== 0) {
                    this.drawCell(x, y, this.colors[this.grid[y][x]]);
                }
            }
        }
        
        if (this.currentPuyo) {
            const positions = this.getPuyoPositions(this.currentPuyo.x, this.currentPuyo.y, this.currentPuyo.rotation);
            if (positions[0].y >= 0) {
                this.drawCell(positions[0].x, positions[0].y, this.colors[this.currentPuyo.color1]);
            }
            if (positions[1].y >= 0) {
                this.drawCell(positions[1].x, positions[1].y, this.colors[this.currentPuyo.color2]);
            }
        }
    }
    
    drawCell(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * this.CELL_SIZE, y * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
        this.ctx.strokeStyle = '#333';
        this.ctx.strokeRect(x * this.CELL_SIZE, y * this.CELL_SIZE, this.CELL_SIZE, this.CELL_SIZE);
    }
    
    gameLoop() {
        if (!this.gameRunning) return;
        
        if (!this.movePuyo(0, 1)) {
            // ぷよが着地した
        }
        
        this.render();
        setTimeout(() => this.gameLoop(), 500);
    }
    
    gameOver() {
        this.gameRunning = false;
        alert(`ゲームオーバー！スコア: ${this.score}`);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new PuyoGame();
});