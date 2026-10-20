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
            
            // Setting up frequency limits
            analyser.fftSize = 512;
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
    
    // "BOK" Filter Logic: Focus heavily on mid-to-high vocal pitch bins (Indices 10 to 45)
    // This ignores deep desk thumps or high mouse click clicks.
    let bokFrequencySum = 0;
    let count = 0;
    for (let i = 10; i < 45; i++) {
        bokFrequencySum += dataArray[i];
        count++;
    }
    let bokVolume = bokFrequencySum / count;
    
    // Render visual mic meter based on the filtered sound
    let micPercentage = Math.min(100, (bokVolume / 90) * 100);
    micBar.style.width = micPercentage + "%";

    // Jump trigger (Adjust '35' higher if it jumps randomly, lower if you have to scream)
    if (bokVolume > 35 && chickenY === 0) {
        let jumpPower = Math.min(18, bokVolume * 0.28);
        velocityY = jumpPower;
        chicken.classList.add("jumping"); // Wing animation
    }

    // Apply Physics Gravity
    chickenY += velocityY;
    velocityY -= gravity;

    if (chickenY <= 0) {
        chickenY = 0;
        velocityY = 0;
        chicken.classList.remove("jumping");
    }
    chicken.style.bottom = chickenY + 'px';

    // Move Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        let currentLeft = parseInt(obs.element.style.left);
        currentLeft -= obstacleSpeed;
        obs.element.style.left = currentLeft + 'px';

        // Collision Check (Slightly narrower hitbox to be fair)
        if (currentLeft < 140 && currentLeft > 95 && chickenY < obs.height) {
            endGame();
        }

        // Delete past obstacles & boost points
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
    gameOverScreen.style.display = 'flex'; // TYPO FIXED HERE
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
    gameOverScreen.style.display = 'none'; // TYPO FIXED HERE
    gameActive = true;
    gameLoop();
    spawnObstacleLoop();
}
