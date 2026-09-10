
    // 徽章计数：监听 earned 类变化，更新"已获得 X 枚"
    (function(){
        function updateBadgeCount(){
            var earned = document.querySelectorAll('#amapBadgesList .amap-badge.earned').length;
            var el = document.getElementById('vsBadgeCount');
            if (el) el.textContent = earned;
        }
        updateBadgeCount();
        var list = document.getElementById('amapBadgesList');
        if (list) {
            var observer = new MutationObserver(updateBadgeCount);
            observer.observe(list, { attributes: true, subtree: true, attributeFilter: ['class'] });
        }
    })();

    /* ============================================================
       近视认知区 · 6个误区星球探索
       ============================================================ */
    (function(){
        // 6个误区数据（isCorrectAnswer=false 表示误区，正确答案是"假的"）
        var myopiaMisconceptions = [
            {
                id: 1, num: '01', icon: '👓',
                title: '戴眼镜会加重近视',
                truth: '佩戴合适的眼镜能让眼睛清晰成像，减轻视觉疲劳，并有助于延缓近视进展。',
                tip: '长期不戴眼镜可能因为为了看清而过度调节，加重眼睛疲劳。',
                isMyth: true
            },
            {
                id: 2, num: '02', icon: '📱',
                title: '只有玩电子产品才会导致近视',
                truth: '近视与长时间、高强度的近距离用眼有关。看书、写作业、下棋、画画等同样属于近距离用眼。',
                tip: '控制所有近距离用眼时间，并保证休息。记住"20-20-20"原则：每用眼20分钟，看20英尺（约6米）外的物体20秒。',
                isMyth: true
            },
            {
                id: 3, num: '03', icon: '⚠️',
                title: '近视可以被"治愈"',
                truth: '真性近视发生后，眼轴变长是不可逆的，不能通过普通非手术方式彻底治愈。',
                tip: '确诊后应前往正规医疗机构进行专业验光，并遵医嘱选择合适的矫正和近视防控方式。',
                isMyth: true
            },
            {
                id: 4, num: '04', icon: '🛡️',
                title: '防蓝光眼镜或绿色屏幕能预防近视',
                truth: '目前没有充分科学证据表明防蓝光眼镜能够有效预防近视。屏幕颜色改变也不能替代科学的近视防控。',
                tip: '减少近距离用眼时间，增加户外活动，才是预防近视的关键。',
                isMyth: true
            },
            {
                id: 5, num: '05', icon: '📊',
                title: '近视度数没到600度就没事',
                truth: '近视相关眼底风险与度数呈正相关，风险并不是到了600度才开始。',
                tip: '防控目标不是"守到600度"，而是尽可能延缓眼轴增长、控制最终度数。无论度数高低，都应该重视定期眼科检查。',
                isMyth: true
            },
            {
                id: 6, num: '06', icon: '👀',
                title: '做"眼球操"能恢复视力',
                truth: '普通眼球操主要锻炼眼外肌，不能逆转已经发生的眼轴变化。',
                tip: '大众化眼球操不能治疗近视。特定情况下的视觉训练需要在专业医生或视光师指导下进行。',
                isMyth: true
            }
        ];

        var solvedSet = new Set();
        var totalEnergy = 0;

        // 渲染进度节点
        function renderProgressNodes() {
            var progressNodesEl = document.getElementById('mzProgressNodes');
            if (!progressNodesEl) return;
            progressNodesEl.innerHTML = '';
            for (var i = 0; i < myopiaMisconceptions.length; i++) {
                var node = document.createElement('span');
                node.className = 'mz-node' + (solvedSet.has(i + 1) ? ' done' : '');
                progressNodesEl.appendChild(node);
            }
        }

        // 渲染星球卡片（含内联答题区和真相区）
        function renderPlanets() {
            var planetsEl = document.getElementById('mzPlanets');
            if (!planetsEl) return;
            planetsEl.innerHTML = '';
            myopiaMisconceptions.forEach(function(m){
                var done = solvedSet.has(m.id);
                var planet = document.createElement('div');
                planet.className = 'mz-planet' + (done ? ' done' : '');
                planet.setAttribute('data-id', m.id);
                planet.innerHTML =
                    '<div class="mz-planet-head">' +
                        '<div class="mz-planet-num">' + m.num + '</div>' +
                        '<div class="mz-planet-icon">' + m.icon + '</div>' +
                        '<div class="mz-planet-title">' + m.title + '</div>' +
                        '<div class="mz-planet-status">' + (done ? '✓ 已破解' : '点击探索 →') + '</div>' +
                    '</div>' +
                    '<div class="mz-planet-body" hidden>' +
                        '<div class="mz-quiz">' +
                            '<p class="mz-quiz-question">你觉得这是真的吗？</p>' +
                            '<div class="mz-quiz-btns">' +
                                '<button class="mz-quiz-btn mz-quiz-true" type="button" data-answer="true">✓ 我觉得是真的</button>' +
                                '<button class="mz-quiz-btn mz-quiz-false" type="button" data-answer="false">✕ 我觉得是假的</button>' +
                            '</div>' +
                            '<div class="mz-quiz-feedback" hidden></div>' +
                        '</div>' +
                        '<div class="mz-truth" hidden>' +
                            '<div class="mz-truth-block">' +
                                '<div class="mz-truth-label">🔎 真相揭晓</div>' +
                                '<p class="mz-truth-text"></p>' +
                            '</div>' +
                            '<div class="mz-tip-block">' +
                                '<div class="mz-tip-label">💡 小光仔提醒</div>' +
                                '<p class="mz-tip-text"></p>' +
                            '</div>' +
                            '<div class="mz-reward">' +
                                '<span class="mz-reward-check">✓ 已破解</span>' +
                                '<span class="mz-reward-energy">+10 探索能量</span>' +
                            '</div>' +
                            '<button class="mz-continue-btn" type="button">收起 ↑</button>' +
                        '</div>' +
                    '</div>';
                planetsEl.appendChild(planet);
            });
        }

        // 更新进度
        function updateProgress() {
            var count = solvedSet.size;
            var pct = (count / myopiaMisconceptions.length) * 100;
            var progressFillEl = document.getElementById('mzProgressFill');
            var solvedCountEl = document.getElementById('mzSolvedCount');
            var energyEl = document.getElementById('mzEnergy');
            if (progressFillEl) progressFillEl.style.width = pct + '%';
            if (solvedCountEl) solvedCountEl.textContent = count;
            if (energyEl) energyEl.textContent = '+' + (count * 10);
            totalEnergy = count * 10;
            renderProgressNodes();
            if (count === myopiaMisconceptions.length) {
                setTimeout(showSummary, 600);
            }
        }

        // 切换星球卡片展开/收起
        function togglePlanet(planetEl) {
            var body = planetEl.querySelector('.mz-planet-body');
            if (!body) return;
            var isOpen = !body.hidden;
            // 收起其他已展开的
            var all = document.querySelectorAll('.mz-planet .mz-planet-body');
            all.forEach(function(b){ b.hidden = true; });
            if (isOpen) {
                body.hidden = true;
            } else {
                body.hidden = false;
                // 重置答题区
                var quiz = body.querySelector('.mz-quiz');
                var truth = body.querySelector('.mz-truth');
                var feedback = body.querySelector('.mz-quiz-feedback');
                if (quiz) quiz.hidden = false;
                if (truth) truth.hidden = true;
                if (feedback) {
                    feedback.hidden = true;
                    feedback.className = 'mz-quiz-feedback';
                    feedback.textContent = '';
                }
                var btns = body.querySelectorAll('.mz-quiz-btn');
                btns.forEach(function(b){ b.disabled = false; });
            }
        }

        // 答题判断
        function answerQuiz(planetEl, userAnswer) {
            var id = parseInt(planetEl.getAttribute('data-id'), 10);
            var m = myopiaMisconceptions.find(function(x){ return x.id === id; });
            if (!m) return;
            var correctAnswer = !m.isMyth;
            var isCorrect = (userAnswer === correctAnswer);
            var feedback = planetEl.querySelector('.mz-quiz-feedback');
            var truth = planetEl.querySelector('.mz-truth');
            var truthText = planetEl.querySelector('.mz-truth-text');
            var tipText = planetEl.querySelector('.mz-tip-text');
            var bubbleEl = document.getElementById('mzBubble');
            var assistantEl = document.getElementById('mzAssistant');

            var btns = planetEl.querySelectorAll('.mz-quiz-btn');
            btns.forEach(function(b){ b.disabled = true; });

            if (feedback) {
                feedback.hidden = false;
                feedback.className = 'mz-quiz-feedback ' + (isCorrect ? 'correct' : 'wrong');
                feedback.textContent = isCorrect
                    ? '正确！你破解了一个近视误区 🌟'
                    : '差一点！看看小光仔怎么说～';
            }

            if (bubbleEl) {
                bubbleEl.innerHTML = isCorrect
                    ? '太棒啦！又破解一个！⭐'
                    : '没关系，看看真相是什么吧～';
            }
            if (assistantEl) assistantEl.classList.add('show-bubble');
            setTimeout(function(){ if(assistantEl) assistantEl.classList.remove('show-bubble'); }, 3000);

            setTimeout(function(){
                if (truthText) truthText.textContent = m.truth;
                if (tipText) tipText.textContent = m.tip;
                if (truth) truth.hidden = false;
                if (!solvedSet.has(m.id)) {
                    solvedSet.add(m.id);
                    renderPlanets();
                    updateProgress();
                }
            }, 800);
        }

        // 显示完成总结
        function showSummary() {
            var summaryEl = document.getElementById('mzSummary');
            var summaryEnergyEl = document.getElementById('mzSummaryEnergy');
            if (summaryEnergyEl) summaryEnergyEl.textContent = totalEnergy;
            if (summaryEl) {
                summaryEl.hidden = false;
                summaryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // 重新挑战
        function retry() {
            solvedSet.clear();
            totalEnergy = 0;
            var summaryEl = document.getElementById('mzSummary');
            var bubbleEl = document.getElementById('mzBubble');
            if (summaryEl) summaryEl.hidden = true;
            renderPlanets();
            updateProgress();
            if (bubbleEl) bubbleEl.innerHTML = '准备好了吗？<br>我们再来一次吧！✨';
        }

        // 绑定事件（事件委托：星球卡片由 JS 动态生成）
        var mzRetryBtn = document.getElementById('mzRetryBtn');
        if (mzRetryBtn) mzRetryBtn.addEventListener('click', retry);
        var mzBackBtn = document.getElementById('mzBackBtn');
        if (mzBackBtn) mzBackBtn.addEventListener('click', function(){
            var explore = document.querySelector('.vs-explore');
            if (explore) explore.scrollIntoView({behavior:'smooth'});
        });

        // 星球容器委托：处理星球头部点击（展开/收起）、答题按钮点击、收起按钮
        var planetsEl = document.getElementById('mzPlanets');
        if (planetsEl) {
            planetsEl.addEventListener('click', function(e){
                var planetEl = e.target.closest('.mz-planet');
                if (!planetEl) return;
                // 点击答题按钮
                var quizBtn = e.target.closest('.mz-quiz-btn');
                if (quizBtn) {
                    e.stopPropagation();
                    answerQuiz(planetEl, quizBtn.getAttribute('data-answer') === 'true');
                    return;
                }
                // 点击收起按钮
                var continueBtn = e.target.closest('.mz-continue-btn');
                if (continueBtn) {
                    e.stopPropagation();
                    var body = planetEl.querySelector('.mz-planet-body');
                    if (body) body.hidden = true;
                    return;
                }
                // 点击星球头部 → 展开/收起
                if (e.target.closest('.mz-planet-head')) {
                    togglePlanet(planetEl);
                }
            });
        }

        // 小光仔点击显示气泡
        var assistantElNow = document.getElementById('mzAssistant');
        if (assistantElNow) {
            assistantElNow.addEventListener('click', function(){
                assistantElNow.classList.toggle('show-bubble');
            });
        }

        // 初始化
        renderProgressNodes();
        renderPlanets();
        updateProgress();
    })();

    /* ============================================================
       眼镜星球探索馆
       ============================================================ */
    (function(){
        var LENS_DATA = {
            resin: {
                icon:'🌱',
                title:'树脂镜片星球',
                tip:'日常学习首选',
                img:'../配图/镜片/树脂镜片.jpg',
                features: ['轻便不压鼻', '透光率高', '防紫外线', '不容易碎'],
                text:'树脂镜片是用特殊树脂材料做的，就像透明的果冻一样有弹性。它很轻很轻，戴一整天鼻子也不会累。而且它还能挡住有害的紫外线，保护我们的眼睛。现在大多数小朋友戴的眼镜都是树脂镜片哦！',
                suit:'适合：上学、看书、日常佩戴'
            },
            pc: {
                icon:'🚀',
                title:'PC太空镜片星球',
                tip:'运动抗冲击',
                img:'../配图/镜片/PC镜片.jpg',
                features: ['超级抗冲击', '轻如羽毛', '安全不易碎', '运动好伙伴'],
                text:'PC镜片又叫"太空镜片"，它是用和宇航员头盔一样的材料做的！它超级耐摔，就算掉在地上也不容易碎，特别安全。而且它比树脂镜片还要轻，喜欢运动的小朋友选它就对啦！',
                suit:'适合：打球、跑步、运动玩耍'
            },
            glass: {
                icon:'💎',
                title:'玻璃镜片星球',
                tip:'耐磨但较重',
                img:'../配图/镜片/玻璃镜片.jpg',
                features: ['超级耐磨', '清晰度高', '不容易刮花', '重量较大'],
                text:'玻璃镜片就像玻璃窗户一样，是用真正的玻璃做的。它的优点是非常耐磨，不容易被刮花，看东西也特别清晰。但是它比较重，戴久了鼻子会有点酸，而且摔碎了会很危险。所以现在很少用啦！',
                suit:'适合：特殊需求人群'
            }
        };
        var FRAME_DATA = {
            rim:    { icon:'⭕', title:'镜圈', tip:'决定外观', text:'决定眼镜外观，也影响镜片厚度。' },
            bridge: { icon:'➖', title:'中梁', tip:'连接左右', text:'连接左右镜圈，提高稳定性。' },
            nose:   { icon:'👃', title:'鼻托', tip:'支撑重量', text:'支撑眼镜重量，提高舒适度。' },
            temple: { icon:'🦵', title:'镜腿', tip:'固定眼镜', text:'固定眼镜，分散重量。' }
        };
        var DEGREE_MAP = {
            low:   { lens:'1.56镜片', label:'200度以内' },
            mid:   { lens:'1.60镜片', label:'200-400度' },
            high:  { lens:'1.67镜片', label:'400-600度' },
            ultra: { lens:'1.71/1.74镜片', label:'600度以上' }
        };
        var SCENE_MAP = {
            study:  { name:'学习', frame:'TR90轻量镜架', reason:'长时间看书学习，需要轻便不累鼻' },
            sport:  { name:'运动', frame:'硅胶防滑镜架', reason:'运动时容易出汗，防滑镜架更稳固' },
            screen: { name:'长时间用电子', frame:'钛合金轻量镜架', reason:'长时间佩戴，钛架轻且不易过敏' }
        };
        var FACE_MAP = {
            round:   { label:'圆脸', frame:'方形镜框' },
            square:  { label:'方脸', frame:'圆润椭圆镜框' },
            long:    { label:'长脸', frame:'高度较大的镜框' },
            diamond: { label:'菱形脸', frame:'下宽型镜框' }
        };
        var LENS_MATERIAL = {
            sport: 'PC太空镜片',
            screen: '防蓝光树脂镜片',
            study: '树脂镜片',
            default: '树脂镜片'
        };
        var Q_ANSWERS = {
            student: '学生党推荐树脂镜片哦！轻便、透光好，还能防紫外线，长时间看书也不累～',
            high:    '高度近视（600度以上）建议选择 1.71 或 1.74 的高折射率镜片，这样镜片更薄更美观，也更轻哦！',
            frame:   '想要舒服的镜架？试试钛架吧！重量轻、弹性好、还不容易过敏，长时间佩戴也舒适～'
        };

        var $modal = document.getElementById('gpModal');
        var $mIcon = document.getElementById('gpModalIcon');
        var $mTitle = document.getElementById('gpModalTitle');
        var $mText = document.getElementById('gpModalText');
        var $mTip = document.getElementById('gpModalTip');
        var $mImgWrap = document.getElementById('gpModalImgWrap');
        var $mImg = document.getElementById('gpModalImg');
        var $mFeatures = document.getElementById('gpModalFeatures');
        var $mSuit = document.getElementById('gpModalSuit');

        function openModal(data){
            $mIcon.textContent = data.icon;
            $mTitle.textContent = data.title;
            $mText.textContent = data.text;
            $mTip.textContent = data.tip;

            // 图片
            if(data.img){
                $mImg.src = data.img;
                $mImg.alt = data.title;
                $mImgWrap.hidden = false;
            } else {
                $mImgWrap.hidden = true;
            }

            // 特点标签
            if(data.features && data.features.length){
                var html = '';
                data.features.forEach(function(f){
                    html += '<span class="gp-modal-feat">✨ ' + f + '</span>';
                });
                $mFeatures.innerHTML = html;
                $mFeatures.hidden = false;
            } else {
                $mFeatures.hidden = true;
            }

            // 适用场景
            if(data.suit){
                $mSuit.textContent = data.suit;
                $mSuit.hidden = false;
            } else {
                $mSuit.hidden = true;
            }

            $modal.hidden = false;
            createSparkle(window.innerWidth/2, window.innerHeight/2);
        }
        function closeModal(){ $modal.hidden = true; }

        /* 镜片星球点击 */
        document.querySelectorAll('.gp-lens-planet').forEach(function(el){
            el.addEventListener('click', function(){
                openModal(LENS_DATA[el.dataset.lens]);
            });
        });

        /* 镜架：SVG部位点击 + 按钮点击联动 */
        var $ggTip = document.getElementById('gpGgTip');
        function highlightFrame(part){
            document.querySelectorAll('.gp-gg-part').forEach(function(p){ p.classList.remove('active'); });
            document.querySelectorAll('.gp-gg-part[data-part="'+part+'"]').forEach(function(p){ p.classList.add('active'); });
            document.querySelectorAll('.gp-frame-btn').forEach(function(b){ b.classList.remove('active'); });
            var btn = document.querySelector('.gp-frame-btn[data-frame="'+part+'"]');
            if(btn) btn.classList.add('active');
            var d = FRAME_DATA[part];
            $ggTip.textContent = d.title + '：' + d.text;
            openModal(d);
        }
        document.querySelectorAll('.gp-gg-part').forEach(function(el){
            el.addEventListener('click', function(){ highlightFrame(el.dataset.part); });
        });
        document.querySelectorAll('.gp-frame-btn').forEach(function(el){
            el.addEventListener('click', function(){ highlightFrame(el.dataset.frame); });
        });

        document.getElementById('gpModalClose').addEventListener('click', closeModal);
        document.getElementById('gpModalOverlay').addEventListener('click', closeModal);

        /* 专属眼镜推荐 - 4步 */
        var $result = document.getElementById('gpResult');
        function getChecked(name){
            var r = document.querySelector('input[name="'+name+'"]:checked');
            return r ? r.value : '';
        }
        document.getElementById('gpRecommendBtn').addEventListener('click', function(){
            var degree = getChecked('gpDegree');
            var scene = getChecked('gpScene');
            var face = getChecked('gpFace');
            if(!degree){
                $result.hidden = false;
                $result.style.borderColor = 'rgba(255,152,0,0.5)';
                $result.innerHTML = '<div class="gp-result-title" style="color:#ffb74d">⚠️ 请先选择近视度数</div><div style="text-align:center;color:#ffe0b2">完成第一步再生成报告哦～</div>';
                return;
            }
            var deg = DEGREE_MAP[degree];
            var sc = scene ? SCENE_MAP[scene] : SCENE_MAP.study;
            var fc = face ? FACE_MAP[face] : null;
            var lensMat = LENS_MATERIAL[scene] || LENS_MATERIAL.default;

            var html = '<div class="gp-result-title">🎁 我的专属眼镜报告</div>';
            html += '<div class="gp-result-row"><span class="gp-result-tag">度数</span><span class="gp-result-val">'+deg.label+'</span></div>';
            html += '<div class="gp-result-row"><span class="gp-result-tag">镜片</span><span class="gp-result-val">'+deg.lens+' · '+lensMat+'</span></div>';
            html += '<div class="gp-result-row"><span class="gp-result-tag">镜架</span><span class="gp-result-val">'+sc.frame+'</span></div>';
            if(fc){
                html += '<div class="gp-result-row"><span class="gp-result-tag">脸型</span><span class="gp-result-val">'+fc.label+' → '+fc.frame+'</span></div>';
            }
            html += '<div class="gp-result-reason">💡 推荐理由：'+deg.lens+'适合'+deg.label+'，搭配'+sc.frame+'，'+sc.reason+'。'+(fc?'你的'+fc.label+'适合'+fc.frame+'，更修饰脸型。':'')+'</div>';
            $result.hidden = false;
            $result.style.borderColor = 'rgba(165,232,90,0.5)';
            $result.innerHTML = html;
        });

        /* 小光仔讲解对话框 */
        var $chat = document.getElementById('gpChat');
        var $bubble = document.getElementById('gpChatBubble');
        var DEFAULT_MSG = '嘿！你知道吗？<br>镜片不是越贵越好，<br>选择适合自己的才最重要哦！';

        document.getElementById('gpAssistant').addEventListener('click', function(){
            $bubble.innerHTML = DEFAULT_MSG;
            $chat.hidden = false;
        });
        document.getElementById('gpChatClose').addEventListener('click', function(){ $chat.hidden = true; });
        document.getElementById('gpChatOverlay').addEventListener('click', function(){ $chat.hidden = true; });

        document.querySelectorAll('.gp-q-btn').forEach(function(btn){
            btn.addEventListener('click', function(){
                $bubble.innerHTML = Q_ANSWERS[btn.dataset.q] || DEFAULT_MSG;
            });
        });

        /* 自由问答 · Groq API（完全免费，无需信用卡，每天14400次） */
        var GROQ_API_KEY = 'gsk_' + 'PLACEHOLDER';
        var GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

        var $input = document.getElementById('gpChatInput');
        var $sendBtn = document.getElementById('gpChatSend');

        var SYS_PROMPT = '你是"小光仔"，瞳学星球的护眼精灵助手。你精通儿童眼健康、近视防控、眼镜知识、配镜流程等领域。'
            + '请用亲切、活泼、简短的语气回答问题，像和朋友聊天一样。回答控制在3句话以内，通俗易懂，适合青少年阅读。'
            + '如果问题与眼睛无关，礼貌引导回到护眼话题。';

        function askAI(question){
            if(GROQ_API_KEY === 'gsk_PLACEHOLDER'){
                $bubble.innerHTML = '小光仔还需要主人配置Groq API Key才能联网回答哦～<br>免费获取：console.groq.com/keys';
                return;
            }
            $sendBtn.disabled = true;
            $sendBtn.textContent = '...';
            $bubble.innerHTML = '小光仔正在思考<span class="gp-chat-loading">...</span>';

            fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + GROQ_API_KEY
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: SYS_PROMPT },
                        { role: 'user', content: question }
                    ],
                    max_tokens: 200,
                    temperature: 0.7
                })
            })
            .then(function(r){ return r.json(); })
            .then(function(data){
                var reply = '';
                try {
                    reply = data.choices[0].message.content;
                } catch(e) {}
                $bubble.textContent = reply || '抱歉，我没听清楚，再问一次吧～';
                $sendBtn.disabled = false;
                $sendBtn.textContent = '发送';
            })
            .catch(function(){
                $bubble.innerHTML = '网络开小差了，稍后再试一下吧～ 🌟';
                $sendBtn.disabled = false;
                $sendBtn.textContent = '发送';
            });
        }

        $sendBtn.addEventListener('click', function(){
            var q = $input.value.trim();
            if(q){
                askAI(q);
                $input.value = '';
            }
        });
        $input.addEventListener('keydown', function(e){
            if(e.key === 'Enter'){
                var q = $input.value.trim();
                if(q){
                    askAI(q);
                    $input.value = '';
                }
            }
        });

        /* 点击星光特效 */
        function createSparkle(x, y){
            for(var i=0;i<6;i++){
                var s = document.createElement('div');
                var angle = (Math.PI*2/6)*i;
                var dist = 30 + Math.random()*20;
                s.style.cssText = 'position:fixed;width:8px;height:8px;border-radius:50%;'+
                    'background:radial-gradient(circle,#fff,rgba(165,232,90,.9) 40%,transparent 70%);'+
                    'pointer-events:none;z-index:9999;left:'+(x-4)+'px;top:'+(y-4)+'px;'+
                    'box-shadow:0 0 8px #a5e85a;transition:transform .5s ease,opacity .5s ease;';
                document.body.appendChild(s);
                (function(star, a, d){
                    requestAnimationFrame(function(){
                        star.style.transform = 'translate('+Math.cos(a)*d+'px,'+Math.sin(a)*d+'px) scale(0)';
                        star.style.opacity = '0';
                    });
                })(s, angle, dist);
                setTimeout(function(el){ el.remove(); }.bind(null,s), 500);
            }
        }
        document.querySelectorAll('.gp-lens-planet, .gp-gg-part, .gp-frame-btn, .gp-custom-btn, .gp-opt').forEach(function(el){
            el.addEventListener('click', function(e){
                createSparkle(e.clientX, e.clientY);
            });
        });

        /* ESC 关闭弹窗 */
        document.addEventListener('keydown', function(e){
            if(e.key === 'Escape'){
                closeModal();
                $chat.hidden = true;
            }
        });
    })();

    /* ============================================================
       视界探索站 · 星球探索进度联动
       ============================================================ */
    (function(){
        var LEVELS = [
            { name: '护眼新手', icon: '🌱' },
            { name: '护眼学徒', icon: '🌿' },
            { name: '护眼达人', icon: '🌳' },
            { name: '护眼专家', icon: '👁️' },
            { name: '视界守护者', icon: '👑' }
        ];
        var explored = {}; // zone -> true

        var $energy = document.getElementById('amapEnergyText');
        var $progress = document.getElementById('amapProgressText');
        var $fill = document.getElementById('amapProgressFill');
        var $levelName = document.getElementById('amapLevelText');
        var $levelIcon = document.querySelector('.vs-level-icon');
        var $reset = document.getElementById('amapResetBtn');
        var $home = document.getElementById('amapHomeBtn');

        function updateStats(){
            var count = Object.keys(explored).length;
            if($energy) $energy.textContent = String(count * 10);
            if($progress) $progress.textContent = count + ' / 4';
            if($fill) $fill.style.width = (count / 4 * 100) + '%';
            var lv = LEVELS[count] || LEVELS[0];
            if($levelName) $levelName.textContent = lv.name;
            if($levelIcon) $levelIcon.textContent = lv.icon;
        }

        // 给四个星球节点绑定探索事件
        document.querySelectorAll('.vs-map-node').forEach(function(node){
            var zone = node.getAttribute('data-zone');
            var btn = node.querySelector('.vs-node-btn');
            function markExplored(){
                if(!explored[zone]){
                    explored[zone] = true;
                    updateStats();
                }
            }
            if(btn) btn.addEventListener('click', markExplored);
            // 点击星球本体也算探索
            node.addEventListener('click', markExplored);
        });

        if($reset){
            $reset.addEventListener('click', function(){
                explored = {};
                updateStats();
            });
        }
        if($home){
            $home.addEventListener('click', function(){
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        updateStats();
    })();

    /* ============================================================
       配镜星际任务站
       ============================================================ */
    (function(){
        var STEPS = [
            {
                step: 1, icon: '🔍', title: '问诊与基础检查', eyebrow: '第1站 · 眼睛检查站',
                xgzSay: '配眼镜前，要先了解你的眼睛情况哦！',
                tasks: [
                    '告诉验光师：年龄、用眼习惯、旧眼镜感受',
                    '测量：裸眼视力、矫正视力',
                    '记录：主导眼、瞳距等重要数据'
                ],
                guideMsg: '第一关是基础检查，让验光师了解你的眼睛～'
            },
            {
                step: 2, icon: '🤖', title: '电脑验光', eyebrow: '第2站 · 智能验光舱',
                xgzSay: '小机器会快速测出你的近视、远视和散光初步数据。',
                warn: '电脑验光只是参考，不能直接拿来配眼镜哦！',
                guideMsg: '电脑验光只是第一步，还要精细调试呢～'
            },
            {
                step: 3, icon: '🎯', title: '精细主观验光', eyebrow: '第3站 · 精准调试实验室',
                xgzSay: '这是最重要的一步，我们一起找到最舒服的清晰度！',
                tasks: [
                    '散光检查：确定散光度数和方向',
                    '球镜调整：找到最舒服的清晰度',
                    '双眼平衡：让两只眼睛一起工作更舒服'
                ],
                lensTest: true,
                guideMsg: '马上进入精准验光环节，这是最关键的一步！'
            },
            {
                step: 4, icon: '👓', title: '试戴与生成处方', eyebrow: '第4站 · 眼镜试戴空间',
                xgzSay: '戴上新眼镜前，一定要先体验一下！',
                tasks: [
                    '看远处：确认远距离清晰度',
                    '看近处：阅读、写字是否舒适',
                    '走动感受：走路、上下楼梯是否头晕'
                ],
                rx: true,
                guideMsg: '最后一步！试戴后就能拿到你的配镜处方啦～'
            }
        ];

        var currentStep = 0;
        var doneSteps = {};

        /* 配镜视频播放控制 */
        (function() {
            var v = document.getElementById('glassesFlowVideo');
            var overlay = document.getElementById('mzVideoOverlay');
            var playBtn = document.getElementById('mzPlayBtn');
            var controls = document.getElementById('mzVideoControls');
            var muteBtn = document.getElementById('mzVideoMute');
            var backBtn = document.getElementById('mzVideoBack');
            if (!v || !overlay || !playBtn || !controls || !muteBtn || !backBtn) return;
            v.controls = false;
            v.defaultMuted = false;
            v.muted = false;
            v.volume = 1;
            function startPlay() {
                overlay.classList.add('is-hidden');
                controls.classList.add('is-show');
                v.play().catch(function() {
                    overlay.classList.remove('is-hidden');
                    playBtn.textContent = '点击重试播放';
                });
            }
            var pauseBtn = document.createElement('button');
            pauseBtn.className = 'mz-video-control';
            pauseBtn.type = 'button';
            pauseBtn.textContent = '暂停';
            controls.appendChild(pauseBtn);
            pauseBtn.addEventListener('click', function() { if(v.paused) startPlay(); else v.pause(); });
            v.addEventListener('play', function(){ pauseBtn.textContent='暂停'; });
            v.addEventListener('pause', function(){ pauseBtn.textContent='播放'; });
            v.addEventListener('error', function(){ overlay.classList.remove('is-hidden'); playBtn.textContent='视频暂时无法播放，点击重试'; });
            document.addEventListener('visibilitychange', function(){ if(document.hidden) v.pause(); });
            playBtn.addEventListener('click', function(e) { e.stopPropagation(); startPlay(); });
            overlay.addEventListener('click', startPlay);
            muteBtn.addEventListener('click', function() {
                v.muted = !v.muted;
                muteBtn.setAttribute('aria-pressed', String(v.muted));
                muteBtn.textContent = v.muted ? '🔇 取消静音' : '🔊 静音';
            });
            backBtn.addEventListener('click', function() {
                v.pause();
                controls.classList.remove('is-show');
                overlay.classList.remove('is-hidden');
                document.getElementById('mzMap').scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            v.addEventListener('ended', function() {
                controls.classList.remove('is-show');
                overlay.classList.remove('is-hidden');
            });
        })();

        var $modal = document.getElementById('mzModal');
        var $mIcon = document.getElementById('mzModalIcon');
        var $mTitle = document.getElementById('mzModalTitle');
        var $mEyebrow = document.getElementById('mzModalEyebrow');
        var $mXgz = document.getElementById('mzModalXgzSay');
        var $mBody = document.getElementById('mzModalBody');
        var $prevBtn = document.getElementById('mzPrevBtn');
        var $nextBtn = document.getElementById('mzNextBtn');
        var $doneBtn = document.getElementById('mzDoneBtn');
        var $stars = document.querySelectorAll('.mz-star');
        var $guideBubble = document.getElementById('mzGuideBubble');
        var $guide = document.getElementById('mzGuide');

        function openStep(step){
            currentStep = step;
            var s = STEPS[step - 1];
            $mIcon.textContent = s.icon;
            $mTitle.textContent = s.title;
            $mEyebrow.textContent = s.eyebrow;
            $mXgz.textContent = '小光仔：' + s.xgzSay;

            var html = '';
            if(s.tasks){
                html += s.tasks.map(function(t, i){
                    return '<div class="mz-task"><span class="mz-task-num">'+(i+1)+'</span><span>'+t+'</span></div>';
                }).join('');
            }
            if(s.warn){
                html += '<div class="mz-warn">⚠️ '+s.warn+'</div>';
            }
            if(s.lensTest){
                html += '<div class="mz-lens-test">'+
                    '<button class="mz-lens-btn" data-lens="-2.00">低度片</button>'+
                    '<button class="mz-lens-btn" data-lens="-3.50">中度片</button>'+
                    '<button class="mz-lens-btn" data-lens="-5.00">高度片</button>'+
                    '</div>'+
                    '<div class="mz-lens-result blur" id="mzLensResult">👁️ 现在看远处有点模糊…</div>';
            }
            if(s.rx){
                html += '<div class="mz-rx-card">'+
                    '<div class="mz-rx-title">📋 我的配镜处方卡</div>'+
                    '<div class="mz-rx-grid">'+
                    '<div class="mz-rx-item"><span>球镜 SPH</span><span>-3.50</span></div>'+
                    '<div class="mz-rx-item"><span>柱镜 CYL</span><span>-0.75</span></div>'+
                    '<div class="mz-rx-item"><span>轴位 AXIS</span><span>180°</span></div>'+
                    '<div class="mz-rx-item"><span>瞳距 PD</span><span>62mm</span></div>'+
                    '</div>'+
                    '<div class="mz-rx-note">* 示例数据，实际处方以专业验光师为准</div>'+
                    '</div>';
            }
            $mBody.innerHTML = html;
            $modal.hidden = false;

            // 按钮状态
            $prevBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
            $nextBtn.style.visibility = step === 4 ? 'hidden' : 'visible';
            $doneBtn.textContent = doneSteps[step] ? '✓ 已完成' : '✓ 完成本站';

            // 镜片测试交互
            if(s.lensTest){
                var $result = document.getElementById('mzLensResult');
                document.querySelectorAll('.mz-lens-btn').forEach(function(btn){
                    btn.addEventListener('click', function(){
                        document.querySelectorAll('.mz-lens-btn').forEach(function(b){ b.classList.remove('active'); });
                        btn.classList.add('active');
                        var lens = btn.dataset.lens;
                        $result.classList.remove('blur');
                        $result.innerHTML = '🌟 现在看远处 '+lens+' 度，清晰多啦！';
                        sparkle(window.innerWidth/2, window.innerHeight/2);
                    });
                });
            }

            // 小光仔气泡提示当前关卡
            var s = STEPS[step - 1];
            $guideBubble.innerHTML = '小光仔：<br>' + (s.guideMsg || '点击「完成本站」继续冒险吧！');
        }

        function closeModal(){ $modal.hidden = true; }

        function updateProgress(){
            var count = Object.keys(doneSteps).length;
            $stars.forEach(function(s, i){
                s.classList.toggle('active', i < count);
                s.textContent = i < count ? '★' : '☆';
            });
            // 全部完成 → 轨道点亮
            var orbit = document.getElementById('mzOrbitLine');
            if(orbit) orbit.classList.toggle('lit', count === 4);
        }

        function sparkle(x, y){
            for(var i=0;i<8;i++){
                var s = document.createElement('div');
                var a = (Math.PI*2/8)*i;
                var d = 35 + Math.random()*25;
                s.style.cssText = 'position:fixed;width:7px;height:7px;border-radius:50%;'+
                    'background:radial-gradient(circle,#fff,rgba(165,232,90,.9) 40%,transparent 70%);'+
                    'pointer-events:none;z-index:9999;left:'+(x-3.5)+'px;top:'+(y-3.5)+'px;'+
                    'box-shadow:0 0 8px #a5e85a;transition:transform .5s ease,opacity .5s ease;';
                document.body.appendChild(s);
                (function(el, ang, dist){
                    requestAnimationFrame(function(){
                        el.style.transform = 'translate('+Math.cos(ang)*dist+'px,'+Math.sin(ang)*dist+'px) scale(0)';
                        el.style.opacity = '0';
                    });
                })(s, a, d);
                setTimeout(function(el){ el.remove(); }.bind(null, s), 500);
            }
        }

        /* 星球点击 */
        document.querySelectorAll('.mz-planet[data-step]').forEach(function(p){
            p.addEventListener('click', function(){
                var stepNum = parseInt(p.dataset.step);
                if(isNaN(stepNum) || stepNum < 1 || stepNum > STEPS.length) return;
                openStep(stepNum);
            });
        });

        $prevBtn.addEventListener('click', function(){ if(currentStep > 1) openStep(currentStep - 1); });
        $nextBtn.addEventListener('click', function(){ if(currentStep < 4) openStep(currentStep + 1); });
        document.getElementById('mzModalClose').addEventListener('click', closeModal);
        document.getElementById('mzModalOverlay').addEventListener('click', closeModal);

        /* 完成本站 */
        $doneBtn.addEventListener('click', function(){
            if(doneSteps[currentStep]){ closeModal(); return; }
            doneSteps[currentStep] = true;
            var planet = document.querySelector('.mz-planet[data-step="'+currentStep+'"]');
            planet.classList.add('done');
            updateProgress();

            var s = STEPS[currentStep - 1];
            $guideBubble.innerHTML = (currentStep === 4 ? '全部完成啦！你真是配镜小达人！🏆' : '第'+currentStep+'关完成啦！'+s.guideMsg);
            $guide.classList.add('show-bubble');
            setTimeout(function(){ $guide.classList.remove('show-bubble'); }, 4000);

            sparkle(window.innerWidth/2, window.innerHeight/2);
            $doneBtn.textContent = '✓ 已完成';

            // 全部完成 → 徽章
            if(Object.keys(doneSteps).length === 4){
                setTimeout(function(){
                    closeModal();
                    document.getElementById('mzBadge').hidden = false;
                }, 800);
            } else {
                setTimeout(closeModal, 1200);
            }
        });

        /* 徽章 */
        var $badge = document.getElementById('mzBadge');
        document.getElementById('mzBadgeClose').addEventListener('click', function(){ $badge.hidden = true; });
        document.getElementById('mzBadgeOverlay').addEventListener('click', function(){ $badge.hidden = true; });
        document.getElementById('mzBadgeRecord').addEventListener('click', function(){
            $badge.hidden = true;
            // 打开配镜小助手
            var card = document.getElementById('lensAssistantCard');
            if(card) card.scrollIntoView({behavior:'smooth'});
            setTimeout(function(){
                // 触发配镜小助手弹窗打开
                var openBtn = document.querySelector('#lensAssistantCard .vs-node-btn');
                if(openBtn) openBtn.click();
            }, 600);
        });

        /* ESC */
        document.addEventListener('keydown', function(e){
            if(e.key === 'Escape'){ closeModal(); $badge.hidden = true; }
        });

        /* 卡片按钮跳转 */
        var cardBtn = document.querySelector('.vs-explore-card.vs-explore-gold .vs-explore-btn');
        if(cardBtn){
            cardBtn.addEventListener('click', function(){
                document.getElementById('missionZone').scrollIntoView({behavior:'smooth'});
            });
        }
    })();

    /* ============================================================
       配镜小助手 · 配镜记录
       ============================================================ */
    (function(){
        var STORAGE_KEY = 'lensAssistantRecords';
        var $card = document.getElementById('lensAssistantCard');
        var $modal = document.getElementById('lensModal');
        var $overlay = document.getElementById('lensOverlay');
        var $close = document.getElementById('lensClose');
        var $form = document.getElementById('lensForm');
        var $xgz = document.getElementById('lensXgz');
        var $toast = document.getElementById('lensToast');
        var $list = document.getElementById('lensArchiveList');
        var $empty = document.getElementById('lensArchiveEmpty');

        function getRecords(){
            try {
                return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            } catch(e){ return []; }
        }
        function saveRecords(list){
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        }
        function fmt(v){ return v === '' || v == null ? '—' : v; }

        // 渲染视界档案卡
        function renderArchive(){
            var records = getRecords().slice().sort(function(a,b){
                return (b.date||'').localeCompare(a.date||'');
            });
            if (records.length === 0){
                $empty.style.display = 'block';
                $list.innerHTML = '';
                return;
            }
            $empty.style.display = 'none';
            $list.innerHTML = records.map(function(r){
                return '<div class="lens-archive-item">' +
                    '<div class="lens-archive-date">📅 ' + fmt(r.date) + '</div>' +
                    '<div class="lens-archive-eyes">' +
                        '<div class="lens-archive-eye"><b>左眼</b><br>SPH ' + fmt(r.lSph) +
                        ' · CYL ' + fmt(r.lCyl) + ' · AXIS ' + fmt(r.lAxis) + '</div>' +
                        '<div class="lens-archive-eye"><b>右眼</b><br>SPH ' + fmt(r.rSph) +
                        ' · CYL ' + fmt(r.rCyl) + ' · AXIS ' + fmt(r.rAxis) + '</div>' +
                    '</div>' +
                    '<div class="lens-archive-meta"><b>镜片：</b>' + fmt(r.lensType) +
                    (r.store ? '　<b>地点：</b>' + r.store : '') +
                    (r.note ? '<br><b>备注：</b>' + r.note : '') + '</div>' +
                '</div>';
            }).join('');
        }

        // 打开弹窗
        function openModal(){
            $modal.hidden = false;
            renderArchive();
            // 默认今天日期
            var $date = document.getElementById('lensDate');
            if ($date && !$date.value) {
                var d = new Date();
                $date.value = d.getFullYear() + '-' +
                    String(d.getMonth()+1).padStart(2,'0') + '-' +
                    String(d.getDate()).padStart(2,'0');
            }
        }
        function closeModal(){ $modal.hidden = true; }

        // 小光仔弹跳动画
        function bounceXgz(){
            if (!$xgz) return;
            $xgz.classList.remove('bounce');
            void $xgz.offsetWidth;
            $xgz.classList.add('bounce');
        }

        // 保存成功提示
        function showToast(){
            $toast.hidden = false;
            setTimeout(function(){ $toast.hidden = true; }, 2200);
        }

        // 表单提交
        if ($form) {
            $form.addEventListener('submit', function(e){
                e.preventDefault();
                var record = {
                    date: document.getElementById('lensDate').value,
                    lSph: document.getElementById('lensLSph').value,
                    lCyl: document.getElementById('lensLCyl').value,
                    lAxis: document.getElementById('lensLAxis').value,
                    rSph: document.getElementById('lensRSph').value,
                    rCyl: document.getElementById('lensRCyl').value,
                    rAxis: document.getElementById('lensRAxis').value,
                    lensType: document.getElementById('lensLensType').value,
                    store: document.getElementById('lensStore').value.trim(),
                    note: document.getElementById('lensNote').value.trim()
                };
                var list = getRecords();
                list.push(record);
                saveRecords(list);
                renderArchive();
                $form.reset();
                bounceXgz();
                showToast();
            });
        }

        // 事件绑定
        if ($card) $card.addEventListener('click', openModal);
        if ($overlay) $overlay.addEventListener('click', closeModal);
        if ($close) $close.addEventListener('click', closeModal);
        document.addEventListener('keydown', function(e){
            if (e.key === 'Escape' && $modal && !$modal.hidden) closeModal();
        });
    })();
    
