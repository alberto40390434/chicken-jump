const chicken = document.getElementById('chicken');
const container = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score');
const levelDisplay = document.getElementById('level-display');
const micBar = document.getElementById('mic-bar');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScore = document.getElementById('final-score');

let chickenY = 0;
let velocityY = 0;
let gravity = 0.6;
let score = 0;
let gameActive = false;
let obstacles = [];
let obstacleSpeed = 4;
let currentLevel = 1;

let audioContext, analyser, dataArray;

function initAudio() {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            
            document.getElementById('start-screen').style.display = 'none';
            gameActive = true;
            gameLoop();
            spawnObstacleLoop();
        })
        .catch(err => {
            alert("Microphone access is required for this game to work!");
            console.log(err);
        });
}

function gameLoop() {
    if (!gameActive) return;

    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
    }
    let averageVolume = sum / dataArray.length;
    
    let micPercentage = Math.min(100, (averageVolume / 80) * 100);
    micBar.style.width = micPercentage + "%";

    if (averageVolume > 25 && chickenY === 0) {
        let jumpPower = Math.min(18, averageVolume * 0.25);
        velocityY = jumpPower;
        chicken.innerText = "🚀";
    }

    chickenY += velocityY;
    velocityY -= gravity;

    if (chickenY <= 0) {
        chickenY = 0;
        velocityY = 0;
        chicken.innerText = "🐔";
    }
    chicken.style.bottom = chickenY + 'px';

    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        let currentLeft = parseInt(obs.element.style.left);
        currentLeft -= obstacleSpeed;
        obs.element.style.left = currentLeft + 'px';

        if (currentLeft < 150 && currentLeft > 100 && chickenY < obs.height) {
            endGame();
        }

        if (currentLeft < -40) {
            obs.element.remove();
            obstacles.splice(i, 1);
            score += 10;
            scoreDisplay.innerText = score;
            
            if (score % 50 === 0) {
                currentLevel++;
                obstacleSpeed += 1.5;
                levelDisplay.innerText = currentLevel + " (Faster!)";
            }
        }
    }

    requestAnimationFrame(gameLoop);
}

function spawnObstacleLoop() {
    if (!gameActive) return;

    let obsHeight = Math.floor(Math.random() * 80) + 40; 
    let obsElement = document.createElement('div');
    obsElement.classList.add('obstacle');
    obsElement.style.height = obsHeight + 'px';
    obsElement.style.left = '850px';
    container.appendChild(obsElement);

    obstacles.push({
        element: obsElement,
        height: obsHeight
    });

    let spawnDelay = Math.random() * 1500 + 1200;
    setTimeout(spawnObstacleLoop, spawnDelay);
}

function endGame() {
    gameActive = false;
    gameOverScreen.style.style.display = 'flex';
    finalScore.innerText = score;
}

function resetGame() {
    document.querySelectorAll('.obstacle').forEach(el => el.remove());
    obstacles = [];
    score = 0;
    currentLevel = 1;
    obstacleSpeed = 4;
    chickenY = 0;
    velocityY = 0;
    scoreDisplay.innerText = score;
    levelDisplay.innerText = "1 (Infinite Mode)";
    gameOverScreen.style.style.display = 'none';
    gameActive = true;
    gameLoop();
    spawnObstacleLoop();
}
