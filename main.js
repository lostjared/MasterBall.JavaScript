const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

bg = new Image();
bg.onload = function() {}
bg.src="bg.png";


// Constants
const BALL_RADIUS = 7.5;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 10;
const MAP_SIZE = 520;
const NULL_BLOCK = -1;
const BLOCK_WIDTH = 25;
const BLOCK_HEIGHT = 15;

// Helper functions
function getRandomColor() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r},${g},${b})`;
}

function makeFont(fontFamily, fontSize) {
    return `${fontSize}px ${fontFamily}`;
}

// Ball structure
class Ball {
    constructor() {
        this.x = 320;
        this.y = 240;
        this.dx = 4;
        this.dy = -4;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;

        // Bounce off walls
        if (this.x + BALL_RADIUS > canvas.width || this.x - BALL_RADIUS < 0) {
            this.dx = -this.dx;
        }
        if (this.y - BALL_RADIUS < 0) {
            this.dy = -this.dy;
        }
    }

    reset() {
        this.x = 320;
        this.y = 240;
        this.dx = 4;
        this.dy = -4;
    }
}

// Level map structure
class LevelMap {
    constructor() {
        this.blocks = new Array(MAP_SIZE).fill(NULL_BLOCK);
        this.randMap(5, 6);
    }

    randMap(mass, max) {
        for (let i = 0; i < MAP_SIZE; i++) {
            const rmap = Math.floor(Math.random() * max);
            this.blocks[i] = rmap >= mass ? getRandomColor() : NULL_BLOCK;
        }
    }

    draw() {
        const sx = 7;
        const sy = 51;
        let dx = sx;
        let dy = sy;
        let row = 0;

        ctx.drawImage(bg, 0,0);

        for (let i = 0; i < MAP_SIZE; i++) {
            this.drawTile(dx, dy, this.blocks[i]);
            dy += BLOCK_HEIGHT;
            row++;

            if (row > 20) {
                row = 0;
                dx += BLOCK_WIDTH;
                dy = sy;
            }
        }
    }

    drawTile(x, y, color) {
        if (color !== NULL_BLOCK) {
            ctx.beginPath();
            ctx.rect(x, y, BLOCK_WIDTH, BLOCK_HEIGHT);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.closePath();
        }
    }

    levelOver() {
        return this.blocks.every(block => block === NULL_BLOCK);
    }
}

// Player bar structure
class PlayerBar {
    constructor() {
        this.x = (canvas.width - PADDLE_WIDTH) / 2;
        this.y = canvas.height - 35;
        this.moveLeft = false;
        this.moveRight = false;
    }

    draw() {
        ctx.beginPath();
        ctx.rect(this.x, this.y, PADDLE_WIDTH, PADDLE_HEIGHT);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.closePath();
    }

    update() {
        if (this.moveLeft && this.x > 7) {
            this.x -= 7;
        }
        if (this.moveRight && this.x < canvas.width - PADDLE_WIDTH - 7) {
            this.x += 7;
        }
    }
}

// Game state
const ball = new Ball();
const levelMap = new LevelMap();
const playerBar = new PlayerBar();
const player = {
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false
};

function loadLevel(level) {
    switch (level) {
        case 1:
            levelMap.randMap(19, 20);
            break;
        case 2:
            levelMap.randMap(15, 20);
            break;
        case 3:
            levelMap.randMap(10, 20);
            break;
        default:
            levelMap.randMap(7, 20);
            break;
    }
    if (level >= 7) {
        levelMap.randMap(Math.floor(Math.random() * 255), Math.floor(Math.random() * 400));
    }
}

// Game logic
function gameUpdate() {
    if (player.gameOver) return;

    drawGame();
    gameLogic();

    requestAnimationFrame(gameUpdate);
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    levelMap.draw();
    ball.draw();
    playerBar.draw();
    drawMenu();
}

function drawMenu() {
    ctx.font = makeFont("Arial", 18);
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Master Ball Game", 15, 30);

    ctx.font = makeFont("Arial", 12);
    ctx.fillText(`Score: ${player.score}`, 170, 15);
    ctx.fillText(`Lives: ${player.lives}`, 300, 15);
    ctx.fillText(`Level: ${player.level}`, 480, 20);
}

function gameLogic() {
    playerBar.update();
    ball.update();
    barProc();
    checkCollision();

    if (levelMap.levelOver()) {
        player.level++;
        loadLevel(player.level);
        ball.reset();
    }

    if (ball.y + BALL_RADIUS > canvas.height) {
        player.lives--;
        if (player.lives < 0) {
            player.gameOver = true;
            alert("Game Over");
            document.location.reload();
        } else {
            ball.reset();
        }
    }
}

function barProc() {
    if (ball.x > playerBar.x && ball.x < playerBar.x + PADDLE_WIDTH && ball.y + BALL_RADIUS > playerBar.y && ball.y - BALL_RADIUS < playerBar.y + PADDLE_HEIGHT) {
        ball.dy = -ball.dy;
    }
}

function checkCollision() {
    const sx = 7;
    const sy = 51;
    let dx = sx;
    let dy = sy;
    let row = 0;

    for (let i = 0; i < MAP_SIZE; i++) {
        const blockX = dx;
        const blockY = dy;

        if (levelMap.blocks[i] !== NULL_BLOCK) {
            if (ball.x > blockX && ball.x < blockX + BLOCK_WIDTH && ball.y - BALL_RADIUS < blockY + BLOCK_HEIGHT && ball.y + BALL_RADIUS > blockY) {
                ball.dy = -ball.dy;
                levelMap.blocks[i] = NULL_BLOCK;
                player.score += 20;
            }
        }

        dy += BLOCK_HEIGHT;
        row++;

        if (row > 20) {
            row = 0;
            dx += BLOCK_WIDTH;
            dy = sy;
        }
    }
}

function handleInput() {
    document.addEventListener('keydown', function(event) {
        if (event.key === 'ArrowLeft') {
            playerBar.moveLeft = true;
        } else if (event.key === 'ArrowRight') {
            playerBar.moveRight = true;
        }
    });

    document.addEventListener('keyup', function(event) {
        if (event.key === 'ArrowLeft') {
            playerBar.moveLeft = false;
        } else if (event.key === 'ArrowRight') {
            playerBar.moveRight = false;
        }
    });
}

// Initialize game
loadLevel(player.level);
requestAnimationFrame(gameUpdate);
handleInput();
