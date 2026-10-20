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
    navigator.mediaDevices.getUserMedia({ 
        audio: {
            // Turn off browser auto-gain and processing so it doesn't accidentally amplify background room noise
            echoCancellation: false,
            noiseSuppression: true, 
            autoGainControl: false
        }, 
        video: false 
    })
    .then(stream => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.2; // Faster reaction time to short clucks
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
    
    // 1. Isolate the specific sharp pitch range of a "BOK" sound
    let bokFrequencySum = 0;
    let count = 0;
    for (let i = 12; i < 40; i++) { 
        bokFrequencySum += dataArray[i];
        count++;
    }
    let bokVolume = bokFrequencySum / count;
    
    // 2. STRICTOR ACTIVATION THRESHOLD
    // '55' is high enough to block normal classroom chatter, typing, and ambient shuffling.
    // It requires a direct, sharp sound close to the mic.
    const strictThreshold = 55; 

    // Render visual meter relative to our strict threshold
    let displayPercentage = 0;
    if (bokVolume > 15) {
        displayPercentage = Math.min(100, ((bokVolume - 15) / (strictThreshold - 15)) * 100);
    }
    micBar.style.width = displayPercentage + "%";
    
    // Visual indicator: Bar turns green when you are loud enough to jump
    if (bokVolume > strictThreshold) {
        micBar.style.background = "#ff007f"; 
    } else {
        micBar.style.background = "#00ffcc";
    }

    // 3. Jump Execution
    if (bokVolume > strictThreshold && chickenY === 0) {
        // Linear scale for jump calculation so screaming doesn't break physics
        let jumpPower = Math.min(19, 10 + (bokVolume - strictThreshold) * 0.2);
        velocityY = jumpPower;
        chicken.classList.add("jumping");
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

        if (currentLeft < 140 && currentLeft > 95 && chickenY < obs.height) {
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
    gameOverScreen.style.display = 'flex';
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
    gameOverScreen.style.display = 'none';
    gameActive = true;
    gameLoop();
    spawnObstacleLoop();
}
