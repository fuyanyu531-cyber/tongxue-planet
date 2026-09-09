
    (function(){
        // 数据映射（若 main.js 已提供 ADV_PART_DATA 会覆盖；这里兜底一份）
        var PART_ICON = {
            cornea:  '../../03-视界探索站/配图/探索素材/眼球小岛.png',
            pupil:   '../../03-视界探索站/配图/探索素材/小光仔开心.png',
            lens:    '../../03-视界探索站/配图/探索素材/实验烧瓶.png',
            retina:  '../../03-视界探索站/配图/探索素材/误区辨别小岛.png',
            nerve:   '../../03-视界探索站/配图/探索素材/飞船.png'
        };
        var ORDER = ['cornea','pupil','lens','retina','nerve'];

        var modal     = document.getElementById('advPartModal');
        var mNum      = document.getElementById('advPartNum');
        var mTitle    = document.getElementById('advPartTitle');
        var mSubtitle = document.getElementById('advPartSubtitle');
        var mIcon     = document.getElementById('advPartIcon');
        var mDesc     = document.getElementById('advPartDesc');
        var mTip      = document.getElementById('advPartTipText');
        var mNextBtn  = document.getElementById('advPartNextBtn');
        var eyeIntro  = document.getElementById('adv3EyeIntro');

        /**
         * 统一更新：眼球介绍 + 当前节点激活态（is-active）
         *  - 局部切换 adv3EyeIntro，280–350ms 淡入+轻微缩放+发光
         *  - withModal=true 时额外显示模态（兼容旧体验，点击节点默认不自动打开）
         */
        function updateEyeDisplay(node, opts){
            opts = opts || {};
            var part = node.getAttribute('data-part');
            var num  = node.getAttribute('data-num') || '01';
            var t    = node.getAttribute('data-title') || '';
            var sub  = node.getAttribute('data-subtitle') || '';
            var desc = node.getAttribute('data-desc') || '';
            var tip  = node.getAttribute('data-tip') || '';

            // 1) 节点激活态：当前节点 金黄星+绿色发光+1.08
            document.querySelectorAll('.adv3-eye-node').forEach(function(n){
                n.classList.remove('is-active');
            });
            node.classList.add('is-active');

            // 2) 局部切换介绍（淡入+缩放 280–350ms）
            if (eyeIntro) {
                var html = '<b>🌱 ' + t + ' · ' + sub + '：</b>' + desc +
                           '<br><em>💡 小贴士：</em>' + tip;
                // 重置 enter 动画（一次完成后强制回流，重新触发）
                eyeIntro.classList.remove('enter');
                // 强制回流：void element.offsetWidth
                void eyeIntro.offsetWidth;
                eyeIntro.innerHTML = html;
                eyeIntro.classList.add('enter');
            }

            // 2b) 同步小光仔提示气泡
            var bubble = document.getElementById('adv3EyeBubble');
            if (bubble) {
                var bText = bubble.querySelector('.eye-bubble-text');
                if (bText) bText.textContent = '已抵达 ' + t + '：' + sub + ' ✦';
            }

            // 3) （可选）同步弹窗数据
            if (mNum)      mNum.textContent      = '第 ' + (ORDER.indexOf(part)+1 || 1) + ' 站';
            if (mTitle)    mTitle.textContent    = t;
            if (mSubtitle) mSubtitle.textContent = sub;
            if (mIcon) {
                var img = mIcon.querySelector('img');
                if (img) img.src = PART_ICON[part] || img.src;
            }
            if (mDesc) mDesc.textContent = desc;
            if (mTip)  mTip.innerHTML    = tip;

            // 4) withModal=true 时才打开弹窗
            if (opts.withModal && modal) {
                modal.hidden = false;
                modal.setAttribute('aria-hidden', 'false');
            }

            updateEyeDisplay._active = part;
        }

        function openModal(node){
            // 直接复用 display 更新（包含简介更新 + 节点 active），同时强制显示弹窗
            updateEyeDisplay(node, { withModal: true });
        }

        function closeModal(){
            if (!modal) return;
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
        }

        // 绑定所有节点点击（不自动打开弹窗；只做局部切换）
        document.querySelectorAll('.adv3-eye-node').forEach(function(node){
            var btn = node.querySelector('button.adv3-pin');
            var handler = function(e){
                e.preventDefault();
                // ★ 不打开弹窗，只做局部切换
                updateEyeDisplay(node, { withModal: false });
            };
            if (btn) btn.addEventListener('click', handler);
            else node.addEventListener('click', handler);
        });

        // 弹窗关闭：遮罩 / × / ESC
        if (modal) {
            modal.addEventListener('click', function(e){
                var t = e.target;
                if (t && t.getAttribute && t.getAttribute('data-close-modal') === '1') closeModal();
                if (t && (t.classList && (t.classList.contains('ad-modal-mask') || t.classList.contains('adv-modal-mask')))) closeModal();
            });
        }
        document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });

        // 弹窗「下一个节点」→ 关闭弹窗，滚回探索区并切换介绍（保持局部切换不弹窗）
        if (mNextBtn) {
            mNextBtn.addEventListener('click', function(){
                var cur = updateEyeDisplay._active || openModal._active || ORDER[0];
                var i = ORDER.indexOf(cur);
                var next = ORDER[(i+1) % ORDER.length];
                var nextNode = document.querySelector('.adv3-eye-node[data-part="'+next+'"]');
                closeModal();
                if (nextNode) {
                    var stage = document.querySelector('.adv3-eye-stage');
                    if (stage) stage.scrollIntoView({behavior:'smooth', block:'center'});
                    setTimeout(function(){
                        updateEyeDisplay(nextNode, { withModal: false });
                    }, 380);
                }
            });
        }

        // Hero 顶部章节节点：滚动 + 激活对应节点介绍（局部切换；不弹窗）
        var stepToPart = {'1':'cornea','2':'pupil','3':'lens','4':'retina','5':'nerve'};
        document.querySelectorAll('.adv3-hnode-btn[data-step]').forEach(function(b){
            b.addEventListener('click', function(){
                var stage = document.querySelector('.adv3-eye-stage');
                if (stage) stage.scrollIntoView({behavior:'smooth', block:'center'});
                var part = stepToPart[b.getAttribute('data-step')];
                var node = part && document.querySelector('.adv3-eye-node[data-part="'+part+'"]');
                if (node) {
                    setTimeout(function(){
                        updateEyeDisplay(node, { withModal: false });
                    }, 420);
                }
            });
        });

        // 去挑战本章：滚到小游戏
        var chal = document.getElementById('adv3ChallengeBtn');
        if (chal) chal.addEventListener('click', function(){
            var g = document.querySelector('.adv3-games');
            if (g) g.scrollIntoView({behavior:'smooth', block:'start'});
        });

        // 小游戏按钮：直接打开统一游戏 Modal（不跳转新页面）
        document.querySelectorAll('.adv3-game-card .play[data-game]').forEach(function(b){
            b.addEventListener('click', function(ev){
                ev.preventDefault();
                var g = b.getAttribute('data-game');
                try {
                    if (typeof window.advOpenGame === 'function') return window.advOpenGame(g);
                } catch(err) { console.warn('[adventure] open game failed:', g, err); }
            });
        });
    })();
    