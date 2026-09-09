
    (function(){
        'use strict';
        // -------- 统一状态 --------
        var LS_KEY = 'txq_adventure_score_v1';
        var BASE_SCORE = 1280; // 首页默认 1280 积分，作为本页积分起点
        var gameState = {
            score: 0,         // 当前游戏内的临时得分
            totalScore: BASE_SCORE, // 已累积到首页的总积分
            currentGame: null,
            completedGames: [],
            level: 1
        };
        try {
            var raw = localStorage.getItem(LS_KEY);
            if (raw) {
                var s = JSON.parse(raw);
                if (s && typeof s.totalScore === 'number') {
                    gameState.totalScore = s.totalScore;
                    gameState.completedGames = Array.isArray(s.completedGames) ? s.completedGames : [];
                    if (typeof s.level === 'number') gameState.level = s.level;
                }
            }
        } catch(e) {}

        function saveState(){
            try {
                localStorage.setItem(LS_KEY, JSON.stringify({
                    totalScore: gameState.totalScore,
                    completedGames: gameState.completedGames,
                    level: gameState.level
                }));
            } catch(e) {}
        }
        function refreshHomeScore(){
            var el = document.getElementById('adv3ScoreText');
            if (el) el.textContent = '⭐ ' + gameState.totalScore + ' 积分';
        }
        refreshHomeScore();

        function addScore(delta, markCompleted){
            gameState.totalScore = (gameState.totalScore || 0) + delta;
            if (markCompleted && gameState.currentGame && gameState.completedGames.indexOf(gameState.currentGame) === -1) {
                gameState.completedGames.push(gameState.currentGame);
            }
            saveState();
            refreshHomeScore();
        }

        // Modal DOM 在页面底部，需等 DOMContentLoaded 后再查询
        document.addEventListener('DOMContentLoaded', function(){

        // -------- DOM 引用 --------
        var modal = document.getElementById('gameModal');
        var gameBody = document.getElementById('gameBody');
        var gameTitle = document.getElementById('gameTitle');
        var gameSubtitle = document.getElementById('gameSubtitle');
        var elScore = document.getElementById('gameScore');
        var elLives = document.getElementById('gameLives');
        var endOverlay = document.getElementById('gameEndOverlay');
        var endIcon = document.getElementById('gameEndIcon');
        var endTitle = document.getElementById('gameEndTitle');
        var endDesc = document.getElementById('gameEndDesc');
        var endScore = document.getElementById('gameEndScore');
        var endBackBtn = document.getElementById('gameEndBackBtn');
        var endRetryBtn = document.getElementById('gameEndRetryBtn');
        var closeBtn = document.getElementById('gameCloseBtn');
        var backBtn = document.getElementById('gameBackBtn');

        // 当前游戏的清理函数
        var currentCleanup = null;

        // -------- 模态控制 --------
        function openModal(gameId){
            if (!modal) return;
            modal.hidden = false;
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            gameState.currentGame = gameId;
            gameState.score = 0;
            elScore.textContent = '0';
            elLives.textContent = '3';
            endOverlay.hidden = true;
        }
        function closeModal(){
            if (!modal) return;
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            try { if (currentCleanup) currentCleanup(); } catch(e){}
            currentCleanup = null;
            gameState.currentGame = null;
            gameBody.innerHTML = '<div class="game-loading">加载中...</div>';
        }
        function setScore(s){ gameState.score = s; elScore.textContent = s; }
        function setLives(n){ elLives.textContent = Math.max(0, n); }
        function addGameScore(delta){ setScore(gameState.score + delta); }

        // 通用：弹出结束面板
        function showEnd(success, earnedScore, opts){
            opts = opts || {};
            if (earnedScore > 0) addScore(earnedScore, success);
            endIcon.textContent = opts.icon || (success ? '🎉' : '💡');
            endTitle.textContent = opts.title || (success ? '挑战成功！' : '再来一次吧！');
            endDesc.textContent = opts.desc || (success ? '太棒了，你是真正的护眼小英雄！' : '没关系，再试一次就好啦～');
            endScore.textContent = '+' + (earnedScore || 0);
            endOverlay.hidden = false;
        }
        endBackBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        backBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', function(e){
            if (e.target.getAttribute && e.target.getAttribute('data-game-close') === '1') closeModal();
        });
        document.addEventListener('keydown', function(e){
            if (e.key === 'Escape' && !modal.hidden) closeModal();
        });

        // -------- 游戏工厂 --------
        var GAMES = {
            'light-maze':   initLightMaze,
            'find-monster': initFindMonster,
            'eye-puzzle':   initEyePuzzle,
            'eye-travel':   initEyeTravel
        };

        window.advOpenGame = function(gameId){
            openModal(gameId);
            var fn = GAMES[gameId];
            if (typeof fn !== 'function') {
                gameBody.innerHTML = '<div class="game-loading">游戏加载失败：未找到 ' + gameId + '</div>';
                return;
            }
            endRetryBtn.onclick = function(){
                endOverlay.hidden = true;
                // 先清理上一局的定时器/动画帧/全局监听，避免累积
                try { if (currentCleanup) currentCleanup(); } catch(e){}
                currentCleanup = null;
                fn(gameId);
            };
            fn(gameId);
        };

        /* =========================================================================
           小游戏 1：光线迷宫
           - Canvas 绘制
           - 光源 → 镜子（点击旋转 90°） → 视网膜
           - 3 个关卡，难度递增
           - 到达视网膜成功 +50 积分
           ========================================================================= */
        function initLightMaze(gameId){
            gameTitle.textContent = '🔦 光线迷宫';
            gameSubtitle.textContent = '移动镜子，让光线成功到达视网膜！';
            setScore(0);
            setLives(1);
            gameBody.innerHTML = '';

            var wrap = document.createElement('div');
            wrap.className = 'lightmaze';
            gameBody.appendChild(wrap);

            // HUD
            var hud = document.createElement('div');
            hud.className = 'game-hud';
            var left = document.createElement('div');
            left.className = 'pill gold';
            left.textContent = '关卡：Lv.1 星空练习';
            left.id = 'lmLevelLabel';
            var right = document.createElement('div');
            right.className = 'pill';
            right.innerHTML = '找到 <b>镜子</b> 并点击旋转 90°，让光线抵达 🎯';
            hud.appendChild(left);
            hud.appendChild(right);
            wrap.appendChild(hud);

            // 关卡切换
            var levels = document.createElement('div');
            levels.className = 'lightmaze-levels';
            var levelDefs = [
                { name: 'Lv.1 星空练习', mirrors: 2, walls: 2 },
                { name: 'Lv.2 小小挑战', mirrors: 4, walls: 3 },
                { name: 'Lv.3 光线大师', mirrors: 6, walls: 5 }
            ];
            levelDefs.forEach(function(d, i){
                var b = document.createElement('button');
                b.textContent = d.name;
                b.dataset.lvl = i;
                if (i === 0) b.classList.add('active');
                b.onclick = function(){
                    levels.querySelectorAll('button').forEach(function(x){ x.classList.remove('active'); });
                    b.classList.add('active');
                    startLevel(i);
                };
                levels.appendChild(b);
            });
            wrap.appendChild(levels);

            var canvas = document.createElement('canvas');
            canvas.className = 'lightmaze-canvas';
            wrap.appendChild(canvas);

            var tip = document.createElement('div');
            tip.className = 'lightmaze-tip';
            tip.innerHTML = '💡 <b>玩法：</b>点击镜子可旋转 90°。蓝色银镜会反射光线，灰色墙壁会挡住光线。让金黄色光线成功抵达右侧 <b>🎯 视网膜</b>！';
            wrap.appendChild(tip);

            var ctx = canvas.getContext('2d');
            var W = 800, H = 500;
            var cell = 50;
            var cols = 16, rows = 10;
            var solved = false;
            var lightPulse = 0;

            function resizeCanvas(){
                var rect = canvas.getBoundingClientRect();
                var dpr = window.devicePixelRatio || 1;
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                ctx.setTransform(dpr,0,0,dpr,0,0);
                W = rect.width; H = rect.height;
                cell = Math.min(W / cols, H / rows);
            }

            var grid = []; // 每格 {type:'wall'|'mirror', dir:0|1 (镜子方向: '/'=1, '\\'=0)}
            var source = {c: 0, r: 4};
            var target = {c: 15, r: 5};

            function makeLevel(idx){
                grid = [];
                for (var r=0;r<rows;r++){
                    grid.push(new Array(cols).fill(null));
                }
                // 每关显式定义：光源、终点、镜子位置（保证可解）、墙壁（不挡光线路径）
                // 反射规则：dir 0='\\' (right→down, down→right, left→up, up→left)
                //          dir 1='/'  (right→up, up→right, left→down, down→left)
                var levels = [
                    {
                        source: {c:0, r:4}, target: {c:cols-1, r:5},
                        mirrors: [[6,4],[6,5]],
                        walls: [[3,2],[9,2],[3,7],[9,7]]
                    },
                    {
                        source: {c:0, r:2}, target: {c:cols-1, r:7},
                        mirrors: [[5,2],[5,5],[11,5],[11,7]],
                        walls: [[3,4],[8,3],[8,8],[13,4]]
                    },
                    {
                        source: {c:0, r:1}, target: {c:cols-1, r:8},
                        mirrors: [[3,1],[3,4],[8,4],[8,6],[12,6],[12,8]],
                        walls: [[5,2],[5,7],[10,2],[10,9]]
                    }
                ];
                var L = levels[idx] || levels[0];
                source = L.source;
                target = L.target;
                L.walls.forEach(function(p){
                    if (p[1]>=0 && p[1]<rows && p[0]>=0 && p[0]<cols) grid[p[1]][p[0]] = {type:'wall'};
                });
                L.mirrors.forEach(function(p){
                    if (p[1]>=0 && p[1]<rows && p[0]>=0 && p[0]<cols) {
                        grid[p[1]][p[0]] = { type:'mirror', dir: Math.floor(Math.random()*2) };
                    }
                });
                solved = false;
                document.getElementById('lmLevelLabel').textContent = '关卡：' + levelDefs[idx].name;
            }

            function startLevel(idx){
                makeLevel(idx);
                resizeCanvas();
                draw();
            }

            // 光线追踪
            function traceLight(){
                // 从光源向右发射
                var segs = [];
                var c = source.c, r = source.r;
                var dc = 1, dr = 0; // 初始向右
                segs.push({x: c*cell+cell/2, y: r*cell+cell/2});
                var steps = 0;
                while (steps < 200) {
                    steps++;
                    c += dc; r += dr;
                    if (c < 0 || c >= cols || r < 0 || r >= rows) {
                        segs.push({x: c*cell+cell/2, y: r*cell+cell/2, hit:'wall'});
                        return {segs: segs, hit:'wall'};
                    }
                    var cellObj = grid[r][c];
                    if (cellObj && cellObj.type === 'wall') {
                        // 撞墙，在进入格子前停
                        segs.push({x: (c)*cell+cell/2, y: (r)*cell+cell/2, hit:'wall'});
                        return {segs: segs, hit:'wall'};
                    }
                    if (cellObj && cellObj.type === 'mirror') {
                        var cx = c*cell+cell/2, cy = r*cell+cell/2;
                        segs.push({x: cx, y: cy});
                        // 反射：dir 0 = '\\', dir 1 = '/'
                        if (cellObj.dir === 0) {
                            // '\' : right→down, down→right, left→up, up→left
                            var ndc = dr, ndr = dc;
                            dc = ndc; dr = ndr;
                        } else {
                            // '/' : right→up, up→right, left→down, down→left
                            var ndc2 = -dr, ndr2 = -dc;
                            dc = ndc2; dr = ndr2;
                        }
                        continue;
                    }
                    if (c === target.c && r === target.r) {
                        segs.push({x: c*cell+cell/2, y: r*cell+cell/2, hit:'retina'});
                        return {segs: segs, hit:'retina'};
                    }
                }
                return {segs: segs, hit:'loop'};
            }

            function draw(){
                if (!ctx) return;
                ctx.clearRect(0,0,W,H);
                // 星空
                var grad = ctx.createLinearGradient(0,0,0,H);
                grad.addColorStop(0, '#04122E');
                grad.addColorStop(1, '#071A40');
                ctx.fillStyle = grad;
                ctx.fillRect(0,0,W,H);
                // 随机星点（固定）
                ctx.save();
                for (var i=0;i<40;i++){
                    var sx = (i*73 % W), sy = ((i*131) % H);
                    ctx.fillStyle = 'rgba(255,255,255,' + (0.2 + 0.4*Math.abs(Math.sin(i*1.3+lightPulse/30))) + ')';
                    ctx.beginPath(); ctx.arc(sx, sy, 1.2, 0, Math.PI*2); ctx.fill();
                }
                ctx.restore();

                // 网格线
                ctx.strokeStyle = 'rgba(101,200,255,0.06)';
                ctx.lineWidth = 1;
                for (var cc=0; cc<=cols; cc++){
                    ctx.beginPath(); ctx.moveTo(cc*cell, 0); ctx.lineTo(cc*cell, rows*cell); ctx.stroke();
                }
                for (var rr=0; rr<=rows; rr++){
                    ctx.beginPath(); ctx.moveTo(0, rr*cell); ctx.lineTo(cols*cell, rr*cell); ctx.stroke();
                }

                // 光源
                var sx2 = source.c*cell+cell/2, sy2 = source.r*cell+cell/2;
                ctx.save();
                ctx.shadowBlur = 28; ctx.shadowColor = '#FFD45A';
                ctx.fillStyle = '#FFE79A';
                ctx.beginPath(); ctx.arc(sx2, sy2, cell*0.36, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#FFF8D8';
                ctx.beginPath(); ctx.arc(sx2, sy2, cell*0.18, 0, Math.PI*2); ctx.fill();
                ctx.restore();
                ctx.fillStyle = '#FFD45A'; ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('☀️', sx2, sy2+4);

                // 视网膜
                var tx = target.c*cell+cell/2, ty = target.r*cell+cell/2;
                ctx.save();
                ctx.shadowBlur = solved ? 40 : 22;
                ctx.shadowColor = solved ? '#78C943' : '#4AD48A';
                ctx.strokeStyle = solved ? '#A5E85A' : '#4AD48A';
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(tx, ty, cell*0.38, 0, Math.PI*2); ctx.stroke();
                ctx.fillStyle = solved ? 'rgba(165,232,90,0.45)' : 'rgba(74,212,138,0.20)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(165,232,90,0.80)';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(tx, ty, cell*0.22, 0, Math.PI*2); ctx.stroke();
                ctx.restore();
                ctx.fillStyle = '#A5E85A';
                ctx.fillText('🎯', tx, ty+4);

                // 墙与镜子
                for (var rr2=0; rr2<rows; rr2++){
                    for (var cc2=0; cc2<cols; cc2++){
                        var o = grid[rr2][cc2];
                        if (!o) continue;
                        var px = cc2*cell, py = rr2*cell;
                        if (o.type === 'wall') {
                            ctx.fillStyle = '#3A4C7A';
                            ctx.fillRect(px+4, py+4, cell-8, cell-8);
                            ctx.strokeStyle = '#5C72A6';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(px+4, py+4, cell-8, cell-8);
                        } else if (o.type === 'mirror') {
                            // 镜子背景方块
                            ctx.fillStyle = 'rgba(120,180,255,0.12)';
                            ctx.fillRect(px+6, py+6, cell-12, cell-12);
                            // 镜子斜线
                            ctx.save();
                            ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(150,210,255,0.9)';
                            ctx.strokeStyle = '#B6D6FF';
                            ctx.lineWidth = 5;
                            ctx.lineCap = 'round';
                            ctx.beginPath();
                            if (o.dir === 0) {
                                ctx.moveTo(px+10, py+10); ctx.lineTo(px+cell-10, py+cell-10);
                            } else {
                                ctx.moveTo(px+cell-10, py+10); ctx.lineTo(px+10, py+cell-10);
                            }
                            ctx.stroke();
                            // 高光
                            ctx.strokeStyle = '#FFFFFF';
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            if (o.dir === 0) {
                                ctx.moveTo(px+12, py+12); ctx.lineTo(px+cell-16, py+cell-16);
                            } else {
                                ctx.moveTo(px+cell-12, py+12); ctx.lineTo(px+16, py+cell-16);
                            }
                            ctx.stroke();
                            ctx.restore();
                        }
                    }
                }

                // 光线
                var trace = traceLight();
                var segs = trace.segs;
                ctx.save();
                var beamColor = trace.hit === 'retina' ? '#FFD45A' : (trace.hit === 'wall' ? '#FF8C5A' : '#FFD45A');
                ctx.shadowBlur = 18; ctx.shadowColor = beamColor;
                ctx.strokeStyle = beamColor;
                ctx.lineWidth = 3.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                for (var k=0; k<segs.length; k++){
                    var p = segs[k];
                    if (k===0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
                }
                ctx.stroke();
                // 内芯亮线
                ctx.shadowBlur = 0;
                ctx.strokeStyle = 'rgba(255,255,255,0.85)';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                for (var k2=0; k2<segs.length; k2++){
                    var p2 = segs[k2];
                    if (k2===0) ctx.moveTo(p2.x, p2.y); else ctx.lineTo(p2.x, p2.y);
                }
                ctx.stroke();
                ctx.restore();

                // 成功发光覆盖
                if (solved) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(165,232,90,' + (0.08 + 0.06*Math.sin(lightPulse/10)) + ')';
                    ctx.fillRect(0,0,W,H);
                    ctx.restore();
                }
            }

            function trySolved(){
                var t = traceLight();
                if (t.hit === 'retina' && !solved) {
                    solved = true;
                    var earn = 50;
                    setScore(earn);
                    addScore(earn, true);
                    setTimeout(function(){
                        showEnd(true, earn, {
                            icon: '✨',
                            title: '光线成功抵达视网膜！',
                            desc: '你成功引导光线穿过眼睛，太棒啦！'
                        });
                    }, 700);
                }
            }

            canvas.addEventListener('click', function(e){
                if (solved) return;
                var rect = canvas.getBoundingClientRect();
                var x = (e.clientX - rect.left) * (W / rect.width);
                var y = (e.clientY - rect.top) * (H / rect.height);
                var cc = Math.floor(x / cell);
                var rr = Math.floor(y / cell);
                if (cc < 0 || cc >= cols || rr < 0 || rr >= rows) return;
                var o = grid[rr][cc];
                if (o && o.type === 'mirror') {
                    o.dir = (o.dir + 1) % 2;
                    draw();
                    trySolved();
                }
            });

            function animate(){
                lightPulse++;
                draw();
                raf = requestAnimationFrame(animate);
            }
            var raf = null;

            function cleanup(){
                if (raf) cancelAnimationFrame(raf);
                raf = null;
                window.removeEventListener('resize', onResize);
            }
            currentCleanup = cleanup;

            function onResize(){
                resizeCanvas();
                draw();
            }

            // 初始化
            setTimeout(function(){
                resizeCanvas();
                startLevel(0);
                animate();
            }, 30);

            window.addEventListener('resize', onResize);
        }

        /* =========================================================================
           小游戏 2：找近视怪兽
           - 场景中 4~5 只 Q 版怪兽
           - 60 秒倒计时，每只 +10，全找到额外 +30（最高 +80）
           ========================================================================= */
        function initFindMonster(gameId){
            gameTitle.textContent = '👾 找近视怪兽';
            gameSubtitle.textContent = '在场景中找出偷偷伤害眼睛的坏习惯！';
            setScore(0);
            setLives(1);
            gameBody.innerHTML = '';

            var wrap = document.createElement('div');
            wrap.className = 'findmonster';
            gameBody.appendChild(wrap);

            var hud = document.createElement('div');
            hud.className = 'game-hud';
            var timePill = document.createElement('div');
            timePill.className = 'pill gold';
            timePill.innerHTML = '⏱️ <b id="fmTime">60</b> 秒';
            var foundPill = document.createElement('div');
            foundPill.className = 'pill green';
            foundPill.innerHTML = '已找到：<b id="fmFound">0</b> / <b id="fmTotal">0</b>';
            hud.appendChild(timePill);
            hud.appendChild(foundPill);
            wrap.appendChild(hud);

            var scene = document.createElement('div');
            scene.className = 'findmonster-scene';
            // 装饰
            scene.innerHTML = '<div class="scene-item scene-sun"></div>' +
                '<div class="scene-item scene-window"></div>' +
                '<div class="scene-item scene-desk"></div>' +
                '<div class="scene-item scene-book"></div>' +
                '<div class="scene-item scene-plant"></div>';
            wrap.appendChild(scene);

            var tip = document.createElement('div');
            tip.className = 'lightmaze-tip';
            tip.innerHTML = '💡 <b>玩法：</b>60 秒内找出场景里所有近视小怪兽！每找到一只 +10 积分，全部找到额外 +30。';
            wrap.appendChild(tip);

            var monsters = [
                { emoji: '📖', x: 18, y: 52, name: '趴着看书', msg: '趴着看书会让眼睛很疲劳哦，要坐直看书！' },
                { emoji: '👀', x: 44, y: 38, name: '离书太近', msg: '离书太近会增加眼睛负担，保持一尺距离最好！' },
                { emoji: '📱', x: 68, y: 60, name: '长时间看屏幕', msg: '长时间看屏幕要记得每 20 分钟远眺放松哦！' },
                { emoji: '🌙', x: 78, y: 26, name: '黑暗中看手机', msg: '黑暗环境看手机伤眼睛，要开小夜灯！' },
                { emoji: '🏃', x: 54, y: 70, name: '缺少户外活动', msg: '每天户外活动 2 小时可以预防近视哦！' }
            ];

            var foundCount = 0;
            var totalScore = 0;
            var timeLeft = 60;
            var finished = false;
            var timer = null;
            var totalEl = document.getElementById('fmTotal');
            var foundEl = document.getElementById('fmFound');
            var timeEl = document.getElementById('fmTime');
            totalEl.textContent = monsters.length;
            foundEl.textContent = '0';

            function showToast(msg){
                var t = document.createElement('div');
                t.className = 'monster-toast';
                t.textContent = '⚠️ 找到了！' + msg;
                scene.appendChild(t);
                setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 2600);
            }

            monsters.forEach(function(m, i){
                var el = document.createElement('div');
                el.className = 'monster';
                el.style.left = m.x + '%';
                el.style.top = m.y + '%';
                el.style.animationDelay = (i * 0.3) + 's';
                el.innerHTML = '<span class="eye le"></span><span class="eye ri"></span><span class="mouth"></span><span style="position:absolute;bottom:2px;right:4px;font-size:22px;pointer-events:none;">' + m.emoji + '</span>';
                el.setAttribute('role', 'button');
                el.setAttribute('aria-label', m.name);
                el.addEventListener('click', function(){
                    if (el.classList.contains('found') || finished) return;
                    el.classList.add('found');
                    foundCount++;
                    totalScore += 10;
                    setScore(totalScore);
                    foundEl.textContent = foundCount;
                    showToast(m.msg);
                    if (foundCount === monsters.length) {
                        totalScore += 30;
                        setScore(totalScore);
                        finished = true;
                        clearInterval(timer);
                        setTimeout(function(){
                            showEnd(true, totalScore, {
                                icon: '🎉',
                                title: '护眼侦探成功！',
                                desc: '你找到了全部近视怪兽，眼睛会感谢你的！'
                            });
                        }, 800);
                    }
                });
                scene.appendChild(el);
            });

            timer = setInterval(function(){
                timeLeft--;
                timeEl.textContent = timeLeft;
                if (timeLeft <= 0) {
                    clearInterval(timer);
                    if (!finished) {
                        finished = true;
                        setTimeout(function(){
                            showEnd(false, totalScore, {
                                icon: '⏰',
                                title: '时间到啦！',
                                desc: '你找到了 ' + foundCount + '/' + monsters.length + ' 只怪兽，再来挑战一次吧～'
                            });
                        }, 300);
                    }
                }
            }, 1000);

            currentCleanup = function(){
                if (timer) clearInterval(timer);
                timer = null;
            };
        }

        /* =========================================================================
           小游戏 3：拼拼眼球
           - 拖放 5 个部件到正确位置
           - 正确吸附 + 科普，错误抖动返回
           - 全部完成 +100 积分
           ========================================================================= */
        function initEyePuzzle(gameId){
            gameTitle.textContent = '🧩 拼拼眼球';
            gameSubtitle.textContent = '把眼睛的零件放回正确位置！';
            setScore(0);
            setLives(1);
            gameBody.innerHTML = '';

            var parts = [
                { id:'cornea',   name:'角膜',      emoji:'🛡️', x: 32, y: 18, info:'<b>角膜：</b><i>是眼睛最外层的透明保护罩。</i>' },
                { id:'pupil',    name:'瞳孔',      emoji:'⚫', x: 46, y: 40, info:'<b>瞳孔：</b><i>可以调节进入眼睛的光线多少。</i>' },
                { id:'lens',     name:'晶状体',    emoji:'🔍', x: 62, y: 52, info:'<b>晶状体：</b><i>可以改变形状，帮助我们看清远近。</i>' },
                { id:'retina',   name:'视网膜',    emoji:'🟢', x: 80, y: 46, info:'<b>视网膜：</b><i>负责接收光线并形成视觉信息。</i>' },
                { id:'nerve',    name:'视神经',    emoji:'🔗', x: 90, y: 72, info:'<b>视神经：</b><i>把视觉信息传给大脑。</i>' }
            ];

            var wrap = document.createElement('div');
            wrap.className = 'eyepuzzle';
            gameBody.appendChild(wrap);

            var board = document.createElement('div');
            board.className = 'eyepuzzle-board';
            var eyeBg = document.createElement('div');
            eyeBg.className = 'pz-eye-bg';
            board.appendChild(eyeBg);
            parts.forEach(function(p){
                var slot = document.createElement('div');
                slot.className = 'eyepuzzle-slot';
                slot.dataset.id = p.id;
                slot.style.left = p.x + '%';
                slot.style.top = p.y + '%';
                slot.innerHTML = '<span class="slot-label">' + p.name + '</span>';
                board.appendChild(slot);
            });
            wrap.appendChild(board);

            var right = document.createElement('div');
            right.style.display = 'flex';
            right.style.flexDirection = 'column';
            right.style.gap = '12px';
            var partsBox = document.createElement('div');
            partsBox.className = 'eyepuzzle-parts';
            parts.forEach(function(p){
                var part = document.createElement('div');
                part.className = 'pz-part';
                part.dataset.id = p.id;
                part.innerHTML = '<div class="ball">' + p.emoji + '</div><div class="label">' + p.name + '</div>';
                partsBox.appendChild(part);
            });
            right.appendChild(partsBox);
            var knowledge = document.createElement('div');
            knowledge.className = 'eyepuzzle-knowledge';
            knowledge.innerHTML = '把左侧的 <b>5 个结构</b> 拖到眼球的正确位置上，每个位置都有虚线圆圈提示哦～';
            right.appendChild(knowledge);
            wrap.appendChild(right);

            var solvedCount = 0;
            var finished = false;

            function enableDrag(partEl){
                var startX, startY, origLeft, origTop;
                var dragging = false;
                function onDown(e){
                    if (partEl.classList.contains('solved')) return;
                    e.preventDefault();
                    var pt = e.touches ? e.touches[0] : e;
                    var rect = partEl.getBoundingClientRect();
                    startX = pt.clientX - rect.left;
                    startY = pt.clientY - rect.top;
                    dragging = true;
                    partEl.classList.add('drag');
                    partEl.style.left = rect.left + 'px';
                    partEl.style.top = rect.top + 'px';
                    document.addEventListener('mousemove', onMove);
                    document.addEventListener('mouseup', onUp);
                    document.addEventListener('touchmove', onMove, {passive:false});
                    document.addEventListener('touchend', onUp);
                }
                function onMove(e){
                    if (!dragging) return;
                    if (e.cancelable) e.preventDefault();
                    var pt = e.touches ? e.touches[0] : e;
                    partEl.style.left = (pt.clientX - startX) + 'px';
                    partEl.style.top = (pt.clientY - startY) + 'px';
                    // hover 提示
                    var hit = hitTest(pt.clientX, pt.clientY);
                    board.querySelectorAll('.eyepuzzle-slot').forEach(function(s){
                        s.classList.remove('hover');
                    });
                    if (hit && hit.dataset.id === partEl.dataset.id) hit.classList.add('hover');
                }
                function onUp(e){
                    if (!dragging) return;
                    dragging = false;
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onUp);
                    document.removeEventListener('touchmove', onMove);
                    document.removeEventListener('touchend', onUp);
                    var pt = e.changedTouches ? e.changedTouches[0] : e;
                    partEl.classList.remove('drag');
                    partEl.style.left = '';
                    partEl.style.top = '';
                    var hit = hitTest(pt.clientX, pt.clientY);
                    board.querySelectorAll('.eyepuzzle-slot').forEach(function(s){
                        s.classList.remove('hover');
                    });
                    if (hit && hit.dataset.id === partEl.dataset.id && !hit.classList.contains('filled')) {
                        // 正确：吸附
                        hit.classList.add('filled');
                        partEl.classList.add('solved');
                        var p = parts.filter(function(x){ return x.id === partEl.dataset.id; })[0];
                        knowledge.innerHTML = p.info;
                        solvedCount++;
                        setScore(solvedCount * 20);
                        if (solvedCount === parts.length && !finished) {
                            finished = true;
                            var earn = 100;
                            setScore(earn);
                            setTimeout(function(){
                                showEnd(true, earn, {
                                    icon: '✨',
                                    title: '眼球拼图完成！',
                                    desc: '你成功拼出了完整的眼球，眼睛王国的秘密都被你发现啦！'
                                });
                            }, 600);
                        }
                    } else {
                        // 错误：抖动
                        partEl.classList.add('shake');
                        setTimeout(function(){ partEl.classList.remove('shake'); }, 400);
                    }
                }
                partEl.addEventListener('mousedown', onDown);
                partEl.addEventListener('touchstart', onDown, {passive:false});
            }

            function hitTest(x, y){
                var slots = board.querySelectorAll('.eyepuzzle-slot');
                for (var i=0; i<slots.length; i++){
                    var s = slots[i];
                    var r = s.getBoundingClientRect();
                    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return s;
                }
                return null;
            }

            partsBox.querySelectorAll('.pz-part').forEach(enableDrag);

            currentCleanup = function(){};
        }

        /* =========================================================================
           小游戏 4：眼球旅行
           - Canvas 自动横向前进
           - 点击/方向键控制飞船上下移动
           - 收集 ⭐💎🟢，躲避 👾☁️⚡
           - 6 个区域小知识 + 随机问答
           - 抵达视网膜终点 +100
           ========================================================================= */
        function initEyeTravel(gameId){
            gameTitle.textContent = '🚗 眼球旅行';
            gameSubtitle.textContent = '和小光仔一起进入眼睛内部冒险！';
            setScore(0);
            setLives(3);
            gameBody.innerHTML = '';

            var wrap = document.createElement('div');
            wrap.className = 'eyetravel';
            gameBody.appendChild(wrap);

            var hud = document.createElement('div');
            hud.className = 'game-hud';
            var distPill = document.createElement('div');
            distPill.className = 'pill gold';
            distPill.innerHTML = '距离视网膜：<b id="etDist">100</b>%';
            var itemPill = document.createElement('div');
            itemPill.className = 'pill green';
            itemPill.innerHTML = '能量：<b id="etItems">0</b>';
            hud.appendChild(distPill);
            hud.appendChild(itemPill);
            wrap.appendChild(hud);

            var stage = document.createElement('div');
            stage.style.position = 'relative';
            var canvas = document.createElement('canvas');
            canvas.className = 'eyetravel-canvas';
            stage.appendChild(canvas);
            var qaOverlay = document.createElement('div');
            qaOverlay.className = 'qa-overlay';
            qaOverlay.hidden = true;
            stage.appendChild(qaOverlay);
            wrap.appendChild(stage);

            var tip = document.createElement('div');
            tip.className = 'travel-tip';
            tip.innerHTML = '💡 <b>玩法：</b>按住鼠标 / 触屏 或 按 <b>↑↓</b> 方向键 控制小飞船，躲避近视怪兽和障碍，收集星星和健康光点！';
            wrap.appendChild(tip);

            var ctx = canvas.getContext('2d');
            var W = 800, H = 450;
            var ship = { x: 80, y: H/2, r: 22, vy: 0 };
            var speed = 2.2;
            var distance = 0; // 0 ~ 100
            var items = [];
            var obstacles = [];
            var stars = [];
            var itemsCollected = 0;
            var lives = 3;
            var finished = false;
            var invuln = 0;
            var raf = null;
            var mouseDown = false;
            var keys = {};
            var lastSpawn = 0;
            var knowledgeIndex = 0;
            var qaShown = [false, false, false];
            var paused = false;

            // 区域信息
            var zones = [
                { at: 5,  name: '【角膜】',   text: '我们看到的光线，首先会经过透明的角膜。' },
                { at: 25, name: '【瞳孔】',   text: '瞳孔就像一个小孔，可以变大变小来控制光线。' },
                { at: 45, name: '【晶状体】', text: '晶状体会改变形状，帮助我们看清远近。' },
                { at: 62, name: '【玻璃体】', text: '透明的果冻状玻璃体支撑着眼球形状。' },
                { at: 80, name: '【视网膜】', text: '视网膜接收光线，把信号传给大脑。' },
                { at: 96, name: '【视神经】', text: '视神经把视觉信息飞速送到大脑。' }
            ];
            var zoneMsg = null;
            var zoneMsgUntil = 0;

            // 题库
            var questions = [
                { q:'看书时应该保持多远距离？', opts:['太近越好', '保持一尺（约33cm）', '趴在桌上'], ans: 1 },
                { q:'看屏幕多久应该休息一下？', opts:['20 分钟远眺 20 秒', '一直看没关系', '看 2 小时再说'], ans: 0 },
                { q:'预防近视最好的户外活动是？', opts:['每天 2 小时阳光下活动', '关在屋里看书', '一直看手机'], ans: 0 },
                { q:'光线暗的地方能看手机吗？', opts:['可以，越暗越好', '不能，要开小夜灯', '关灯省电'], ans: 1 }
            ];

            function showQA(){
                var q = questions[Math.floor(Math.random()*questions.length)];
                qaOverlay.innerHTML = '';
                var card = document.createElement('div');
                card.className = 'qa-card';
                var qEl = document.createElement('div');
                qEl.className = 'qa-q';
                qEl.textContent = q.q;
                card.appendChild(qEl);
                var opts = document.createElement('div');
                opts.className = 'qa-opts';
                var fb = document.createElement('div');
                fb.className = 'qa-feedback';
                q.opts.forEach(function(o, i){
                    var op = document.createElement('div');
                    op.className = 'qa-op';
                    op.textContent = o;
                    op.onclick = function(){
                        if (fb.classList.contains('good')) return;
                        if (i === q.ans) {
                            op.classList.add('correct');
                            fb.classList.remove('bad');
                            fb.classList.add('good');
                            fb.textContent = '✨ 答对啦！继续前进吧～';
                            setTimeout(resumeGame, 1100);
                        } else {
                            op.classList.add('wrong');
                            fb.classList.remove('good');
                            fb.classList.add('bad');
                            fb.textContent = '💡 再想一想！保持合适距离对眼睛更好哦。';
                        }
                    };
                    opts.appendChild(op);
                });
                card.appendChild(opts);
                card.appendChild(fb);
                qaOverlay.appendChild(card);
                qaOverlay.hidden = false;
                paused = true;
            }
            function resumeGame(){
                qaOverlay.hidden = true;
                paused = false;
            }

            function resizeCanvas(){
                var rect = canvas.getBoundingClientRect();
                var dpr = window.devicePixelRatio || 1;
                canvas.width = rect.width * dpr;
                canvas.height = rect.height * dpr;
                ctx.setTransform(dpr,0,0,dpr,0,0);
                W = rect.width; H = rect.height;
            }

            function spawnObstacle(){
                var typeRoll = Math.random();
                var type;
                if (typeRoll < 0.5) type = 'monster';
                else if (typeRoll < 0.8) type = 'cloud';
                else type = 'bolt';
                obstacles.push({
                    x: W + 30,
                    y: 50 + Math.random() * (H - 100),
                    r: 20 + Math.random()*10,
                    type: type,
                    vy: (Math.random()-0.5) * 1.5
                });
            }
            function spawnItem(){
                var roll = Math.random();
                var type = roll < 0.5 ? 'star' : (roll < 0.8 ? 'gem' : 'health');
                items.push({
                    x: W + 30,
                    y: 50 + Math.random() * (H - 100),
                    r: 14,
                    type: type
                });
            }

            function step(){
                if (finished || paused) return;
                // 飞船控制
                if (keys['ArrowUp'] || keys['w'] || keys['W']) ship.vy -= 0.6;
                if (keys['ArrowDown'] || keys['s'] || keys['S']) ship.vy += 0.6;
                if (mouseDown) {
                    // 朝鼠标位置靠近
                    // target 从外部传入
                    ship.vy += (mouseY - ship.y) * 0.02;
                }
                ship.vy *= 0.92;
                ship.y += ship.vy;
                ship.y = Math.max(ship.r, Math.min(H - ship.r, ship.y));

                distance += speed * 0.08;
                if (distance >= 100) distance = 100;
                document.getElementById('etDist').textContent = Math.round(100 - distance);

                // 区域知识
                zones.forEach(function(z, i){
                    if (distance >= z.at && (!zoneMsg || zoneMsg.name !== z.name || Date.now() > zoneMsgUntil)) {
                        if (!zoneMsg || zoneMsg.name !== z.name) {
                            zoneMsg = z;
                            zoneMsgUntil = Date.now() + 2600;
                        }
                    }
                });
                // 随机问答
                if ((distance > 30 && !qaShown[0]) || (distance > 55 && !qaShown[1]) || (distance > 78 && !qaShown[2])) {
                    var idx = distance > 78 ? 2 : (distance > 55 ? 1 : 0);
                    if (!qaShown[idx]) {
                        qaShown[idx] = true;
                        showQA();
                    }
                }

                // 生成
                lastSpawn++;
                if (lastSpawn > 45) {
                    lastSpawn = 0;
                    if (Math.random() < 0.7) spawnObstacle();
                    if (Math.random() < 0.5) spawnItem();
                }

                // 更新障碍
                for (var i=obstacles.length-1; i>=0; i--){
                    var o = obstacles[i];
                    o.x -= speed;
                    o.y += o.vy;
                    if (o.y < 30 || o.y > H-30) o.vy *= -1;
                    if (o.x < -60) { obstacles.splice(i,1); continue; }
                    var dx = o.x - ship.x, dy = o.y - ship.y;
                    if (invuln <= 0 && dx*dx + dy*dy < (o.r + ship.r - 6)*(o.r + ship.r - 6)) {
                        obstacles.splice(i,1);
                        lives--;
                        invuln = 80;
                        setLives(lives);
                        if (lives <= 0) {
                            finished = true;
                            setTimeout(function(){
                                showEnd(false, itemsCollected * 5, {
                                    icon: '💫',
                                    title: '飞船被击中啦！',
                                    desc: '没关系，再来一次就能成功到达视网膜哦！'
                                });
                            }, 300);
                            return;
                        }
                    }
                }
                // 更新物品
                for (var j=items.length-1; j>=0; j--){
                    var it = items[j];
                    it.x -= speed;
                    if (it.x < -60) { items.splice(j,1); continue; }
                    var dx2 = it.x - ship.x, dy2 = it.y - ship.y;
                    if (dx2*dx2 + dy2*dy2 < (it.r + ship.r)*(it.r + ship.r)) {
                        items.splice(j,1);
                        itemsCollected++;
                        setScore(itemsCollected * 5);
                        document.getElementById('etItems').textContent = itemsCollected;
                    }
                }

                if (invuln > 0) invuln--;

                // 到终点
                if (distance >= 100 && !finished) {
                    finished = true;
                    var earn = 100;
                    setScore(itemsCollected * 5 + earn);
                    setTimeout(function(){
                        showEnd(true, earn, {
                            icon: '🌟',
                            title: '成功穿越眼睛王国！',
                            desc: '你和小光仔一起成功抵达了视网膜终点，太厉害啦！'
                        });
                    }, 500);
                }
            }

            function draw(){
                if (!ctx) return;
                ctx.clearRect(0,0,W,H);
                // 背景渐变（随距离变化颜色）
                var grad = ctx.createLinearGradient(0,0,0,H);
                if (distance < 33) {
                    grad.addColorStop(0, '#0A2A55'); grad.addColorStop(1, '#0E1E4A');
                } else if (distance < 66) {
                    grad.addColorStop(0, '#1A2A6A'); grad.addColorStop(1, '#2A1A5A');
                } else {
                    grad.addColorStop(0, '#2A1A5A'); grad.addColorStop(1, '#3A1040');
                }
                ctx.fillStyle = grad;
                ctx.fillRect(0,0,W,H);
                // 星点背景
                ctx.save();
                for (var i=0; i<30; i++){
                    var sx = (i*113 + distance*2) % W;
                    var sy = (i*79) % H;
                    ctx.fillStyle = 'rgba(255,255,255,0.5)';
                    ctx.beginPath(); ctx.arc((W - sx), sy, 1, 0, Math.PI*2); ctx.fill();
                }
                ctx.restore();

                // 区域标题
                if (zoneMsg && Date.now() < zoneMsgUntil) {
                    ctx.fillStyle = 'rgba(255,231,154,0.95)';
                    ctx.font = 'bold 16px "Noto Sans SC", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(zoneMsg.name, W/2, 36);
                    ctx.fillStyle = 'rgba(220,235,255,0.95)';
                    ctx.font = '13px "Noto Sans SC", sans-serif';
                    ctx.fillText(zoneMsg.text, W/2, 58);
                }

                // 物品
                items.forEach(function(it){
                    ctx.save();
                    ctx.translate(it.x, it.y);
                    var emoji = it.type === 'star' ? '⭐' : (it.type === 'gem' ? '💎' : '🟢');
                    ctx.font = '22px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(emoji, 0, 0);
                    ctx.restore();
                });

                // 障碍
                obstacles.forEach(function(o){
                    ctx.save();
                    ctx.translate(o.x, o.y);
                    var emoji = o.type === 'monster' ? '👾' : (o.type === 'cloud' ? '☁️' : '⚡');
                    ctx.font = '28px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(emoji, 0, 0);
                    ctx.restore();
                });

                // 飞船
                ctx.save();
                ctx.translate(ship.x, ship.y);
                if (invuln > 0 && Math.floor(invuln/6) % 2) ctx.globalAlpha = 0.4;
                // 小飞船（椭圆 + 翼）
                ctx.fillStyle = '#78C943';
                ctx.beginPath(); ctx.ellipse(0, 0, 26, 16, 0, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#A5E85A';
                ctx.beginPath(); ctx.ellipse(-4, -4, 16, 8, 0, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#FFF8D8';
                ctx.beginPath(); ctx.arc(-2, -2, 6, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = '#FFD45A';
                ctx.beginPath(); ctx.moveTo(-22, 0); ctx.lineTo(-34, -6); ctx.lineTo(-34, 6); ctx.closePath(); ctx.fill();
                ctx.restore();

                // 终点提示
                if (distance > 90) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(165,232,90,' + (0.6 + 0.4*Math.sin(Date.now()/200)) + ')';
                    ctx.font = 'bold 20px "Noto Sans SC", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('🌟 视网膜终点就在前方！', W/2, H - 30);
                    ctx.restore();
                }
            }

            function loop(){
                step();
                draw();
                raf = requestAnimationFrame(loop);
            }

            var mouseY = H/2;
            function onPointerMove(e){
                if (e.cancelable) e.preventDefault();
                var rect = canvas.getBoundingClientRect();
                var pt = e.touches ? e.touches[0] : e;
                mouseY = (pt.clientY - rect.top) * (H / rect.height);
            }
            canvas.addEventListener('mousedown', function(){ mouseDown = true; });
            canvas.addEventListener('mouseup', function(){ mouseDown = false; });
            canvas.addEventListener('mouseleave', function(){ mouseDown = false; });
            canvas.addEventListener('mousemove', onPointerMove);
            canvas.addEventListener('touchstart', function(e){ mouseDown = true; onPointerMove(e); }, {passive:false});
            canvas.addEventListener('touchmove', onPointerMove, {passive:false});
            canvas.addEventListener('touchend', function(){ mouseDown = false; });

            function onKey(e){
                keys[e.key] = true;
                if (['ArrowUp','ArrowDown',' '].indexOf(e.key) !== -1) e.preventDefault();
            }
            function onKeyUp(e){ keys[e.key] = false; }
            document.addEventListener('keydown', onKey);
            document.addEventListener('keyup', onKeyUp);

            currentCleanup = function(){
                if (raf) cancelAnimationFrame(raf);
                raf = null;
                document.removeEventListener('keydown', onKey);
                document.removeEventListener('keyup', onKeyUp);
                window.removeEventListener('resize', onTravelResize);
            };

            function onTravelResize(){ resizeCanvas(); }

            setTimeout(function(){
                resizeCanvas();
                ship.y = H/2;
                loop();
            }, 30);

            window.addEventListener('resize', onTravelResize);
        }

        }); // end DOMContentLoaded
    })();
    