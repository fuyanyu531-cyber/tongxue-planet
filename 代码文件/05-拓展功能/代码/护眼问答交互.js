
    (function () {
        /* ============================================================
           小光仔 AI 助手 · 自由问答（接入真实 AI 接口）
           ============================================================ */

        // ============ AI 智能体配置 ============
        // 多 API 备选，确保免费可用
        var AI_PROVIDERS = [
            {
                name: 'FreeAPI',
                endpoint: 'https://openai.good.hidns.vip/v1/chat/completions',
                key: 'https://github.com/smanx/free-api',
                models: ['moonshotai/kimi-k3', 'openai/gpt-oss-20b']
            },
            {
                name: 'OVHcloud',
                endpoint: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
                key: '',
                models: ['Qwen3-32B', 'gpt-oss-20b']
            }
        ];
        var SYSTEM_PROMPT = '你是「小光仔」，一个亲切可爱、活泼有趣的护眼AI助手，专门为6到15岁的小朋友解答关于眼睛、视力和护眼的问题。' +
            '你的语气要像好朋友一样热情，回答要简短易懂，千万不要用医学专业长篇大论。' +
            '可以适当使用可爱的emoji增加趣味性。每次回答先热情回应小朋友，再用简单通俗的语言解释，最后可以给一个小小的护眼小建议。';

        // ============ 本地护眼知识库（不依赖网络，确保问答永远可用）============
        var KNOWLEDGE_BASE = [
            {
                keywords: ['近视', '为什么会近视', '怎么近视', '近视眼'],
                answer: '嗨～我是小光仔😊！<br><br>近视呀，就像你的眼睛里的"照相机镜头"太凸了，导致远处的东西看不清，只能看清近处的～📷<br><br>主要原因有两个：<br>1️⃣ <b>遗传因素</b>：爸爸妈妈近视，小朋友更容易近视<br>2️⃣ <b>用眼习惯不好</b>：长时间看手机、看书距离太近、户外运动太少<br><br>🌟 <b>护眼小建议</b>：记住"20-20-20"法则哦！每用眼20分钟，看20英尺（约6米）外的地方20秒～'
            },
            {
                keywords: ['戴眼镜', '眼镜会越来越深', '眼镜度数', '戴眼镜好吗'],
                answer: '你好呀！👋<br><br>很多小朋友都担心戴眼镜会让度数越来越深，其实这是个<b>误会</b>哦～<br><br>✅ <b>真相是</b>：该戴眼镜的时候不戴，眼睛看不清会更累，反而更容易加深！<br><br>戴合适的眼镜能让眼睛放松，帮助控制度数增长～<br><br>🌟 <b>护眼小建议</b>：度数变化超过50度就要及时换眼镜啦，每年至少检查一次视力哦！'
            },
            {
                keywords: ['保护眼睛', '如何保护', '怎样保护', '护眼方法', '怎么护眼'],
                answer: '嘿！保护眼睛小光仔最在行了～😎<br><br>给你几个超实用的护眼秘诀：<br>1️⃣ <b>充足户外活动</b>：每天至少2小时，阳光是最好的"护眼药"🌞<br>2️⃣ <b>正确读写姿势</b>：眼睛离书本一尺（约33cm），胸离桌子一拳<br>3️⃣ <b>控制用眼时间</b>：看书/看屏幕30-40分钟休息10分钟<br>4️⃣ <b>充足睡眠</b>：小学生每天睡10小时，初中生9小时😴<br>5️⃣ <b>均衡饮食</b>：多吃胡萝卜、菠菜、蓝莓等对眼睛好的食物🥕<br><br>🌟 坚持这些好习惯，眼睛会越来越亮哦！'
            },
            {
                keywords: ['假性近视', '假近视', '什么是假性'],
                answer: '好问题！让小光仔给你讲讲～🤓<br><br><b>假性近视</b>就像眼睛"假装"近视了，其实是眼睛太累了，睫状肌一直紧绷着放松不下来～<br><br>它和真近视的区别：<br>🔸 <b>假性近视</b>：休息后视力能恢复，是暂时的<br>🔸 <b>真性近视</b>：眼轴变长了，休息也恢复不了<br><br>🌟 <b>护眼小建议</b>：假性近视及时干预是可以恢复的！多做户外活动、减少近距离用眼、必要时配合医生治疗，千万别急着配眼镜哦～'
            },
            {
                keywords: ['眼睛累', '眼疲劳', '眼睛酸', '眼睛疼', '用眼过度'],
                answer: '哎呀，眼睛累了要好好休息哦～😌<br><br>试试这些放松小方法：<br>1️⃣ <b>闭目养神</b>：闭上眼睛休息5-10分钟<br>2️⃣ <b>远眺放松</b>：看看窗外远处的绿色植物🌳<br>3️⃣ <b>眼保健操</b>：按揉睛明穴、太阳穴，很舒服的～<br>4️⃣ <b>热敷眼睛</b>：用温热的毛巾敷眼睛，促进血液循环<br>5️⃣ <b>多眨眨眼</b>：看屏幕时眨眼次数会减少，记得多眨眼保持眼睛湿润💧<br><br>🌟 如果眼睛经常疲劳，可能是度数不合适或用眼习惯不好，建议去检查一下哦！'
            },
            {
                keywords: ['散光', '什么是散光', '散光是怎么回事'],
                answer: '嗨！散光是什么呢？让小光仔来解释～<br><br>简单说，散光是因为你的<b>角膜不够圆</b>，像个橄榄球而不是篮球🏈，导致光线聚焦不均匀，看东西会有重影～<br><br>散光的症状：<br>🔸 看东西模糊、有重影<br>🔸 容易眼疲劳、头痛<br>🔸 看远近都不清楚<br><br>🌟 <b>护眼小建议</b>：散光通常是天生的，需要戴眼镜矫正哦！定期检查视力很重要～'
            },
            {
                keywords: ['弱视', '什么是弱视', '弱视怎么办'],
                answer: '你好呀！弱视和近视不一样哦～🧐<br><br><b>弱视</b>是眼睛本身没有毛病，但因为小时候视觉发育不好，导致即使戴了眼镜也看不清～<br><br>弱视的黄金治疗期是<b>3-8岁</b>，年龄越小治疗效果越好！<br><br>常见治疗方法：<br>🔸 遮盖疗法：遮住好眼睛，强迫用弱视眼<br>🔸 视觉训练：做一些特殊的训练游戏<br><br>🌟 <b>护眼小建议</b>：小朋友3岁就要做视力检查啦，早发现早治疗，弱视是可以治好的！'
            },
            {
                keywords: ['配眼镜', '怎么配眼镜', '配镜流程', '如何配镜'],
                answer: '嘿！配眼镜可是有讲究的哦～👓<br><br>正确的配镜流程：<br>1️⃣ <b>视力检查</b>：先做全面的眼部检查<br>2️⃣ <b>医学验光</b>：小朋友建议散瞳验光，结果更准确<br>3️⃣ <b>试戴评估</b>：戴着试镜架走走看看，确认舒适<br>4️⃣ <b>选择镜片</b>：小朋友建议选防蓝光、耐摔的镜片<br>5️⃣ <b>选择镜架</b>：要轻便、贴合脸型、不容易滑<br>6️⃣ <b>取镜复查</b>：取镜后1-2周复查，确认度数合适<br><br>🌟 <b>护眼小建议</b>：一定要去正规医院或眼镜店配镜，别随便买哦！'
            },
            {
                keywords: ['蓝光', '防蓝光', '蓝光眼镜', '蓝光有害'],
                answer: '关于蓝光，小光仔来给你科普～💡<br><br>蓝光是屏幕发出的一种光线，长时间看屏幕确实会让眼睛累，但<b>不用过度担心</b>哦！<br><br>科学结论：<br>🔸 正常使用电子设备的蓝光量<b>不会伤害眼睛</b><br>🔸 防蓝光眼镜对儿童来说<b>不是必须的</b><br>🔸 真正伤眼的是<b>长时间近距离用眼</b>，不是蓝光本身<br><br>🌟 <b>护眼小建议</b>：与其买防蓝光眼镜，不如控制看屏幕的时间更有效！每看20分钟屏幕休息20秒～'
            },
            {
                keywords: ['多远', '看电视距离', '看书距离', '用眼距离'],
                answer: '你好呀！用眼距离很重要哦～📏<br><br>记住这些"距离黄金法则"：<br>📱 <b>看手机</b>：距离眼睛30cm以上<br>💻 <b>看电脑</b>：距离50-70cm，屏幕略低于视线<br>📺 <b>看电视</b>：距离屏幕对角线的3倍以上<br>📖 <b>看书</b>：眼睛离书本一尺（约33cm）<br><br>🌟 <b>护眼小建议</b>：不要躺着看书或看手机哦，对眼睛伤害很大！坐姿要端正，背挺直～'
            },
            {
                keywords: ['睡眠', '睡觉', '睡多久', '熬夜'],
                answer: '睡觉对眼睛超级重要！😴<br><br>充足的睡眠能让眼睛得到充分休息，帮助视力发育～<br><br>建议睡眠时间：<br>🔸 <b>小学生</b>：每天10小时<br>🔸 <b>初中生</b>：每天9小时<br>🔸 <b>高中生</b>：每天8小时<br><br>熬夜的危害：<br>❌ 眼睛疲劳加重<br>❌ 视力下降加快<br>❌ 眼睛干涩、黑眼圈<br><br>🌟 <b>护眼小建议</b>：晚上9点前睡觉最好啦，睡前1小时别看手机哦！'
            },
            {
                keywords: ['饮食', '吃什么', '食物', '营养', '胡萝卜'],
                answer: '吃对食物，眼睛更亮！🥕<br><br>对眼睛好的营养和食物：<br>🥕 <b>胡萝卜素</b>：胡萝卜、南瓜、芒果<br>🥬 <b>叶黄素</b>：菠菜、西兰花、玉米<br>🫐 <b>花青素</b>：蓝莓、桑葚、紫甘蓝<br>🐟 <b>DHA</b>：深海鱼、核桃<br>🥚 <b>维生素A</b>：动物肝脏、鸡蛋、牛奶<br><br>🌟 <b>护眼小建议</b>：不挑食、不偏食，五颜六色的蔬菜水果都要吃～少吃甜食，糖分会影响视力发育哦！'
            }
        ];

        // 本地知识库匹配函数
        function matchKnowledge(question) {
            var q = question.toLowerCase();
            var bestMatch = null;
            var bestScore = 0;
            for (var i = 0; i < KNOWLEDGE_BASE.length; i++) {
                var item = KNOWLEDGE_BASE[i];
                var score = 0;
                for (var j = 0; j < item.keywords.length; j++) {
                    if (q.indexOf(item.keywords[j].toLowerCase()) !== -1) {
                        score += item.keywords[j].length;
                    }
                }
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = item;
                }
            }
            // 匹配分数大于1认为命中
            return bestScore >= 2 ? bestMatch.answer : null;
        }

        var AVATAR = '../../公共资源/配图/小光仔全身.png';

        var $msgBox  = document.getElementById('qaChatMessages');
        var $input   = document.getElementById('qaChatInput');
        var $sendBtn = document.getElementById('qaSendBtn');
        var $voiceBtn = document.getElementById('qaVoiceBtn');
        var $quick   = document.getElementById('qaQuick');
        if (!$msgBox || !$input) return;

        var isLoading = false;

        /* ---- 1. 渲染消息气泡（用户右侧 / AI左侧） ---- */
        function renderMessage(text, who) {
            var wrap = document.createElement('div');
            wrap.className = 'msg msg-' + who;
            var av = document.createElement('img');
            av.className = 'msg-avatar';
            av.src = AVATAR;
            av.alt = '小光仔';
            var b = document.createElement('div');
            b.className = 'bubble bubble-' + who;
            b.innerHTML = text;
            wrap.appendChild(av);
            wrap.appendChild(b);

            // AI 回复添加朗读按钮
            if (who === 'bot') {
                var speakBtn = document.createElement('button');
                speakBtn.className = 'msg-speak-btn';
                speakBtn.innerHTML = '🔊';
                speakBtn.title = '朗读这条消息';
                speakBtn.addEventListener('click', function() {
                    // 去除 HTML 标签后朗读
                    var plainText = b.innerText;
                    if (window.speakText) {
                        window.speakText(plainText);
                    } else {
                        alert('语音功能加载中，请刷新页面重试');
                    }
                });
                wrap.appendChild(speakBtn);
            }

            $msgBox.appendChild(wrap);
            scrollToBottom();
            return wrap;
        }

        function scrollToBottom() {
            $msgBox.scrollTop = $msgBox.scrollHeight;
        }

        /* ---- 2. 思考中动画 ---- */
        function showThinking() {
            var wrap = document.createElement('div');
            wrap.className = 'msg msg-bot';
            wrap.id = 'qaThinkingMsg';
            var av = document.createElement('img');
            av.className = 'msg-avatar';
            av.src = AVATAR;
            av.alt = '小光仔';
            var b = document.createElement('div');
            b.className = 'bubble bubble-bot';
            var t = document.createElement('div');
            t.className = 'thinking';
            t.innerHTML = '<span></span><span></span><span></span>';
            b.appendChild(t);
            wrap.appendChild(av);
            wrap.appendChild(b);
            $msgBox.appendChild(wrap);
            scrollToBottom();
        }
        function removeThinking() {
            var t = document.getElementById('qaThinkingMsg');
            if (t) t.remove();
        }

        function setLoading(on) {
            isLoading = on;
            $sendBtn.disabled = on;
            $input.disabled = on;
            $sendBtn.style.opacity = on ? '0.6' : '1';
            $sendBtn.style.cursor = on ? 'not-allowed' : 'pointer';
        }

        /* ---- 3. 问答：多API备选（免费无需注册）→ 本地知识库兜底 ---- */
        async function callAI(userMessage) {
            for (var p = 0; p < AI_PROVIDERS.length; p++) {
                var provider = AI_PROVIDERS[p];
                for (var i = 0; i < provider.models.length; i++) {
                    try {
                        var controller = new AbortController();
                        var timeoutId = setTimeout(function() { controller.abort(); }, 45000);

                        var headers = { 'Content-Type': 'application/json' };
                        if (provider.key) headers['Authorization'] = 'Bearer ' + provider.key;

                        var response = await fetch(provider.endpoint, {
                            method: 'POST',
                            headers: headers,
                            body: JSON.stringify({
                                model: provider.models[i],
                                messages: [
                                    { role: 'system', content: SYSTEM_PROMPT },
                                    { role: 'user', content: userMessage }
                                ]
                            }),
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);

                        if (!response.ok) {
                            if (i < provider.models.length - 1) continue;
                            throw new Error('HTTP ' + response.status);
                        }

                        var data = await response.json();
                        var reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
                        if (!reply) {
                            if (i < provider.models.length - 1) continue;
                            throw new Error('返回内容为空');
                        }

                        // 去除模型思考过程（<think>...</think>），只保留最终回答
                        reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
                        if (!reply && i < provider.models.length - 1) continue;

                        return String(reply).replace(/\n/g, '<br>');
                    } catch (err) {
                        console.warn(provider.name + ' 模型 ' + provider.models[i] + ' 调用失败:', err.message);
                    }
                }
            }

            // 所有 AI 都失败，回退到本地知识库
            var localAnswer = matchKnowledge(userMessage);
            if (localAnswer) return localAnswer;

            // 最终兜底：友好回复
            return getFriendlyReply(userMessage);
        }

        // 友好回复（AI 不可用时的兜底）
        function getFriendlyReply(question) {
            var replies = [
                '哇，这个问题很有意思呢～🤔<br><br>小光仔建议你去问问爸爸妈妈或眼科医生，他们会给你更专业的答案哦！<br><br>🌟 同时记得多做户外运动、少看电子屏幕，眼睛会更健康哒！',
                '嗯嗯，这个问题小光仔也在学习中～📚<br><br>关于"视力"的问题，最好咨询专业的眼科医生哦，他们能给你最准确的解答！<br><br>🌟 护眼小贴士：每用眼30分钟就休息一下，看看远处的绿色植物🌳',
                '好问题！不过这个可能需要专业医生来回答哦～👨‍⚕️<br><br>小光仔知道的护眼知识都在上面的菜单里啦，你可以点进去看看有没有你想了解的！<br><br>🌟 记得每天户外活动2小时，这是预防近视最好的方法哦🌞'
            ];
            return replies[Math.floor(Math.random() * replies.length)];
        }

        /* ---- 4. 发送消息主流程：sendMessage → callAI → renderMessage ---- */
        async function sendMessage(q) {
            q = (q || '').trim();
            if (!q || isLoading) return;

            // ① 渲染用户消息（右侧气泡）
            renderMessage(q, 'user');
            $input.value = '';
            setLoading(true);

            // ② 显示思考中
            showThinking();

            // ③ 调用 AI 获取回复
            var reply = await callAI(q);

            // ④ 移除思考，渲染 AI 回复（左侧气泡）
            removeThinking();
            renderMessage(reply, 'bot');
            setLoading(false);
        }

        /* ---- 5. 事件绑定 ---- */
        $sendBtn.addEventListener('click', function () { sendMessage($input.value); });
        $input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') sendMessage($input.value);
        });

        // 快捷问题按钮 → 直接发送给 AI
        if ($quick) {
            $quick.addEventListener('click', function (e) {
                var btn = e.target.closest('.quick-btn');
                if (btn) sendMessage(btn.getAttribute('data-q'));
            });
        }

        // 左侧知识分类导航 → 点击发送对应问题给 AI
        var $menu = document.querySelector('.left-menu');
        if ($menu) {
            $menu.addEventListener('click', function (e) {
                var btn = e.target.closest('.menu-btn');
                if (btn) sendMessage(btn.getAttribute('data-q'));
            });
        }

        // 语音按钮（占位交互）
        if ($voiceBtn) {
            $voiceBtn.addEventListener('click', function () {
                $input.value = $input.value || '我正在用语音提问…';
                $input.focus();
                $voiceBtn.style.background = 'rgba(165,232,90,0.3)';
                $voiceBtn.style.borderColor = 'rgba(165,232,90,0.7)';
                setTimeout(function () {
                    $voiceBtn.style.background = '';
                    $voiceBtn.style.borderColor = '';
                }, 800);
            });
        }
    })();
    