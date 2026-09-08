/* ============================================
   瞳学星球 - 首页交互脚本
   功能：导航高亮、打卡勾选、语音朗读按钮交互等
   ============================================ */

// 等待 DOM 加载完毕后执行
document.addEventListener('DOMContentLoaded', function () {

    // ============================================
    // 通用安全工具（避免 Cannot read properties of null (reading '0') 类报错）
    // 经验 2195456：regex.match() / querySelector() 可能返回 null，使用前必须判空
    // ============================================
    function safeMatch(str, regex, fallback) {
        if (str == null) return fallback == null ? '' : fallback;
        var m = String(str).match(regex);
        return (m && m.length) ? m[0] : (fallback == null ? '' : fallback);
    }
    function safeMatchAt(str, regex, index, fallback) {
        if (str == null) return fallback == null ? '' : fallback;
        var idx = typeof index === 'number' ? index : 0;
        var m = String(str).match(regex);
        return (m && m.length > idx) ? m[idx] : (fallback == null ? '' : fallback);
    }
    function safeEl(selector, root) {
        try { return (root || document).querySelector(selector); }
        catch (e) { return null; }
    }
    function safeEls(selector, root) {
        try { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); }
        catch (e) { return []; }
    }
    function safeGetData(el, name, fallback) {
        if (!el || !el.getAttribute) return fallback == null ? '' : fallback;
        var v = el.getAttribute('data-' + name);
        return v == null ? (fallback == null ? '' : fallback) : v;
    }
    // 监听页面级未捕获错误（便于后续排查，不破坏体验）
    window.addEventListener('error', function (ev) {
        try {
            // 只记录在控制台里，不对用户弹窗；过滤掉预览注入脚本与外链 404
            var msg = ev && ev.message ? String(ev.message) : '';
            if (!msg) return;
            // 忽略非 "Cannot read" 类错误
            if (msg.indexOf('reading') < 0 && msg.indexOf('Cannot read') < 0) return;
            // 忽略来源为匿名/注入脚本的错误（预览器/浏览器工具注入，非页面代码）
            var fn = ev.filename || '';
            var isInjected = !fn || fn === '<anonymous>' || fn.indexOf('sandbox_bundle') >= 0 || fn.indexOf('electron') >= 0;
            if (isInjected) {
                // 阻止浏览器输出默认错误日志（注入脚本错误与页面无关）
                try { ev.preventDefault(); } catch (_) {}
                return;
            }
            // eslint-disable-next-line no-console
            console.warn('[瞳学星球·兜底] ' + msg + (ev.filename ? ' @ ' + ev.filename + ':' + ev.lineno + ':' + ev.colno : ''));
        } catch (_) {}
    }, true);

    // ============================================
    // 0. 路径别名兼容：新信息架构 URL（eyeball-adventure / vision-exploration）
    //    → 自动落到现有实际页面（adventure.html / selftest.html）
    //    仅做轻量跳转，不影响任何已有业务。
    // ============================================
    (function aliasRedirect() {
        var path = window.location.pathname;
        var file = (path.substring(path.lastIndexOf('/') + 1) || '').toLowerCase();
        // 真实文件缺失时按别名落到已有页面（保留查询参数和 hash）
        var rest = window.location.search + window.location.hash;
        if (file === 'eyeball-adventure.html') {
            window.location.replace('adventure-intro.html' + rest);
            return;
        }
        if (file === 'vision-exploration.html') {
            window.location.replace('selftest.html' + rest);
            return;
        }
    })();

    // ============================================
    // 1. 导航栏高亮：根据当前页面文件名，自动为对应菜单项添加 active
    // ============================================
    (function setActiveNavLink() {
        // 从地址栏获取当前文件名（去掉参数和hash）
        var path = window.location.pathname;
        var filename = path.substring(path.lastIndexOf('/') + 1).toLowerCase();
        if (filename === '') filename = 'index.html';

        // 为 data-page 匹配的导航链接添加 active
        // 新映射：
        //   index                → index.html（或空路径）
        //   eyeball-adventure    → eyeball-adventure.html / adventure.html（兼容旧名）
        //   vision-exploration   → vision-exploration.html / selftest.html（兼容旧名）
        //   decoder              → decoder.html
        //   hero                 → hero.html
        //   qa                   → qa.html
        var navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(function (link) {
            link.classList.remove('active');
            var page = (link.getAttribute('data-page') || '').toLowerCase();
            if (
                (page === 'index'               && (filename === 'index.html' || filename === '')) ||
                (page === 'eyeball-adventure'   && (filename === 'eyeball-adventure.html'  || filename === 'adventure.html' || filename === 'adventure-intro.html')) ||
                (page === 'vision-exploration'  && (filename === 'vision-exploration.html' || filename === 'selftest.html')) ||
                (page === 'decoder'             && filename === 'decoder.html') ||
                (page === 'hero'                && filename === 'hero.html') ||
                (page === 'qa'                  && filename === 'qa.html')
            ) {
                link.classList.add('active');
            }
        });
    })();


    // ============================================
    // 2. 语音朗读功能（Web Speech API）
    // ============================================
    var isSpeaking = false;
    var currentUtterance = null;

    // 朗读文本
    function speakText(text) {
        if (!('speechSynthesis' in window)) {
            showToast('😅 你的浏览器不支持语音朗读');
            return;
        }
        // 停止当前朗读
        window.speechSynthesis.cancel();

        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        utterance.volume = 1.0;

        // 优先选择中文语音
        var voices = window.speechSynthesis.getVoices();
        var zhVoice = voices.find(function(v) {
            return v.lang.indexOf('zh') >= 0;
        });
        if (zhVoice) utterance.voice = zhVoice;

        utterance.onend = function() { isSpeaking = false; };
        utterance.onerror = function() { isSpeaking = false; };

        currentUtterance = utterance;
        isSpeaking = true;
        window.speechSynthesis.speak(utterance);
    }

    // 停止朗读
    function stopSpeaking() {
        window.speechSynthesis.cancel();
        isSpeaking = false;
    }

    // 朗读导航栏按钮：朗读页面主要内容
    var voiceBtn = document.querySelector('.btn-voice');
    if (voiceBtn) {
        voiceBtn.addEventListener('click', function () {
            this.style.transform = 'scale(0.95)';
            var self = this;
            setTimeout(function () { self.style.transform = ''; }, 150);

            if (isSpeaking) {
                stopSpeaking();
                showToast('⏹ 已停止朗读');
                return;
            }

            // 读取页面主要文字内容
            var mainContent = document.querySelector('main') || document.querySelector('.page-content') || document.body;
            var text = mainContent.innerText.replace(/\s+/g, ' ').trim().slice(0, 500);
            if (text) {
                speakText(text);
                showToast('🔊 开始朗读...');
            } else {
                showToast('没有可朗读的内容');
            }
        });
    }

    // 暴露给全局，供各页面调用
    window.speakText = speakText;
    window.stopSpeaking = stopSpeaking;


    // ============================================
    // 3. 今日打卡：勾选项目切换状态
    // ============================================
    var checkinItems = document.querySelectorAll('.checkin-items li');

    checkinItems.forEach(function (item) {
        item.addEventListener('click', function () {
            var checkbox = this.querySelector('.checkbox');
            if (checkbox) {
                // 切换 已勾选 / 未勾选 显示
                if (checkbox.textContent === '⬜') {
                    checkbox.textContent = '✅';
                    this.style.background = '#F1FBF0';
                    this.style.borderColor = 'var(--primary)';
                    this.style.opacity = '0.85';
                } else {
                    checkbox.textContent = '⬜';
                    this.style.background = '#fff';
                    this.style.borderColor = '#FFF3E0';
                    this.style.opacity = '1';
                }
            }
        });
    });


    // ============================================
    // 4. 立即打卡按钮：点击反馈
    // ============================================
    var checkinBtn = document.querySelector('.btn-checkin');

    if (checkinBtn) {
        checkinBtn.addEventListener('click', function () {
            // 统计已勾选的数量
            var checked = document.querySelectorAll('.checkbox');
            var count = 0;
            checked.forEach(function (cb) {
                if (cb.textContent === '✅') count++;
            });

            if (count === 0) {
                showToast('🙈 还没勾选完成呢，先选几项吧～');
            } else if (count < 4) {
                showToast('💪 完成了 ' + count + ' 项，继续加油哦！');
            } else {
                showToast('🎉 太棒啦！今日护眼任务全完成！');
            }
        });
    }


    // ============================================
    // 5. 功能卡片：点击卡片整体也可跳转（与按钮 href 一致）
    // ============================================
    var featureCards = document.querySelectorAll('.feature-card');

    featureCards.forEach(function (card) {
        var link = card.querySelector('.card-link');
        // 卡片点击 = 跳转按钮指向的页面；按钮本身正常跳转不拦截
        card.addEventListener('click', function (e) {
            // 避免与按钮重复触发
            if (e.target.closest('.card-link')) return;
            if (link && link.getAttribute('href')) {
                window.location.href = link.getAttribute('href');
            }
        });
    });


    // ============================================
    // 6. 热门问答/排行榜/更多链接 点击提示
    // ============================================
    var moreLinks = document.querySelectorAll('.more-link, .qa-list a');

    moreLinks.forEach(function (el) {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            showToast('📖 内容模块正在建设中...');
        });
    });


    // ============================================
    // 7. Footer 链接占位提示
    // ============================================
    var footerLinks = document.querySelectorAll('.footer-col a');

    footerLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            showToast('🌱 页面即将上线～');
        });
    });


    // ============================================
    // 8. 用户头像：点击欢迎提示
    // ============================================
    var avatar = document.querySelector('.user-avatar');

    if (avatar) {
        avatar.addEventListener('click', function () {
            showToast('👋 你好呀！欢迎来到瞳学星球～');
        });
    }


    // ============================================
    // 辅助函数：显示简易 Toast 提示
    // ============================================
    function showToast(msg) {
        // 如果已存在旧 toast，先移除
        var old = document.getElementById('tongxue-toast');
        if (old) old.remove();

        // 创建 toast 元素
        var toast = document.createElement('div');
        toast.id = 'tongxue-toast';
        toast.textContent = msg;

        // 样式内联（保持独立，不依赖额外CSS）
        Object.assign(toast.style, {
            position: 'fixed',
            top: '96px',
            left: '50%',
            transform: 'translateX(-50%) translateY(-20px)',
            background: 'rgba(36, 92, 66, 0.95)',
            color: '#fff',
            padding: '12px 28px',
            borderRadius: '24px',
            fontSize: '14px',
            fontWeight: '700',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            zIndex: '9999',
            opacity: '0',
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap',
            letterSpacing: '1px'
        });

        document.body.appendChild(toast);

        // 入场动画
        requestAnimationFrame(function () {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // 2.5 秒后自动消失
        setTimeout(function () {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(function () {
                if (toast.parentNode) toast.remove();
            }, 300);
        }, 2500);
    }


    // ============================================
    // 9. 滚动时导航栏阴影加深（视觉反馈）
    // ============================================
    var navbar = document.querySelector('.navbar');

    window.addEventListener('scroll', function () {
        if (!navbar) return;
        var scrollY = window.scrollY || window.pageYOffset;
        if (scrollY > 20) {
            navbar.style.boxShadow = '0 4px 16px rgba(79, 174, 69, 0.18)';
        } else {
            navbar.style.boxShadow = '0 2px 8px rgba(79, 174, 69, 0.08)';
        }
    });


    // ============================================
    // 10. hero.html 21天打卡：日期圆点击切换状态（未完成→已完成）
    // ============================================
    (function initCheckinDays() {
        var grid = document.querySelector('.checkin-grid');
        if (!grid) return;

        // 自动统计并更新 "已坚持 X 天"
        function refreshDaysCount() {
            var done = grid.querySelectorAll('.day-circle.done');
            var countEl = document.getElementById('days-done-count');
            if (countEl) countEl.textContent = done.length;
        }

        grid.addEventListener('click', function (e) {
            var circle = e.target.closest('.day-circle');
            if (!circle) return;
            circle.classList.toggle('done');
            refreshDaysCount();

            if (circle.classList.contains('done')) {
                showToast('🎉 打卡成功！离护眼小英雄又近一步～');
            } else {
                showToast('↩️ 已取消当日打卡');
            }
        });

        refreshDaysCount();
    })();


    // ============================================
    // 11. qa.html 问答卡片：3D 翻转交互（点正面翻背面，点背面翻回正面）
    // ============================================
    (function initQaFlipCards() {
        var qaCards = document.querySelectorAll('.qa-flip');
        if (!qaCards.length) return;

        var tipEl = document.getElementById('qaHeroTip');
        var tipHidden = false;

        function hideTipOnce() {
            if (tipHidden || !tipEl) return;
            tipHidden = true;
            tipEl.classList.add('fade-out');
            setTimeout(function () {
                if (tipEl && tipEl.parentNode) tipEl.parentNode.removeChild(tipEl);
            }, 600);
        }

        qaCards.forEach(function (card) {
            // 点击：切换 flipped 状态 + 轻微缩放反馈
            card.addEventListener('click', function () {
                hideTipOnce();
                card.classList.toggle('flipped');
                // 轻微缩放/阴影反馈
                card.style.transition = 'transform 0.25s ease';
                card.style.transform = 'scale(0.97)';
                setTimeout(function () {
                    card.style.transform = '';
                }, 250);
            });

            // 支持键盘 Enter / Space 操作
            card.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    card.click();
                }
            });
        });
    })();


    // ============================================
    // 12. decoder.html 天书解码器 主逻辑
    //     · 5 个符号卡片（R/L SPH CYL AXIS PD）→ 弹窗解释
    //     · 模拟验光单：点击列代码/R/L/数字 → 含义解释
    //     · "我是小侦探"小游戏 3 题（对=星星+鼓励，错=温柔解释），结果页可再玩/返回
    // ============================================
    (function initDecoderPage() {
        var filename = (window.location.pathname.split('/').pop() || '').toLowerCase();
        if (filename !== 'decoder.html') return;

        /* ---------- 12.1 工具 ---------- */
        var $  = function (s, r) { return (r || document).querySelector(s); };
        var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

        /* ---------- 12.2 符号解释数据（5项） ---------- */
        var ITEMS = [
            {
                key: 'RL',
                theme: 'green',
                order: '1 / 5',
                title: 'R 与 L —— 右眼和左眼',
                icon: '👀',
                desc: '验光单最开头常常会出现 R 和 L 两个字母：<br><b>R = Right = 右眼 🫣</b>，<b>L = Left = 左眼 🫢</b>。<br>有的验光单也写 <b>OD（右眼）</b>、<b>OS（左眼）</b>，意思是一样的哦！这样医生和配镜师就能清楚地知道：哪组数据是给右眼的，哪组是给左眼的。',
                tip: '两只眼睛像一对好朋友👭，它们的数据经常不一样，配镜时每只眼睛都要"量身定制"，不能混在一起哦！'
            },
            {
                key: 'SPH',
                theme: 'blue',
                order: '2 / 5',
                title: 'SPH —— 球镜（近视 / 远视）',
                icon: '🔵',
                desc: '<b>SPH = Sphere（球镜）</b>，是用来矫正 <b>近视</b> 或 <b>远视</b> 的度数。<br>' +
                      '• 数字前面是 <b>减号「-」</b>（如 -2.00）：说明是 <b>近视</b>（看不清远处的黑板/招牌）。数字越大，近视越深～<br>' +
                      '• 数字前面是 <b>加号「+」</b>（如 +1.50）：说明是 <b>远视</b>（看近处书本更费力，容易累）。<br>' +
                      '小贴士：1.00D = 大家常说的"100度"，所以 -2.00 就是"近视 200 度"。',
                tip: '如果小朋友 SPH 的「-」号一年一年变大，说明近视在悄悄加深😟。每天户外活动 2 小时、坚持 20-20-20 法则，能帮 SPH 乖乖听话哦！'
            },
            {
                key: 'CYL',
                theme: 'purple',
                order: '3 / 5',
                title: 'CYL —— 柱镜（散光）',
                icon: '🌀',
                desc: '<b>CYL = Cylinder（柱镜）</b>，用来矫正 <b>散光</b>。<br>什么是散光呢？想象一下：角膜本来应该像"圆圆的篮球"🏀，如果它长成像"橄榄球"🏈一样不圆，光线就不能聚成一个点——这就是散光！<br>CYL 越大，说明散光越"厉害"。比如 CYL -0.75 就是散光 75 度，-2.00 就是散光 200 度。',
                tip: '散光不是"大病"！很多小朋友都有一点点散光。只要配上合适的眼镜👓，看东西立刻就变清晰啦，不会再晕乎乎、重影啦～'
            },
            {
                key: 'AXIS',
                theme: 'orange',
                order: '4 / 5',
                title: 'AXIS（A）—— 轴位（散光方向）',
                icon: '🧭',
                desc: '<b>AXIS = 轴位</b>，只有在有散光（CYL 不为 0）的时候才有意义哦！<br>它是一个 <b>0° 到 180°</b> 的角度数字🧭，告诉配镜师：你的散光"歪"在哪个方向，这样镜片里的散光部分才能对准正确的位置，就像贴纸贴对地方才平整。<br>例如 AXIS 180°、AXIS 90°……只要散光度数不变，轴位也要和之前大致对得上哦！',
                tip: '小朋友不用自己记轴位数字😌—— 但你可以观察：每次复查验光单，如果 CYL 有数字，就一定有一个对应的 AXIS 哦！'
            },
            {
                key: 'PD',
                theme: 'teal',
                order: '5 / 5',
                title: 'PD —— 瞳距（瞳孔距离）',
                icon: '📏',
                desc: '<b>PD = Pupillary Distance（瞳距）</b>，就是两只眼睛 <b>瞳孔中心之间的距离</b>，通常用毫米（mm）表示，比如 PD 58 mm、PD 60 mm。<br>为什么它很重要？因为眼镜镜片中间有一个"看东西最清楚"的光心🔎——配镜师必须把这个光心对准你的瞳孔，这样戴着才舒服、不累眼。就像瞄准靶心🎯，不能偏！',
                tip: '小朋友越长越高，脸和眼睛的距离也会慢慢变哦～所以每半年复查一次，PD 也要重新量一量，确保眼镜一直"合身"！'
            }
        ];

        /* ---------- 12.3 验光单每格数字/代码的含义解释 ---------- */
        // 模拟单元格点击解释（儿童易懂）
        var CELLS = {
            // 代码按钮点击（列标题/眼别/PD）
            'code-R':   { name: 'R（右眼）', body: '这一行的所有数据都是<b>右眼</b>的哦～医生一般<b>先写右眼 R，再写左眼 L</b>，两只眼睛"待遇"一样，都会被认真检查！' },
            'code-L':   { name: 'L（左眼）', body: '这一行的所有数据都是<b>左眼</b>的哦～左眼看东西和右眼不一定一样清楚，所以会有一组独立的数据！' },
            'code-SPH': { name: 'SPH（球镜）', body: '这一列是 <b>球镜（近视/远视度数）</b>：<br>带「-」是近视，带「+」是远视。数字越大，度数越深！' },
            'code-CYL': { name: 'CYL（柱镜）', body: '这一列是 <b>柱镜（散光度数）</b>：<br>如果这一格是 0 或空白，说明你<b>没有散光</b>，是非常标准的眼球哦😊。有数字的话，就表示有散光需要矫正。' },
            'code-AXIS':{ name: 'A（AXIS 轴位）', body: '这一列是 <b>散光方向（轴位）</b>：<br>只有当 CYL（散光）那一列<b>不是 0</b> 时，这个数字才有意义，告诉配镜师散光"长在哪个角度"～' },
            'code-PD':  { name: 'PD（瞳距）', body: 'PD = 两个瞳孔之间的<b>距离</b>，单位是 <b>毫米（mm）</b>，用来让眼镜的"镜片光心"对准你的瞳孔，像"瞄准靶心"一样🎯！' },
            // 右眼行
            'r-sph':   { name: '右眼 SPH：-2.00', body: '这是<b>右眼的球镜值</b>：<br>前面带<b>「-」</b>，代表是<b>近视</b>。<b>-2.00 = 近视 200 度</b>。看远处的黑板或路牌会有点模糊，需要配 -2.00 的凹透镜（中间薄、两边厚的"缩小镜片"）才能看清！' },
            'r-cyl':   { name: '右眼 CYL：-0.75', body: '这是<b>右眼的散光度数</b>：<b>-0.75 = 散光 75 度</b>。<br>散光比较轻微，大部分人都有一点点，戴上合适镜片看东西就不"重影"啦～' },
            'r-axis':  { name: '右眼 AXIS：180°', body: '这是<b>右眼散光的方向（轴位）</b>：<b>180 度</b>，属于"水平方向"🧭。配镜师会按这个角度把散光镜片放对位置，这样看字就清楚不晃眼了！' },
            // 左眼行
            'l-sph':   { name: '左眼 SPH：-1.50', body: '这是<b>左眼的球镜值</b>：<b>-1.50 = 近视 150 度</b>。<br>比右眼轻 50 度，所以左眼比右眼稍微清楚一点点～两只眼睛度数不一样是<b>非常正常</b>的哦！' },
            'l-cyl':   { name: '左眼 CYL：-0.50', body: '这是<b>左眼的散光度数</b>：<b>-0.50 = 散光 50 度</b>，比右眼更轻微～很多小朋友甚至自己都察觉不到！' },
            'l-axis':  { name: '左眼 AXIS：95°', body: '这是<b>左眼散光的方向（轴位）</b>：<b>95 度</b>，接近"垂直方向"🧭。和右眼 180° 不一样——两只眼睛的轴位<b>本来就可能不同</b>，不用担心！' },
            // PD
            'pd':      { name: 'PD 瞳距：59 mm', body: '<b>瞳距 59 毫米</b>。小学生的 PD 一般在 <b>54~62 mm</b> 之间，随着慢慢长大、脸变宽，PD 也会一年一年变大一点点～<br>这个数字要告诉配镜师，这样眼镜戴起来才<u>不晃眼、不头晕</u>！' }
        };

        /* ---------- 12.4 小侦探游戏 3 题 ---------- */
        var QUIZ = [
            {
                q: '1. 验光单上写着 「SPH -3.00」，它最可能表示什么？',
                options: ['近视 300 度 👓', '远视 300 度 🔭', '散光 300 度 🌀', '视力表看到 3.0'],
                answer: 0,
                good: '答对啦🎉！SPH 是球镜，减号「-」是近视，-3.00 就是大家常说的 300 度近视～',
                bad: '没关系，记下来就好哦😊：SPH 是球镜，减号「-」是近视，加号「+」是远视。-3.00 就是近视 300 度！'
            },
            {
                q: '2. 验光单上写着 「PD 60mm」，最接近下面哪个意思？',
                options: ['眼睛长度 6 厘米', '瞳距 60 毫米 📏', '视力 6.0 满分', '近视 60 度'],
                answer: 1,
                good: '完全正确！💯 PD = Pupillary Distance（瞳距），就是两个瞳孔之间的距离～配眼镜时这个数字非常重要！',
                bad: '让小光仔告诉你吧😘：PD = 瞳距（Pupillary Distance），就是两个瞳孔之间的距离，单位是毫米(mm)，用来"瞄准"镜片的光心～'
            },
            {
                q: '3. 小明的验光单里 CYL 一栏写着 「-1.50」，这表示？',
                options: ['他有 150 度的散光 🌀', '他的视力是 1.5', '他的眼睛特别健康', '他远视 150 度'],
                answer: 0,
                good: '你真是解码小侦探🕵️！CYL 是柱镜，用来矫正散光～CYL -1.50 就是散光 150 度！',
                bad: '再仔细回忆一下💡：<b>CYL = 柱镜 = 散光</b>。所以 CYL -1.50 = 散光 150 度，需要配上有散光部分的镜片才看得清哦～'
            }
        ];
        var TOTAL_QUIZ = QUIZ.length;

        /* ---------- 12.5 小侦探游戏状态 ---------- */
        var st = { idx: 0, stars: 0, answered: false, nextReady: false };

        /* ---------- 12.6 功能1：符号卡片点击 → 弹窗解释 ---------- */
        var itemModal = $('#decoderItemModal');
        var itemIcon  = $('#decoderItemIcon');
        var itemOrder = $('#decoderItemOrder');
        var itemTitle = $('#decoderItemTitle');
        var itemDesc  = $('#decoderItemDesc');
        var itemTip   = $('#decoderItemTip');

        function setItemActive(key) {
            $$('#decoderItemGrid .decoder-item-card').forEach(function (el) {
                el.classList.toggle('active', el.getAttribute('data-item') === key);
            });
        }
        function openItem(key) {
            var it = null;
            for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].key === key) { it = ITEMS[i]; break; }
            if (!it) return;
            setItemActive(key);
            // 🔑 设置弹窗主题色：green / blue / purple / orange / teal
            var theme = it.theme || 'purple';
            itemModal.setAttribute('data-theme', theme);
            itemIcon.textContent = it.icon;
            itemOrder.textContent = it.order;
            itemTitle.textContent = it.title;
            itemDesc.innerHTML = it.desc;
            itemTip.innerHTML = it.tip;
            itemModal.hidden = false;
            itemModal.setAttribute('aria-hidden', 'false');
        }
        function closeItem() {
            itemModal.hidden = true;
            itemModal.setAttribute('aria-hidden', 'true');
            setItemActive(null);
        }
        $$('#decoderItemGrid .decoder-item-card').forEach(function (el) {
            el.addEventListener('click', function () {
                var k = el.getAttribute('data-item');
                if (k) openItem(k);
            });
        });
        // 弹窗关闭（遮罩/×/按钮/ESC）
        itemModal.addEventListener('click', function (e) {
            if (e.target.getAttribute('data-close-modal') === '1') closeItem();
        });
        document.addEventListener('keydown', function (e) {
            if (!itemModal.hidden && e.key === 'Escape') closeItem();
        });

        /* ---------- 12.7 功能2：模拟验光单 数字/代码点击 → 含义小卡 ---------- */
        var cellTip = $('#decoderCellTip');
        var cellName = $('#decoderCellName');
        var cellBody = $('#decoderCellBody');
        function setNumActive(sel) {
            $$('.rx-num, .rx-code-btn').forEach(function (el) { el.classList.remove('active'); });
            if (sel) sel.classList.add('active');
        }
        function showCell(key, triggerEl) {
            var info = CELLS[key];
            if (!info) return;
            setNumActive(triggerEl || null);
            cellName.textContent = info.name;
            cellBody.innerHTML = info.body;
            cellTip.hidden = false;
            // 小光仔气泡更新
            var bubble = $('#decoderGuideBubble');
            if (bubble) {
                bubble.innerHTML = '你刚才点了 <b>' + info.name + '</b><br>下面的黄色小卡片就是它的意思～是不是没那么难？😊<br>继续点其它数字试试，全点过了你就是"验光单小博士"啦！';
            }
            cellTip.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        $$('#decoderPrescription .rx-code-btn').forEach(function (btn) {
            btn.addEventListener('click', function () { showCell('code-' + btn.getAttribute('data-code'), btn); });
        });
        $$('#decoderPrescription .rx-num').forEach(function (btn) {
            btn.addEventListener('click', function () { showCell(btn.getAttribute('data-cell'), btn); });
        });
        $('#decoderCellClose').addEventListener('click', function () {
            cellTip.hidden = true;
            setNumActive(null);
        });

        /* ---------- 12.8 功能3：我是小侦探游戏 ---------- */
        var optWrap = $('#detectiveOptions');
        var qEl = $('#detectiveQuestion');
        var idxEl = $('#detectiveIndex');
        var fbEl = $('#detectiveFeedback');
        var fbInner = $('#detectiveFeedbackInner');
        var nextBtn = $('#detectiveNextBtn');
        var wrap = $('#detectiveWrap');
        var result = $('#detectiveResult');

        function renderQuiz() {
            var q = QUIZ[st.idx];
            st.answered = false;
            st.nextReady = false;
            idxEl.textContent = String(st.idx + 1);
            qEl.textContent = q.q;
            // 顶部星星（当前已获得多少）
            $$('#detectiveStars .star').forEach(function (s, i) {
                s.classList.toggle('filled', i < st.stars);
            });
            // 选项
            optWrap.innerHTML = '';
            var keys = ['A', 'B', 'C', 'D'];
            q.options.forEach(function (txt, i) {
                var b = document.createElement('button');
                b.type = 'button';
                b.className = 'quiz-option';
                b.setAttribute('data-idx', String(i));
                b.innerHTML = '<span class="opt-key">' + keys[i] + '</span>' +
                              '<span class="opt-text">' + txt + '</span>';
                optWrap.appendChild(b);
            });
            // 反馈/按钮重置
            fbEl.hidden = true;
            fbEl.classList.remove('correct', 'wrong');
            nextBtn.disabled = true;
            nextBtn.textContent = (st.idx === TOTAL_QUIZ - 1) ? '🏆 查看解码结果 →' : '下一题 →';
        }
        function chooseOption(i) {
            if (st.answered) return;
            var q = QUIZ[st.idx];
            st.answered = true;
            var options = $$('#detectiveOptions .quiz-option');
            if (options[i]) options[i].classList.add('chosen');
            options.forEach(function (o) { o.disabled = true; });

            var correct = (i === q.answer);
            fbEl.hidden = false;
            // 关键状态立刻更新（避免 150ms 延迟竞态）
            if (correct) {
                st.stars += 1;
                $$('#detectiveStars .star').forEach(function (s, k) {
                    s.classList.toggle('filled', k < st.stars);
                });
                fbEl.className = 'detective-feedback correct';
                fbInner.innerHTML = '✨ <b>' + q.good + '</b>';
                showToast('🌟 答对啦！解码成功 +1 线索星星！');
            } else {
                if (options[q.answer]) options[q.answer].classList.add('correct');
                fbEl.className = 'detective-feedback wrong';
                fbInner.innerHTML = '🌱 <b>' + q.bad + '</b>';
                showToast('💡 没关系，小光仔陪你一起记住！');
            }
            // 延迟 150ms 显示 chosen→correct/wrong 颜色过渡
            setTimeout(function () {
                if (options[i]) {
                    options[i].classList.remove('chosen');
                    options[i].classList.add(correct ? 'correct' : 'wrong');
                }
                st.nextReady = true;
                nextBtn.disabled = false;
            }, 150);
        }
        function goNext() {
            if (!st.nextReady || !st.answered) return;
            if (st.idx >= TOTAL_QUIZ - 1) { finishDetective(); return; }
            st.idx += 1;
            renderQuiz();
        }
        function finishDetective() {
            // 星星数字填入结果
            var sub = $('#detectiveResultSub');
            if (st.stars === TOTAL_QUIZ) {
                sub.textContent = '⭐ 满分！你已经是一位超级「解码小专家」啦，获得 3 颗线索星星！';
                showToast('🏆 3题全对！你真的是验光单解码小专家～');
            } else if (st.stars >= 2) {
                sub.textContent = '👏 太棒了！你获得了 ' + st.stars + ' / 3 颗线索星星！再挑战一次说不定就满分啦！';
                showToast('🎉 挑战完成，你真会解码！');
            } else {
                sub.textContent = '💪 挑战完成！你获得了 ' + st.stars + ' / 3 颗线索星星。再玩一次巩固一下吧！';
                showToast('🌟 你完成了小侦探挑战，真勇敢！');
            }
            // 结果页星星展示
            var resultStars = $('#detectiveResultStars');
            resultStars.innerHTML = '';
            for (var i = 0; i < TOTAL_QUIZ; i++) {
                var s = document.createElement('span');
                s.className = 'star' + (i < st.stars ? '' : ' empty');
                s.textContent = i < st.stars ? '★' : '☆';
                resultStars.appendChild(s);
            }
            wrap.hidden = true;
            result.hidden = false;
            result.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        function restartDetective() {
            st = { idx: 0, stars: 0, answered: false, nextReady: false };
            result.hidden = true;
            wrap.hidden = false;
            renderQuiz();
            $('#detectiveWrap').scrollIntoView({ behavior: 'smooth', block: 'start' });
            showToast('🔄 小侦探已准备好，再来一次吧！');
        }
        // 事件绑定（选项用委托）
        optWrap.addEventListener('click', function (e) {
            var btn = e.target.closest('.quiz-option');
            if (!btn) return;
            var i = Number(btn.getAttribute('data-idx'));
            if (isNaN(i)) return;
            chooseOption(i);
        });
        nextBtn.addEventListener('click', goNext);
        $('#detectiveRestartBtn').addEventListener('click', restartDetective);

        // 初始化渲染第一题
        renderQuiz();

        /* ============================================================
         * 12.9 🔍 验光单解码器核心区（拍照上传 + 双眼6输入 + 快捷符号）
         * ============================================================ */
        (function initDecoderCoreModule() {
            var $photoInput   = $('#decoderPhotoInput');
            var $photoPreview = $('#decoderPhotoPreview');
            var $photoStatus  = $('#decoderPhotoStatus');
            var $recogBtn     = $('#decoderRecognizeBtn');
            var $explainBtn   = $('#decoderExplainBtn');
            var $quickWrap    = document.querySelector('.core-quick-row');
            var $resultWrap   = $('#decoderCoreResult');   // 旧的单符号结果区
            var $resultTitle  = $('#decoderResultTitle');
            var $resultSub    = $('#decoderResultSub');
            var $resultBody   = $('#decoderResultBody');
            var $resultTag    = $('#decoderResultTag');

            // 如果页面没有核心区 DOM（非 decoder 或老版本）则跳过
            if (!$photoInput || !$explainBtn) return;

            // 综合报告容器（每次生成前动态插入 / 复用）
            var $reportWrap = document.getElementById('decoderReportWrap');
            if (!$reportWrap) {
                var div = document.createElement('div');
                div.id = 'decoderReportWrap';
                // 插入到核心区里的免责声明之前（更合适：在结果、免责之前）
                $resultWrap.parentNode.insertBefore(div, $resultWrap);
                $reportWrap = div;
            }

            // 6 个输入框
            var RX_IDS = {
                r: ['rx-r-sph', 'rx-r-cyl', 'rx-r-axis'],
                l: ['rx-l-sph', 'rx-l-cyl', 'rx-l-axis']
            };
            function getRx() {
                var out = {};
                ['r', 'l'].forEach(function (eye) {
                    out[eye] = {
                        sph:   parseFloatSafe(document.getElementById(RX_IDS[eye][0]).value),
                        cyl:   parseFloatSafe(document.getElementById(RX_IDS[eye][1]).value),
                        axis:  parseIntSafe(document.getElementById(RX_IDS[eye][2]).value)
                    };
                });
                return out;
            }
            function parseFloatSafe(v) {
                if (v === null || v === undefined) return null;
                var s = String(v).trim();
                if (s === '' || s === '-') return null;
                var n = Number(s);
                if (!isFinite(n)) return null;
                return n;
            }
            function parseIntSafe(v) {
                if (v === null || v === undefined) return null;
                var s = String(v).trim();
                if (s === '') return null;
                var n = parseInt(s, 10);
                if (!isFinite(n)) return null;
                return n;
            }
            function hasAnyValue(rx) {
                return (rx.r.sph  !== null || rx.r.cyl  !== null || rx.r.axis  !== null ||
                        rx.l.sph  !== null || rx.l.cyl  !== null || rx.l.axis  !== null);
            }

            // 快捷符号解释映射（简短版）
            var QUICK = {
                SPH: {
                    icon: '🔵',
                    title: 'SPH',
                    sub:   '球镜（近视 / 远视）',
                    body:  'SPH 是球镜度数，可以帮助我们了解近视或远视的大致度数。<br>• 前面带<b>「-」号</b>（比如 -2.00）：是<b>近视</b>，看不清远处的黑板或招牌～<br>• 前面带<b>「+」号</b>（比如 +1.50）：是<b>远视</b>，看近处书本比较费力。<br>大家常说的 "100 度" 就相当于 1.00D 哦！'
                },
                CYL: {
                    icon: '🌀',
                    title: 'CYL',
                    sub:   '柱镜（散光度数）',
                    body:  'CYL 是散光值（柱镜）。<br>如果角膜像<b>橄榄球</b>🏈 一样不是正圆，看东西就会有点<b>重影、模糊</b>—— 这就是散光啦！<br>CYL 数字越大（比如 -1.50），散光就越明显。很多小朋友都有一点点散光，配上合适的眼镜就清楚啦！'
                },
                AXIS: {
                    icon: '🧭',
                    title: 'AXIS（A）',
                    sub:   '轴位（散光方向）',
                    body:  'AXIS 是散光的"方向角"🧭，范围是 <b>0° ~ 180°</b>。<br>只有当 CYL（散光）有数字的时候，AXIS 才有意义哦——它告诉配镜师：散光镜片要"对准哪个角度"贴进镜框里，就像拼图对准缺口一样。'
                },
                R: {
                    icon: '👁️',
                    title: 'R（右眼）',
                    sub:   'Right — 右眼',
                    body:  'R = Right = <b>右眼</b> 🫣。<br>验光单上 R 那一整行的数据，全部都是关于<b>右眼</b>的度数哦。医生和配镜师都是<b>先写 R 右眼，再写 L 左眼</b>，两只眼睛"各有一组数据"，不会混在一起。'
                },
                L: {
                    icon: '👁️',
                    title: 'L（左眼）',
                    sub:   'Left — 左眼',
                    body:  'L = Left = <b>左眼</b> 🫢。<br>验光单上 L 那一整行的数据，全部都是关于<b>左眼</b>的度数。两只眼睛的度数<b>常常不一样</b>，这是非常正常的！配镜时左眼和右眼都要"量身定制"。'
                },
                PD: {
                    icon: '📏',
                    title: 'PD',
                    sub:   '瞳距（瞳孔之间的距离）',
                    body:  'PD = 瞳距，就是<b>两个瞳孔中心之间的距离</b>，一般用毫米(mm)来表示，比如 58mm、60mm。<br>为什么它很重要？因为眼镜每片镜片中间都有一个"最清楚的光心"🔎—— 必须刚好对准你的瞳孔，戴起来才不会晕、不会累，就像"瞄准靶心"一样🎯！'
                }
            };

            /* ---------- 通用：显示单符号解释（快捷chip / 单输入解析） ---------- */
            function hideSingleResult() {
                if ($resultWrap) $resultWrap.hidden = true;
            }
            function showSingleResult(info, extraLine) {
                // 隐藏综合报告
                $reportWrap.innerHTML = '';
                $reportWrap.hidden = true;

                $resultTag.textContent   = '小光仔解释结果';
                $resultTitle.textContent = info.title;
                $resultSub.textContent   = info.sub;
                var body = info.body;
                if (extraLine && extraLine.length > 0) {
                    body = body + '<br><br>💡 <b>你输入的数值：</b>' + extraLine;
                }
                $resultBody.innerHTML = body;
                $resultWrap.hidden = false;
                setTimeout(function () {
                    try { $resultWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
                }, 60);
            }

            /* ---------- 度数等级：近视/远视/散光 ---------- */
            function spheroLevel(n) {
                var a = Math.abs(n);
                if (a < 0.01)  return { cls: 'tag-none', txt: '无度数' };
                if (a <= 3.00)  return { cls: 'tag-mild', txt: '轻度' };
                if (a <= 6.00)  return { cls: 'tag-mid',  txt: '中度' };
                return               { cls: 'tag-high', txt: '重度' };
            }
            function cylLevel(n) {
                var a = Math.abs(n);
                if (a < 0.01) return { cls: 'tag-none', txt: '无散光' };
                if (a <= 1.00) return { cls: 'tag-mild', txt: '轻度散光' };
                if (a <= 2.00) return { cls: 'tag-mid',  txt: '中度散光' };
                return              { cls: 'tag-high', txt: '重度散光' };
            }
            function axisValid(n) { return n !== null && n >= 0 && n <= 180; }

            /* ---------- 1. 拍照 / 上传图片：预览 + 状态 ---------- */
            $photoInput.addEventListener('change', function (e) {
                var file = e.target.files && e.target.files[0];
                if (!file) return;

                // 简单文件类型校验（仅限 jpg/png/webp）
                var okType = /^image\/(jpeg|png|webp)$/i.test(file.type);
                if (!okType) {
                    $photoStatus.textContent = '❌ 不支持的图片格式，请上传 JPG / PNG / WEBP 图片';
                    $photoStatus.className = 'core-photo-status is-err';
                    $recogBtn.disabled = true;
                    showToast('⚠️ 只能上传 JPG、PNG 或 WEBP 哦～');
                    return;
                }
                // 大小限制 10MB
                if (file.size > 10 * 1024 * 1024) {
                    $photoStatus.textContent = '❌ 图片太大了（超过 10MB），请换一张小一点的～';
                    $photoStatus.className = 'core-photo-status is-err';
                    $recogBtn.disabled = true;
                    showToast('📷 图片要 ≤ 10MB 哦');
                    return;
                }

                $photoPreview.innerHTML = '';
                var reader = new FileReader();
                reader.onload = function (ev) {
                    var img = document.createElement('img');
                    img.src = ev.target.result;
                    img.alt = '验光单预览';
                    img.className = 'preview-img';
                    $photoPreview.appendChild(img);

                    $photoStatus.textContent = '✅ 已选择图片：' +
                        (file.name.length > 18 ? file.name.slice(0, 16) + '…' : file.name) +
                        '（' + Math.round(file.size / 1024) + ' KB）';
                    $photoStatus.className = 'core-photo-status is-ok';
                    $recogBtn.disabled = false;
                };
                reader.onerror = function () {
                    $photoStatus.textContent = '❌ 图片读取失败，请换一张～';
                    $photoStatus.className = 'core-photo-status is-err';
                    $recogBtn.disabled = true;
                };
                reader.readAsDataURL(file);
            });

            /* ---------- 2. 开始识别按钮：诚实提示（不接入OCR） ---------- */
            $recogBtn.addEventListener('click', function () {
                if ($recogBtn.disabled) return;
                var origText = $recogBtn.textContent;
                $recogBtn.disabled = true;
                $recogBtn.textContent = '⏳ 正在识别中…';

                setTimeout(function () {
                    $recogBtn.disabled = false;
                    $recogBtn.textContent = origText;
                    // 诚实提示：不伪造成功，也显示报告提示引导手动
                    $photoStatus.textContent = '💡 图片识别功能演示模式';
                    $photoStatus.className = 'core-photo-status';

                    // 显示诚实失败提示 + 引导用户用手动输入
                    showPhotoFailReport();
                    showToast('🔍 图片OCR尚未接入，请使用右侧"手动输入"来获得解释～');
                }, 1500);
            });

            function showPhotoFailReport() {
                hideSingleResult();
                $reportWrap.hidden = false;
                $reportWrap.innerHTML =
                    '<div class="decoder-report-wrap">' +
                      '<div class="decoder-report-head">' +
                        '<div class="decoder-report-xgz"><img src="assets/images/xiaoguangzi-new.png" alt="小光仔"></div>' +
                        '<div>' +
                          '<span class="decoder-report-tag">识别提示</span>' +
                          '<h4 class="decoder-report-title">图片暂时无法自动识别</h4>' +
                          '<p class="decoder-report-sub">小光仔还在学习 OCR 本领，目前无法直接从图片里读出数字哦～</p>' +
                        '</div>' +
                      '</div>' +
                      '<div class="decoder-report-empty">' +
                        '<span class="empty-icon">🖼️ → ✏️</span>' +
                        '请检查图片是否清晰完整，或使用右侧 <b>「手动输入验光数据」</b>，小光仔会立刻帮你解释清楚哦！' +
                      '</div>' +
                      '<div class="decoder-report-summary">' +
                        '<h5>💡 小光仔建议</h5>' +
                        '<ul>' +
                          '<li>拍照时请让<b>验光单平铺在桌面上</b>，避免倾斜或阴影；</li>' +
                          '<li>确保<b>数字和字母都清晰可读</b>，不要反光、不要糊；</li>' +
                          '<li>如果赶时间，直接填右边的右眼 / 左眼三格数据吧，一样能得到完整解释！</li>' +
                        '</ul>' +
                      '</div>' +
                    '</div>';
                setTimeout(function () {
                    try { $reportWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
                }, 60);
            }

            /* ---------- 3. ✨ 开始解释：双眼6输入综合报告 ---------- */
            $explainBtn.addEventListener('click', function () {
                var rx = getRx();
                if (!hasAnyValue(rx)) {
                    // 6 个都空 → 提示
                    $reportWrap.hidden = false;
                    $reportWrap.innerHTML =
                        '<div class="decoder-report-wrap">' +
                          '<div class="decoder-report-head">' +
                            '<div class="decoder-report-xgz"><img src="assets/images/xiaoguangzi-new.png" alt="小光仔"></div>' +
                            '<div>' +
                              '<span class="decoder-report-tag">请先填一下～</span>' +
                              '<h4 class="decoder-report-title">还没有填任何数字哦！</h4>' +
                              '<p class="decoder-report-sub">在右眼 / 左眼填入任意一项度数，小光仔就能开始解释啦！</p>' +
                            '</div>' +
                          '</div>' +
                          '<div class="decoder-report-empty">' +
                            '<span class="empty-icon">✏️</span>' +
                            '例如：右眼 SPH -2.00、CYL -0.75、AXIS 180，这样小光仔就能看懂啦～' +
                          '</div>' +
                        '</div>';
                    hideSingleResult();
                    showToast('😉 先填一个或多个度数数字再开始解释哦～');
                    setTimeout(function () {
                        try { $reportWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
                    }, 60);
                    return;
                }
                renderFullReport(rx);
            });

            function formatNum(n, decimals) {
                if (n === null) return '—';
                var fixed = Number(n).toFixed(decimals || 2);
                // 正数补 + 号
                if (n > 0) fixed = '+' + fixed;
                return fixed;
            }
            function formatAxis(n) {
                if (n === null) return '—';
                return n + '°';
            }

            function eyeBlock(eyeKey, eyeName, emoji, data) {
                var sph  = data.sph, cyl = data.cyl, axis = data.axis;
                var hasS = sph !== null, hasC = cyl !== null, hasA = axis !== null;
                var sLvl = hasS ? spheroLevel(sph) : null;
                var cLvl = hasC ? cylLevel(cyl) : null;

                var aTip = '';
                if (hasC && !hasA)      aTip = '<span class="report-val-tag tag-mid">缺轴位建议补充</span>';
                else if (hasC && hasA)  aTip = axisValid(axis)
                    ? '<span class="report-val-tag tag-mild">轴位正常</span>'
                    : '<span class="report-val-tag tag-high">轴位需0~180</span>';
                else if (hasA && !hasC) aTip = '<span class="report-val-tag tag-none">无散光,轴位可忽略</span>';

                var sphRow =
                    '<div class="report-row' + (hasS ? '' : ' empty') + '">' +
                      '<span class="report-row-label">SPH <small>球镜</small></span>' +
                      '<span class="report-row-value">' +
                        '<span class="report-val-num">' + (hasS ? formatNum(sph, 2) : '未填') + '</span>' +
                        (sLvl ? '<span class="report-val-tag ' + sLvl.cls + '">' + sLvl.txt + '</span>' : '') +
                      '</span>' +
                    '</div>';
                var cylRow =
                    '<div class="report-row' + (hasC ? '' : ' empty') + '">' +
                      '<span class="report-row-label">CYL <small>柱镜</small></span>' +
                      '<span class="report-row-value">' +
                        '<span class="report-val-num">' + (hasC ? formatNum(cyl, 2) : '未填') + '</span>' +
                        (cLvl ? '<span class="report-val-tag ' + cLvl.cls + '">' + cLvl.txt + '</span>' : '') +
                      '</span>' +
                    '</div>';
                var axisRow =
                    '<div class="report-row' + (hasA ? '' : ' empty') + '">' +
                      '<span class="report-row-label">AXIS <small>轴位</small></span>' +
                      '<span class="report-row-value">' +
                        '<span class="report-val-num">' + (hasA ? formatAxis(axis) : '未填') + '</span>' +
                        aTip +
                      '</span>' +
                    '</div>';

                return (
                    '<div class="decoder-report-eye ' + (eyeKey === 'r' ? 'eye-r' : 'eye-l') + '">' +
                      '<div class="report-eye-head">' +
                        '<span class="report-eye-emoji">' + (eyeKey === 'r' ? 'R' : 'L') + '</span>' +
                        '<span class="report-eye-name">' + emoji + ' ' + eyeName + '</span>' +
                      '</div>' +
                      sphRow + cylRow + axisRow +
                    '</div>'
                );
            }

            function summarize(rx) {
                var lines = [];
                var tips = [];
                var warn = false;

                function summarizeEye(eyeKey, eyeName, d) {
                    var local = [];
                    if (d.sph !== null) {
                        var sign = d.sph < 0 ? '近视' : (d.sph > 0 ? '远视' : '标准平光');
                        var deg  = Math.round(Math.abs(d.sph) * 100);
                        if (deg > 0) {
                            local.push('<b>' + eyeName + ' SPH ' + sign + ' ' + deg + ' 度</b>（' + formatNum(d.sph, 2) + '）');
                            if (d.sph < -3) warn = true;
                        } else {
                            local.push('<b>' + eyeName + ' SPH = 0</b>（没有近视/远视度数）');
                        }
                    }
                    if (d.cyl !== null) {
                        var d2 = Math.round(Math.abs(d.cyl) * 100);
                        if (d2 > 0) {
                            local.push('<b>' + eyeName + ' 散光 ' + d2 + ' 度</b>（CYL ' + formatNum(d.cyl, 2) + '）');
                            if (Math.abs(d.cyl) > 1.5) warn = true;
                        } else {
                            local.push('<b>' + eyeName + ' 没有散光</b>，眼球圆圆的很棒！');
                        }
                        if (d.cyl !== 0 && d.axis === null) {
                            tips.push(eyeName + '有散光度数，但<b>没有填写 AXIS 轴位</b>——正式配镜时一定要有哦！');
                            warn = true;
                        } else if (d.axis !== null && !axisValid(d.axis)) {
                            tips.push(eyeName + '的 AXIS 轴位 ' + d.axis + '° 不在 0~180° 范围内，请确认一下～');
                            warn = true;
                        }
                    } else if (d.axis !== null) {
                        tips.push(eyeName + '填了 AXIS，但没有 CYL 散光值：' +
                            '如果医生没有写 CYL，就表示<b>没有散光</b>，这时候轴位可以不填～');
                    }
                    return local;
                }

                lines = lines.concat(summarizeEye('r', '🫣 右眼', rx.r));
                lines = lines.concat(summarizeEye('l', '🫢 左眼', rx.l));

                // 两只眼对比：差异大
                if (rx.r.sph !== null && rx.l.sph !== null) {
                    var diff = Math.abs(rx.r.sph - rx.l.sph);
                    if (diff >= 2) {
                        tips.push('两眼 SPH 球镜度数相差 <b>' + (diff * 100).toFixed(0) + ' 度</b>，属于"屈光参差"—— 这种情况戴眼镜会比较累，建议和医生/配镜师讨论一下～');
                        warn = true;
                    }
                }

                // 通用护眼建议
                var anyMyopia  = (rx.r.sph !== null && rx.r.sph < 0) || (rx.l.sph !== null && rx.l.sph < 0);
                var anyAstig   = (rx.r.cyl !== null && Math.abs(rx.r.cyl) > 0) || (rx.l.cyl !== null && Math.abs(rx.l.cyl) > 0);
                var anyHigh    = (rx.r.sph !== null && Math.abs(rx.r.sph) > 3) || (rx.l.sph !== null && Math.abs(rx.l.sph) > 3);

                if (lines.length === 0) {
                    return { head: '', lines: [], tips: [], warn: false, anyMyopia: false, anyAstig: false, anyHigh: false };
                }
                return {
                    head:      '👓 简单解释',
                    lines:     lines,
                    tips:      tips,
                    warn:      warn,
                    anyMyopia: anyMyopia,
                    anyAstig:  anyAstig,
                    anyHigh:   anyHigh
                };
            }

            function renderFullReport(rx) {
                hideSingleResult();

                var leftBlock  = eyeBlock('r', '右眼', '🫣', rx.r);
                var rightBlock = eyeBlock('l', '左眼', '🫢', rx.l);
                var s = summarize(rx);

                var summaryHTML = '';
                if (s.lines.length > 0) {
                    summaryHTML = '<div class="decoder-report-summary">' +
                        '<h5>' + s.head + '</h5>' +
                        '<ul>' + s.lines.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul>';

                    if (s.tips.length > 0) {
                        summaryHTML += '<div class="' + (s.warn ? 'warn-tip' : 'green-tip') + '">' +
                            '🧐 <b>小光仔特别提醒：</b><ul>' +
                            s.tips.map(function (t) { return '<li>' + t + '</li>'; }).join('') +
                            '</ul></div>';
                    }

                    var tipMsg = s.anyMyopia
                        ? '户外 2 小时 + 20-20-20 法则 + 远离长时间近距离用眼，能帮近视小眼镜"慢一点加深"哦！'
                        : s.anyAstig
                            ? '一点点散光不要怕！定期复查看有没有变化就好啦。'
                            : '平时也要记得少看屏幕，每用眼 20 分钟就向 20 英尺(6米)外看 20 秒哦！';
                    summaryHTML += '<div class="' + (s.anyHigh ? 'warn-tip' : 'green-tip') + '">' +
                        '🌳 <b>护眼小贴士：</b>' + tipMsg + '</div>';

                    summaryHTML += '</div>';
                }

                $reportWrap.hidden = false;
                $reportWrap.innerHTML =
                    '<div class="decoder-report-wrap">' +
                      '<div class="decoder-report-head">' +
                        '<div class="decoder-report-xgz"><img src="assets/images/xiaoguangzi-new.png" alt="小光仔"></div>' +
                        '<div>' +
                          '<span class="decoder-report-tag">小光仔解释报告</span>' +
                          '<h4 class="decoder-report-title">你的验光数据小报告</h4>' +
                          '<p class="decoder-report-sub">这是给小朋友看的趣味解释，正式配镜请以医生/验光师为准哦～</p>' +
                        '</div>' +
                      '</div>' +
                      '<div class="decoder-report-grid">' + leftBlock + rightBlock + '</div>' +
                      summaryHTML +
                    '</div>';
                setTimeout(function () {
                    try { $reportWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
                }, 60);
            }

            /* ---------- 4. 常用符号快捷按钮（保留单符号解释能力） ---------- */
            if ($quickWrap) {
                $quickWrap.addEventListener('click', function (e) {
                    var chip = e.target.closest('.core-quick-chip');
                    if (!chip) return;
                    var key = chip.getAttribute('data-quick');
                    var info = QUICK[key];
                    if (!info) return;
                    // 清空综合报告
                    $reportWrap.innerHTML = '';
                    $reportWrap.hidden = true;
                    showSingleResult(info, null);
                });
            }

        })();

    })();


    // ============================================
    // 13. eye-test.html / adventure.html "开始按钮" 占位提示
    // ============================================
    (function initDemoStartBtns() {
        var startBtn = document.getElementById('demo-start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', function () {
                var msg = startBtn.getAttribute('data-toast') || '✨ 功能模块正在开发中～';
                showToast(msg);
            });
        }
    })();


    // ============================================
    // 14. 页面加载完成后，欢迎语 Toast（首页显示友好欢迎）
    // ============================================
    setTimeout(function () {
        var filename = window.location.pathname.split('/').pop().toLowerCase();
        if (filename === '' || filename === 'index.html') {
            showToast('🌟 欢迎来到瞳学星球！');
        }
    }, 500);


    // ============================================
    // 15. 眼球大冒险（adventure.html）三阶段互动主逻辑
    //     · 5 个眼睛部位科普（点热点/形状/标签弹出说明）
    //     · 4 道护眼小挑战选择题（对=星星+鼓励，错=温柔解释）
    //     · 冒险完成页（再玩一次 / 返回首页）
    // ============================================
    (function initAdventurePage() {
        // 仅在 adventure.html 生效
        var filename = (window.location.pathname.split('/').pop() || '').toLowerCase();
        if (filename !== 'adventure.html') return;

        /* ---------- 15.1 数据：5 个部位（儿童易懂语言） ---------- */
        var PARTS = [
            {
                key: 'cornea',
                order: 1,
                name: '角膜',
                subtitle: '眼睛的透明小窗口',
                icon: '🪟',
                desc: '角膜是眼睛最外面透明的小窗口，就像相机的镜头一样，帮助我们看清这个世界！',
                tip: '角膜需要保持健康，平时不要用脏手揉眼睛哦！'
            },
            {
                key: 'pupil',
                order: 2,
                name: '瞳孔',
                subtitle: '会变大变小的光圈',
                icon: '⚫',
                desc: '瞳孔就是我们在眼睛中间看到的那个小黑点。它其实是「光线的入口」，就像相机的光圈：亮的地方它会变小（怕闪到眼睛），暗的地方它会变大（要吸收更多光）。',
                tip: '下一次你可以对着镜子做个小实验：先打开房间大灯看看瞳孔大小，再关掉灯等一会儿，你会发现瞳孔"长大"啦！'
            },
            {
                key: 'lens',
                order: 3,
                name: '晶状体',
                subtitle: '自动调焦的放大镜',
                icon: '🔍',
                desc: '晶状体在瞳孔后面，像一个会变胖变扁的「自动放大镜」。看远处的时候它会扁扁的，看近处的时候它会变得鼓鼓的。这样不管是黑板、书本还是天上的飞机，我们都能看得清清楚楚。',
                tip: '如果一直盯着近处（比如手机、书）太久，晶状体会"累得鼓不回去"，慢慢就看不清远处了——这就是近视！所以每看20分钟要休息一下。'
            },
            {
                key: 'retina',
                order: 4,
                name: '视网膜',
                subtitle: '眼睛里的白色大银幕',
                icon: '🎬',
                desc: '视网膜在眼睛的后壁上，像电影院的「白色大银幕」。角膜、晶状体把光线聚焦好之后，就会在这里投射出一幅清晰的画，然后由千千万万的小细胞把画面"读"出来。',
                tip: '维生素 A 和叶黄素对视网膜特别友好：胡萝卜、南瓜、菠菜、玉米、蛋黄都是"护眼好食材"。小朋友不要挑食哦～'
            },
            {
                key: 'nerve',
                order: 5,
                name: '视神经',
                subtitle: '通往大脑的快递光缆',
                icon: '📡',
                desc: '视神经就像一根高速「快递光缆」，把视网膜上看到的画面，用电信号的方式飞快地送到大脑里的"视觉中心"。大脑一收到就立刻告诉我们：「哦！这是小狗、那是彩虹！」',
                tip: '睡眠对视神经特别重要！小学生每天要睡够 9~11 小时，大脑和视神经休息好了，第二天看什么都特别清楚。'
            }
        ];

        /* ---------- 15.2 数据：4 道护眼小挑战（选择题） ---------- */
        var QUIZ = [
            {
                q: '1. 我们看到远处的东西和近处的东西，主要靠眼睛里的谁变胖变扁来「调焦」？',
                options: [
                    '晶状体（调焦放大镜）',
                    '视网膜（投影银幕）',
                    '瞳孔（会变的光圈）',
                    '视神经（光缆快递员）'
                ],
                answer: 0,   // A
                good: '答对啦！晶状体就像一个「自动放大镜」，看远就扁、看近就鼓～',
                bad: '没关系！再想想：看东西时「调焦」的是会变胖变扁的放大镜——它就是晶状体哦！'
            },
            {
                q: '2. 每用眼一段时间就要休息，最著名的「护眼 20-20-20 法则」是指？',
                options: [
                    '每用眼 20 分钟，看 20 英尺（约 6 米）外 20 秒',
                    '每天必须玩 20 分钟手机',
                    '每 20 秒眨 20 下眼睛',
                    '考试前要连续学习 20 小时'
                ],
                answer: 0,
                good: '完美！20-20-20 法则是全世界眼科医生都推荐的护眼小秘诀，记得告诉同学！',
                bad: '小光仔来告诉你：每用眼 20 分钟，就抬头看 6 米（20 英尺）外的远方 20 秒，给眼睛充充电～'
            },
            {
                q: '3. 下面哪种做法对眼睛不健康？',
                options: [
                    '每天户外活动 2 小时晒太阳',
                    '胡萝卜、菠菜、蛋黄都不挑食',
                    '晚上关灯躺床上看手机',
                    '每看书一节课就远眺放松'
                ],
                answer: 2,
                good: '你真棒！关灯看手机又暗又近，眼睛会超级累——可千万别这样！',
                bad: '没关系，记下来就好啦：关灯后还躺着看手机，会让眼睛又干又累，是所有选项里「最伤眼」的做法。'
            },
            {
                q: '4. 我们在眼睛后壁上看到画面的「电影银幕」，它的名字是？',
                options: ['角膜', '瞳孔', '视网膜', '睫毛'],
                answer: 2,
                good: '没错！视网膜是眼睛后面的大银幕，晶状体把画面投影在这里～',
                bad: '小光仔提示：想一下"电影院里的银幕"装在眼睛最后面——那就是 视网膜 啦！'
            }
        ];

        /* ---------- 15.3 全局状态 ---------- */
        var state = {
            partsDone: {},          // { cornea: true, ... }
            partsCount: 0,
            quizIdx: 0,             // 当前第几题（0-based）
            quizStars: 0,           // 答对几题
            answered: false,        // 这道题是否已选答案（防止反复选）
            chosenIdx: -1
        };
        var TOTAL_PARTS = PARTS.length;
        var TOTAL_QUIZ = QUIZ.length;

        /* ---------- 15.4 DOM 工具 ---------- */
        var $  = function (sel, root) { return (root || document).querySelector(sel); };
        var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

        /* ---------- 15.5 阶段切换 + 步数进度条 ---------- */
        function goStage(stage) {
            $$('.adv-stage').forEach(function (el) {
                el.classList.toggle('active', el.getAttribute('data-stage') === String(stage));
            });
            // 更新 stepper
            $$('#advStepper .adv-step').forEach(function (el) {
                var n = Number(el.getAttribute('data-step'));
                el.classList.remove('active', 'done');
                if (n < stage) el.classList.add('done');
                if (n === stage) el.classList.add('active');
            });
            $$('#advStepper .adv-step-line').forEach(function (el, i) {
                // 0: 第一与第二段之间，当>1时passed
                // 1: 第二与第三段之间，当>2时passed
                if ((i === 0 && stage > 1) || (i === 1 && stage > 2)) el.classList.add('passed');
                else el.classList.remove('passed');
            });
            // 滚动到顶部内容区
            try {
                var banner = $('.subpage-banner');
                if (banner) banner.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (e) { /* 不支持也无所谓 */ }
        }

        /* ---------- 15.6 部位探索：点击 → 高亮 + 弹窗 ---------- */
        var modal      = $('#advPartModal');
        var modalTitle = $('#advPartTitle');
        var modalSub   = $('#advPartSubtitle');
        var modalNum   = $('#advPartNum');
        var modalIcon  = $('#advPartIcon');
        var modalDesc  = $('#advPartDesc');
        var modalTipText = $('#advPartTipText');
        var modalNext  = $('#advPartNextBtn');
        var curPartKey = null;

        function getPart(key) {
            for (var i = 0; i < PARTS.length; i++) if (PARTS[i].key === key) return PARTS[i];
            return null;
        }
        function setPartActive(key) {
            $$('.eye-hotspot, .part-tag, .eye-part-shape').forEach(function (el) {
                el.classList.remove('active');
            });
            if (!key) return;
            $$('.eye-hotspot[data-part="' + key + '"], ' +
               '.part-tag[data-part="' + key + '"], ' +
               '.eye-part-shape[data-part="' + key + '"]').forEach(function (el) {
                el.classList.add('active');
            });
        }
        function openPart(key) {
            var p = getPart(key);
            if (!p) return;
            curPartKey = key;
            setPartActive(key);
            modalTitle.textContent = p.name;
            if (modalSub) {
                if (p.subtitle && p.subtitle.length > 0) {
                    modalSub.textContent = p.subtitle;
                    modalSub.style.display = '';
                } else {
                    modalSub.textContent = '';
                    modalSub.style.display = 'none';
                }
            }
            modalNum.textContent   = '第 ' + p.order + ' 站';
            // 用真实 PNG 代替 emoji
            var ICON_MAP = {
                cornea:  'island-eye.png',
                pupil:   'character-happy.png',
                lens:    'flask.png',
                retina:  'island-rumor.png',
                nerve:   'spaceship.png'
            };
            var iconFile = ICON_MAP[key] || 'island-eye.png';
            modalIcon.innerHTML = '<img class="ad-icon ad-icon--contain" src="assets/images/vision/' + iconFile + '" alt="' + p.name + '">';
            modalDesc.textContent  = p.desc;
            if (modalTipText) modalTipText.textContent = p.tip;
            // 下一个按钮文字：若当前是最后一个 → 完成并开始挑战
            var isLast = p.order === TOTAL_PARTS;
            var notDoneCount = TOTAL_PARTS - state.partsCount - (state.partsDone[key] ? 0 : 1);
            // 如果所有都探索完 → 按钮文案提示进入挑战
            modalNext.innerHTML = isLast
                ? '<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/treasure.png" alt="完成"> 完成！去做护眼小挑战 →'
                : (notDoneCount > 0 ? '我知道啦，继续探索 →' : '我知道啦，去挑战 →');
            modal.hidden = false;
            modal.setAttribute('aria-hidden', 'false');
        }
        function closePart() {
            modal.hidden = true;
            modal.setAttribute('aria-hidden', 'true');
            setPartActive(null);
        }
        function markPartDone(key) {
            if (state.partsDone[key]) return;
            state.partsDone[key] = true;
            state.partsCount += 1;
            // 样式
            $$('.eye-hotspot[data-part="' + key + '"], ' +
               '.part-tag[data-part="' + key + '"], ' +
               '.eye-part-shape[data-part="' + key + '"]').forEach(function (el) {
                el.classList.add('done');
            });
            // 进度条
            $('#advProgressText').textContent = state.partsCount + ' / ' + TOTAL_PARTS;
            $('#advProgressFill').style.width = (state.partsCount / TOTAL_PARTS * 100).toFixed(1) + '%';
            // 小光仔更新引导气泡
            var bubble = $('#advGuideBubble');
            if (state.partsCount < TOTAL_PARTS) {
                bubble.innerHTML =
                    '好棒！又认识了一个新伙伴～<br>还剩 <b>' + (TOTAL_PARTS - state.partsCount) + '</b> 个部位，加油！<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/star-small.png" alt="✨">';
            } else {
                bubble.innerHTML =
                    '<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/character-happy.png" alt="🎉"> 你已经认识了全部 <b>5 个眼睛小伙伴</b>！<br>点击下方按钮，和我一起进入 <b>护眼知识小挑战</b> 吧～';
            }
            // 解锁下一步
            var btn = $('#advGoQuizBtn');
            if (state.partsCount >= TOTAL_PARTS) {
                btn.disabled = false;
                btn.innerHTML = '<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/rocket.png" alt="🚀"> 完成结构探索！进入知识小挑战 →';
            }
        }

        /* ---------- 15.7 小挑战：题目渲染 + 判分 ---------- */
        function renderQuiz() {
            var q = QUIZ[state.quizIdx];
            state.answered = false;
            state.chosenIdx = -1;
            state.nextReady = false;      // 防止未作答就点「下一题」
            $('#quizIndex').textContent = String(state.quizIdx + 1);
            $('#quizQuestion').textContent = q.q;
            // 星星（已经获得的点亮）
            $$('#quizStars .star').forEach(function (s, i) {
                s.classList.toggle('filled', i < state.quizStars);
            });
            // 选项
            var optWrap = $('#quizOptions');
            optWrap.innerHTML = '';
            var keys = ['A', 'B', 'C', 'D'];
            q.options.forEach(function (text, i) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'quiz-option';
                btn.setAttribute('data-idx', String(i));
                btn.innerHTML =
                    '<span class="opt-key">' + keys[i] + '</span>' +
                    '<span class="opt-text">' + text + '</span>';
                optWrap.appendChild(btn);
            });
            // 反馈 + 下一题重置
            var fb = $('#quizFeedback');
            fb.hidden = true;
            fb.classList.remove('correct', 'wrong');
            var nextBtn = $('#quizNextBtn');
            nextBtn.disabled = true;
            nextBtn.innerHTML = (state.quizIdx === TOTAL_QUIZ - 1)
                ? '<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/treasure.png" alt="🏆"> 查看冒险结果 →'
                : '下一题 →';
        }
        function chooseOption(idx) {
            if (state.answered) return;
            var q = QUIZ[state.quizIdx];
            state.answered = true;
            state.chosenIdx = idx;
            var options = $$('#quizOptions .quiz-option');
            // 先给用户选的打 chosen（短暂高亮，表示"收到你的选择"）
            if (options[idx]) options[idx].classList.add('chosen');
            // 禁止再点
            options.forEach(function (o) { o.disabled = true; });
            var correct = (idx === q.answer);
            // 关键状态立刻更新（不要放进 setTimeout，防止用户快速切题导致星星漏计）
            var fb = $('#quizFeedback');
            var inner = $('#quizFeedbackInner');
            fb.hidden = false;
            var nextBtn = $('#quizNextBtn');
            var guide = $('#advQuizGuide');
            if (correct) {
                state.quizStars += 1;
                $$('#quizStars .star').forEach(function (s, i) {
                    s.classList.toggle('filled', i < state.quizStars);
                });
                fb.className = 'quiz-feedback correct';
                inner.innerHTML = '<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/star-small.png" alt="✨"> <b>' + q.good + '</b>';
                showToast('<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/star-big.png" alt="🌟"> 答对啦，加一颗星星！');
            } else {
                // 正确答案标出绿色
                if (options[q.answer]) options[q.answer].classList.add('correct');
                fb.className = 'quiz-feedback wrong';
                inner.innerHTML = '<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/moss.png" alt="🌱"> <b>' + q.bad + '</b>';
                showToast('<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/play-btn.png" alt="💡"> 没关系～我们一起学习！');
            }
            // 150ms 之后把 chosen 换成正确/错误的颜色样式（给孩子"选择被确认"的过渡感）
            setTimeout(function () {
                if (options[idx]) {
                    options[idx].classList.remove('chosen');
                    options[idx].classList.add(correct ? 'correct' : 'wrong');
                }
                // 更新挑战向导气泡
                if (state.quizIdx < TOTAL_QUIZ - 1) {
                    guide.innerHTML = correct
                        ? '真厉害！<br>准备好下一题了吗？👇 点「下一题 →」继续'
                        : '这题错啦，不过没关系！<br>小光仔已经告诉你正确答案，再看一遍就记住啦 <img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/character-happy.png" alt="😊">';
                } else {
                    guide.innerHTML = '最后一题也做完啦～<br>点 <b><img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/treasure.png" alt="🏆"> 查看冒险结果 →</b>，看看你的护眼成绩吧！';
                }
                // 启用下一题 / 完成按钮（放在最后，保证一切就绪才可用）
                state.nextReady = true;
                nextBtn.disabled = false;
            }, 150);
        }
        function goNextQuiz() {
            // 如果用户还没选答案 or 状态还没就绪，防止"空题"前进
            if (!state.nextReady || !state.answered) return;
            // 如果是最后一题 → 进入完成页
            if (state.quizIdx >= TOTAL_QUIZ - 1) {
                finishGame();
                return;
            }
            state.quizIdx += 1;
            renderQuiz();
        }
        function finishGame() {
            // 星星数（数字）填入完成页
            $('#advStarCount').textContent = String(state.quizStars);
            var sub = $('#advFinishSub');
            if (state.quizStars === TOTAL_QUIZ) {
                sub.innerHTML = '<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/star-big.png" alt="⭐"> 满分！你已经是一位超级「护眼小专家」啦～';
                showToast('<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/treasure.png" alt="🏆"> 全对！你真的是护眼小专家～');
            } else if (state.quizStars >= 2) {
                sub.innerHTML = '<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/character-happy.png" alt="👏"> 太棒了！你已经掌握了超多护眼知识，继续加油～';
                showToast('<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/spaceship.png" alt="🎉"> 冒险完成，你真优秀！');
            } else {
                sub.innerHTML = '<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/ice.png" alt="💪"> 冒险完成！知识需要慢慢记，下次再挑战就能得更多星星啦～';
                showToast('<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/star-big.png" alt="🌟"> 你完成了冒险，真勇敢！');
            }
            goStage(3);
        }

        /* ---------- 15.8 再玩一次 / 返回首页 ---------- */
        function restartAll() {
            // 重置状态
            state = { partsDone: {}, partsCount: 0, quizIdx: 0, quizStars: 0, answered: false, chosenIdx: -1 };
            // 重置所有完成样式
            $$('.eye-hotspot, .part-tag, .eye-part-shape').forEach(function (el) {
                el.classList.remove('done', 'active');
            });
            // 进度条、按钮
            $('#advProgressText').textContent = '0 / ' + TOTAL_PARTS;
            $('#advProgressFill').style.width = '0%';
            var btn = $('#advGoQuizBtn');
            btn.disabled = true;
            btn.innerHTML = '<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/ice.png" alt="锁定"> 先完成 5 个部位的探索哦～';
            // 小光仔气泡
            $('#advGuideBubble').innerHTML =
                '嗨！我是小光仔～<br>下面是一只大大的眼睛剖面图！<br>点击 <b>5 个发光小圆圈</b>，让我们从「角膜」开始，一个一个认识它们吧！';
            $('#advQuizGuide').innerHTML =
                '哇～结构探索完成，你真棒！<br>现在来挑战 <b>4 道护眼小题目</b>，答对有星星<img class="ad-icon ad-icon--contain ad-icon--xxs" src="assets/images/vision/star-small.png" alt="✨">，答错也没关系，我会告诉你答案～';
            // 重新渲染第一题
            renderQuiz();
            // 回到阶段 1
            goStage(1);
            showToast('🔄 游戏已重置，再来一次吧！');
        }

        /* ---------- 15.9 绑定事件 ---------- */
        // 部位热点 / 文字标签 / SVG 形状：三种入口都能点开
        $$('.eye-hotspot, .part-tag, .eye-part-shape').forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                var key = el.getAttribute('data-part');
                if (key) openPart(key);
            });
        });
        // 弹窗关闭（遮罩 / × / ESC / 点到弹窗背景本身）
        modal.addEventListener('click', function (e) {
            if (e.target === modal) { closePart(); return; }
            var attr = null;
            try { attr = e.target.getAttribute && e.target.getAttribute('data-close-modal'); } catch (err) {}
            if (attr === '1') closePart();
        });
        document.addEventListener('keydown', function (e) {
            if (!modal.hidden && e.key === 'Escape') closePart();
        });
        // 弹窗里"下一个/我知道啦"
        modalNext.addEventListener('click', function () {
            var key = curPartKey;
            if (key) markPartDone(key);
            // 如果还有未探索的，按顺序自动跳到下一站（给孩子顺畅的旅行感）
            var curOrder = 0;
            for (var i = 0; i < PARTS.length; i++) if (PARTS[i].key === key) { curOrder = PARTS[i].order; }
            closePart();
            // 找下一个未探索
            var next = null;
            for (var o = curOrder + 1; o <= TOTAL_PARTS; o++) {
                for (var j = 0; j < PARTS.length; j++) if (PARTS[j].order === o && !state.partsDone[PARTS[j].key]) { next = PARTS[j]; break; }
                if (next) break;
            }
            if (!next) {
                // 从头找一个未探索（防止乱序）
                for (var k = 0; k < PARTS.length; k++) if (!state.partsDone[PARTS[k].key]) { next = PARTS[k]; break; }
            }
            if (state.partsCount >= TOTAL_PARTS) {
                // 全部探索完 → 不自动弹窗，提示点按钮
                showToast('✅ 5 个部位全部探索完！点下方按钮去挑战～');
            } else if (next) {
                setTimeout(function () { openPart(next.key); }, 200);
            }
        });

        // 阶段 1 → 阶段 2（进入挑战）
        $('#advGoQuizBtn').addEventListener('click', function () {
            if (state.partsCount < TOTAL_PARTS) return;
            renderQuiz();
            goStage(2);
            showToast('📚 护眼知识小挑战，开始！');
        });

        // 选项点击（事件委托，防止重绘丢失绑定）
        $('#quizOptions').addEventListener('click', function (e) {
            var btn = e.target.closest('.quiz-option');
            if (!btn) return;
            var idx = Number(btn.getAttribute('data-idx'));
            if (isNaN(idx)) return;
            chooseOption(idx);
        });

        // 下一题 / 完成
        $('#quizNextBtn').addEventListener('click', goNextQuiz);

        // 再玩一次
        $('#advRestartBtn').addEventListener('click', restartAll);

        /* ---------- 15.10 初始化：渲染状态、进度条 ---------- */
        $('#advProgressText').textContent = '0 / ' + TOTAL_PARTS;
        $('#advProgressFill').style.width = '0%';

    })();


    // ============================================
    // 16. hero.html 护眼小英雄（每日任务打卡 · localStorage）
    // ============================================
    (function initHeroPage() {
        var $  = function (s, r) { return (r || document).querySelector(s); };
        var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

        if ($('#heroBackHome') === null) return; // 非 hero 页面不执行

        var LS_KEY = 'txq_hero_v1';
        var TOTAL_TASKS = 5;
        var POINTS_PER_TASK = 10;

        // 勋章定义（积分阈值、名称、emoji、贺词）
        var BADGES = [
            { key: 'star',    points: 30,  name: '护眼新星',   emoji: '⭐', desc: '你已经迈出了护眼的第一步，继续加油！' },
            { key: 'persist', points: 100, name: '坚持小达人', emoji: '🔥', desc: '连续坚持真的很酷，你就是最棒的！' },
            { key: 'hero',    points: 210, name: '护眼英雄',   emoji: '🦸', desc: '21 天养成好习惯，你已经是真正的护眼小英雄啦！' }
        ];

        // ---------- localStorage 读写 ----------
        function todayStr() {
            var d = new Date();
            return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
        }
        function loadState() {
            try {
                var raw = localStorage.getItem(LS_KEY);
                if (!raw) return defaultState();
                var s = JSON.parse(raw);
                // 如果不是今天，重置今日完成状态
                if (s.today !== todayStr()) {
                    s.yesterdayDone = s.today;
                    s.yesterdayFullCount = s.doneCount;
                    s.today = todayStr();
                    s.tasks = {};
                    s.doneCount = 0;
                }
                // 补齐字段
                if (!s.badges) s.badges = {};
                if (typeof s.totalPoints !== 'number') s.totalPoints = 0;
                if (typeof s.streak !== 'number') s.streak = 0;
                return s;
            } catch (e) {
                return defaultState();
            }
        }
        function defaultState() {
            return {
                today: todayStr(),
                tasks: {},      // { taskId: true }
                doneCount: 0,
                totalPoints: 0,
                streak: 0,
                badges: {},     // { star: true }
                lastFullDate: null // 上一次完成全部任务的日期
            };
        }
        function saveState() {
            try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
        }

        var state = loadState();

        // ---------- DOM 快捷 ----------
        var $tasksGrid = $('#tasksGrid');
        var $badgesGrid = $('#badgesGrid');
        var $todayDone = $('#todayDone');
        var $todayTotal = $('#todayTotal');
        var $totalPoints = $('#totalPoints');
        var $streakDays = $('#streakDays');
        var $progressFill = $('#todayProgressFill');
        var $celebrate = $('#celebrateLayer');
        var $badgeModal = $('#badgeModal');

        // ---------- 渲染 ----------
        function renderAll() {
            renderTasks();
            renderStats();
            renderBadges();
        }
        function renderTasks() {
            var cards = $tasksGrid.querySelectorAll('.hero-task-card');
            cards.forEach(function (card) {
                var tid = card.getAttribute('data-task-id');
                var done = !!state.tasks[tid];
                card.classList.toggle('is-done', done);
                var btn = card.querySelector('.task-action-btn');
                if (btn) btn.setAttribute('aria-pressed', done ? 'true' : 'false');
            });
        }
        function renderStats() {
            var done = state.doneCount;
            $todayDone.textContent = done;
            $todayTotal.textContent = TOTAL_TASKS;
            var prevPoints = Number($totalPoints.textContent) || 0;
            $totalPoints.textContent = state.totalPoints;
            $streakDays.textContent = state.streak;
            var pct = Math.round((done / TOTAL_TASKS) * 100);
            $progressFill.style.width = pct + '%';
            // 积分增加时触发数字弹跳动画（纯视觉反馈，不改变逻辑）
            if (state.totalPoints > prevPoints && $totalPoints.classList) {
                $totalPoints.classList.remove('bump');
                void $totalPoints.offsetWidth;
                $totalPoints.classList.add('bump');
            }
        }
        function renderBadges() {
            var cards = $badgesGrid.querySelectorAll('.hero-badge-card');
            cards.forEach(function (card) {
                var key = card.getAttribute('data-badge');
                var need = Number(card.getAttribute('data-points')) || 0;
                var unlocked = state.totalPoints >= need;
                card.classList.toggle('is-unlocked', unlocked);
                if (unlocked) state.badges[key] = true;
            });
        }

        // ---------- 任务点击：完成 / 撤销 ----------
        $tasksGrid.addEventListener('click', function (e) {
            var btn = e.target.closest('.task-action-btn');
            if (!btn) return;
            var card = btn.closest('.hero-task-card');
            if (!card) return;
            var tid = card.getAttribute('data-task-id');
            var wasDone = !!state.tasks[tid];

            if (wasDone) {
                // 撤销完成
                delete state.tasks[tid];
                state.doneCount = Math.max(0, state.doneCount - 1);
                state.totalPoints = Math.max(0, state.totalPoints - POINTS_PER_TASK);
                saveState();
                renderAll();
                showToast('↩️ 已取消完成，任务可重新打卡～');
            } else {
                // 完成任务
                state.tasks[tid] = true;
                state.doneCount += 1;
                state.totalPoints += POINTS_PER_TASK;

                // 如果今天全部完成，并且上次完成的日期不是今天 → 连续+1
                if (state.doneCount === TOTAL_TASKS && state.lastFullDate !== state.today) {
                    // 昨天或之前完成过？简单处理：首次全完成 +1；之后每天全完成 +1
                    var yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    var yStr = yesterday.getFullYear() + '-' + (yesterday.getMonth() + 1) + '-' + yesterday.getDate();
                    if (state.lastFullDate === yStr) {
                        state.streak += 1;
                    } else if (state.lastFullDate === null) {
                        state.streak = 1;
                    } else {
                        // 断签，重新开始
                        state.streak = 1;
                    }
                    state.lastFullDate = state.today;
                }

                saveState();
                renderAll();

                // 庆祝动画 + Toast
                celebrateAtBtn(btn, POINTS_PER_TASK);
                showToast('🎉 太棒了！获得 ' + POINTS_PER_TASK + ' 积分！');

                // 触发全屏彩带（每完成 1 个来一点，全部完成时多放一些）
                var big = state.doneCount === TOTAL_TASKS;
                throwConfetti(big ? 80 : 24, big ? 2800 : 1600);

                // 检查是否解锁新勋章
                checkNewBadges();
            }
        });

        // ---------- 勋章解锁检测 ----------
        function checkNewBadges() {
            // 先更新一次
            renderBadges();
            for (var i = 0; i < BADGES.length; i++) {
                var b = BADGES[i];
                if (state.totalPoints >= b.points && !state.badges['_announced_' + b.key]) {
                    state.badges['_announced_' + b.key] = true;
                    saveState();
                    // 延迟弹窗，给庆祝动画点时间
                    (function (bb) {
                        setTimeout(function () { showBadgeModal(bb); }, 700);
                    })(b);
                    break; // 一次只弹一个
                }
            }
        }

        // ---------- 勋章解锁弹窗 ----------
        function showBadgeModal(badge) {
            $('#badgeModalMedal').textContent = badge.emoji;
            $('#badgeModalName').textContent = badge.name;
            $('#badgeModalDesc').textContent = badge.desc;
            $badgeModal.hidden = false;
            document.body.classList.add('modal-open');
            // 再放一轮彩带
            throwConfetti(60, 2200);
        }
        function closeBadgeModal() {
            if (!$badgeModal || $badgeModal.hidden) return;
            $badgeModal.hidden = true;
            document.body.classList.remove('modal-open');
        }
        if ($badgeModal) {
            $badgeModal.addEventListener('click', function (e) {
                if (e.target.getAttribute('data-close-modal') === '1') closeBadgeModal();
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape') closeBadgeModal();
            });
        }

        // ---------- 庆祝：按钮位置星星飘起 ----------
        function celebrateAtBtn(btn, pointsText) {
            if (!btn) return;
            var rect = btn.getBoundingClientRect();
            var emojis = ['⭐', '✨', '💫', '🌟', '+10'];
            var count = 6;
            for (var i = 0; i < count; i++) {
                var s = document.createElement('div');
                s.className = 'hero-star-pop';
                s.textContent = i === 0 ? '+' + pointsText : emojis[1 + Math.floor(Math.random() * 4)];
                s.style.left = (rect.left + rect.width / 2 + (Math.random() * 60 - 30)) + 'px';
                s.style.top  = (rect.top  + rect.height / 2 - 10 + (Math.random() * 20)) + 'px';
                s.style.animationDelay = (i * 60) + 'ms';
                document.body.appendChild(s);
                // 用IIFE绑定当前s，避免循环闭包变量共享问题
                (function (el, delay) {
                    setTimeout(function () { el && el.parentNode && el.remove(); }, delay);
                })(s, 1400 + i * 80);
            }
        }

        // ---------- 庆祝：全屏彩纸 ----------
        var COLORS = ['#FF9518', '#57B83F', '#3B8FE8', '#7651D8', '#18B7B5', '#FFD24D', '#FF6E95'];
        function throwConfetti(count, duration) {
            if (!$celebrate) return;
            count = count || 30;
            duration = duration || 1800;
            // 显示庆祝层（仅播放彩纸时可见，不使用暗色背景）
            $celebrate.style.display = 'block';
            $celebrate.style.background = 'transparent';
            var vw = window.innerWidth || document.documentElement.clientWidth;
            for (var i = 0; i < count; i++) {
                var c = document.createElement('div');
                c.className = 'hero-confetti';
                c.style.left = (Math.random() * vw) + 'px';
                c.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
                var size = 8 + Math.random() * 8;
                c.style.width = size + 'px';
                c.style.height = (size * 1.5) + 'px';
                c.style.opacity = (0.75 + Math.random() * 0.25).toFixed(2);
                var dur = (1.4 + Math.random() * 1.2).toFixed(2);
                c.style.animationDuration = dur + 's';
                // 随机左右漂移
                c.style.transform = 'translateX(' + (Math.random() * 120 - 60) + 'px)';
                $celebrate.appendChild(c);
                // 结束自动移除
                (function (el) {
                    setTimeout(function () { el.remove(); }, parseFloat(dur) * 1000 + 200);
                })(c);
            }
            // 彩纸全部结束后隐藏庆祝层
            setTimeout(function () {
                if ($celebrate.children.length === 0) {
                    $celebrate.style.display = 'none';
                }
            }, duration + 500);
        }

        // ---------- 重置今日任务（演示按钮） ----------
        var $resetBtn = $('#heroResetBtn');
        if ($resetBtn) {
            $resetBtn.addEventListener('click', function () {
                // 仅清除今日任务完成状态，保留累计积分/勋章/连续
                state.tasks = {};
                // 计算需要扣除的积分
                var pointsLost = state.doneCount * POINTS_PER_TASK;
                state.totalPoints = Math.max(0, state.totalPoints - pointsLost);
                state.doneCount = 0;
                // 撤销"今日已全完成"标记以允许再次获得连续奖励
                if (state.lastFullDate === state.today) {
                    state.lastFullDate = state.yesterdayFullDate ? state.yesterdayFullDate : null;
                    if (state.streak > 0) state.streak = Math.max(0, state.streak - 1);
                }
                saveState();
                renderAll();
                var toast = $resetBtn.getAttribute('data-toast') || '🔄 已重置今日任务';
                showToast(toast);
            });
        }

        // ---------- 首次进入，如果今天所有任务已完成（例如老数据），更新连续天数 ----------
        (function ensureStreak() {
            if (state.doneCount >= TOTAL_TASKS && state.lastFullDate !== state.today) {
                state.lastFullDate = state.today;
                if (state.streak <= 0) state.streak = 1;
                saveState();
            }
        })();

        /* ---------- 首屏渲染 ---------- */
        renderAll();

    })();


    // ============================================
    // 17. selftest.html 视界实验室（5个探索任务 · localStorage 积分系统）
    // ============================================
    (function initVisionLab() {
        var $ = function (s, r) { return (r || document).querySelector(s); };
        var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

        // 非视界实验室页面不执行
        if (!$('#vlabModal') || !$('#amapScene')) return;

        /* ---- localStorage 状态管理 ---- */
        var LS_KEY = 'txq_amap_v1';
        var TASKS = ['eyeball', 'vision', 'rumor', 'life', 'challenge'];
        var TASK_NAMES = {
            eyeball: '眼球实验室', vision: '我的视界', rumor: '谣言粉碎机',
            life: '近视人生', challenge: '护眼挑战'
        };
        var BADGE_NAMES = {
            eyeball: '眼球观察员', vision: '视界探索家', rumor: '谣言终结者',
            life: '护眼小达人', challenge: '护眼光辉使者'
        };
        // 每个任务奖励的探索能量
        var TASK_ENERGY = { eyeball: 20, vision: 20, rumor: 20, life: 20, challenge: 20 };

        function loadState() {
            try {
                var raw = localStorage.getItem(LS_KEY);
                if (raw) return JSON.parse(raw);
            } catch (e) {}
            return { completed: {}, energy: 0, storySeen: false, rewardShown: false };
        }
        function saveState() {
            try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {}
        }
        var state = loadState();

        /* ---- UI 更新（能量 + 进度 + 等级 + 徽章）---- */
        var $progressText = $('#amapProgressText');
        var $energyText   = $('#amapEnergyText');
        var $energyVal    = $('#amapEnergyText');
        var $progressFill = $('#amapProgressFill');
        var $levelText    = $('#amapLevelText');

        function levelName(done) {
            if (done >= 5) return '视界大师';
            if (done >= 4) return '护眼专家';
            if (done >= 3) return '视界达人';
            if (done >= 2) return '护眼学徒';
            if (done >= 1) return '探索新星';
            return '探索新手';
        }

        function updateUI() {
            var done = 0;
            TASKS.forEach(function (t) {
                var isDone = !!state.completed[t];
                if (isDone) done++;
                // 徽章
                var $badge = document.querySelector('[data-badge-for="' + t + '"]');
                if ($badge) $badge.classList.toggle('earned', isDone);
            });
            if ($progressText) $progressText.textContent = done + ' / 5';
            if ($energyText)   $energyText.textContent = state.energy;
            if ($progressFill) $progressFill.style.width = (done / 5 * 100) + '%';
            if ($levelText)    $levelText.textContent = levelName(done);

            // 全部完成 → 奖励弹窗
            if (done === 5 && !state.rewardShown) {
                state.rewardShown = true;
                saveState();
                setTimeout(function () { showRewardModal(); }, 800);
            }
        }

        /* ---- 任务完成 ---- */
        function completeTask(taskKey) {
            if (!state.completed[taskKey]) {
                state.completed[taskKey] = true;
                state.energy += TASK_ENERGY[taskKey];
                saveState();
                closeModal();
                // 小光仔鼓励 + 徽章提示
                setTimeout(function () {
                    showToast('🎉 太棒啦！获得「' + BADGE_NAMES[taskKey] + '」徽章！ +' + TASK_ENERGY[taskKey] + ' 探索能量');
                }, 200);
            }
            updateUI();
        }

        /* ---- 弹窗控制 ---- */
        var $modal      = $('#vlabModal');
        var $modalBody  = $('#vlabModalBody');

        function openModal(html) {
            $modalBody.innerHTML = html;
            $modal.hidden = false;
            document.body.style.overflow = 'hidden';
        }
        function closeModal() {
            $modal.hidden = true;
            $modalBody.innerHTML = '';
            document.body.style.overflow = '';
        }

        $modal.addEventListener('click', function (e) {
            if (e.target.hasAttribute('data-close-modal') || e.target.closest('[data-close-modal]')) {
                closeModal();
            }
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !$modal.hidden) closeModal();
        });

        /* ---- 奖励弹窗 ---- */
        var $rewardModal = $('#vlabRewardModal');
        function showRewardModal() {
            if ($rewardModal) {
                var $rewardEnergy = $('#vlabRewardEnergy');
                if ($rewardEnergy) $rewardEnergy.textContent = state.energy;
                $rewardModal.hidden = false;
                document.body.style.overflow = 'hidden';
            }
        }
        function closeRewardModal() {
            if ($rewardModal) {
                $rewardModal.hidden = true;
                document.body.style.overflow = '';
            }
        }
        if ($rewardModal) {
            $rewardModal.addEventListener('click', function (e) {
                if (e.target.hasAttribute('data-close-reward') || e.target.closest('[data-close-reward]')) {
                    closeRewardModal();
                }
            });
        }
        var $replayBtn = $('#vlabReplayBtn');
        if ($replayBtn) {
            $replayBtn.addEventListener('click', function () {
                state = { completed: {}, energy: 0, storySeen: true, rewardShown: false };
                saveState();
                closeRewardModal();
                updateUI();
                showToast('🔄 已重置！再来一次吧～');
            });
        }
        var $rewardHomeBtn = $('#vlabRewardHomeBtn');
        if ($rewardHomeBtn) {
            $rewardHomeBtn.addEventListener('click', function () {
                location.href = 'index.html';
            });
        }

        /* ---- 重置按钮（地图右上角） ---- */
        var $resetBtn = $('#amapResetBtn');
        if ($resetBtn) {
            $resetBtn.addEventListener('click', function () {
                if (confirm('确定要重置全部探索进度吗？所有徽章和能量都会清空哦～')) {
                    state = { completed: {}, energy: 0, storySeen: true, rewardShown: false };
                    saveState();
                    updateUI();
                    showToast('🔄 已重置全部进度！');
                }
            });
        }

        /* ---- 返回首页按钮 ---- */
        var $homeBtn = $('#amapHomeBtn');
        if ($homeBtn) {
            $homeBtn.addEventListener('click', function () {
                location.href = 'index.html';
            });
        }

        /* ---- 家长指引 / 我的成就 入口 ---- */
        var $parentBtn = $('#amapParentBtn');
        if ($parentBtn) {
            $parentBtn.addEventListener('click', function () {
                showToast('👨‍👩‍👧 家长指引：请陪伴孩子探索，每完成一个任务鼓励一下TA吧！');
            });
        }
        var $achieveBtn = $('#amapAchieveBtn');
        if ($achieveBtn) {
            $achieveBtn.addEventListener('click', function () {
                var done = 0;
                TASKS.forEach(function (t) { if (state.completed[t]) done++; });
                showToast('🏅 当前已获得 ' + done + ' 枚徽章，探索能量 ' + state.energy + '！');
            });
        }

        /* ---- 剧情入口对话框（首次进入逐句播放） ---- */
        var $storyModal = $('#amapStoryModal');
        var $storyLine  = $('#amapStoryLine');
        var $startBtn   = $('#amapStartBtn');
        var $storySkip  = $('#amapStorySkip');
        var STORY_LINES = [
            '嘿！欢迎来到视界实验室！',
            '这里没有枯燥的测试，\n只有5个有趣的探索任务！',
            '准备好了吗？'
        ];
        var storyTimer = null;
        function typeLine(text, cb) {
            if (!$storyLine) return;
            $storyLine.textContent = '';
            var i = 0;
            clearInterval(storyTimer);
            storyTimer = setInterval(function () {
                if (i >= text.length) { clearInterval(storyTimer); if (cb) cb(); return; }
                $storyLine.textContent += text.charAt(i) === '\n' ? '\n' : text.charAt(i);
                i++;
            }, 45);
        }
        function playStory() {
            if (!$storyModal || state.storySeen) { hideStory(); return; }
            $storyModal.style.display = 'flex';
            $startBtn.style.display = 'none';
            var idx = 0;
            function next() {
                if (idx >= STORY_LINES.length) {
                    $startBtn.style.display = 'inline-block';
                    return;
                }
                typeLine(STORY_LINES[idx], function () {
                    setTimeout(function () { idx++; next(); }, 500);
                });
            }
            next();
        }
        function hideStory() {
            if ($storyModal) $storyModal.style.display = 'none';
            state.storySeen = true;
            saveState();
        }
        if ($startBtn) {
            $startBtn.addEventListener('click', function () {
                hideStory();
                showToast('🎈 冒险开始！点击地图上的任务地点吧～');
            });
        }
        if ($storySkip) {
            $storySkip.addEventListener('click', hideStory);
        }

        /* ============================================================
         * 实验 ① 眼球实验室
         * ============================================================ */
        function openEyeballLab() {
            openModal(
                '<div class="vlab-exp-head">' +
                  '<div class="vlab-exp-icon">🔬</div>' +
                  '<h3>眼球实验室</h3>' +
                  '<p>亲手探索近视是怎么发生的</p>' +
                '</div>' +
                '<div class="vlab-eyeball-stage">' +
                  '<div class="vlab-eyeball-canvas">' +
                    '<svg class="vlab-eyeball-svg" viewBox="0 0 600 220" id="eyeballSvg">' +
                      '<g id="eyeballRays"></g>' +
                      '<circle cx="120" cy="110" r="35" fill="#BBDEFB" stroke="#1E88E5" stroke-width="2"/>' +
                      '<ellipse cx="145" cy="110" rx="12" ry="20" fill="#90CAF9" stroke="#1E88E5" stroke-width="1.5"/>' +
                      '<circle id="eyeballBall" cx="280" cy="110" r="90" fill="none" stroke="#43A047" stroke-width="3"/>' +
                      '<circle id="eyeballRetina" cx="370" cy="110" r="6" fill="#E53935"/>' +
                      '<circle id="eyeballFocus" cx="370" cy="110" r="5" fill="#FF6F00" opacity="0.8"/>' +
                      '<text x="120" y="170" text-anchor="middle" font-size="12" fill="#1565C0" font-weight="bold">角膜</text>' +
                      '<text x="280" y="60" text-anchor="middle" font-size="12" fill="#2E7D32" font-weight="bold">眼球</text>' +
                      '<text id="eyeballRetinaLabel" x="370" y="135" text-anchor="middle" font-size="11" fill="#E53935" font-weight="bold">视网膜</text>' +
                      '<text id="eyeballFocusLabel" x="370" y="95" text-anchor="middle" font-size="11" fill="#FF6F00" font-weight="bold">焦点</text>' +
                    '</svg>' +
                  '</div>' +
                  '<div class="vlab-eyeball-mode-row">' +
                    '<button class="vlab-eyeball-mode-btn active" data-mode="normal">正常眼</button>' +
                    '<button class="vlab-eyeball-mode-btn" data-mode="myopia">近视眼</button>' +
                  '</div>' +
                  '<div class="vlab-eyeball-label" id="eyeballLabel">✅ 正常眼：光线刚好聚焦在视网膜上</div>' +
                  '<div class="vlab-eyeball-slider-row">' +
                    '<label>眼球前后径</label>' +
                    '<input type="range" class="vlab-eyeball-slider" id="eyeballSlider" min="0" max="100" value="0">' +
                  '</div>' +
                '</div>' +
                '<div class="vlab-xgz-tip">' +
                  '<div class="vlab-xgz-avatar"><img src="assets/images/xiaoguangzi-new.png" alt="小光仔"></div>' +
                  '<div class="vlab-xgz-text">眼球前后径变长，或者眼睛的屈光力发生变化，就可能让焦点落在视网膜<b>前面</b>——这就是近视啦！<br>拖动滑块，看看眼球变长后焦点会跑到哪里～</div>' +
                '</div>' +
                '<div class="vlab-exp-btns">' +
                  '<button class="vlab-btn-primary" id="eyeballDoneBtn">✓ 完成实验</button>' +
                  '<button class="vlab-btn-outline" data-close-modal>返回</button>' +
                '</div>'
            );

            var ball      = $('#eyeballBall');
            var retina    = $('#eyeballRetina');
            var retinaLbl = $('#eyeballRetinaLabel');
            var focus     = $('#eyeballFocus');
            var focusLbl  = $('#eyeballFocusLabel');
            var rays      = $('#eyeballRays');
            var label     = $('#eyeballLabel');
            var slider    = $('#eyeballSlider');

            function updateEye(val) {
                var ballR = 90;
                var ballCx = 280 + val * 0.6;
                var retinaCx = ballCx + ballR;
                var focusCx = 370;

                ball.setAttribute('cx', ballCx);
                retina.setAttribute('cx', retinaCx);
                retinaLbl.setAttribute('x', retinaCx);
                focus.setAttribute('cx', focusCx);
                focusLbl.setAttribute('x', focusCx);

                var rayHTML = '';
                var lightYs = [85, 100, 110, 120, 135];
                for (var i = 0; i < lightYs.length; i++) {
                    var y = lightYs[i];
                    rayHTML += '<line x1="20" y1="' + y + '" x2="145" y2="' + y + '" stroke="#FFD54F" stroke-width="2" opacity="0.7"/>';
                    rayHTML += '<line x1="145" y1="' + y + '" x2="' + focusCx + '" y2="110" stroke="#FF9800" stroke-width="2" opacity="0.7"/>';
                    if (val > 10) {
                        var ratio = (retinaCx - 145) / (focusCx - 145);
                        var retinaY = 110 + (y - 110) * ratio;
                        rayHTML += '<line x1="' + focusCx + '" y1="110" x2="' + retinaCx + '" y2="' + retinaY.toFixed(1) + '" stroke="#FFD54F" stroke-width="1.5" opacity="0.4" stroke-dasharray="4,3"/>';
                    }
                }
                rays.innerHTML = rayHTML;

                if (val < 10) {
                    label.textContent = '✅ 正常眼：光线刚好聚焦在视网膜上';
                    label.style.color = '#2E7D32';
                } else if (val < 50) {
                    label.textContent = '⚠️ 轻度近视：焦点落在视网膜前面一点';
                    label.style.color = '#FB8C00';
                } else {
                    label.textContent = '🔴 近视眼：焦点明显在视网膜前方，看不清了！';
                    label.style.color = '#E53935';
                }
            }

            $$('.vlab-eyeball-mode-btn', $modalBody).forEach(function (b) {
                b.addEventListener('click', function () {
                    $$('.vlab-eyeball-mode-btn', $modalBody).forEach(function (x) { x.classList.remove('active'); });
                    b.classList.add('active');
                    var mode = b.getAttribute('data-mode');
                    slider.value = mode === 'normal' ? 0 : 65;
                    updateEye(parseInt(slider.value, 10));
                });
            });

            slider.addEventListener('input', function () {
                updateEye(parseInt(slider.value, 10));
                $$('.vlab-eyeball-mode-btn', $modalBody).forEach(function (x) { x.classList.remove('active'); });
                if (parseInt(slider.value, 10) < 10) {
                    $$('.vlab-eyeball-mode-btn', $modalBody)[0].classList.add('active');
                } else {
                    $$('.vlab-eyeball-mode-btn', $modalBody)[1].classList.add('active');
                }
            });

            updateEye(0);

            $('#eyeballDoneBtn').addEventListener('click', function () {
                closeModal();
                completeTask('eyeball');
            });
        }

        /* ============================================================
         * 实验 ② 我的视界
         * ============================================================ */
        function openVisionLab() {
            openModal(
                '<div class="vlab-exp-head">' +
                  '<div class="vlab-exp-icon">🌐</div>' +
                  '<h3>我的视界</h3>' +
                  '<p>体验不同程度近视看到的世界</p>' +
                '</div>' +
                '<div class="vlab-vision-stage">' +
                  '<div class="vlab-vision-preview" id="visionPreview">' +
                    '<h4>📝 课堂黑板</h4>' +
                    '<p>3 × 5 = 15 &nbsp;&nbsp; 春眠不觉晓<br>处处闻啼鸟　夜来风雨声</p>' +
                  '</div>' +
                  '<div class="vlab-vision-slider-row">' +
                    '<label>近视程度</label>' +
                    '<input type="range" class="vlab-vision-slider" id="visionSlider" min="0" max="8" value="0" step="1">' +
                  '</div>' +
                  '<div class="vlab-vision-level" id="visionLevel">0° — 正常视力</div>' +
                '</div>' +
                '<div class="vlab-xgz-tip">' +
                  '<div class="vlab-xgz-avatar"><img src="assets/images/xiaoguangzi-new.png" alt="小光仔"></div>' +
                  '<div class="vlab-xgz-text">原来不是"看不见"，而是<b>越来越难看清细节</b>。<br>拖动滑块，感受一下近视看到的世界是什么样的～</div>' +
                '</div>' +
                '<div class="vlab-exp-btns">' +
                  '<button class="vlab-btn-primary" id="visionDoneBtn">✓ 完成实验</button>' +
                  '<button class="vlab-btn-outline" data-close-modal>返回</button>' +
                '</div>'
            );

            var preview = $('#visionPreview');
            var slider   = $('#visionSlider');
            var levelLbl = $('#visionLevel');
            var levels = [
                '0° — 正常视力，清晰锐利',
                '轻度近视 — 远处开始有点糊',
                '轻度近视 — 细节变模糊了',
                '中度近视 — 看文字很费力',
                '中度近视 — 几乎看不清字了',
                '高度近视 — 只能看到色块',
                '高度近视 — 一片模糊',
                '重度近视 — 几乎看不见',
                '重度近视 — 完全模糊'
            ];
            var blurMap = [0, 1, 2, 3.5, 5, 7, 9, 12, 15];

            slider.addEventListener('input', function () {
                var v = parseInt(slider.value, 10);
                preview.style.filter = 'blur(' + blurMap[v] + 'px)';
                levelLbl.textContent = levels[v];
            });

            $('#visionDoneBtn').addEventListener('click', function () {
                closeModal();
                completeTask('vision');
            });
        }

        /* ============================================================
         * 实验 ③ 谣言粉碎机
         * ============================================================ */
        function openRumorLab() {
            var questions = [
                { q: '戴眼镜会让近视越来越深？', answer: false, title: '❌ 这是常见误区', desc: '眼镜本身不会让近视加深。近视度数变化与<b>眼球发育、用眼环境</b>等因素有关。合适的眼镜反而能减轻眼睛疲劳！' },
                { q: '看绿色植物可以治疗近视？', answer: false, title: '❌ 这是误区', desc: '看绿色植物能让眼睛<b>放松休息</b>，但<b>不能治疗或逆转近视</b>。真性近视是眼球结构变化，植物无法改变眼球形状。' },
                { q: '关灯玩手机一定会导致近视？', answer: false, title: '❌ 不完全对', desc: '关灯玩手机不会"一定"导致近视，但暗环境下屏幕强光会让眼睛<b>非常疲劳、干涩</b>，长期确实可能加速近视发展。建议开一盏小灯！' },
                { q: '近视了就不用进行户外活动？', answer: false, title: '❌ 完全错误', desc: '恰恰相反！<b>每天2小时户外活动</b>是目前公认最有效的近视防控方法之一。阳光能促进多巴胺分泌，抑制眼轴增长。近视了更要多去户外！' },
                { q: '眼睛疲劳等于近视？', answer: false, title: '❌ 不等于', desc: '眼疲劳是<b>用眼过度</b>的表现，休息后通常能恢复。近视是<b>眼球结构变化</b>导致的。虽然疲劳不等于近视，但长期疲劳不加休息，可能促进近视发展。' }
            ];
            var curIdx = 0;
            var correct = 0;

            function renderQ() {
                if (curIdx >= questions.length) {
                    openModal(
                        '<div class="vlab-exp-head">' +
                          '<div class="vlab-exp-icon">🏆</div>' +
                          '<h3>谣言粉碎完成！</h3>' +
                        '</div>' +
                        '<div style="text-align:center;padding:20px 0;">' +
                          '<div style="font-size:48px;font-weight:900;color:#FB8C00;">' + correct + ' / ' + questions.length + '</div>' +
                          '<p style="font-size:16px;color:#555;font-weight:600;margin-top:8px;">答对 ' + correct + ' 题</p>' +
                        '</div>' +
                        '<div class="vlab-xgz-tip">' +
                          '<div class="vlab-xgz-avatar"><img src="assets/images/xiaoguangzi-new.png" alt="小光仔"></div>' +
                          '<div class="vlab-xgz-text">' + (correct >= 4 ? '太棒啦！你已经学会了分辨近视谣言！' : '没关系，再试一次！这次换个思路看看～') + '</div>' +
                        '</div>' +
                        '<div class="vlab-exp-btns">' +
                          '<button class="vlab-btn-primary" id="rumorDoneBtn">✓ 完成实验</button>' +
                          '<button class="vlab-btn-outline" id="rumorRetryBtn">🔄 再答一次</button>' +
                        '</div>'
                    );
                    $('#rumorDoneBtn').addEventListener('click', function () { closeModal(); completeTask('rumor'); });
                    $('#rumorRetryBtn').addEventListener('click', function () { curIdx = 0; correct = 0; renderQ(); });
                    return;
                }
                var q = questions[curIdx];
                openModal(
                    '<div class="vlab-exp-head">' +
                      '<div class="vlab-exp-icon">⚡</div>' +
                      '<h3>谣言粉碎机</h3>' +
                      '<p>别被"听说"骗了，自己判断真相</p>' +
                    '</div>' +
                    '<div class="vlab-rumor-progress">' +
                      '<span class="vlab-rumor-q-num">第 ' + (curIdx + 1) + ' / ' + questions.length + ' 题</span>' +
                      '<span class="vlab-rumor-score">⭐ 已答对 ' + correct + ' 题</span>' +
                    '</div>' +
                    '<div class="vlab-rumor-question">' +
                      '<div class="vlab-rumor-q-label">以下说法是真是假？</div>' +
                      '<div class="vlab-rumor-q-text">' + q.q + '</div>' +
                    '</div>' +
                    '<div class="vlab-rumor-choices">' +
                      '<button class="vlab-rumor-choice" data-pick="true">✅ 是真的</button>' +
                      '<button class="vlab-rumor-choice" data-pick="false">❌ 假的</button>' +
                    '</div>' +
                    '<div class="vlab-rumor-feedback" id="rumorFeedback">' +
                      '<div class="vlab-rumor-fb-title" id="rumorFbTitle"></div>' +
                      '<div class="vlab-rumor-fb-desc" id="rumorFbDesc"></div>' +
                    '</div>' +
                    '<div class="vlab-exp-btns" id="rumorNextRow" style="display:none;">' +
                      '<button class="vlab-btn-primary" id="rumorNextBtn">下一题 →</button>' +
                    '</div>'
                );

                var answered = false;
                $$('.vlab-rumor-choice', $modalBody).forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        if (answered) return;
                        answered = true;
                        var pick = btn.getAttribute('data-pick') === 'true';
                        var isCorrect = (pick === q.answer);
                        $$('.vlab-rumor-choice', $modalBody).forEach(function (b) {
                            b.classList.add('is-disabled');
                            if (b.getAttribute('data-pick') === String(q.answer)) b.classList.add('is-true');
                            else if (b === btn && !isCorrect) b.classList.add('is-false');
                        });
                        var $fb = $('#rumorFeedback');
                        var $fbTitle = $('#rumorFbTitle');
                        var $fbDesc  = $('#rumorFbDesc');
                        $fbDesc.innerHTML = q.desc;
                        if (isCorrect) {
                            correct++;
                            $fbTitle.textContent = '✅ 答对了！';
                            $fb.className = 'vlab-rumor-feedback show correct';
                        } else {
                            $fbTitle.textContent = q.title;
                            $fb.className = 'vlab-rumor-feedback show wrong';
                        }
                        $('#rumorNextRow').style.display = 'flex';
                        $('#rumorNextBtn').textContent = curIdx === questions.length - 1 ? '查看结果 →' : '下一题 →';
                    });
                });

                $('#rumorNextBtn').addEventListener('click', function () { curIdx++; renderQ(); });
            }
            renderQ();
        }

        /* ============================================================
         * 实验 ④ 近视人生
         * ============================================================ */
        function openLifeLab() {
            var scenes = [
                { icon: '🏫', name: '上课', title: '课堂看黑板', normal: '3×5=15\n春眠不觉晓', myopia: '看不清黑板上的字\n只能看到模糊的色块', question: '你会选择继续眯眼，还是去做专业检查？', choices: [ { text: '😌 继续眯眼', feedback: '长期眯眼会让眼睛更疲劳，度数可能加深更快。建议及时告诉老师和家长，去正规检查！' }, { text: '🏥 去做检查', feedback: '太棒了！早发现、早干预是保护视力的最佳方式。专业检查能帮你配到合适的眼镜。' } ] },
                { icon: '🏃', name: '运动', title: '操场打球', normal: '看清球的轨迹\n精准接球', myopia: '球飞过来时\n完全看不清在哪', question: '看不清球，你怎么办？', choices: [ { text: '😤 硬着头皮上', feedback: '看不清球很容易被砸到或摔倒，运动受伤风险很高！建议戴运动眼镜或做适合的运动。' }, { text: '🥽 配运动眼镜', feedback: '聪明！专业的运动眼镜能让你安全运动，享受快乐体育课～' } ] },
                { icon: '🎬', name: '看电影', title: '电影院看字幕', normal: '字幕清清楚楚\n轻松看懂剧情', myopia: '字幕一片模糊\n只能靠猜剧情', question: '看不清字幕，你会？', choices: [ { text: '🤷 靠猜看下去', feedback: '看不清还硬看会让眼睛更累。如果经常看不清远处，记得去检查视力哦！' }, { text: '👀 去查视力', feedback: '对！如果远处看不清，可能已经有近视了，早查早安心～' } ] },
                { icon: '📱', name: '看手机', title: '睡前看手机', normal: '近距离还能看清\n但也要注意休息', myopia: '即使近距离\n也越看越模糊', question: '看手机越来越模糊，你怎么办？', choices: [ { text: '📵 减少看屏幕', feedback: '很好！减少屏幕时间 + 多去户外，是保护眼睛的基本功。如果持续模糊要去检查。' }, { text: '😰 更用力看', feedback: '更用力看只会让眼睛更累。如果视力持续下降，请尽快告诉家长去检查！' } ] }
            ];
            var curScene = 0;

            function renderScene() {
                if (curScene >= scenes.length) {
                    openModal(
                        '<div class="vlab-exp-head">' +
                          '<div class="vlab-exp-icon">🎓</div>' +
                          '<h3>近视人生体验完成！</h3>' +
                        '</div>' +
                        '<div style="text-align:center;padding:16px 0;">' +
                          '<p style="font-size:16px;color:#555;font-weight:600;line-height:1.8;">你体验了 ' + scenes.length + ' 个生活场景。<br>近视不只是"看不清"，它会影响<b>上课、运动、看电影</b>等方方面面。<br>保护好眼睛，生活才会更精彩！</p>' +
                        '</div>' +
                        '<div class="vlab-xgz-tip">' +
                          '<div class="vlab-xgz-avatar"><img src="assets/images/xiaoguangzi-new.png" alt="小光仔"></div>' +
                          '<div class="vlab-xgz-text">重点不是吓唬你，而是让你理解真实生活中的影响。<br>早保护、早检查，才能拥有清晰视界！</div>' +
                        '</div>' +
                        '<div class="vlab-exp-btns">' +
                          '<button class="vlab-btn-primary" id="lifeDoneBtn">✓ 完成实验</button>' +
                        '</div>'
                    );
                    $('#lifeDoneBtn').addEventListener('click', function () { closeModal(); completeTask('life'); });
                    return;
                }
                var s = scenes[curScene];
                openModal(
                    '<div class="vlab-exp-head">' +
                      '<div class="vlab-exp-icon">🏫</div>' +
                      '<h3>近视人生</h3>' +
                      '<p>如果看不清，日常生活会发生什么？</p>' +
                    '</div>' +
                    '<div class="vlab-life-scenes" id="lifeScenes">' +
                      scenes.map(function (sc, i) {
                          return '<button class="vlab-life-scene-btn' + (i === curScene ? ' active' : '') + '" data-scene="' + i + '">' + sc.icon + ' ' + sc.name + '</button>';
                      }).join('') +
                    '</div>' +
                    '<div class="vlab-life-stage">' +
                      '<div class="vlab-life-scene-title">' + s.title + '</div>' +
                      '<div class="vlab-life-compare">' +
                        '<div class="vlab-life-col normal">' +
                          '<span class="vlab-life-col-label">正常视界</span>' +
                          '<div class="vlab-life-col-content">' + s.normal.replace(/\n/g, '<br>') + '</div>' +
                        '</div>' +
                        '<div class="vlab-life-col myopia">' +
                          '<span class="vlab-life-col-label">近视模拟</span>' +
                          '<div class="vlab-life-col-content">' + s.myopia.replace(/\n/g, '<br>') + '</div>' +
                        '</div>' +
                      '</div>' +
                      '<div class="vlab-life-question">' + s.question + '</div>' +
                      '<div class="vlab-life-choices" id="lifeChoices">' +
                        s.choices.map(function (c, i) {
                            return '<button class="vlab-life-choice" data-choice="' + i + '">' + c.text + '</button>';
                        }).join('') +
                      '</div>' +
                      '<div class="vlab-life-feedback" id="lifeFeedback"></div>' +
                    '</div>' +
                    '<div class="vlab-exp-btns" id="lifeNextRow" style="display:none;">' +
                      '<button class="vlab-btn-primary" id="lifeNextBtn">' + (curScene === scenes.length - 1 ? '完成体验 →' : '下一个场景 →') + '</button>' +
                    '</div>'
                );

                $$('.vlab-life-scene-btn', $modalBody).forEach(function (b) {
                    b.addEventListener('click', function () {
                        curScene = parseInt(b.getAttribute('data-scene'), 10);
                        renderScene();
                    });
                });

                var answered = false;
                $$('.vlab-life-choice', $modalBody).forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        if (answered) return;
                        answered = true;
                        var idx = parseInt(btn.getAttribute('data-choice'), 10);
                        var $fb = $('#lifeFeedback');
                        $fb.innerHTML = s.choices[idx].feedback;
                        $fb.classList.add('show');
                        $('#lifeNextRow').style.display = 'flex';
                    });
                });

                $('#lifeNextBtn').addEventListener('click', function () { curScene++; renderScene(); });
            }
            renderScene();
        }

        /* ============================================================
         * 实验 ⑤ 护眼挑战
         * ============================================================ */
        function openChallengeLab() {
            var steps = [
                { time: '☀️ 早上', label: '起床后第一件事', choices: [ { icon: '☀️', text: '出门晒太阳', good: true, fb: '太棒了！早晨阳光能帮助预防近视，是护眼好习惯！+20分' }, { icon: '📱', text: '起床先玩手机', good: false, fb: '刚起床就看屏幕，眼睛还没"醒"过来呢，容易疲劳。+5分' } ] },
                { time: '📖 上午', label: '上课时间', choices: [ { icon: '👀', text: '认真看黑板', good: true, fb: '坐端正、看清楚，学习效率高，眼睛也舒服！+20分' }, { icon: '📖', text: '趴着看书', good: false, fb: '趴着看书距离太近，眼睛很累，姿势也不好。+5分' } ] },
                { time: '🏃 下午', label: '课后时光', choices: [ { icon: '🏃', text: '户外运动', good: true, fb: '户外运动是最好的护眼方式之一！+20分' }, { icon: '🎮', text: '连续玩游戏', good: false, fb: '连续看屏幕太久，眼睛会很疲劳。建议每30分钟休息一下。+5分' } ] },
                { time: '📵 晚上', label: '睡前习惯', choices: [ { icon: '📵', text: '睡前少看屏幕', good: true, fb: '睡前不看屏幕，眼睛和大脑都能好好休息！+20分' }, { icon: '📱', text: '躺床刷手机', good: false, fb: '躺床上看手机对眼睛伤害很大，还影响睡眠。+5分' } ] }
            ];
            var curStep = 0;
            var score = 0;

            function renderStep() {
                if (curStep >= steps.length) {
                    var stars = '', rank = '';
                    if (score >= 75) { stars = '⭐⭐⭐⭐⭐'; rank = '🏆 护眼小能手！'; }
                    else if (score >= 50) { stars = '⭐⭐⭐⭐'; rank = '👍 不错哦，继续加油！'; }
                    else if (score >= 30) { stars = '⭐⭐⭐'; rank = '💪 还差一点点，再试一次吧！'; }
                    else { stars = '⭐⭐'; rank = '😊 别灰心，重新挑战试试！'; }
                    openModal(
                        '<div class="vlab-exp-head">' +
                          '<div class="vlab-exp-icon">🌟</div>' +
                          '<h3>护眼挑战完成！</h3>' +
                        '</div>' +
                        '<div class="vlab-chal-result">' +
                          '<div style="font-size:15px;font-weight:700;color:#555;margin-bottom:8px;">今日护眼分数</div>' +
                          '<div class="vlab-chal-score">' + score + '分</div>' +
                          '<div class="vlab-chal-stars">' + stars + '</div>' +
                          '<div class="vlab-chal-rank">' + rank + '</div>' +
                        '</div>' +
                        '<div class="vlab-xgz-tip">' +
                          '<div class="vlab-xgz-avatar"><img src="assets/images/xiaoguangzi-new.png" alt="小光仔"></div>' +
                          '<div class="vlab-xgz-text">' + (score >= 75 ? '你已经成为真正的护眼小能手啦！' : '没关系，再试一次！这次换个思路看看～') + '</div>' +
                        '</div>' +
                        '<div class="vlab-exp-btns">' +
                          '<button class="vlab-btn-primary" id="chalDoneBtn">✓ 完成实验</button>' +
                          '<button class="vlab-btn-outline" id="chalRetryBtn">🔄 再玩一次</button>' +
                        '</div>'
                    );
                    $('#chalDoneBtn').addEventListener('click', function () { closeModal(); completeTask('challenge'); });
                    $('#chalRetryBtn').addEventListener('click', function () { curStep = 0; score = 0; renderStep(); });
                    return;
                }
                var s = steps[curStep];
                openModal(
                    '<div class="vlab-exp-head">' +
                      '<div class="vlab-exp-icon">🌟</div>' +
                      '<h3>护眼挑战</h3>' +
                      '<p>安排"小光仔的一天"</p>' +
                    '</div>' +
                    '<div class="vlab-chal-progress">第 ' + (curStep + 1) + ' / ' + steps.length + ' 关　当前 ' + score + ' 分</div>' +
                    '<div class="vlab-chal-scene">' +
                      '<div class="vlab-chal-time">' + s.time + '</div>' +
                      '<p style="font-size:14px;color:#555;font-weight:600;margin-bottom:16px;">' + s.label + '</p>' +
                      '<div class="vlab-chal-choices" id="chalChoices">' +
                        s.choices.map(function (c, i) {
                            return '<button class="vlab-chal-choice" data-choice="' + i + '"><span class="vlab-chal-icon">' + c.icon + '</span><span class="vlab-chal-text">' + c.text + '</span></button>';
                        }).join('') +
                      '</div>' +
                      '<div class="vlab-chal-feedback" id="chalFeedback"></div>' +
                    '</div>' +
                    '<div class="vlab-exp-btns" id="chalNextRow" style="display:none;">' +
                      '<button class="vlab-btn-primary" id="chalNextBtn">' + (curStep === steps.length - 1 ? '查看结果 →' : '下一关 →') + '</button>' +
                    '</div>'
                );

                var answered = false;
                $$('.vlab-chal-choice', $modalBody).forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        if (answered) return;
                        answered = true;
                        var idx = parseInt(btn.getAttribute('data-choice'), 10);
                        var choice = s.choices[idx];
                        score += choice.good ? 20 : 5;
                        var $fb = $('#chalFeedback');
                        $fb.innerHTML = choice.fb;
                        $fb.className = 'vlab-chal-feedback show ' + (choice.good ? 'good' : 'bad');
                        $$('.vlab-chal-choice', $modalBody).forEach(function (b) { b.style.pointerEvents = 'none'; b.style.opacity = '0.6'; });
                        btn.style.opacity = '1';
                        btn.style.borderColor = choice.good ? '#43A233' : '#FB8C00';
                        $('#chalNextRow').style.display = 'flex';
                    });
                });

                $('#chalNextBtn').addEventListener('click', function () { curStep++; renderStep(); });
            }
            renderStep();
        }

        /* ---- 初始化 ---- */
        updateUI();
        playStory();

    })();


    // ============================================
    // 中央验光设备外壳（天书解码器）· 定位锚点对齐
    // 保证 .hp-planet-image-area 与 .hp-planet-img 的渲染盒 1:1 重合，
    // 使外壳 .hp-decoder-shell 的「星球 PNG 百分比坐标」精准对应到背景图。
    // ============================================
    (function () {
        var area = document.querySelector('.hp-planet-image-area');
        var img  = document.querySelector('.hp-planet-img');
        if (!area || !img) return;
        function syncAreaToImg() {
            try {
                var frame = area.parentElement;
                if (!frame) return;
                var fb = frame.getBoundingClientRect();
                var ib = img.getBoundingClientRect();
                area.style.left   = (((ib.left - fb.left) / fb.width) * 100).toFixed(5) + '%';
                area.style.top    = 'auto';
                area.style.bottom = (((fb.bottom - ib.bottom) / fb.height) * 100).toFixed(5) + '%';
                area.style.transform = 'none';
                area.style.width  = ((ib.width / fb.width) * 100).toFixed(5) + '%';
                area.style.height = ((ib.height / fb.height) * 100).toFixed(5) + '%';
                area.style.aspectRatio = 'auto';
            } catch (e) { /* 静默：不影响页面其他交互 */ }
        }
        syncAreaToImg();
        window.addEventListener('load', syncAreaToImg);
        window.addEventListener('resize', syncAreaToImg);
        // Hero 入场动画、字体加载后再对齐一次
        setTimeout(syncAreaToImg, 400);
        setTimeout(syncAreaToImg, 1200);
        if (window.ResizeObserver) {
            var ro = new ResizeObserver(syncAreaToImg);
            ro.observe(img);
            if (img.parentElement) ro.observe(img.parentElement);
        }
    })();

    // ============================================
    // 调试信息（控制台提示）
    // ============================================
    console.log('%c🌟 瞳学星球 页面加载完成！',
        'color:#4FAE45;font-size:16px;font-weight:bold;'
    );
    console.log('%c护眼小卫士 · 守护每个孩子的明亮视界',
        'color:#FF9D1E;font-size:12px;font-weight:600;'
    );

});
