
    (function(){
        // ---------- 工具：随机数 ----------
        function rand(min, max) { return Math.random() * (max - min) + min; }
        function randInt(min, max) { return Math.floor(rand(min, max + 1)); }

        // ---------- 1. 远景星星（30 个小点，慢闪） ----------
        var farField = document.getElementById('adv3StarFar');
        if (farField) {
            for (var i = 0; i < 30; i++) {
                var s = document.createElement('span');
                s.className = 'adv3-sfar';
                s.style.left = rand(2, 98) + '%';
                s.style.top = rand(2, 98) + '%';
                s.style.animationDelay = rand(0, 5) + 's';
                s.style.animationDuration = rand(4, 7) + 's';
                farField.appendChild(s);
            }
        }

        // ---------- 2. 中景星星（18 个，中速闪烁 + 漂移） ----------
        var midField = document.getElementById('adv3StarMid');
        if (midField) {
            for (var i = 0; i < 18; i++) {
                var s = document.createElement('span');
                s.className = 'adv3-smid';
                s.style.left = rand(2, 98) + '%';
                s.style.top = rand(2, 98) + '%';
                s.style.animationDelay = rand(0, 4) + 's, ' + rand(0, 60) + 's';
                midField.appendChild(s);
            }
        }

        // ---------- 3. 近景大星（10 个，亮、缓慢闪烁） ----------
        var nearField = document.getElementById('adv3StarNear');
        if (nearField) {
            for (var i = 0; i < 10; i++) {
                var s = document.createElement('span');
                s.className = 'adv3-snear';
                s.style.left = rand(5, 95) + '%';
                s.style.top = rand(5, 95) + '%';
                s.style.animationDelay = rand(0, 6) + 's';
                s.style.animationDuration = rand(5, 8) + 's';
                nearField.appendChild(s);
            }
        }

        // ---------- 4. 漂浮星尘（16 个，柔和飘动） ----------
        var dustField = document.getElementById('adv3DustField');
        if (dustField) {
            for (var i = 0; i < 16; i++) {
                var d = document.createElement('span');
                d.className = 'adv3-dust-p';
                d.style.left = rand(3, 97) + '%';
                d.style.top = rand(5, 95) + '%';
                d.style.animationDelay = rand(0, 12) + 's';
                d.style.animationDuration = rand(10, 16) + 's';
                dustField.appendChild(d);
            }
        }

        // ---------- 5. 眼睛星球眨眼（可选：轻微scale Y模拟眨眼） ----------
        var planetImg = document.querySelector('.adv3-planet-img');
        if (planetImg) {
            // 12s 后（星球到位）开始偶尔眨眼
            setTimeout(function startBlink() {
                planetImg.style.transition = 'transform 0.15s ease';
                planetImg.style.transform = 'scaleY(0.85)';
                setTimeout(function() {
                    planetImg.style.transform = '';
                    setTimeout(startBlink, rand(3000, 6000));
                }, 150);
            }, 12000);
        }

        // ---------- 6. 滚动提示：用户滚动后淡出 Hero 动画 ----------
        var heroSec = document.querySelector('.adv3-hero');
        var scrollHint = document.querySelector('.adv3-scroll-hint');
        if (heroSec && scrollHint) {
            var fadeTimer = null;
            window.addEventListener('scroll', function() {
                if (window.scrollY > 50) {
                    scrollHint.style.opacity = '0';
                    scrollHint.style.transition = 'opacity 0.5s ease';
                    if (heroSec.style.opacity !== '0.6') {
                        heroSec.style.transition = 'opacity 0.8s ease';
                        heroSec.style.opacity = '0.6';
                    }
                } else {
                    scrollHint.style.opacity = '';
                    heroSec.style.opacity = '';
                }
            }, { passive: true });
        }
    })();
    