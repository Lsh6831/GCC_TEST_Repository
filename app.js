document.addEventListener('DOMContentLoaded', () => {
    // 탭 전환 로직
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(target).classList.add('active');
            
            // 탭 전환 시 각 게임 초기화 또는 리사이즈 처리
            if (target === 'plinko') initPlinko();
            if (target === 'ladder') initLadder();
            if (target === 'roulette') initRoulette();
        });
    });

    // --- 랜덤 숫자 뽑기 기능 ---
    const generateBtn = document.getElementById('generate-btn');
    const resultNumDisplay = document.getElementById('result-num');
    const historyNumList = document.getElementById('history-num');

    generateBtn.addEventListener('click', () => {
        const min = parseInt(document.getElementById('min-num').value);
        const max = parseInt(document.getElementById('max-num').value);

        if (isNaN(min) || isNaN(max) || min >= max) {
            alert('올바른 범위를 입력해주세요.');
            return;
        }

        // 애니메이션 효과
        let count = 0;
        const interval = setInterval(() => {
            resultNumDisplay.innerText = Math.floor(Math.random() * (max - min + 1)) + min;
            count++;
            if (count > 10) {
                clearInterval(interval);
                const finalNum = Math.floor(Math.random() * (max - min + 1)) + min;
                resultNumDisplay.innerText = finalNum;
                
                // 히스토리 추가
                const historyItem = document.createElement('span');
                historyItem.className = 'history-item';
                historyItem.innerText = finalNum;
                historyNumList.prepend(historyItem);
            }
        }, 50);
    });

    // --- 룰렛 기능 ---
    const rouletteCanvas = document.getElementById('roulette-canvas');
    const rouletteCtx = rouletteCanvas.getContext('2d');
    const spinBtn = document.getElementById('spin-btn');
    const rouletteInput = document.getElementById('roulette-input');
    const rouletteResult = document.getElementById('roulette-result');

    let items = ["피자", "치킨", "한식", "중식", "일식"];
    let startAngle = 0;
    let arc = Math.PI / (items.length / 2);
    let spinTimeout = null;
    let spinAngleStart = 10;
    let spinTime = 0;
    let spinTimeTotal = 0;

    function initRoulette() {
        rouletteCanvas.width = 400;
        rouletteCanvas.height = 400;
        const inputVal = rouletteInput.value.trim();
        if (inputVal) {
            items = inputVal.split(',').map(s => s.trim()).filter(s => s !== "");
        }
        if (items.length === 0) items = ["항목1", "항목2"];
        arc = Math.PI / (items.length / 2);
        drawRoulette();
    }

    function drawRoulette() {
        rouletteCtx.clearRect(0, 0, 400, 400);
        const centerX = 200;
        const centerY = 200;
        const radius = 180;

        items.forEach((item, i) => {
            const angle = startAngle + i * arc;
            rouletteCtx.fillStyle = getColor(i, items.length);
            rouletteCtx.beginPath();
            rouletteCtx.moveTo(centerX, centerY);
            rouletteCtx.arc(centerX, centerY, radius, angle, angle + arc, false);
            rouletteCtx.lineTo(centerX, centerY);
            rouletteCtx.fill();

            rouletteCtx.save();
            rouletteCtx.fillStyle = "white";
            rouletteCtx.translate(centerX + Math.cos(angle + arc / 2) * radius / 1.5, centerY + Math.sin(angle + arc / 2) * radius / 1.5);
            rouletteCtx.rotate(angle + arc / 2 + Math.PI / 2);
            rouletteCtx.font = 'bold 16px Arial';
            rouletteCtx.textAlign = "center";
            rouletteCtx.fillText(item, 0, 0);
            rouletteCtx.restore();
        });
    }

    function getColor(item, maxitem) {
        const phase = 0;
        const center = 128;
        const width = 127;
        const frequency = Math.PI * 2 / maxitem;
        const red = Math.sin(frequency * item + 2 + phase) * width + center;
        const green = Math.sin(frequency * item + 0 + phase) * width + center;
        const blue = Math.sin(frequency * item + 4 + phase) * width + center;
        return `rgb(${red},${green},${blue})`;
    }

    spinBtn.addEventListener('click', () => {
        if (spinTimeout) return;
        initRoulette();
        spinAngleStart = Math.random() * 10 + 10;
        spinTime = 0;
        spinTimeTotal = Math.random() * 3000 + 4000;
        rotateWheel();
    });

    function rotateWheel() {
        spinTime += 30;
        if (spinTime >= spinTimeTotal) {
            stopRotateWheel();
            return;
        }
        const spinAngle = spinAngleStart - easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
        startAngle += (spinAngle * Math.PI / 180);
        drawRoulette();
        spinTimeout = setTimeout(rotateWheel, 30);
    }

    function stopRotateWheel() {
        clearTimeout(spinTimeout);
        spinTimeout = null;
        const degrees = startAngle * 180 / Math.PI + 90;
        const arcd = arc * 180 / Math.PI;
        const index = Math.floor((360 - degrees % 360) / arcd);
        rouletteResult.innerText = items[index >= 0 ? index : index + items.length];
    }

    function easeOut(t, b, c, d) {
        const ts = (t /= d) * t;
        const tc = ts * t;
        return b + c * (tc + -3 * ts + 3 * t);
    }

    // 초기 실행
    initRoulette();

    // --- 사다리 타기 기능 ---
    const ladderCanvas = document.getElementById('ladder-canvas');
    const ladderCtx = ladderCanvas.getContext('2d');
    const ladderCountInput = document.getElementById('ladder-count');
    const makeLadderBtn = document.getElementById('make-ladder');
    const ladderInputsDiv = document.getElementById('ladder-inputs');
    const ladderResultsDiv = document.getElementById('ladder-results');

    let ladderLines = [];
    let ladderWidth, ladderHeight;
    let horizontalBars = [];
    let isLadderAnimating = false;

    function initLadder() {
        const count = parseInt(ladderCountInput.value);
        ladderWidth = ladderCanvas.parentElement.clientWidth;
        ladderHeight = 400;
        ladderCanvas.width = ladderWidth;
        ladderCanvas.height = ladderHeight;

        ladderInputsDiv.innerHTML = '';
        ladderResultsDiv.innerHTML = '';
        horizontalBars = [];

        const spacing = ladderWidth / (count + 1);
        for (let i = 0; i < count; i++) {
            const x = spacing * (i + 1);
            
            // 입력칸 생성
            const input = document.createElement('input');
            input.type = 'text';
            input.value = `출발${i+1}`;
            input.dataset.index = i;
            input.onclick = () => startLadder(i);
            ladderInputsDiv.appendChild(input);

            // 결과칸 생성
            const result = document.createElement('input');
            result.type = 'text';
            result.value = `결과${i+1}`;
            ladderResultsDiv.appendChild(result);

            // 가로줄 생성 (옆 줄이 있을 때만)
            if (i < count - 1) {
                const nextX = spacing * (i + 2);
                for (let j = 0; j < 5; j++) {
                    const y = 50 + Math.random() * (ladderHeight - 100);
                    horizontalBars.push({ x1: x, x2: nextX, y: y, lineIndex: i });
                }
            }
        }
        drawLadder();
    }

    function drawLadder() {
        ladderCtx.clearRect(0, 0, ladderWidth, ladderHeight);
        ladderCtx.strokeStyle = '#ccc';
        ladderCtx.lineWidth = 4;
        ladderCtx.lineCap = 'round';

        const count = parseInt(ladderCountInput.value);
        const spacing = ladderWidth / (count + 1);

        // 세로줄
        for (let i = 0; i < count; i++) {
            const x = spacing * (i + 1);
            ladderCtx.beginPath();
            ladderCtx.moveTo(x, 10);
            ladderCtx.lineTo(x, ladderHeight - 10);
            ladderCtx.stroke();
        }

        // 가로줄
        horizontalBars.forEach(bar => {
            ladderCtx.beginPath();
            ladderCtx.moveTo(bar.x1, bar.y);
            ladderCtx.lineTo(bar.x2, bar.y);
            ladderCtx.stroke();
        });
    }

    function startLadder(startIndex) {
        if (isLadderAnimating) return;
        isLadderAnimating = true;
        drawLadder(); // 초기화 후 그리기

        const count = parseInt(ladderCountInput.value);
        const spacing = ladderWidth / (count + 1);
        let currentX = spacing * (startIndex + 1);
        let currentY = 10;
        let currentLine = startIndex;

        ladderCtx.strokeStyle = varColor('--primary-color');
        ladderCtx.lineWidth = 6;
        
        const path = [];
        path.push({x: currentX, y: currentY});

        // 경로 계산
        while (currentY < ladderHeight - 10) {
            let nextY = ladderHeight - 10;
            let targetBar = null;

            // 현재 라인에서 가장 가까운 가로줄 찾기
            horizontalBars.forEach(bar => {
                if (bar.y > currentY && bar.y < nextY) {
                    if (bar.lineIndex === currentLine) {
                        nextY = bar.y;
                        targetBar = { x: spacing * (currentLine + 2), line: currentLine + 1 };
                    } else if (bar.lineIndex === currentLine - 1) {
                        nextY = bar.y;
                        targetBar = { x: spacing * (currentLine), line: currentLine - 1 };
                    }
                }
            });

            path.push({x: currentX, y: nextY});
            if (targetBar) {
                currentX = targetBar.x;
                currentLine = targetBar.line;
                path.push({x: currentX, y: nextY});
            }
            currentY = nextY;
        }

        // 애니메이션 실행
        let step = 0;
        const animatePath = () => {
            if (step >= path.length - 1) {
                isLadderAnimating = false;
                highlightResult(currentLine);
                return;
            }

            const start = path[step];
            const end = path[step + 1];
            
            let progress = 0;
            const drawStep = () => {
                progress += 0.1;
                if (progress >= 1) {
                    step++;
                    animatePath();
                    return;
                }
                const x = start.x + (end.x - start.x) * progress;
                const y = start.y + (end.y - start.y) * progress;
                
                ladderCtx.beginPath();
                ladderCtx.moveTo(start.x, start.y);
                ladderCtx.lineTo(x, y);
                ladderCtx.stroke();
                requestAnimationFrame(drawStep);
            };
            drawStep();
        };
        animatePath();
    }

    function highlightResult(index) {
        const results = ladderResultsDiv.querySelectorAll('input');
        results.forEach(r => r.style.background = 'none');
        results[index].style.background = '#eef5ff';
        results[index].style.border = '2px solid var(--primary-color)';
    }

    function varColor(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    makeLadderBtn.addEventListener('click', initLadder);
    initLadder();

    // --- 익스트림 플링코 기능 ---
    const plinkoCanvas = document.getElementById('plinko-canvas');
    const plinkoCtx = plinkoCanvas.getContext('2d');
    const dropBallBtn = document.getElementById('drop-ball');
    const kickBallBtn = document.getElementById('kick-ball');
    const resetPlinkoBtn = document.getElementById('reset-plinko');
    const plinkoNamesInput = document.getElementById('plinko-names');
    const rankItemsList = document.getElementById('rank-items');

    const ROWS = 16;
    const COLS = 11;
    const PEG_RADIUS = 4;
    const BALL_RADIUS = 10;
    const GRAVITY = 0.25;
    const FRICTION = 0.99;
    const BOUNCE = 0.6;

    let pegs = [];
    let balls = [];
    let plinkoWidth, plinkoHeight;
    let rankResults = [];
    let isPlinkoLoopRunning = false;
    let kickTimer = 0; // 킥 지속 시간

    function initPlinko() {
        plinkoWidth = 400;
        plinkoHeight = 800;
        plinkoCanvas.width = plinkoWidth;
        plinkoCanvas.height = plinkoHeight;

        pegs = [];
        const spacingX = plinkoWidth / (COLS + 1);
        const spacingY = (plinkoHeight - 200) / (ROWS + 1);

        for (let r = 0; r < ROWS; r++) {
            const isEven = r % 2 === 0;
            const colsInRow = isEven ? COLS : COLS - 1;
            const offsetX = isEven ? spacingX : spacingX * 1.5;

            for (let c = 0; c < colsInRow; c++) {
                pegs.push({
                    x: offsetX + c * spacingX,
                    y: 100 + r * spacingY
                });
            }
        }
        
        if (!isPlinkoLoopRunning) {
            isPlinkoLoopRunning = true;
            requestAnimationFrame(updatePlinko);
        }
    }

    function updatePlinko() {
        plinkoCtx.clearRect(0, 0, plinkoWidth, plinkoHeight);

        // 1. 배경 및 못 그리기
        plinkoCtx.fillStyle = '#bbb';
        pegs.forEach(peg => {
            plinkoCtx.beginPath();
            plinkoCtx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
            plinkoCtx.fill();
        });

        // 2. 출구 가이드 (깔때기) 그리기
        plinkoCtx.strokeStyle = '#ddd';
        plinkoCtx.lineWidth = 8;
        plinkoCtx.beginPath();
        plinkoCtx.moveTo(0, plinkoHeight - 120);
        plinkoCtx.lineTo(plinkoWidth / 2 - 40, plinkoHeight - 60);
        plinkoCtx.lineTo(plinkoWidth / 2 - 40, plinkoHeight);
        plinkoCtx.stroke();

        plinkoCtx.beginPath();
        plinkoCtx.moveTo(plinkoWidth, plinkoHeight - 120);
        plinkoCtx.lineTo(plinkoWidth / 2 + 40, plinkoHeight - 60);
        plinkoCtx.lineTo(plinkoWidth / 2 + 40, plinkoHeight);
        plinkoCtx.stroke();

        // 3. 킥커(플리퍼) 애니메이션 및 물리 판정
        if (kickTimer > 0) {
            kickTimer--;
            plinkoCtx.strokeStyle = varColor('--accent-color');
            plinkoCtx.lineWidth = 15;
            plinkoCtx.lineCap = 'round';
            plinkoCtx.beginPath();
            plinkoCtx.moveTo(plinkoWidth / 2 - 120, plinkoHeight - 140);
            plinkoCtx.lineTo(plinkoWidth / 2 + 120, plinkoHeight - 140 - (kickTimer * 4));
            plinkoCtx.stroke();
        }

        plinkoCtx.fillStyle = varColor('--primary-color');
        plinkoCtx.font = 'bold 16px Arial';
        plinkoCtx.textAlign = 'center';
        plinkoCtx.fillText('▼ EXIT ▼', plinkoWidth / 2, plinkoHeight - 20);

        // 4. 공 물리 엔진
        balls.forEach((ball, index) => {
            ball.vy += GRAVITY;
            ball.x += ball.vx;
            ball.y += ball.vy;
            ball.vx *= FRICTION;

            // [벽 충돌 및 이탈 방지]
            if (ball.x < BALL_RADIUS) { ball.x = BALL_RADIUS; ball.vx = Math.abs(ball.vx) * BOUNCE; }
            if (ball.x > plinkoWidth - BALL_RADIUS) { ball.x = plinkoWidth - BALL_RADIUS; ball.vx = -Math.abs(ball.vx) * BOUNCE; }

            // [못 충돌]
            pegs.forEach(peg => {
                const dx = ball.x - peg.x;
                const dy = ball.y - peg.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < BALL_RADIUS + PEG_RADIUS) {
                    const angle = Math.atan2(dy, dx);
                    const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                    ball.vx = Math.cos(angle) * (speed + 1) * BOUNCE + (Math.random() - 0.5) * 2;
                    ball.vy = Math.sin(angle) * (speed + 1) * BOUNCE;
                    ball.x = peg.x + Math.cos(angle) * (BALL_RADIUS + PEG_RADIUS + 1);
                    ball.y = peg.y + Math.sin(angle) * (BALL_RADIUS + PEG_RADIUS + 1);
                }
            });

            // [깔때기 가이드 물리] - 끼임 방지를 위해 위치 강제 밀어내기
            if (ball.y > plinkoHeight - 130 && ball.y < plinkoHeight - 60) {
                const leftWallX = (ball.y - (plinkoHeight - 120)) * ((plinkoWidth/2 - 40) / 60);
                const rightWallX = plinkoWidth - leftWallX;
                
                if (ball.x < plinkoWidth / 2 - 40 && ball.x < (plinkoWidth/2 - 40) * (ball.y - (plinkoHeight-120))/60 ) {
                     ball.vx += 0.5;
                }
                if (ball.x > plinkoWidth / 2 + 40 && ball.x > plinkoWidth - (plinkoWidth/2 - 40) * (ball.y - (plinkoHeight-120))/60 ) {
                     ball.vx -= 0.5;
                }
            }
            // 수직 통로 고정
            if (ball.y > plinkoHeight - 60) {
                if (ball.x < plinkoWidth / 2 - 30) { ball.x = plinkoWidth / 2 - 30; ball.vx = Math.abs(ball.vx); }
                if (ball.x > plinkoWidth / 2 + 30) { ball.x = plinkoWidth / 2 + 30; ball.vx = -Math.abs(ball.vx); }
            }

            // [킥커 충돌] - 킥 활성화 시 공을 위로 쳐올림
            if (kickTimer > 5 && ball.y > plinkoHeight - 180 && ball.y < plinkoHeight - 120) {
                ball.vy = -18; // 강력한 상승력
                ball.vx += (Math.random() - 0.5) * 15;
            }

            // [그리기]
            plinkoCtx.fillStyle = ball.color;
            plinkoCtx.beginPath();
            plinkoCtx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
            plinkoCtx.fill();
            plinkoCtx.fillStyle = 'white';
            plinkoCtx.font = 'bold 11px Arial';
            plinkoCtx.fillText(ball.name, ball.x, ball.y + 4);

            // [도착 판정]
            if (ball.y > plinkoHeight) {
                if (!rankResults.includes(ball.name)) {
                    rankResults.push(ball.name);
                    const li = document.createElement('li');
                    li.innerText = `${rankResults.length}위: ${ball.name}`;
                    rankItemsList.appendChild(li);
                }
                balls.splice(index, 1);
            }
        });

        requestAnimationFrame(updatePlinko);
    }

    function triggerKick() {
        kickTimer = 15; // 킥 지속 시간 설정
    }

    dropBallBtn.addEventListener('click', () => {
        const names = plinkoNamesInput.value.split(',').map(n => n.trim()).filter(n => n !== "");
        if (names.length === 0) return;

        balls = [];
        rankResults = [];
        rankItemsList.innerHTML = '';
        
        // 동시 투하
        names.forEach((name, i) => {
            balls.push({
                x: plinkoWidth / 2 + (Math.random() - 0.5) * 80,
                y: -20 - (i * 5), // 살짝의 간격만 줌 (완전 겹침 방지)
                vx: (Math.random() - 0.5) * 2,
                vy: 0,
                name: name,
                color: `hsl(${(i * 360) / names.length}, 75%, 50%)`
            });
        });
    });

    kickBallBtn.addEventListener('click', triggerKick);
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            triggerKick();
        }
    });

    resetPlinkoBtn.addEventListener('click', () => {
        balls = [];
        rankResults = [];
        rankItemsList.innerHTML = '';
    });

    initPlinko();

});
