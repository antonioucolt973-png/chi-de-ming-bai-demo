/**
 * 吃得明白 - 核心应用逻辑
 * 设计原则：老人友好，全程可零打字操作
 */

(function() {
  'use strict';

  // ==================== 状态 ====================
  var state = {
    meals: [],
    pendingItems: [],
    profile: null,
    recommendation: null,
    selectedAge: null,
    selectedGender: null,
    selectedCondition: null,
    selectedIcon: '🍚',
    scannedIcon: '🍚'
  };

  // ==================== 常用食物（一键记录）====================
  var QUICK_FOODS = [
    { icon: '🍚', name: '一碗米饭', keyword: '白米饭', multiplier: 1 },
    { icon: '🥚', name: '一个煮鸡蛋', keyword: '鸡蛋', multiplier: 1 },
    { icon: '🥣', name: '一碗白粥', keyword: '白粥', multiplier: 1 },
    { icon: '🥟', name: '一盘饺子', keyword: '饺子', multiplier: 1 },
    { icon: '🍜', name: '一碗面条', keyword: '面条', multiplier: 1 },
    { icon: '🥬', name: '一盘炒青菜', keyword: '炒时蔬', multiplier: 1 },
    { icon: '🍞', name: '一片馒头', keyword: '馒头', multiplier: 1 },
    { icon: '🐟', name: '一盘清蒸鱼', keyword: '清蒸鱼', multiplier: 1 },
    { icon: '🍗', name: '一份鸡肉', keyword: '鸡胸肉', multiplier: 1 },
    { icon: '🥛', name: '一杯牛奶', keyword: '牛奶', multiplier: 1 },
    { icon: '🥤', name: '一杯豆浆', keyword: '豆浆', multiplier: 1 },
    { icon: '🍎', name: '一个苹果', keyword: '苹果', multiplier: 1 }
  ];

  // ==================== 常见食物组合（用于AI识别）====================
  var FOOD_COMBOS = [
    ['米饭', '番茄炒蛋', '青菜'],
    ['馒头', '豆浆', '鸡蛋'],
    ['白粥', '鸡蛋'],
    ['面条', '青菜'],
    ['米饭', '蒸鱼', '青菜'],
    ['饺子'],
    ['米饭', '鸡肉', '青菜'],
    ['牛奶', '面包'],
    ['米饭', '红烧肉'],
    ['米饭', '番茄炒蛋', '鸡蛋', '青菜']
  ];

  // ==================== 启动 ====================
  document.addEventListener('DOMContentLoaded', function() {
    setTodayDate();
    Charts.init();
    loadProfile();
    loadFromStorage();
    initManualNutrientGrid();
    renderQuickFoods();
    renderAll();
    checkBaiduAIStatus();
    initBottomNav();

    // 如果用户之前关闭过引导条，不再显示
    if (localStorage.getItem('guideDismissed') === '1') {
      var gb = document.getElementById('guideBar');
      if (gb) gb.style.display = 'none';
    }

    // 首次打开自动出现指向型引导
    if (localStorage.getItem('onboardingDismissed') !== '1') {
      setTimeout(function() { startOnboardingGuide(); }, 800);
    }

    // 身高体重输入变化时更新预览
    var hEl = document.getElementById('profileHeight');
    var wEl = document.getElementById('profileWeight');
    if (hEl) hEl.addEventListener('input', updateRecommendationPreview);
    if (wEl) wEl.addEventListener('input', updateRecommendationPreview);
  });

  // ==================== 底部导航 ====================

  // 滚动到指定区域
  window.scrollToSection = function(section) {
    var target = null;
    if (section === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    } else if (section === 'summary') {
      target = document.getElementById('todaySummary') || document.querySelector('.today-summary');
    } else if (section === 'records') {
      target = document.getElementById('mealRecords') || document.querySelector('.meal-records');
    } else if (section === 'trend') {
      target = document.getElementById('trendSection') || document.querySelector('.trend-card');
    }
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 初始化底部导航高亮
  function initBottomNav() {
    var navItems = document.querySelectorAll('.bottom-nav-item[data-nav]');
    if (navItems.length === 0) return;

    var sections = {
      'top': 0,
      'summary': document.getElementById('todaySummary') || document.querySelector('.today-summary'),
      'records': document.getElementById('mealRecords') || document.querySelector('.meal-records'),
      'trend': document.getElementById('trendSection') || document.querySelector('.trend-card')
    };

    window.addEventListener('scroll', function() {
      var scrollY = window.scrollY + 120;
      var current = 'top';

      for (var key in sections) {
        var el = sections[key];
        if (el && typeof el === 'object' && el.offsetTop) {
          if (scrollY >= el.offsetTop) {
            current = key;
          }
        }
      }

      navItems.forEach(function(item) {
        if (item.dataset.nav === current) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }, { passive: true });
  }

  // 检查 MiMo AI 是否已配置
  function checkBaiduAIStatus() {
    fetch('/api/mimo_status')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        var badge = document.getElementById('aiEngineBadge');
        var text = document.getElementById('aiEngineText');
        if (badge && text) {
          if (data.configured) {
            text.textContent = 'MiMo-V2.5 AI 已启用';
            badge.style.display = 'inline-flex';
          } else {
            text.textContent = 'AI助手识别模式（未配置MiMo API）';
            badge.style.display = 'inline-flex';
            badge.style.background = '#fff3e0';
            badge.style.borderColor = '#ff9800';
            badge.style.color = '#e65100';
            badge.querySelector('.badge-dot').style.background = '#ff9800';
          }
        }
      })
      .catch(function() {
        // 静默失败
      });
  }

  function setTodayDate() {
    var now = new Date();
    var weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    var dateStr = now.getFullYear() + '年' +
                  (now.getMonth() + 1) + '月' +
                  now.getDate() + '日 周' +
                  weekDays[now.getDay()];
    document.getElementById('todayDate').textContent = dateStr;
  }

  // ==================== 生成常用食物按钮 ====================
  function renderQuickFoods() {
    var grid = document.getElementById('quickFoodGrid');
    if (!grid) return;
    grid.innerHTML = '';

    QUICK_FOODS.forEach(function(food) {
      var btn = document.createElement('button');
      btn.className = 'quick-food-btn';
      btn.innerHTML =
        '<span class="quick-food-icon">' + food.icon + '</span>' +
        '<span class="quick-food-name">' + food.name + '</span>';
      btn.onclick = function() { recordByKeyword(food.keyword, food.multiplier); };
      grid.appendChild(btn);
    });
  }

  // 一键记录
  function recordByKeyword(keyword, multiplier) {
    // 先尝试：从文本中精确匹配
    var parsed = parseFoodInput(keyword);
    if (parsed.length > 0) {
      var items = parsed.map(function(p) {
        var m = p.multiplier;
        if (multiplier && multiplier !== 1) m = multiplier;
        return {
          food: p.food,
          multiplier: m,
          nutrition: calcNutrition(p.food, m)
        };
      });
      showResult(items);
      document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    // 备选：反向搜索（关键词是食物名的子串，如"粥"匹配"白粥"）
    var matches = searchFood(keyword);
    if (matches.length > 0) {
      var items2 = [
        {
          food: matches[0],
          multiplier: multiplier || 1,
          nutrition: calcNutrition(matches[0], multiplier || 1)
        }
      ];
      showResult(items2);
      document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }

    alert('没有匹配到 "' + keyword + '"，请试试拍照识别');
  }

  // ==================== 大按钮拍照识别 ====================
  window.handleBigPhotoUpload = function(event) {
    var file = event.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
      var base64Data = e.target.result;

      // 显示进度面板
      showPhotoProgress(base64Data);

      // 食物照片压缩：最大宽度1200px，质量0.85
      var foodImg = new Image();
      foodImg.onload = function() {
        var foodCanvas = document.createElement('canvas');
        var foodMaxW = 1200;
        var foodScale = Math.min(1, foodMaxW / foodImg.width);
        foodCanvas.width = foodImg.width * foodScale;
        foodCanvas.height = foodImg.height * foodScale;
        var foodCtx = foodCanvas.getContext('2d');
        foodCtx.drawImage(foodImg, 0, 0, foodCanvas.width, foodCanvas.height);
        var compressedFood = foodCanvas.toDataURL('image/jpeg', 0.85);

        // 更新进度：正在上传
        showPhotoProgressUploading();

        fetch('/api/recognize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: compressedFood })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.task_id) {
            pollWithProgress(data.task_id);
          } else {
            showPhotoProgressError('无法启动识别');
          }
        })
        .catch(function(err) {
          showPhotoProgressError('网络错误：' + err.message);
        });
      };
      foodImg.src = base64Data;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  // 轮询：最多等60秒，让 MiMo 有足够时间识别（思考模式+图片可能需要10-30秒）
  function pollWithFastFallback(taskId, statusEl) {
    var pollCount = 0;
    var maxPolls = 120; // 500ms × 120 = 60秒
    var gaveUp = false;

    function poll() {
      pollCount++;
      if (pollCount > maxPolls && !gaveUp) {
        gaveUp = true;
        // 超时后走智能猜测，用户不用干等
        showSmartGuess(statusEl);
        return;
      }

      fetch('/api/result/' + taskId)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          console.log('[食物识别] 轮询第' + pollCount + '次返回:', JSON.stringify(data).substring(0, 200));
          // 兼容两种成功格式：success:true 或 status:done
          if ((data.success === true || data.status === 'done') && data.foods && data.foods.length > 0) {
            showRecognizedFoods(data.foods, statusEl);
          } else if (data.status === 'pending') {
            if (!gaveUp) {
              var secLeft = Math.ceil((maxPolls - pollCount) * 0.5);
              if (secLeft > 40) {
                statusEl.innerHTML = '<span class="analyzing-icon">🔍</span> AI 正在识别这张照片里的食物...';
              } else if (secLeft > 20) {
                statusEl.innerHTML = '<span class="analyzing-icon">🔍</span> 还在识别中，马上就好...（' + secLeft + '秒）';
              } else {
                statusEl.innerHTML = '<span class="analyzing-icon">🔍</span> 快好了...（' + secLeft + '秒，如等不及可点常用食物）';
              }
              setTimeout(poll, 500);
            }
          } else if (data.status === 'error' || data.success === false) {
            // MiMo 明确返回错误，显示错误原因
            var errMsg = data.error || '识别失败';
            console.error('[食物识别] MiMo返回错误:', errMsg);
            if (statusEl) {
              statusEl.innerHTML = '<span class="analyzing-icon">⚠️</span> AI识别失败：' + errMsg + '，请手动选择下方常见食物，或用语音/文字输入';
            }
          } else {
            // 未知状态，继续轮询
            if (!gaveUp) setTimeout(poll, 500);
          }
        })
        .catch(function() {
          if (!gaveUp) setTimeout(poll, 800);
        });
    }
    poll();
  }

  // 把API返回的 foods 数组转成界面显示
  function showRecognizedFoods(foods, statusEl) {
    console.log('[食物识别] showRecognizedFoods foods=', foods, '数量=', foods.length);
    var items = foods.map(function(f) {
      // 先尝试从本地数据库查找
      var foodInfo = searchFoodByName(f.name, f);

      // 如果本地数据库没有，但 MiMo 返回了营养数据，创建临时食物
      if (!foodInfo || foodInfo.id === 'unknown') {
        foodInfo = {
          id: 'mimo_' + f.name,
          name: f.name,
          icon: f.icon || '🍽',
          category: f.category || 'AI识别',
          cal: f.cal ? Math.round(f.cal / (f.weight || 200) * 100) : 150,
          protein: f.protein ? Math.round(f.protein / (f.weight || 200) * 100 * 10) / 10 : 5,
          fat: f.fat ? Math.round(f.fat / (f.weight || 200) * 100 * 10) / 10 : 3,
          carb: f.carb ? Math.round(f.carb / (f.weight || 200) * 100 * 10) / 10 : 20,
          fiber: f.fiber ? Math.round(f.fiber / (f.weight || 200) * 100 * 10) / 10 : 0,
          ca: f.ca || 0, fe: f.fe || 0, zn: f.zn || 0, va: f.va || 0, vc: f.vc || 0,
          unit: '份',
          unitWeight: f.weight || 200
        };
      }

      var multiplier = f.multiplier || 1;
      if (f.weight && foodInfo.unitWeight) {
        multiplier = f.weight / foodInfo.unitWeight;
      }
      return {
        food: foodInfo,
        multiplier: multiplier,
        nutrition: calcNutrition(foodInfo, multiplier)
      };
    });

    console.log('[食物识别] 最终展示 items 数量=', items.length);
    if (statusEl) {
      statusEl.innerHTML = '<span style="color:var(--green)">✅</span> AI 识别完成（' + items.length + '个食物），确认后记录';
      statusEl.className = 'photo-analyzing-text photo-success';
    }
    showResult(items);
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // 智能猜测：给出常见食物组合（当识别太慢时用）
  function showSmartGuess(statusEl) {
    // 不再随机猜，直接告诉用户识别失败
    statusEl.innerHTML = '<span class="analyzing-icon">⚠️</span> AI识别超时或未识别到食物，请手动选择下方常见食物，或用语音/文字输入';
    statusEl.className = 'photo-analyzing-text';

    // 展开快捷食物区域，方便用户手动选
    var quickFoods = document.getElementById('quickFoodsSection');
    if (quickFoods) {
      quickFoods.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  function searchFoodByName(name, fallback) {
    if (typeof FOOD_DB !== 'undefined') {
      // 1. 精确匹配（名称或 id 完全一致）
      for (var i = 0; i < FOOD_DB.length; i++) {
        if (FOOD_DB[i].name === name || (FOOD_DB[i].id && FOOD_DB[i].id === name)) return FOOD_DB[i];
      }
      // 2. 模糊匹配（仅当名称长度 >= 2 时，避免"饭"匹配到"米饭"等过度泛化）
      //    且模糊匹配结果名称长度不能比搜索词短太多（避免"黑橄榄"匹配到"橄榄"）
      if (name && name.length >= 2) {
        for (var j = 0; j < FOOD_DB.length; j++) {
          var dbName = FOOD_DB[j].name;
          // 只接受包含关系且长度差异不大
          if ((dbName.indexOf(name) >= 0 || name.indexOf(dbName) >= 0) &&
              Math.abs(dbName.length - name.length) <= 2) {
            return FOOD_DB[j];
          }
        }
      }
    }
    // fallback：用传入的原始数据构造一个（保留 MiMo 返回的营养数据）
    if (fallback && fallback.name) {
      return {
        name: fallback.name,
        icon: fallback.icon || '🍽',
        category: fallback.category || 'AI识别',
        cal: fallback.cal ? Math.round(fallback.cal / (fallback.weight || 200) * 100) : 0,
        protein: fallback.protein ? Math.round(fallback.protein / (fallback.weight || 200) * 100 * 10) / 10 : 0,
        fat: fallback.fat ? Math.round(fallback.fat / (fallback.weight || 200) * 100 * 10) / 10 : 0,
        carb: fallback.carb ? Math.round(fallback.carb / (fallback.weight || 200) * 100 * 10) / 10 : 0,
        fiber: fallback.fiber ? Math.round(fallback.fiber / (fallback.weight || 200) * 100 * 10) / 10 : 0,
        ca: fallback.ca || 0, fe: fallback.fe || 0, zn: fallback.zn || 0,
        va: fallback.va || 0, vc: fallback.vc || 0,
        unitWeight: fallback.weight || 100,
        unit: '份'
      };
    }
    return { name: name, icon: '🍽', category: '识别到', cal: 0, protein: 0, fat: 0, carb: 0, unitWeight: 100, unit: '份' };
  }

  // ==================== 语音/文字 快速记录 ====================
  window.quickVoiceRecord = function() {
    var overlay = document.getElementById('voiceOverlay');
    overlay.style.display = 'flex';

    // ─── 文字输入优先（兼容所有浏览器） ───
    var liveTextEl = document.getElementById('voiceLiveText');
    var finishBtn = document.getElementById('voiceFinishBtn');
    var cancelBtn = document.getElementById('voiceCancelBtn');
    var timerEl = document.getElementById('voiceTimer');
    var secondsLeft = 60;

    // 构建UI：文字输入框 + 实时语音状态
    if (liveTextEl) {
      liveTextEl.innerHTML =
        '<div style="margin-bottom:8px;font-size:15px;color:#5c5546;font-weight:600;">✏️ 请输入您吃了什么</div>' +
        '<input type="text" id="voiceManualInput" placeholder="例如：一碗米饭、番茄炒蛋和青菜" style="width:100%;padding:14px 16px;font-size:20px;border-radius:12px;border:2px solid var(--accent,#e07a3c);box-sizing:border-box;outline:none;">' +
        '<div id="voiceStatus" style="margin-top:10px;font-size:13px;color:#666;line-height:1.5;">🎙️ 推荐点输入框，用手机输入法麦克风说话；文字会自动填入，再点完成。<br>提交后由 MiMo AI 解析食物和份量。</div>';
    }

    var manualInput = document.getElementById('voiceManualInput');
    var voiceStatus = document.getElementById('voiceStatus');
    // 自动 focus 输入框
    if (manualInput) {
      setTimeout(function() { manualInput.focus(); }, 100);
    }

    // 快捷按钮：一点就自动填入
    var presetBtns = overlay.querySelectorAll('.voice-preset-btn');
    for (var pb = 0; pb < presetBtns.length; pb++) {
      (function(btn) {
        btn.onclick = function() {
          var txt = btn.getAttribute('data-text');
          if (manualInput) {
            manualInput.value = txt;
            manualInput.focus();
          }
          secondsLeft = 60;
          updateTimer();
          if (voiceStatus) voiceStatus.textContent = '✅ 已填入，点"完成"后由 MiMo AI 解析';
        };
      })(presetBtns[pb]);
    }

    function updateTimer() {
      if (timerEl) timerEl.textContent = secondsLeft + ' 秒';
    }
    updateTimer();

    var intervalId = setInterval(function() {
      secondsLeft--;
      updateTimer();
      if (secondsLeft <= 0) {
        finish();
      }
    }, 1000);

    var rec = null;
    var finished = false;
    var speechDisabled = false;
    var textSoFar = '';

    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(intervalId);
      if (rec) { try { rec.stop(); } catch(e) {} }
      // 优先用输入框的文字，其次用语音识别结果
      var finalText = '';
      if (manualInput && manualInput.value.trim()) {
        finalText = manualInput.value.trim();
      } else {
        finalText = textSoFar.trim();
      }

      // 如果输入框为空，不要关闭弹窗，提示用户输入
      if (!finalText) {
        finished = false; // 允许再次点击完成
        secondsLeft = 60;
        intervalId = setInterval(function() {
          secondsLeft--;
          updateTimer();
          if (secondsLeft <= 0) { finish(); }
        }, 1000);
        if (voiceStatus) {
          voiceStatus.innerHTML = '⚠️ <span style="color:var(--accent,#e07a3c);font-weight:600;">请先输入吃了什么；手机上可以点输入框后使用键盘麦克风</span>';
        }
        if (manualInput) manualInput.focus();
        return;
      }

      console.log('[语音] finalText=', finalText);
      // 不立即关闭弹窗，先显示 loading
      processVoiceText(finalText, overlay, finishBtn, voiceStatus);
    }

    function cancel() {
      if (finished) return;
      finished = true;
      clearInterval(intervalId);
      if (rec) { try { rec.stop(); } catch(e) {} }
      overlay.style.display = 'none';
    }

    if (finishBtn) finishBtn.onclick = finish;
    if (cancelBtn) cancelBtn.onclick = cancel;
    if (manualInput) {
      manualInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') finish();
      });
      manualInput.addEventListener('input', function() {
        secondsLeft = 60;
        updateTimer();
        if (voiceStatus && manualInput.value.trim()) {
          voiceStatus.textContent = '✅ 已输入，点"完成"后由 MiMo AI 解析';
        }
      });
    }

    // ─── 尝试启用语音识别（如果浏览器支持 + 用户允许麦克风），作为辅助 ───
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var hasSpeech = !!SpeechRecognition;

    if (hasSpeech) {
      try {
        rec = new SpeechRecognition();
        rec.lang = 'zh-CN';
        rec.continuous = true;
        rec.interimResults = true;

        rec.onresult = function(event) {
          var interim = '';
          var finalPiece = '';
          for (var i = event.resultIndex; i < event.results.length; i++) {
            var transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalPiece += transcript;
            } else {
              interim += transcript;
            }
          }
          if (finalPiece) {
            textSoFar += ' ' + finalPiece;
            if (manualInput) manualInput.value = textSoFar.trim();
          }
          if (voiceStatus) voiceStatus.textContent = '🎤 正在聆听中...（识别的文字会自动填到上面，您也可以手动修改）';
        };

        rec.onerror = function(e) {
          if (voiceStatus) {
            var errMsg = e && e.error ? e.error : 'unknown';
            voiceStatus.innerHTML = '⚠️ 浏览器语音不可用（' + errMsg + '）。请点输入框，用手机输入法麦克风说话，或直接打字。';
          }
          if (e && (e.error === 'network' || e.error === 'not-allowed' || e.error === 'service-not-allowed')) {
            speechDisabled = true;
            try { rec.stop(); } catch(stopErr) {}
          }
        };

        rec.onend = function() {
          if (!finished && !speechDisabled) {
            try { rec.start(); } catch(e) {}
          }
        };

        rec.start();
        if (voiceStatus) voiceStatus.textContent = '🎤 可直接说话；如果没反应，请点输入框使用手机键盘麦克风';
      } catch(e) {
        if (voiceStatus) voiceStatus.textContent = '✏️ 请点输入框，用手机输入法麦克风说话，或直接输入文字';
      }
    } else {
      if (voiceStatus) voiceStatus.textContent = '✏️ 本浏览器不支持网页语音。请点输入框，用手机输入法麦克风说话。';
    }
  };

  function processVoiceText(text, overlay, finishBtn, voiceStatusEl) {
    if (!text || text.trim() === '') {
      // 不再 alert，直接返回（弹窗已处理空值情况）
      console.warn('[语音] processVoiceText 收到空文本');
      return;
    }

    // 显示 loading 状态
    var statusEl = voiceStatusEl || document.getElementById('voiceStatus');
    if (statusEl) {
      statusEl.innerHTML = '🤖 MiMo 正在解析你输入的食物，通常需要 3-10 秒，请稍等。';
    }
    if (finishBtn) {
      finishBtn.textContent = '正在解析...';
      finishBtn.disabled = true;
      finishBtn.style.opacity = '0.7';
      finishBtn.style.pointerEvents = 'none';
    }

    // 10 秒后提示仍在处理
    var slowTimer = setTimeout(function() {
      if (statusEl && finishBtn && finishBtn.disabled) {
        statusEl.innerHTML = '解析时间稍长，仍在处理中，请不要关闭。';
      }
    }, 10000);

    fetch('/api/parse_voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      clearTimeout(slowTimer);
      if (data.success && data.foods && data.foods.length > 0) {
        // MiMo 解析成功，用返回的食物数据
        var items = data.foods.map(function(f) {
          var foodInfo = searchFoodByName(f.name, f);
          if (!foodInfo || foodInfo.id === 'unknown') {
            foodInfo = {
              id: 'mimo_voice_' + f.name,
              name: f.name,
              icon: f.icon || '🍽',
              category: f.category || 'AI识别',
              cal: f.cal ? Math.round(f.cal / (f.weight || 200) * 100) : 150,
              protein: f.protein ? Math.round(f.protein / (f.weight || 200) * 100 * 10) / 10 : 5,
              fat: f.fat ? Math.round(f.fat / (f.weight || 200) * 100 * 10) / 10 : 3,
              carb: f.carb ? Math.round(f.carb / (f.weight || 200) * 100 * 10) / 10 : 20,
              fiber: f.fiber || 0,
              ca: f.ca || 0, fe: f.fe || 0, zn: f.zn || 0, va: f.va || 0, vc: f.vc || 0,
              unit: '份',
              unitWeight: f.weight || 200
            };
          }
          var multiplier = f.multiplier || 1;
          if (f.weight && foodInfo.unitWeight) {
            multiplier = f.weight / foodInfo.unitWeight;
          }
          return {
            food: foodInfo,
            multiplier: multiplier,
            nutrition: calcNutrition(foodInfo, multiplier)
          };
        });
        // 恢复按钮
        if (finishBtn) {
          finishBtn.textContent = '✓ 完成';
          finishBtn.disabled = false;
          finishBtn.style.opacity = '';
          finishBtn.style.pointerEvents = '';
        }
        // 关闭弹窗并显示结果
        if (overlay) overlay.style.display = 'none';
        showResult(items, '✅ 已识别到 ' + items.length + ' 个食物，请确认记录');
        document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        // MiMo 解析失败，回退到本地匹配
        clearTimeout(slowTimer);
        console.warn('[语音] MiMo解析失败:', data.error, '，回退到本地匹配');
        var localParsed = parseFoodInput(text);
        if (localParsed.length > 0) {
          var localItems = localParsed.map(function(p) {
            return {
              food: p.food,
              multiplier: p.multiplier,
              nutrition: calcNutrition(p.food, p.multiplier)
            };
          });
          if (finishBtn) {
            finishBtn.textContent = '✓ 完成';
            finishBtn.disabled = false;
            finishBtn.style.opacity = '';
            finishBtn.style.pointerEvents = '';
          }
          if (overlay) overlay.style.display = 'none';
          showResult(localItems, '✅ 已识别到 ' + localItems.length + ' 个食物（本地匹配），请确认记录');
          document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          // 完全失败，在弹窗内显示错误
          if (finishBtn) {
            finishBtn.textContent = '✓ 完成';
            finishBtn.disabled = false;
            finishBtn.style.opacity = '';
            finishBtn.style.pointerEvents = '';
          }
          if (statusEl) {
            statusEl.innerHTML = '⚠️ 没有识别到食物，请换一种说法试试。<br>' +
              '<div style="display:flex;gap:8px;margin-top:10px;">' +
              '<button class="btn btn-primary btn-sm" onclick="document.getElementById(\'voiceManualInput\').focus()">重新输入</button>' +
              '<button class="btn btn-secondary btn-sm" onclick="closeVoiceOverlay();openManualFoodForm()">手动添加</button>' +
              '</div>';
          }
        }
      }
    })
    .catch(function(err) {
      clearTimeout(slowTimer);
      console.warn('[语音] MiMo请求失败:', err.message, '，回退到本地匹配');
      var localParsed = parseFoodInput(text);
      if (localParsed.length > 0) {
        var localItems = localParsed.map(function(p) {
          return {
            food: p.food,
            multiplier: p.multiplier,
            nutrition: calcNutrition(p.food, p.multiplier)
          };
        });
        if (finishBtn) {
          finishBtn.textContent = '✓ 完成';
          finishBtn.disabled = false;
          finishBtn.style.opacity = '';
          finishBtn.style.pointerEvents = '';
        }
        if (overlay) overlay.style.display = 'none';
        showResult(localItems, '✅ 已识别到 ' + localItems.length + ' 个食物（本地匹配），请确认记录');
        document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        if (finishBtn) {
          finishBtn.textContent = '✓ 完成';
          finishBtn.disabled = false;
          finishBtn.style.opacity = '';
          finishBtn.style.pointerEvents = '';
        }
        if (statusEl) {
          statusEl.innerHTML = '⚠️ 网络错误：' + err.message + '<br>请重试或手动添加。';
        }
      }
    });
  }

  window.closeVoiceOverlay = function() {
    var ov = document.getElementById('voiceOverlay');
    if (ov) ov.style.display = 'none';
  };

  // ==================== 显示识别结果（确认区）====================
  function showResult(items, sourceMessage) {
    state.pendingItems = items;
    var section = document.getElementById('resultSection');
    var list = document.getElementById('resultList');
    var title = section ? section.querySelector('.section-title') : null;

    if (title) {
      title.innerHTML = '<span class="section-icon">✅</span> AI 识别到以下食物 <span class="result-edit-hint">（不对可以点 × 删除）</span>';
    }

    list.innerHTML = '';
    if (sourceMessage) {
      var msg = document.createElement('div');
      msg.className = 'result-source-message';
      msg.textContent = sourceMessage;
      list.appendChild(msg);
    }
    items.forEach(function(item, index) {
      var n = item.nutrition;
      var div = document.createElement('div');
      div.className = 'result-item result-item-lg';
      div.innerHTML =
        '<span class="result-item-icon">' + item.food.icon + '</span>' +
        '<div class="result-item-info">' +
          '<div class="result-item-name">' + item.food.name + '</div>' +
          '<div class="result-item-weight">约 ' + Math.round(n.weight) + 'g · ' + n.cal + '千卡</div>' +
          '<div class="result-item-nutrition">' +
            '<span class="nutri-tag nutri-protein">蛋白 ' + n.protein + 'g</span>' +
            '<span class="nutri-tag nutri-fat">脂肪 ' + n.fat + 'g</span>' +
            '<span class="nutri-tag nutri-carb">碳水 ' + n.carb + 'g</span>' +
            '<span class="nutri-tag nutri-fiber">纤维 ' + n.fiber + 'g</span>' +
          '</div>' +
          '<div class="result-item-micro">' +
            '<span class="micro-tag">钙 ' + n.ca + 'mg</span>' +
            '<span class="micro-tag">铁 ' + n.fe + 'mg</span>' +
            '<span class="micro-tag">锌 ' + n.zn + 'mg</span>' +
            '<span class="micro-tag">VA ' + n.va + 'μg</span>' +
            '<span class="micro-tag">VC ' + n.vc + 'mg</span>' +
          '</div>' +
        '</div>' +
        '<div class="result-item-controls">' +
          '<button class="portion-btn" onclick="adjustPortion(' + index + ', -0.3)">−</button>' +
          '<input type="number" class="portion-input" id="portion-' + index + '" value="' + Math.round(item.nutrition.weight) + '" min="1" step="5" onchange="setCustomWeight(' + index + ', this.value)" oninput="onWeightInput(' + index + ', this.value)" title="输入实际克数">g' +
          '<button class="portion-btn" onclick="adjustPortion(' + index + ', 0.3)">+</button>' +
        '</div>' +
        '<button class="result-item-remove result-item-remove-lg" onclick="removeItem(' + index + ')">✕</button>';
      list.appendChild(div);
    });

    section.style.display = 'block';
  }

  window.adjustPortion = function(index, delta) {
    if (!state.pendingItems[index]) return;
    state.pendingItems[index].multiplier = Math.max(0.1,
      Math.round((state.pendingItems[index].multiplier + delta) * 10) / 10);
    state.pendingItems[index].nutrition = calcNutrition(
      state.pendingItems[index].food,
      state.pendingItems[index].multiplier
    );

    var portionEl = document.getElementById('portion-' + index);
    if (portionEl) portionEl.value = Math.round(state.pendingItems[index].nutrition.weight);

    updateItemNutritionDisplay(index);
  };

  // 直接输入克数
  window.setCustomWeight = function(index, weight) {
    if (!state.pendingItems[index]) return;
    var w = parseFloat(weight);
    if (!w || w < 1) w = 1;
    var food = state.pendingItems[index].food;
    var multiplier = w / food.unitWeight;
    state.pendingItems[index].multiplier = multiplier;
    state.pendingItems[index].nutrition = calcNutrition(food, multiplier);
    updateItemNutritionDisplay(index);
  };

  // 输入过程中实时预览
  window.onWeightInput = function(index, weight) {
    var w = parseFloat(weight);
    if (!w || w < 1) return;
    var food = state.pendingItems[index].food;
    var multiplier = w / food.unitWeight;
    var n = calcNutrition(food, multiplier);
    state.pendingItems[index].multiplier = multiplier;
    state.pendingItems[index].nutrition = n;
    updateItemNutritionDisplay(index);
  };

  // 更新某条食物的营养显示
  function updateItemNutritionDisplay(index) {
    var items = document.querySelectorAll('.result-item');
    if (!items[index]) return;
    var n = state.pendingItems[index].nutrition;
    items[index].querySelector('.result-item-weight').textContent =
      '约 ' + Math.round(n.weight) + 'g · ' + n.cal + '千卡';
    var nutriDiv = items[index].querySelector('.result-item-nutrition');
    if (nutriDiv) {
      nutriDiv.innerHTML =
        '<span class="nutri-tag nutri-protein">蛋白 ' + n.protein + 'g</span>' +
        '<span class="nutri-tag nutri-fat">脂肪 ' + n.fat + 'g</span>' +
        '<span class="nutri-tag nutri-carb">碳水 ' + n.carb + 'g</span>' +
        '<span class="nutri-tag nutri-fiber">纤维 ' + n.fiber + 'g</span>';
    }
    var microDiv = items[index].querySelector('.result-item-micro');
    if (microDiv) {
      microDiv.innerHTML =
        '<span class="micro-tag">钙 ' + n.ca + 'mg</span>' +
        '<span class="micro-tag">铁 ' + n.fe + 'mg</span>' +
        '<span class="micro-tag">锌 ' + n.zn + 'mg</span>' +
        '<span class="micro-tag">VA ' + n.va + 'μg</span>' +
        '<span class="micro-tag">VC ' + n.vc + 'mg</span>';
    }
  };

  window.removeItem = function(index) {
    state.pendingItems.splice(index, 1);
    if (state.pendingItems.length === 0) {
      document.getElementById('resultSection').style.display = 'none';
    } else {
      showResult(state.pendingItems);
    }
  };

  window.cancelResult = function() {
    state.pendingItems = [];
    document.getElementById('resultSection').style.display = 'none';
    var displayArea = document.getElementById('photoDisplayArea');
    if (displayArea) displayArea.style.display = 'none';
  };

  // ==================== 确认记录写入 ====================
  window.confirmResult = function() {
    if (state.pendingItems.length === 0) return;

    var now = new Date();
    var hour = now.getHours();
    var mealType = '加餐';
    var mealIcon = '🍽';
    if (hour >= 5 && hour < 10) { mealType = '早餐'; mealIcon = '🌅'; }
    else if (hour >= 10 && hour < 14) { mealType = '午餐'; mealIcon = '☀️'; }
    else if (hour >= 14 && hour < 17) { mealType = '下午茶'; mealIcon = '🍵'; }
    else if (hour >= 17 && hour < 22) { mealType = '晚餐'; mealIcon = '🌙'; }

    var meal = {
      id: Date.now(),
      type: mealType,
      icon: mealIcon,
      time: padZero(hour) + ':' + padZero(now.getMinutes()),
      items: state.pendingItems.map(function(item) {
        // 保存所有营养素，不遗漏
        var saved = {
          name: item.food.name,
          icon: item.food.icon,
          weight: item.nutrition.weight,
          foodId: item.food.id || ''
        };
        // 遍历所有营养素定义，全部保存
        if (typeof NUTRIENT_DEFS !== 'undefined') {
          NUTRIENT_DEFS.forEach(function(n) {
            saved[n.key] = item.nutrition[n.key] || 0;
          });
        } else {
          saved.cal = item.nutrition.cal;
          saved.protein = item.nutrition.protein;
          saved.fat = item.nutrition.fat;
          saved.carb = item.nutrition.carb;
          saved.fiber = item.nutrition.fiber || 0;
        }
        return saved;
      }),
      totalCal: 0,
      totalProtein: 0,
      totalFat: 0,
      totalCarb: 0,
      totalFiber: 0
    };

    // 汇总所有营养素到meal
    meal.items.forEach(function(item) {
      if (typeof NUTRIENT_DEFS !== 'undefined') {
        NUTRIENT_DEFS.forEach(function(n) {
          var key = n.key;
          var totalKey = 'total' + key.charAt(0).toUpperCase() + key.slice(1);
          if (key === 'cal') totalKey = 'totalCal';
          if (!meal[totalKey]) meal[totalKey] = 0;
          meal[totalKey] += item[key] || 0;
        });
      } else {
        meal.totalCal += item.cal;
        meal.totalProtein += item.protein;
        meal.totalFat += item.fat;
        meal.totalCarb += item.carb;
        meal.totalFiber += item.fiber || 0;
      }
    });

    // 四舍五入所有汇总值
    if (typeof NUTRIENT_DEFS !== 'undefined') {
      NUTRIENT_DEFS.forEach(function(n) {
        var totalKey = 'total' + n.key.charAt(0).toUpperCase() + n.key.slice(1);
        if (n.key === 'cal') totalKey = 'totalCal';
        if (meal[totalKey] !== undefined) {
          meal[totalKey] = Math.round(meal[totalKey] * 10) / 10;
        }
      });
    } else {
      meal.totalCal = Math.round(meal.totalCal);
      meal.totalProtein = Math.round(meal.totalProtein * 10) / 10;
      meal.totalFat = Math.round(meal.totalFat * 10) / 10;
      meal.totalCarb = Math.round(meal.totalCarb * 10) / 10;
      meal.totalFiber = Math.round(meal.totalFiber * 10) / 10;
    }

    state.meals.push(meal);
    saveToStorage();
    renderAll();

    // 重置界面
    state.pendingItems = [];
    document.getElementById('resultSection').style.display = 'none';
    var displayArea = document.getElementById('photoDisplayArea');
    if (displayArea) displayArea.style.display = 'none';

    // 给用户一个"已记录"的视觉反馈
    showFlashMessage('✅ 已记录 ' + meal.totalCal + ' 千卡！');
  };

  function showFlashMessage(msg) {
    var flash = document.createElement('div');
    flash.className = 'flash-message';
    flash.textContent = msg;
    document.body.appendChild(flash);
    setTimeout(function() { flash.style.opacity = '1'; }, 10);
    setTimeout(function() { flash.style.opacity = '0'; }, 1800);
    setTimeout(function() { flash.remove(); }, 2300);
  }

  // ==================== 渲染：用户信息 + 进度 + 列表 ====================
  function renderAll() {
    renderProfileSummary();
    renderSummary();
    renderMealList();
    renderCustomFoodList();
    renderTrend();
  }

  // ====== 趋势观察 ======
  var trendRange = 'week'; // 'week' or 'month'

  window.switchTrendRange = function(range) {
    trendRange = range;
    document.querySelectorAll('.trend-tab').forEach(function(tab) {
      tab.classList.toggle('active', tab.getAttribute('data-range') === range);
    });
    renderTrend();
  };

  function renderTrend() {
    var emptyEl = document.getElementById('trendEmpty');
    var contentEl = document.getElementById('trendContent');
    if (!emptyEl || !contentEl) return;

    var numDays = trendRange === 'week' ? 7 : 30;
    var days = loadRecentDays(numDays);

    if (days.length < 2) {
      emptyEl.style.display = '';
      contentEl.style.display = 'none';
      return;
    }

    emptyEl.style.display = 'none';
    contentEl.style.display = '';

    // 准备数据
    var dates = [];
    var calData = [];
    var proteinData = [];
    var fatData = [];
    var carbData = [];
    var calTargetData = [];
    var proteinTargetData = [];
    var calPctData = [];
    var proteinPctData = [];

    var reco = state.recommendation || {};
    var calTarget = reco.cal || 0;
    var proteinTarget = reco.protein || 0;

    // 倒序排列（旧→新）
    days.reverse();

    days.forEach(function(day) {
      var totals = calcDayTotals(day.meals);
      var dateLabel = (day.dateStr || '').replace('月', '/').replace('日', '');
      dates.push(dateLabel);
      calData.push(totals.cal);
      proteinData.push(totals.protein);
      fatData.push(totals.fat);
      carbData.push(totals.carb);
      calTargetData.push(calTarget);
      proteinTargetData.push(proteinTarget);
      calPctData.push(calTarget ? Math.round(totals.cal / calTarget * 100) : 0);
      proteinPctData.push(proteinTarget ? Math.round(totals.protein / proteinTarget * 100) : 0);
    });

    // 渲染热量趋势图
    renderTrendCalChart(dates, calData, calTargetData);
    // 渲染宏量营养素趋势图
    renderTrendMacroChart(dates, proteinData, fatData, carbData, proteinTargetData);
    // 渲染达标率趋势图
    renderTrendTargetChart(dates, calPctData, proteinPctData);
    // 渲染摘要
    renderTrendSummary(days, calData, proteinData, calTarget, proteinTarget);
  }

  function renderTrendCalChart(dates, calData, calTargetData) {
    var el = document.getElementById('chart-trend-cal');
    if (!el || typeof echarts === 'undefined') return;

    var chart = echarts.init(el);
    chart.setOption({
      tooltip: { trigger: 'axis', formatter: function(params) {
        var s = params[0].axisValue + '<br/>';
        params.forEach(function(p) {
          s += p.marker + p.seriesName + ': ' + p.value + (p.seriesName.indexOf('目标') >= 0 ? ' 千卡' : ' 千卡') + '<br/>';
        });
        return s;
      }},
      legend: { data: ['实际热量', '目标'], top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 45, right: 15, top: 30, bottom: 25 },
      xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10, rotate: dates.length > 10 ? 45 : 0 } },
      yAxis: { type: 'value', name: '千卡', axisLabel: { fontSize: 10 } },
      series: [
        {
          name: '实际热量',
          type: 'line',
          data: calData,
          smooth: true,
          itemStyle: { color: '#D4875A' },
          areaStyle: { color: 'rgba(212,135,90,0.15)' },
          lineStyle: { width: 2 }
        },
        {
          name: '目标',
          type: 'line',
          data: calTargetData,
          itemStyle: { color: '#6B9E7A' },
          lineStyle: { type: 'dashed', width: 1.5 },
          symbol: 'none'
        }
      ]
    });
  }

  function renderTrendMacroChart(dates, proteinData, fatData, carbData, proteinTargetData) {
    var el = document.getElementById('chart-trend-macro');
    if (!el || typeof echarts === 'undefined') return;

    var chart = echarts.init(el);
    chart.setOption({
      tooltip: { trigger: 'axis', formatter: function(params) {
        var s = params[0].axisValue + '<br/>';
        params.forEach(function(p) {
          s += p.marker + p.seriesName + ': ' + p.value + ' g<br/>';
        });
        return s;
      }},
      legend: { data: ['蛋白质', '脂肪', '碳水', '蛋白目标'], top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 35, right: 15, top: 30, bottom: 25 },
      xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10, rotate: dates.length > 10 ? 45 : 0 } },
      yAxis: { type: 'value', name: '克', axisLabel: { fontSize: 10 } },
      series: [
        { name: '蛋白质', type: 'line', data: proteinData, smooth: true, itemStyle: { color: '#D4875A' }, lineStyle: { width: 2 } },
        { name: '脂肪', type: 'line', data: fatData, smooth: true, itemStyle: { color: '#E8A070' }, lineStyle: { width: 1.5 } },
        { name: '碳水', type: 'line', data: carbData, smooth: true, itemStyle: { color: '#C49A6C' }, lineStyle: { width: 1.5 } },
        { name: '蛋白目标', type: 'line', data: proteinTargetData, itemStyle: { color: '#6B9E7A' }, lineStyle: { type: 'dashed', width: 1 }, symbol: 'none' }
      ]
    });
  }

  function renderTrendTargetChart(dates, calPctData, proteinPctData) {
    var el = document.getElementById('chart-trend-target');
    if (!el || typeof echarts === 'undefined') return;

    var chart = echarts.init(el);
    chart.setOption({
      tooltip: { trigger: 'axis', formatter: function(params) {
        var s = params[0].axisValue + '<br/>';
        params.forEach(function(p) {
          s += p.marker + p.seriesName + ': ' + p.value + '%<br/>';
        });
        return s;
      }},
      legend: { data: ['热量达标率', '蛋白质达标率'], top: 0, textStyle: { fontSize: 11 } },
      grid: { left: 40, right: 15, top: 30, bottom: 25 },
      xAxis: { type: 'category', data: dates, axisLabel: { fontSize: 10, rotate: dates.length > 10 ? 45 : 0 } },
      yAxis: { type: 'value', name: '%', max: 150, axisLabel: { fontSize: 10, formatter: '{value}%' } },
      series: [
        {
          name: '热量达标率',
          type: 'bar',
          data: calPctData,
          itemStyle: { color: function(p) { return p.value >= 80 ? '#6B9E7A' : p.value >= 50 ? '#D4875A' : '#E55'; } },
          barWidth: '30%'
        },
        {
          name: '蛋白质达标率',
          type: 'bar',
          data: proteinPctData,
          itemStyle: { color: function(p) { return p.value >= 80 ? '#8BBF9E' : p.value >= 50 ? '#E8A070' : '#E88'; } },
          barWidth: '30%'
        }
      ],
      markLine: {
        silent: true,
        data: [{ yAxis: 80, lineStyle: { color: '#6B9E7A', type: 'dashed' }, label: { formatter: '达标线', position: 'end', fontSize: 10 } }]
      }
    });
  }

  function renderTrendSummary(days, calData, proteinData, calTarget, proteinTarget) {
    var el = document.getElementById('trendSummary');
    if (!el) return;

    var n = days.length;
    var avgCal = Math.round(calData.reduce(function(a,b){return a+b;}, 0) / n);
    var avgProtein = Math.round(proteinData.reduce(function(a,b){return a+b;}, 0) / n * 10) / 10;
    var maxCal = Math.max.apply(null, calData);
    var minCal = Math.min.apply(null, calData);
    var maxCalIdx = calData.indexOf(maxCal);
    var minCalIdx = calData.indexOf(minCal);

    var calPct = calTarget ? Math.round(avgCal / calTarget * 100) : 0;
    var proteinPct = proteinTarget ? Math.round(avgProtein / proteinTarget * 100) : 0;

    var stability = maxCal - minCal;
    var stabilityText = stability < 200 ? '较稳定' : (stability < 500 ? '波动一般' : '波动较大');

    el.innerHTML =
      '<div class="trend-summary-grid">' +
        '<div class="trend-stat"><span class="trend-stat-label">日均热量</span><span class="trend-stat-value">' + avgCal + ' 千卡</span></div>' +
        '<div class="trend-stat"><span class="trend-stat-label">日均蛋白质</span><span class="trend-stat-value">' + avgProtein + ' g</span></div>' +
        '<div class="trend-stat"><span class="trend-stat-label">热量达标率</span><span class="trend-stat-value ' + (calPct>=80?'good':calPct>=50?'warn':'bad') + '">' + calPct + '%</span></div>' +
        '<div class="trend-stat"><span class="trend-stat-label">蛋白达标率</span><span class="trend-stat-value ' + (proteinPct>=80?'good':proteinPct>=50?'warn':'bad') + '">' + proteinPct + '%</span></div>' +
        '<div class="trend-stat"><span class="trend-stat-label">最高热量日</span><span class="trend-stat-value">' + maxCal + ' 千卡</span><span class="trend-stat-date">' + (days[maxCalIdx] ? days[maxCalIdx].dateStr : '') + '</span></div>' +
        '<div class="trend-stat"><span class="trend-stat-label">最低热量日</span><span class="trend-stat-value">' + minCal + ' 千卡</span><span class="trend-stat-date">' + (days[minCalIdx] ? days[minCalIdx].dateStr : '') + '</span></div>' +
        '<div class="trend-stat"><span class="trend-stat-label">热量波动</span><span class="trend-stat-value">' + stability + ' 千卡</span><span class="trend-stat-date">' + stabilityText + '</span></div>' +
        '<div class="trend-stat"><span class="trend-stat-label">记录天数</span><span class="trend-stat-value">' + n + ' 天</span></div>' +
      '</div>';

    // 调用 MiMo AI 生成趋势分析文字
    var aiTrendEl = document.getElementById('aiTrendAnalysis');
    if (!aiTrendEl) {
      // 如果没有 AI 分析容器，创建一个
      var wrapper = document.createElement('div');
      wrapper.id = 'aiTrendAnalysis';
      wrapper.style.cssText = 'margin-top:12px;padding:14px;background:#EEF5F0;border-radius:10px;border-left:4px solid #6B9E7A;font-size:0.9rem;line-height:1.7;color:#2D2A24;';
      wrapper.innerHTML = '<span style="color:#6B9E7A;">🤖 </span><span style="color:#8A847C;">MiMo AI 正在分析趋势...</span>';
      el.appendChild(wrapper);
      aiTrendEl = wrapper;
    }

    // 准备数据发给 MiMo
    var dailyDataForAI = days.map(function(d, i) {
      return {
        dateStr: d.dateStr,
        totals: { cal: calData[i], protein: proteinData[i] }
      };
    });
    var avgForAI = { cal: avgCal, protein: avgProtein };
    var recoForAI = { cal: calTarget, protein: proteinTarget };
    var profileForAI = state.profile || {};

    fetch('/api/ai_trend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dailyData: dailyDataForAI,
        avg: avgForAI,
        recommendation: recoForAI,
        profile: profileForAI
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success && data.analysis) {
        aiTrendEl.innerHTML = '<span style="color:#6B9E7A;font-weight:600;">🤖 AI 趋势分析</span><br>' + data.analysis.replace(/\n/g, '<br>');
      } else {
        aiTrendEl.innerHTML = '<span style="color:#8A847C;">趋势分析暂不可用</span>';
      }
    })
    .catch(function(err) {
      aiTrendEl.innerHTML = '<span style="color:#8A847C;">趋势分析暂不可用</span>';
    });
  }

  function renderProfileSummary() {
    var summary = document.getElementById('profileSummary');
    var targetHint = document.getElementById('todayTargetHint');

    if (state.profile) {
      var conditionLabels = {
        healthy: '健康', fatloss: '减脂', muscle: '增肌',
        stomach: '胃病/消化差', recovery: '术后恢复', diabetes: '控糖',
        elderly: '老人照护', pregnancy: '孕期', lactation: '哺乳期'
      };
      // 根据年龄选择称呼
      var age = state.profile.age;
      var genderLabel = state.profile.gender === 'male' ? '先生' : '女士';
      if (age >= 60) {
        genderLabel = state.profile.gender === 'male' ? '爷爷' : '奶奶';
      } else if (age <= 25) {
        genderLabel = state.profile.gender === 'male' ? '同学' : '同学';
      }

      // 构建健康情况显示文字
      var condText = conditionLabels[state.profile.condition] || state.profile.condition;
      // 如果有补充健康情况，追加显示
      if (state.profile.customCondition) {
        condText = condText + ' + ' + state.profile.customCondition;
      }

      summary.textContent = '👤 ' + age + '岁·' + genderLabel + '·' + condText;
      targetHint.textContent = '（目标：' + (state.recommendation.cal || 0) + '千卡）';
    } else {
      summary.textContent = '👤 点我设置';
      targetHint.textContent = '（设置后显示目标）';
    }
  }

  function renderSummary() {
    var totals = calcTotals();
    var container = document.getElementById('summaryCardsContainer');
    var microContainer = document.getElementById('microSummaryGrid');
    var microSection = document.getElementById('microNutrientSummary');
    if (!container) return;

    var r = state.recommendation || {};
    var coreKeys = ['cal','protein','fat','carb','fiber'];
    var microKeys = ['na','ca','fe','zn','se','k','mg','p','cu','mn','i','va','vc','vd','ve','vk','vb1','vb2','vb6','vb12','niacin','folate','pantothenic'];

    // 核心营养素卡片
    var coreHTML = '';
    coreKeys.forEach(function(key) {
      var def = getNutrientDef(key);
      if (!def) return;
      var val = totals[key] || 0;
      var target = r[key] || 0;
      var pct = (target > 0) ? Math.round(val / target * 100) : 0;
      var colorClass = pct < 40 ? 'progress-low' : (pct <= 110 ? 'progress-good' : 'progress-high');
      var unitLabel = key === 'cal' ? '千卡' : def.unit;
      coreHTML +=
        '<div class="summary-card">' +
          '<span class="summary-value">' + (Math.round(val * 10) / 10) + '</span>' +
          '<span class="summary-label">' + def.name + ' ' + unitLabel + '</span>' +
          '<span class="summary-progress ' + colorClass + '">' + (target > 0 ? pct + '%' : '') + '</span>' +
        '</div>';
    });
    container.innerHTML = coreHTML;

    // 微量营养素
    var hasMicro = false;
    var microHTML = '';
    microKeys.forEach(function(key) {
      var def = getNutrientDef(key);
      if (!def) return;
      var val = totals[key] || 0;
      var target = r[key] || 0;
      if (val > 0 || target > 0) hasMicro = true;
      var pct = (target > 0) ? Math.round(val / target * 100) : 0;
      var colorClass = pct < 40 ? 'progress-low' : (pct <= 110 ? 'progress-good' : 'progress-high');
      microHTML +=
        '<div class="micro-summary-item">' +
          '<span class="micro-icon">' + def.icon + '</span>' +
          '<span class="micro-name">' + def.name + '</span>' +
          '<span class="micro-value">' + (Math.round(val * 10) / 10) + '/' + (target || '—') + def.unit + '</span>' +
          '<span class="micro-pct ' + colorClass + '">' + (target > 0 ? pct + '%' : '') + '</span>' +
        '</div>';
    });
    if (microContainer) microContainer.innerHTML = microHTML;
    if (microSection) microSection.style.display = hasMicro ? 'block' : 'none';

    // 更新目标提示
    var hint = document.getElementById('todayTargetHint');
    if (hint) {
      hint.textContent = r.cal ? '（目标：' + r.cal + '千卡）' : '（未设置目标）';
    }

    // 更新建议
    if (state.recommendation) {
      updateDailyAdvice(totals, r);
    } else {
      var advice = document.getElementById('dailyAdvice');
      if (advice) advice.style.display = 'none';
    }

    Charts.updateMacroChart(totals.protein, totals.fat, totals.carb, totals.cal);
  }

  function updateProgressBar(id, current, target) {
    var el = document.getElementById(id);
    if (!el) return;
    // 防止NaN：target为0或NaN时显示0%
    if (!target || isNaN(target) || target <= 0) {
      el.textContent = '0%';
      el.className = 'summary-progress progress-low';
      return;
    }
    if (!current || isNaN(current)) current = 0;
    var pct = Math.round(current / target * 100);
    var color = '';
    if (pct < 40) color = 'progress-low';
    else if (pct >= 40 && pct <= 110) color = 'progress-good';
    else color = 'progress-high';
    el.textContent = pct + '%';
    el.className = 'summary-progress ' + color;
  }

  function updateDailyAdvice(totals, r) {
    var adviceEl = document.getElementById('dailyAdvice');
    var adviceText = document.getElementById('adviceText');
    if (!adviceEl) return;

    if (totals.cal === 0) {
      adviceEl.style.display = 'none';
      return;
    }

    adviceEl.style.display = 'flex';

    // 优先调用 MiMo AI 生成个性化建议
    var profile = state.profile || {};
    fetch('/api/ai_advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        todayNutrition: totals,
        profile: profile,
        recommendation: r
      })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (data.success && data.advice) {
        adviceText.textContent = data.advice;
      } else {
        // MiMo 失败，回退到本地规则
        console.warn('[建议] MiMo生成失败:', data.error, '，使用本地规则');
        fallbackLocalAdvice(totals, r, adviceText);
      }
    })
    .catch(function(err) {
      console.warn('[建议] MiMo请求失败:', err.message, '，使用本地规则');
      fallbackLocalAdvice(totals, r, adviceText);
    });
  }

  // 本地建议兜底（MiMo不可用时使用）
  function fallbackLocalAdvice(totals, r, adviceText) {
    var messages = [];
    var calPct = totals.cal / r.cal * 100;
    var proteinPct = totals.protein / r.protein * 100;
    var fiberPct = (r.fiber || 25) > 0 ? totals.fiber / (r.fiber || 25) * 100 : 0;

    if (calPct < 40) messages.push('还可以继续吃，离目标还差 ' + Math.round(r.cal - totals.cal) + '千卡');
    else if (calPct > 110) messages.push('热量已超过目标 ' + Math.round(calPct - 100) + '%');
    else messages.push('今天热量吃得刚刚好');

    if (proteinPct < 40) messages.push('蛋白质不够，建议加鸡蛋、牛奶或豆制品');
    else if (proteinPct < 80) messages.push('蛋白质还不够，可再补充一些');

    if (fiberPct < 40) messages.push('膳食纤维不足，建议多吃蔬菜、水果或粗粮');

    var caPct = r.ca > 0 ? totals.ca / r.ca * 100 : 0;
    var fePct = r.fe > 0 ? totals.fe / r.fe * 100 : 0;
    var vcPct = r.vc > 0 ? totals.vc / r.vc * 100 : 0;

    if (caPct < 40 && totals.cal > 200) messages.push('钙摄入不足，建议多喝牛奶、吃豆制品');
    if (fePct < 40 && totals.cal > 200) messages.push('铁摄入偏低，可适当吃瘦肉、动物肝脏');
    if (vcPct < 40 && totals.cal > 200) messages.push('维生素C不够，建议多吃新鲜水果和蔬菜');

    if (state.profile && state.profile.condition === 'stomach') {
      messages.push('胃病请少食多餐，下餐别忘了！');
    }
    if (state.profile && state.profile.condition === 'elderly' && proteinPct < 70) {
      messages.push('老人要多吃鸡蛋、鱼肉、牛奶补充蛋白质');
    }
    if (state.profile && state.profile.condition === 'diabetes' && totals.carb > r.carb * 0.6) {
      messages.push('碳水较多，下次选粗粮或杂粮');
    }

    adviceText.textContent = messages.join('。') + '。';
  }

  function renderMealList() {
    var list = document.getElementById('mealList');
    var empty = document.getElementById('emptyState');
    if (!list || !empty) return;

    if (state.meals.length === 0) {
      empty.style.display = 'flex';
      list.innerHTML = '';
      return;
    }

    empty.style.display = 'none';
    list.innerHTML = '';

    var sorted = state.meals.slice().reverse();
    sorted.forEach(function(meal) {
      var card = document.createElement('div');
      card.className = 'meal-card meal-card-lg fade-in';

      var tags = meal.items.map(function(item) {
        return '<span class="meal-tag">' + item.icon + ' ' + item.name + '</span>';
      }).join('');

      card.innerHTML =
        '<div class="meal-card-header">' +
          '<span class="meal-card-type">' + meal.icon + ' ' + meal.type + '</span>' +
          '<span class="meal-card-time">' + meal.time + '</span>' +
          '<span class="meal-card-cal">' + meal.totalCal + ' 千卡</span>' +
          '<button class="meal-card-delete" onclick="deleteMeal(\'' + meal.id + '\')" title="删除这条记录">✕</button>' +
        '</div>' +
        '<div class="meal-card-items">' + tags + '</div>' +
        '<div class="meal-card-nutrition">' +
          '<span class="nutri-tag nutri-protein">蛋白 ' + meal.totalProtein + 'g</span>' +
          '<span class="nutri-tag nutri-fat">脂肪 ' + meal.totalFat + 'g</span>' +
          '<span class="nutri-tag nutri-carb">碳水 ' + meal.totalCarb + 'g</span>' +
          '<span class="nutri-tag nutri-fiber">纤维 ' + (meal.totalFiber || 0) + 'g</span>' +
        '</div>' +
        '<div class="meal-card-micro">' +
          '<span class="micro-tag">钙 ' + (meal.totalCa || 0) + 'mg</span>' +
          '<span class="micro-tag">铁 ' + (meal.totalFe || 0) + 'mg</span>' +
          '<span class="micro-tag">锌 ' + (meal.totalZn || 0) + 'mg</span>' +
          '<span class="micro-tag">VA ' + (meal.totalVa || 0) + 'μg</span>' +
          '<span class="micro-tag">VC ' + (meal.totalVc || 0) + 'mg</span>' +
        '</div>';
      list.appendChild(card);
    });
  }

  window.deleteMeal = function(mealId) {
    if (!confirm('确定要删除这条记录吗？')) return;
    state.meals = state.meals.filter(function(m) { return String(m.id) !== String(mealId); });
    saveToStorage();
    renderAll();
  };

  function calcTotals() {
    var totals = {};
    // 初始化所有营养素为0
    if (typeof NUTRIENT_DEFS !== 'undefined') {
      NUTRIENT_DEFS.forEach(function(n) { totals[n.key] = 0; });
    } else {
      totals = { cal:0, protein:0, fat:0, carb:0, fiber:0, na:0, ca:0, fe:0, zn:0, va:0, vc:0 };
    }

    // 直接从items中汇总所有营养素，确保不遗漏
    state.meals.forEach(function(meal) {
      if (meal.items) {
        meal.items.forEach(function(item) {
          if (typeof NUTRIENT_DEFS !== 'undefined') {
            NUTRIENT_DEFS.forEach(function(n) {
              totals[n.key] += item[n.key] || 0;
            });
          } else {
            totals.cal += item.cal || 0;
            totals.protein += item.protein || 0;
            totals.fat += item.fat || 0;
            totals.carb += item.carb || 0;
            totals.fiber += item.fiber || 0;
            totals.na += item.na || 0;
            totals.ca += item.ca || 0;
            totals.fe += item.fe || 0;
            totals.zn += item.zn || 0;
            totals.va += item.va || 0;
            totals.vc += item.vc || 0;
          }
        });
      }
    });

    // 四舍五入
    for (var k in totals) {
      totals[k] = Math.round(totals[k] * 10) / 10;
    }
    return totals;
  }

  // ==================== 用户档案（问答式）====================
  window.toggleProfile = function() {
    var modal = document.getElementById('profileModal');
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
    if (state.profile) {
      setAge(state.profile.age);
      // 重设性别和健康状况选中状态
      renderGenderChips(state.profile.gender);
      renderConditionChips(state.profile.condition);
      updateRecommendationPreview();
    }
  };

  // 滚动到指定区域（用于指引步骤跳转）
  window.scrollToSection = function(id) {
    var el = document.getElementById(id) || document.querySelector('.' + id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ==================== 指向型新手引导 ====================
  var onboardingSteps = [
    {
      target: function() { return document.getElementById('profileBtn'); },
      title: '先设置身体情况',
      body: '点右上角的身体情况按钮，填写年龄、性别、身高体重和胃病/控糖等情况。AI 会按这些信息调整今日营养目标和建议。',
      mobileScrollTop: true
    },
    {
      target: function() { return document.getElementById('entryPhoto'); },
      title: '拍一张食物照片',
      body: '适合饭菜、水果、食材。MiMo 会识别图片里的多个食物，通常需要 10-30 秒。'
    },
    {
      target: function() { return document.getElementById('entryScan'); },
      title: '扫描包装营养表',
      body: '适合奶粉、零食、饮料、保健品等包装食品。营养表字多，可能需要 20-60 秒。'
    },
    {
      target: function() { return document.getElementById('entryVoice'); },
      title: '也可以直接说或输入',
      body: '网页语音不稳定时，可以用手机输入法自带语音，例如"一碗米饭和一个鸡蛋"。'
    },
    {
      target: function() { return document.getElementById('todaySummary') || document.querySelector('.today-summary') || document.querySelector('.export-report-section'); },
      title: '查看建议，导出报告',
      body: '记录食物后，这里会显示今日营养建议。需要提交或分享时，点击"导出报告"生成饮食记录报告。',
      mobileScrollBottom: true
    }
  ];
  var onboardingIndex = 0;

  window.startOnboardingGuide = function() {
    onboardingIndex = 0;
    showOnboardingStep();
  };

  function showOnboardingStep() {
    var step = onboardingSteps[onboardingIndex];
    if (!step) { closeOnboarding(); return; }

    var targetEl = null;
    try { targetEl = step.target(); } catch(e) { targetEl = null; }

    // 如果目标元素不存在，跳过
    if (!targetEl) {
      onboardingIndex++;
      if (onboardingIndex < onboardingSteps.length) {
        showOnboardingStep();
      } else {
        closeOnboarding();
      }
      return;
    }

    var overlay = document.getElementById('onboardingOverlay');
    var highlight = document.getElementById('onboardingHighlight');
    var card = document.getElementById('onboardingCard');
    var arrow = document.getElementById('onboardingArrow');
    var isMobile = window.innerWidth <= 768;

    // 移动端：第1步先滚动到顶部
    if (isMobile && step.mobileScrollTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (isMobile && step.mobileScrollBottom) {
      // 移动端：第5步滚动到底部目标区域
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // 桌面端：滚动到目标元素
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // 等滚动完成后再定位
    setTimeout(function() {
      var rect = targetEl.getBoundingClientRect();
      var padding = 8;
      var winW = window.innerWidth;
      var winH = window.innerHeight;

      // 确保高亮框在视口内
      var hlTop = Math.max(4, rect.top - padding);
      var hlLeft = Math.max(4, rect.left - padding);
      var hlWidth = Math.min(rect.width + padding * 2, winW - 8);
      var hlHeight = rect.height + padding * 2;

      // 如果目标在视口外，调整高亮到可见区域
      if (rect.top + rect.height < 0 || rect.top > winH) {
        hlTop = 4;
        hlHeight = 40;
      }

      highlight.style.top = hlTop + 'px';
      highlight.style.left = hlLeft + 'px';
      highlight.style.width = hlWidth + 'px';
      highlight.style.height = hlHeight + 'px';

      // 定位卡片
      var cardW = isMobile ? Math.min(380, winW - 24) : 380;
      var cardH = 240;
      var cardTop, cardLeft;

      if (!isMobile) {
        // 桌面端：卡片在目标右侧或下方
        if (rect.right + cardW + 20 < winW) {
          cardLeft = rect.right + 20;
          cardTop = rect.top;
          arrow.style.left = '-8px';
          arrow.style.top = '20px';
          arrow.style.borderRight = 'none';
          arrow.style.borderTop = 'none';
        } else {
          cardLeft = Math.max(16, rect.left);
          cardTop = rect.bottom + 16;
          arrow.style.left = '20px';
          arrow.style.top = '-8px';
          arrow.style.borderBottom = 'none';
          arrow.style.borderLeft = 'none';
        }
      } else {
        // 移动端：卡片固定在底部
        cardLeft = 12;
        cardTop = winH - cardH - 12;

        // 箭头指向高亮区域
        var arrowX = Math.max(30, Math.min(winW - 30, rect.left + rect.width / 2));
        var arrowY = -8;
        // 如果高亮在卡片上方，箭头朝上
        arrow.style.left = (arrowX - cardLeft - 8) + 'px';
        arrow.style.top = arrowY + 'px';
        arrow.style.borderBottom = 'none';
        arrow.style.borderLeft = 'none';
      }

      // 边界检查
      if (cardTop + cardH > winH) cardTop = winH - cardH - 12;
      if (cardTop < 12) cardTop = 12;
      if (cardLeft + cardW > winW - 12) cardLeft = winW - cardW - 12;
      if (cardLeft < 12) cardLeft = 12;

      card.style.top = cardTop + 'px';
      card.style.left = cardLeft + 'px';
      card.style.width = cardW + 'px';

      overlay.style.display = 'block';
    }, isMobile ? 500 : 300);

    // 更新卡片内容
    document.getElementById('obStepNum').textContent = onboardingIndex + 1;
    document.getElementById('obTitle').textContent = step.title;
    document.getElementById('obBody').textContent = step.body;

    // 更新按钮
    document.getElementById('obPrev').style.display = onboardingIndex > 0 ? 'inline-flex' : 'none';
    var nextBtn = document.getElementById('obNext');
    if (onboardingIndex === onboardingSteps.length - 1) {
      nextBtn.textContent = '完成';
    } else {
      nextBtn.textContent = '下一步';
    }
  }

  window.onboardingNext = function() {
    if (onboardingIndex < onboardingSteps.length - 1) {
      onboardingIndex++;
      showOnboardingStep();
    } else {
      closeOnboarding();
    }
  };

  window.onboardingPrev = function() {
    if (onboardingIndex > 0) {
      onboardingIndex--;
      showOnboardingStep();
    }
  };

  window.closeOnboarding = function() {
    var overlay = document.getElementById('onboardingOverlay');
    if (overlay) overlay.style.display = 'none';
    var cb = document.getElementById('obDontShow');
    if (cb && cb.checked) {
      localStorage.setItem('onboardingDismissed', '1');
    }
  };

  // ==================== 拍照进度面板 ====================
  var lastPhotoDataUrl = null;

  function showPhotoProgress(dataUrl) {
    lastPhotoDataUrl = dataUrl;
    var panel = document.getElementById('photoProgressPanel');
    var thumb = document.getElementById('progressPanelThumb');
    var displayArea = document.getElementById('photoDisplayArea');

    if (thumb) thumb.src = dataUrl;
    if (panel) panel.style.display = 'block';
    if (displayArea) displayArea.style.display = 'none';

    updatePhotoProgressStep(1, 'done');
    updatePhotoProgressStep(2, 'active');
    updatePhotoProgressStep(3, 'waiting');
    updatePhotoProgressStep(4, 'waiting');

    var sub = document.getElementById('progressPanelSub');
    if (sub) sub.textContent = '正在压缩上传...';
    var hint = document.getElementById('progressPanelHint');
    if (hint) hint.textContent = '识别时间较长，请不要关闭页面';
    var errBox = document.getElementById('progressPanelError');
    if (errBox) errBox.style.display = 'none';

    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function updatePhotoProgressStep(step, status) {
    var el = document.getElementById('ps' + step);
    if (!el) return;
    el.classList.remove('ps-active', 'ps-done', 'ps-error', 'ps-waiting');
    el.classList.add('ps-' + status);
    var icon = el.querySelector('.ps-icon');
    if (icon) {
      if (status === 'done') icon.textContent = '✓';
      else if (status === 'active') icon.textContent = '●';
      else if (status === 'error') icon.textContent = '✕';
      else icon.textContent = '○';
    }
  }

  function showPhotoProgressUploading() {
    updatePhotoProgressStep(2, 'done');
    updatePhotoProgressStep(3, 'active');
    var sub = document.getElementById('progressPanelSub');
    if (sub) sub.textContent = 'MiMo 正在看图识别，通常需要 10-30 秒';
  }

  function showPhotoProgressMatching() {
    updatePhotoProgressStep(3, 'done');
    updatePhotoProgressStep(4, 'active');
    var sub = document.getElementById('progressPanelSub');
    if (sub) sub.textContent = '正在匹配营养数据...';
  }

  function showPhotoProgressDone() {
    updatePhotoProgressStep(4, 'done');
    var sub = document.getElementById('progressPanelSub');
    if (sub) sub.textContent = '识别完成！';
    var panel = document.getElementById('photoProgressPanel');
    setTimeout(function() { if (panel) panel.style.display = 'none'; }, 1500);
  }

  function showPhotoProgressError(msg) {
    updatePhotoProgressStep(3, 'error');
    var sub = document.getElementById('progressPanelSub');
    if (sub) sub.textContent = '识别失败';
    var errBox = document.getElementById('progressPanelError');
    var errMsg = document.getElementById('ppErrorMsg');
    if (errMsg) errMsg.textContent = msg || '识别超时或失败';
    if (errBox) errBox.style.display = 'block';
  }

  window.retryPhotoRecognize = function() {
    var panel = document.getElementById('photoProgressPanel');
    if (panel) panel.style.display = 'none';
    if (lastPhotoDataUrl) {
      // 模拟重新选择文件
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var maxW = 1200;
        var scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        var compressed = canvas.toDataURL('image/jpeg', 0.85);

        showPhotoProgress(lastPhotoDataUrl);
        // 延迟一下让 UI 先渲染
        setTimeout(function() {
          showPhotoProgressUploading();
          fetch('/api/recognize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: compressed })
          })
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data.task_id) {
              pollWithProgress(data.task_id);
            } else {
              showPhotoProgressError('无法启动识别');
            }
          })
          .catch(function() {
            showPhotoProgressError('网络错误');
          });
        }, 300);
      };
      img.src = lastPhotoDataUrl;
    }
  };

  // 轮询带进度面板
  function pollWithProgress(taskId) {
    var pollCount = 0;
    var maxPolls = 120;

    function poll() {
      pollCount++;
      if (pollCount > maxPolls) {
        showPhotoProgressError('已等待超过 60 秒，请重试或改用文字输入');
        return;
      }

      fetch('/api/result/' + taskId)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if ((data.success === true || data.status === 'done') && data.foods && data.foods.length > 0) {
            showPhotoProgressMatching();
            setTimeout(function() {
              showPhotoProgressDone();
              var statusEl = document.getElementById('photoAnalyzingText');
              showRecognizedFoods(data.foods, statusEl);
            }, 500);
          } else if (data.status === 'pending') {
            var sub = document.getElementById('progressPanelSub');
            if (sub) {
              var secLeft = Math.ceil((maxPolls - pollCount) * 0.5);
              if (secLeft < 20) {
                sub.textContent = '快好了...（约 ' + secLeft + ' 秒）';
              }
            }
            setTimeout(poll, 500);
          } else if (data.status === 'error' || data.success === false) {
            showPhotoProgressError(data.error || '识别失败');
          } else {
            setTimeout(poll, 500);
          }
        })
        .catch(function() { setTimeout(poll, 800); });
    }
    poll();
  }

  window.setAge = function(age) {
    state.selectedAge = age;
    var btns = document.querySelectorAll('.age-btn');
    btns.forEach(function(b) { b.classList.remove('selected'); });
    // 如果年龄刚好匹配一个按钮，就高亮；否则不高亮（自己填的情况）
    btns.forEach(function(b) {
      var btnAge = parseInt(b.textContent);
      if (btnAge === age) b.classList.add('selected');
    });
    // 显示已选年龄
    var disp = document.getElementById('selectedAgeDisplay');
    if (disp) disp.textContent = '已选：' + age + ' 岁';
    updateRecommendationPreview();
  };

  window.saveCustomAge = function() {
    var input = document.getElementById('customAgeInput');
    if (!input) return;
    var val = parseInt(input.value);
    if (isNaN(val) || val < 5 || val > 120) {
      alert('请输入 5-120 之间的年龄');
      return;
    }
    setAge(val);
    input.value = '';
  };

  function renderGenderChips(gender) {
    var chips = document.querySelectorAll('#genderChips .chip');
    chips.forEach(function(c) {
      c.classList.remove('selected');
      if (c.getAttribute('data-gender') === gender) c.classList.add('selected');
    });
  }

  function renderConditionChips(condition) {
    var chips = document.querySelectorAll('#conditionChips .chip');
    chips.forEach(function(c) {
      c.classList.remove('selected');
      if (c.getAttribute('data-condition') === condition) c.classList.add('selected');
    });
  }

  // 点击性别按钮
  document.addEventListener('click', function(e) {
    // 性别按钮
    var genderChip = e.target.closest && e.target.closest('#genderChips .chip');
    if (genderChip) {
      state.selectedGender = genderChip.getAttribute('data-gender');
      document.querySelectorAll('#genderChips .chip').forEach(function(c) {
        c.classList.remove('selected');
      });
      genderChip.classList.add('selected');
      updateRecommendationPreview();
      return;
    }
    // 健康状况按钮
    var condChip = e.target.closest && e.target.closest('#conditionChips .chip');
    if (condChip) {
      state.selectedCondition = condChip.getAttribute('data-condition');
      document.querySelectorAll('#conditionChips .chip').forEach(function(c) {
        c.classList.remove('selected');
      });
      condChip.classList.add('selected');
      updateRecommendationPreview();
      return;
    }
    // 食物图标选择
    var iconChip = e.target.closest && e.target.closest('#iconPicker .chip');
    if (iconChip) {
      state.selectedIcon = iconChip.getAttribute('data-icon');
      document.querySelectorAll('#iconPicker .chip').forEach(function(c) {
        c.classList.remove('selected');
      });
      iconChip.classList.add('selected');
      return;
    }
    var scanIconChip = e.target.closest && e.target.closest('#scannedIconPicker .chip');
    if (scanIconChip) {
      state.scannedIcon = scanIconChip.getAttribute('data-icon');
      document.querySelectorAll('#scannedIconPicker .chip').forEach(function(c) {
        c.classList.remove('selected');
      });
      scanIconChip.classList.add('selected');
      return;
    }
  });

  window.saveProfile = function() {
    if (!state.selectedAge || !state.selectedGender || !state.selectedCondition) {
      alert('请点一下年龄、性别和健康情况');
      return;
    }

    // 读取补充健康情况（可选，任何预设都可以搭配）
    var customCondition = '';
    var customInput = document.getElementById('customConditionInput');
    if (customInput) {
      customCondition = customInput.value.trim();
    }

    var height = parseFloat(document.getElementById('profileHeight').value);
    var weight = parseFloat(document.getElementById('profileWeight').value);

    // 构建 conditionLabel
    var conditionLabels = {
      healthy: '健康', fatloss: '减脂', muscle: '增肌',
      stomach: '胃病/消化差', recovery: '术后恢复', diabetes: '控糖',
      elderly: '老人照护', pregnancy: '孕期', lactation: '哺乳期'
    };
    var conditionLabel = conditionLabels[state.selectedCondition] || state.selectedCondition;
    // 如果有补充健康情况，追加显示
    if (customCondition) {
      conditionLabel = conditionLabel + ' + ' + customCondition;
    }

    state.profile = {
      age: state.selectedAge,
      gender: state.selectedGender,
      condition: state.selectedCondition,
      conditionLabel: conditionLabel,
      customCondition: customCondition,
      height: height || (state.selectedGender === 'male' ? 170 : 160),
      weight: weight || 60
    };
    calculateRecommendation();
    saveProfileToStorage();
    renderAll();
    toggleProfile();
  };

  window.clearProfile = function() {
    state.profile = null;
    state.recommendation = null;
    state.selectedAge = null;
    state.selectedGender = null;
    state.selectedCondition = null;
    document.querySelectorAll('.age-btn').forEach(function(b) { b.classList.remove('selected'); });
    document.querySelectorAll('#genderChips .chip').forEach(function(c) { c.classList.remove('selected'); });
    document.querySelectorAll('#conditionChips .chip').forEach(function(c) { c.classList.remove('selected'); });
    var customInput = document.getElementById('customConditionInput');
    if (customInput) { customInput.value = ''; }
    document.getElementById('recommendationPreview').style.display = 'none';
    localStorage.removeItem('chidemingbai_profile');
    renderAll();
  };

  function calculateRecommendation() {
    if (!state.profile) return;
    var p = state.profile;
    // 确保所有参数有默认值，防止NaN
    var weight = p.weight || 60;
    var age = p.age || 30;
    var height = p.height || (p.gender === 'male' ? 170 : 160);
    var bmr = 10 * weight + 6.25 * height - 5 * age + (p.gender === 'male' ? 5 : -161);
    if (isNaN(bmr) || bmr <= 0) bmr = 1400;
    var activityFactor = 1.3; // 轻度活动
    var baseCal;
    var proteinRatio;
    var fatRatio = 0.28;
    var carbRatio = 0.52;

    switch(p.condition) {
      case 'healthy':
        baseCal = bmr * activityFactor;
        proteinRatio = 1.0;
        break;
      case 'fatloss':
        baseCal = bmr * activityFactor * 0.8;
        proteinRatio = 1.4;
        fatRatio = 0.30;
        carbRatio = 0.42;
        break;
      case 'muscle':
        baseCal = bmr * activityFactor * 1.15;
        proteinRatio = 1.7;
        fatRatio = 0.28;
        carbRatio = 0.52;
        break;
      case 'elderly':
        baseCal = bmr * activityFactor * 0.9;
        proteinRatio = 1.3;
        break;
      case 'stomach':
        baseCal = bmr * activityFactor * 0.9;
        proteinRatio = 1.1;
        fatRatio = 0.25;
        carbRatio = 0.55;
        break;
      case 'recovery':
        baseCal = bmr * activityFactor * 1.1;
        proteinRatio = 1.4;
        break;
      case 'diabetes':
        baseCal = bmr * activityFactor * 0.95;
        proteinRatio = 1.2;
        fatRatio = 0.30;
        carbRatio = 0.48;
        break;
      case 'pregnancy':
        baseCal = bmr * activityFactor * 1.1;
        proteinRatio = 1.3;
        break;
      case 'lactation':
        baseCal = bmr * activityFactor * 1.15;
        proteinRatio = 1.3;
        break;
      default:
        baseCal = bmr * activityFactor;
        proteinRatio = 1.1;
    }

    // ===== 微量营养素推荐值（依据《中国居民膳食指南2022》按人群细分）=====
    var age = p.age || 30;
    var isElderly = age >= 50;
    var isYouth = age <= 18;
    var isPregnancy = p.condition === 'pregnancy';
    var isLactation = p.condition === 'lactation';
    var isDiabetes = p.condition === 'diabetes';

    // 钙：青少年1000-1200mg，成人800mg，老人1000mg，孕中晚期1000-1200mg
    var recoCa = 800;
    if (isYouth) recoCa = 1000;
    else if (isElderly) recoCa = 1000;
    if (isPregnancy || isLactation) recoCa = 1000;

    // 铁：男12mg，女18mg；孕期20mg，哺乳期18mg
    var recoFe = p.gender === 'male' ? 12 : 18;
    if (isPregnancy) recoFe = 20;
    if (isLactation) recoFe = 18;

    // 锌：男12.5mg，女7.5mg；孕期9.5mg，哺乳期12mg
    var recoZn = p.gender === 'male' ? 12.5 : 7.5;
    if (isPregnancy) recoZn = 9.5;
    if (isLactation) recoZn = 12;

    // 维生素A：男800μg，女700μg；孕期770μg，哺乳期1300μg
    var recoVa = p.gender === 'male' ? 800 : 700;
    if (isPregnancy) recoVa = 770;
    if (isLactation) recoVa = 1300;

    // 维生素C：成人100mg，孕妇115mg，哺乳期150mg
    var recoVc = 100;
    if (isPregnancy) recoVc = 115;
    if (isLactation) recoVc = 150;

    // 膳食纤维：成人25-30g，糖尿病患者30g
    var recoFiber = 25;
    if (isDiabetes) recoFiber = 30;

    // 使用完整的营养素推荐系统
    if (typeof calcAllRecommendations === 'function') {
      state.recommendation = calcAllRecommendations({
        age: p.age || 30,
        gender: p.gender || 'female',
        weight: p.weight || 60,
        height: p.height || (p.gender === 'male' ? 170 : 160),
        activity: p.activity || 'light',
        condition: p.condition || 'normal'
      });
    } else {
      state.recommendation = {
        cal: Math.round(baseCal),
        protein: Math.round(weight * proteinRatio),
        fat: Math.round(baseCal * fatRatio / 9),
        carb: Math.round(baseCal * carbRatio / 4),
        fiber: recoFiber,
        ca: recoCa,
        fe: recoFe,
        zn: recoZn,
        va: recoVa,
        vc: recoVc
      };
    }
  }

  function updateRecommendationPreview() {
    if (!state.selectedAge || !state.selectedGender || !state.selectedCondition) return;

    var height = parseFloat(document.getElementById('profileHeight').value);
    var weight = parseFloat(document.getElementById('profileWeight').value);

    var tempProfile = {
      age: state.selectedAge,
      gender: state.selectedGender,
      condition: state.selectedCondition,
      height: height || (state.selectedGender === 'male' ? 170 : 160),
      weight: weight || 60
    };
    var saved = state.profile;
    state.profile = tempProfile;
    calculateRecommendation();

    if (state.recommendation) {
      // 动态生成所有营养素推荐值
      var recoPreview = document.getElementById('recommendationPreview');
      var recoHTML = '<h4>📋 今日营养目标</h4>';

      // 核心营养素
      recoHTML += '<div class="reco-section-label">核心营养素</div>';
      recoHTML += '<div class="reco-grid">';
      ['cal','protein','fat','carb','fiber','na'].forEach(function(key) {
        var def = getNutrientDef(key);
        if (def) {
          recoHTML += '<div class="reco-item"><span class="reco-value">' + (state.recommendation[key] || 0) + '</span><span class="reco-label">' + def.name + ' ' + def.unit + '</span></div>';
        }
      });
      recoHTML += '</div>';

      // 矿物质
      recoHTML += '<div class="reco-section-label">矿物质</div>';
      recoHTML += '<div class="reco-grid reco-grid-micro">';
      ['ca','fe','zn','se','k','mg','p','cu','mn','i'].forEach(function(key) {
        var def = getNutrientDef(key);
        if (def && state.recommendation[key]) {
          recoHTML += '<div class="reco-item"><span class="reco-value">' + state.recommendation[key] + '</span><span class="reco-label">' + def.name + ' ' + def.unit + '</span></div>';
        }
      });
      recoHTML += '</div>';

      // 维生素
      recoHTML += '<div class="reco-section-label">维生素</div>';
      recoHTML += '<div class="reco-grid reco-grid-micro">';
      ['va','vc','vd','ve','vk','vb1','vb2','vb6','vb12','niacin','folate','pantothenic'].forEach(function(key) {
        var def = getNutrientDef(key);
        if (def && state.recommendation[key]) {
          recoHTML += '<div class="reco-item"><span class="reco-value">' + state.recommendation[key] + '</span><span class="reco-label">' + def.name + ' ' + def.unit + '</span></div>';
        }
      });
      recoHTML += '</div>';

      recoHTML += '<p class="reco-hint" id="recoHint"></p>';
      recoPreview.innerHTML = recoHTML;
      recoPreview.style.display = 'block';
    }
    state.profile = saved;
  }

  function saveProfileToStorage() {
    try { localStorage.setItem('chidemingbai_profile', JSON.stringify(state.profile)); } catch(e) {}
  }

  function loadProfile() {
    try {
      var raw = localStorage.getItem('chidemingbai_profile');
      if (raw) {
        state.profile = JSON.parse(raw);
        state.selectedAge = state.profile.age;
        state.selectedGender = state.profile.gender;
        state.selectedCondition = state.profile.condition;
        // 回填身高体重
        var hEl = document.getElementById('profileHeight');
        var wEl = document.getElementById('profileWeight');
        if (hEl && state.profile.height) hEl.value = state.profile.height;
        if (wEl && state.profile.weight) wEl.value = state.profile.weight;
        // 回填补充健康情况
        var customInput = document.getElementById('customConditionInput');
        if (customInput && state.profile.customCondition) {
          customInput.value = state.profile.customCondition;
        }
        calculateRecommendation();
      }
    } catch(e) {}
  }

  // ==================== 常吃食物（自定义）====================
  window.toggleCustomFood = function() {
    var content = document.getElementById('customFoodContent');
    var toggle = document.getElementById('customFoodToggle');
    if (content.style.display === 'none') {
      content.style.display = 'block';
      toggle.textContent = '▲';
      renderCustomFoodList();
    } else {
      content.style.display = 'none';
      toggle.textContent = '▼';
    }
  };

  window.openManualFoodForm = function() {
    document.getElementById('manualFoodModal').style.display = 'flex';
    document.getElementById('customFoodName').value = '';
    document.getElementById('customFoodCal').value = '';
    document.getElementById('customFoodProtein').value = '';
    document.getElementById('customFoodFat').value = '';
    document.getElementById('customFoodCarb').value = '';
  };

  // AI 查询食物营养（手动添加时）
  window.aiSearchFood = function() {
    var nameInput = document.getElementById('customFoodName');
    var name = nameInput ? nameInput.value.trim() : '';
    if (!name) {
      alert('请先输入食物名称');
      return;
    }

    var btn = document.getElementById('aiSearchBtn');
    if (btn) {
      btn.textContent = '⏳ 查询中...';
      btn.disabled = true;
    }

    fetch('/api/search_food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      if (btn) {
        btn.textContent = '🤖 AI查询营养';
        btn.disabled = false;
      }
      if (data.success && data.food) {
        var f = data.food;
        // 填充表单
        if (nameInput) nameInput.value = f.name;
        var calInput = document.getElementById('customFoodCal');
        var proInput = document.getElementById('customFoodProtein');
        var fatInput = document.getElementById('customFoodFat');
        var carbInput = document.getElementById('customFoodCarb');
        var weightInput = document.getElementById('manualWeight');
        var unitInput = document.getElementById('manualUnit');

        // 换算成每100g的值
        var w = f.weight || 100;
        if (calInput) calInput.value = Math.round(f.cal / w * 100);
        if (proInput) proInput.value = Math.round(f.protein / w * 100 * 10) / 10;
        if (fatInput) fatInput.value = Math.round(f.fat / w * 100 * 10) / 10;
        if (carbInput) carbInput.value = Math.round(f.carb / w * 100 * 10) / 10;
        if (weightInput) weightInput.value = w;
        if (unitInput) unitInput.value = '份';

        // 填充微量营养素
        if (typeof NUTRIENT_DEFS !== 'undefined') {
          NUTRIENT_DEFS.forEach(function(n) {
            var input = document.getElementById('manual_' + n.key);
            if (input && f[n.key] !== undefined) {
              input.value = Math.round(f[n.key] / w * 100 * 10) / 10;
            }
          });
        }

        var sourceLabel = data.source === 'local_db' ? '本地数据库' : 'MiMo AI';
        alert('✅ 已从' + sourceLabel + '获取「' + f.name + '」的营养数据，请确认后保存');
      } else {
        alert('未找到「' + name + '」的营养数据，请手动填写');
      }
    })
    .catch(function(err) {
      if (btn) {
        btn.textContent = '🤖 AI查询营养';
        btn.disabled = false;
      }
      alert('查询失败：' + err.message + '，请手动填写');
    });
  };

  // 绑定 AI 查询按钮
  document.addEventListener('DOMContentLoaded', function() {
    var aiBtn = document.getElementById('aiSearchBtn');
    if (aiBtn) aiBtn.addEventListener('click', window.aiSearchFood);
  });

  window.closeManualFoodForm = function() {
    document.getElementById('manualFoodModal').style.display = 'none';
  };

  // 初始化手动添加表单的营养素输入框
  function initManualNutrientGrid() {
    var container = document.getElementById('manualNutrientGrid');
    if (!container) return;
    var html = '';
    var coreKeys = ['cal','protein','fat','carb','fiber','na'];
    var microKeys = ['ca','fe','zn','se','k','mg','p','cu','mn','i','va','vc','vd','ve','vk','vb1','vb2','vb6','vb12','niacin','folate','pantothenic'];

    // 核心营养素（默认显示）
    html += '<div class="nutrient-section-title">核心营养素（每100g）</div>';
    html += '<div class="nutrient-input-grid">';
    coreKeys.forEach(function(key) {
      var n = getNutrientDef(key);
      if (!n) return;
      html +=
        '<div class="nutrient-input-item">' +
          '<label class="form-label">' + n.icon + ' ' + n.name + '<br><small>(' + n.unit + ')</small></label>' +
          '<input type="number" id="manual_' + n.key + '" class="form-input nutrient-input" step="0.1" min="0" placeholder="0" data-key="' + n.key + '">' +
        '</div>';
    });
    html += '</div>';

    // 微量营养素（默认隐藏，点击展开）
    html += '<button type="button" class="chip" style="margin:8px 0;" onclick="var d=document.getElementById(\'microNutrientInputs\');d.style.display=d.style.display==\'none\'?\'block\':\'none\';this.textContent=d.style.display==\'none\'?\'展开微量营养素 ▼\':\'收起 ▲\';">展开微量营养素 ▼</button>';
    html += '<div id="microNutrientInputs" style="display:none;">';
    html += '<div class="nutrient-section-title">矿物质 & 维生素（每100g）</div>';
    html += '<div class="nutrient-input-grid">';
    microKeys.forEach(function(key) {
      var n = getNutrientDef(key);
      if (!n) return;
      html +=
        '<div class="nutrient-input-item">' +
          '<label class="form-label">' + n.icon + ' ' + n.name + '<br><small>(' + n.unit + ')</small></label>' +
          '<input type="number" id="manual_' + n.key + '" class="form-input nutrient-input" step="0.1" min="0" placeholder="0" data-key="' + n.key + '">' +
        '</div>';
    });
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
  }

  window.saveManualFood = function() {
    var name = document.getElementById('customFoodName').value.trim();
    var weight = parseFloat(document.getElementById('customFoodWeight').value) || 100;
    var unit = document.getElementById('customFoodUnit').value.trim() || '份';

    if (!name) { alert('请填食物名称'); return; }

    // 检查是否为编辑模式
    var modal = document.getElementById('manualFoodModal');
    var editId = modal ? modal.getAttribute('data-edit-id') : null;

    var food = {
      id: editId || ('custom_' + Date.now()),
      name: name,
      category: '自定义',
      unit: unit,
      unitWeight: weight,
      icon: state.selectedIcon
    };

    var hasNutrient = false;
    document.querySelectorAll('#manualNutrientGrid .nutrient-input').forEach(function(input) {
      var key = input.getAttribute('data-key');
      var val = parseFloat(input.value);
      if (!isNaN(val) && val > 0) {
        food[key] = val;
        hasNutrient = true;
      } else {
        food[key] = 0;
      }
    });

    if (!hasNutrient) { alert('请至少填写一种营养成分'); return; }

    if (editId) {
      // 编辑模式：更新已有食物
      // 更新 FOOD_DB
      if (typeof FOOD_DB !== 'undefined') {
        for (var i = 0; i < FOOD_DB.length; i++) {
          if (String(FOOD_DB[i].id) === String(editId)) {
            FOOD_DB[i] = food;
            break;
          }
        }
      }
      // 更新 localStorage
      try {
        var raw = localStorage.getItem('chidemingbai_custom_foods');
        if (raw) {
          var foods = JSON.parse(raw);
          for (var j = 0; j < foods.length; j++) {
            if (String(foods[j].id) === String(editId)) {
              foods[j] = food;
              break;
            }
          }
          localStorage.setItem('chidemingbai_custom_foods', JSON.stringify(foods));
        }
      } catch(e) {}
      // 清除编辑标记
      modal.removeAttribute('data-edit-id');
      // 恢复标题
      var header = modal.querySelector('.profile-modal-header h3');
      if (header) header.textContent = '➕ 手动添加食物';
      var saveBtn = document.getElementById('saveManualBtn');
      if (saveBtn) saveBtn.textContent = '保存';
    } else {
      // 新增模式
      if (typeof FOOD_DB !== 'undefined') FOOD_DB.unshift(food);
      try {
        var existing = [];
        var raw2 = localStorage.getItem('chidemingbai_custom_foods');
        if (raw2) existing = JSON.parse(raw2);
        existing.unshift(food);
        localStorage.setItem('chidemingbai_custom_foods', JSON.stringify(existing));
      } catch(e) {}
    }

    closeManualFoodForm();
    renderCustomFoodList();
    alert(editId ? '已更新：' + name : '已添加：' + name);
  };

  window.openLabelScanner = function() {
    document.getElementById('labelScanModal').style.display = 'flex';
    document.getElementById('labelScanResult').style.display = 'none';
    document.getElementById('saveScannedBtn').style.display = 'none';
    var oldStatus = document.getElementById('labelScanStatusBar');
    if (oldStatus) oldStatus.remove();
  };

  window.closeLabelScanner = function() {
    document.getElementById('labelScanModal').style.display = 'none';
  };

  window.handleLabelImageUpload = function(event) {
    var file = event.target.files[0];
    if (!file) return;

    var resultDiv = document.getElementById('labelScanResult');
    resultDiv.style.display = 'block';
    document.getElementById('saveScannedBtn').style.display = 'inline-flex';
    var oldStatus = document.getElementById('labelScanStatusBar');
    if (oldStatus) oldStatus.remove();

    // 立即显示表单（空）
    fillLabelScanForm({ name: '', weight: 100, unit: '份' });

    var statusBar = document.createElement('div');
    statusBar.className = 'label-scan-status';
    statusBar.id = 'labelScanStatusBar';
    statusBar.innerHTML = '<span class="analyzing-icon">📷</span> 图片已收到，正在压缩上传...';
    resultDiv.parentNode.insertBefore(statusBar, resultDiv);

    // ===== 客户端压缩图片 =====
    var img = new Image();
    var canvas = document.createElement('canvas');
    var reader = new FileReader();

    reader.onload = function(e) {
      img.src = e.target.result;
    };
    img.onload = function() {
      // 营养成分表是小字图片，需要高清晰度
      // 最大宽度1600px，JPEG质量0.92，保留文字清晰度
      var maxW = 1600;
      var scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      var compressedBase64 = canvas.toDataURL('image/jpeg', 0.92);

      console.log('[扫描] 压缩后大小:', Math.round(compressedBase64.length * 0.75 / 1024) + 'KB',
                  '尺寸:', canvas.width + 'x' + canvas.height, '质量: 0.92');

      // ====== 优先走 MiMo AI（后端），Tesseract作为备用 ======
      updateLabelStatus('🔍 MiMo AI 正在识别表格文字...（营养表字多，可能需要 20-60 秒，请稍等）', false);

      fetch('/api/scan_label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: compressedBase64 })
      })
      .then(function(res) {
        if (!res.ok) {
          return res.text().then(function(t) {
            throw new Error('HTTP ' + res.status + ': ' + t.substring(0, 100));
          });
        }
        return res.json();
      })
      .then(function(data) {
        console.log('[扫描] /api/scan_label 完整返回:', JSON.stringify(data).substring(0, 500));
        console.log('[扫描] data.success:', data.success);
        console.log('[扫描] data.error:', data.error);
        if (data.raw_preview) {
          console.log('[扫描] raw_preview 前500字:', String(data.raw_preview).substring(0, 500));
        }
        if (data.success && data.label) {
          // MiMo 识别成功
          var rawText = data.label.raw_text || data.label.raw_text_llm || '';
          console.log('[扫描] MiMo识别到文字:', rawText.substring(0, 500));
          var parsed = Object.assign({}, data.label);
          if (rawText) {
            try {
              var textParsed = parseNutrientsFromText(rawText);
              Object.keys(textParsed || {}).forEach(function(key) {
                // 只在后端没有返回值（undefined/null/''）时，才用文本解析结果填充
                // 如果后端已有非0值，绝不覆盖
                var existingVal = parsed[key];
                var newTextVal = textParsed[key];
                if (key === 'customNutrients') {
                  // 合并 customNutrients，避免重复
                  var existing = parsed.customNutrients || [];
                  newTextVal.forEach(function(cn) {
                    var exists = existing.some(function(e) { return e.name === cn.name; });
                    if (!exists) existing.push(cn);
                  });
                  parsed.customNutrients = existing;
                } else if (existingVal === undefined || existingVal === null || existingVal === '') {
                  parsed[key] = newTextVal;
                } else if (typeof existingVal === 'number' && existingVal === 0 && newTextVal > 0) {
                  // 后端返回了0，但文本解析到了非0值，用文本解析的值
                  parsed[key] = newTextVal;
                }
                // 如果后端已有非0值，不做任何覆盖
              });
            } catch(ex) { console.error('[扫描] 解析失败:', ex); }
          }
          if (data.label.name) parsed.name = data.label.name;
          if (data.label.weight) parsed.weight = data.label.weight;
          if (data.label.unit) parsed.unit = data.label.unit;

          // ====== 检查是否识别到有效数据 ======
          var hasName = parsed.name && parsed.name.trim();
          var standardKeys = ['cal','protein','fat','carb','fiber','na','ca','fe','zn','se','k','mg','p','cu','mn','i','va','vc','vd','ve','vk','vb1','vb2','vb6','vb12','niacin','folate','pantothenic'];
          var hasStandardNutrient = false;
          standardKeys.forEach(function(k) {
            if (parsed[k] && parsed[k] > 0) hasStandardNutrient = true;
          });
          var hasCustom = parsed.customNutrients && parsed.customNutrients.length > 0;

          if (!hasName && !hasStandardNutrient && !hasCustom) {
            // 没有识别到有效数据
            fillLabelScanForm(parsed);
            updateLabelStatus('⚠️ 未识别到有效营养数据，请换一张更清晰的图片或重试。', true);
            // 显示重新上传和手动填写按钮
            var errBar = document.getElementById('labelScanStatusBar');
            if (errBar) {
              var errActions = document.createElement('div');
              errActions.style.cssText = 'display:flex;gap:10px;margin-top:10px;';
              errActions.innerHTML = '<button class="btn btn-primary btn-sm" onclick="document.getElementById(\'labelImageInput\').click()">重新上传</button>' +
                '<button class="btn btn-secondary btn-sm" onclick="closeLabelScanner();openManualFoodForm()">手动填写</button>';
              errBar.appendChild(errActions);
            }
            document.getElementById('saveScannedBtn').style.display = 'none';
          } else {
            fillLabelScanForm(parsed);
            updateLabelStatus('✅ 识别完成，请检查结果后保存', false);
          }
        } else if (data.success && data.task_id) {
          // 图像理解降级模式，需要轮询
          console.log('[扫描] 进入图像理解降级模式，task_id:', data.task_id);
          updateLabelStatus('🔍 正在结构化营养素...（约1-3秒）', false);
          pollLabelScanResult(data.task_id, 0);
        } else if (data.success === false) {
          // MiMo 明确返回失败，显示错误原因后走 Tesseract
          var errMsg = data.error || '未知错误';
          var rawPreview = data.raw_preview || '';
          console.warn('[扫描] MiMo失败:', errMsg, 'raw_preview:', rawPreview);
          updateLabelStatus('⚠️ MiMo 本次识别超时，已尝试本地 OCR。你可以重试、换清晰图片，或手动填写。', true);
          tryTesseractFallback(compressedBase64, errMsg);
        } else {
          console.warn('[扫描] MiMo返回未知结构:', JSON.stringify(data).substring(0, 200));
          updateLabelStatus('⚠️ MiMo 返回异常，正在使用本地 OCR 备用...', true);
          tryTesseractFallback(compressedBase64, '返回异常');
        }
      })
      .catch(function(err) {
        console.error('[扫描] MiMo请求失败:', err.message, '，尝试Tesseract备用');
        tryTesseractFallback(compressedBase64);
      });
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  // Tesseract备用识别
  function tryTesseractFallback(compressedBase64, mimoError) {
    var mimoErr = mimoError || '';
    if (typeof Tesseract === 'undefined') {
      updateLabelStatus('⚠️ MiMo失败且Tesseract未加载，可手动填写' + (mimoErr ? '（MiMo错误：' + mimoErr + '）' : ''), true);
      return;
    }
    updateLabelStatus('🔍 MiMo 本次没有得到可用结果，正在用本地 OCR 备用...（约5-15秒）' + (mimoErr ? '（原因：' + mimoErr + '）' : ''), false);
    Tesseract.recognize(
      compressedBase64,
      'chi_sim+eng',
      {
        logger: function(m) {
          if (m.status === 'recognizing text') {
            updateLabelStatus('🔍 本地识别中... ' + Math.round(m.progress * 100) + '%', false);
          }
        }
      }
    ).then(function(result) {
      var rawText = result.data.text || '';
      console.log('[扫描] Tesseract结果:', rawText.substring(0, 200));
      if (rawText.trim()) {
        var parsed = {};
        try { parsed = parseNutrientsFromText(rawText); } catch(ex) { console.error('[扫描] Tesseract解析失败:', ex); }
        fillLabelScanForm(parsed);
        // 保留 MiMo 失败原因，不掩盖错误
        if (mimoErr) {
          updateLabelStatus('⚠️ MiMo 本次识别失败：' + mimoErr + '；已使用本地 OCR 备用，请检查结果', true);
        } else {
          updateLabelStatus('✅ 本地识别完成（备用），请确认后保存', false);
        }
      } else {
        updateLabelStatus('⚠️ 未识别到文字，可手动填写' + (mimoErr ? '（MiMo错误：' + mimoErr + '）' : ''), true);
      }
    }).catch(function(err) {
      console.error('[扫描] Tesseract失败:', err);
      updateLabelStatus('⚠️ 识别失败：' + (err.message || '') + '，可手动填写' + (mimoErr ? '（MiMo错误：' + mimoErr + '）' : ''), true);
    });
  };

  // 轮询获取营养成分表扫描结果（图像理解降级模式）
  function pollLabelScanResult(taskId, count) {
    if (count > 30) {
      console.warn('[扫描] 图像理解轮询超时');
      updateLabelStatus('⏱️ MiMo AI 识别超时，可手动填写或重试', true);
      return;
    }
    fetch('/api/scan_label_result?task_id=' + taskId)
      .then(function(res) { return res.json(); })
      .then(function(data) {
        console.log('[扫描] 轮询第' + count + '次:', data.status);
        if (data.status === 'done' && data.label) {
          var rawText = data.label.raw_text || data.label.raw_text_llm || '';
          console.log('[扫描] 图像理解完成，文字:', rawText.substring(0, 200));
          var parsed = {};
          if (rawText) {
            try { parsed = parseNutrientsFromText(rawText); } catch(ex) { console.error('[扫描] 解析失败:', ex); }
          }
          if (data.label.name) parsed.name = data.label.name;
          fillLabelScanForm(parsed);
          updateLabelStatus('✅ MiMo AI 识别完成，请确认后保存', false);
        } else if (data.status === 'processing') {
          setTimeout(function() { pollLabelScanResult(taskId, count + 1); }, 2000);
        } else if (data.status === 'error') {
          console.warn('[扫描] 图像理解失败:', data.error, '，尝试Tesseract备用');
          // 图像理解也失败了，尝试Tesseract
          var canvas = document.createElement('canvas');
          // 需要重新获取图片数据，这里用Tesseract需要图片URL
          // 简化处理：直接提示手动填写
          updateLabelStatus('⚠️ ' + (data.error || '识别失败') + '，可手动填写', true);
        }
      })
      .catch(function(err) {
        console.error('[扫描] 轮询失败:', err);
        if (count < 30) {
          setTimeout(function() { pollLabelScanResult(taskId, count + 1); }, 3000);
        } else {
          updateLabelStatus('⚠️ 网络问题，可手动填写', true);
        }
      });
  };

  function pollLabelFast(taskId) {
    var pollCount = 0;
    var maxPolls = 15;
    function poll() {
      pollCount++;
      if (pollCount > maxPolls) {
        updateLabelStatus('较慢，您可以直接手动填写', true);
        return;
      }
      fetch('/api/result/' + taskId)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (data.success && data.label) {
            var lb = data.label;
            if (document.getElementById('scannedFoodName') && !document.getElementById('scannedFoodName').value) {
              document.getElementById('scannedFoodName').value = lb.name || '';
            }
            if (document.getElementById('scannedCal')) document.getElementById('scannedCal').value = lb.cal || '';
            if (document.getElementById('scannedProtein')) document.getElementById('scannedProtein').value = lb.protein || '';
            if (document.getElementById('scannedFat')) document.getElementById('scannedFat').value = lb.fat || '';
            if (document.getElementById('scannedCarb')) document.getElementById('scannedCarb').value = lb.carb || '';
            if (document.getElementById('scannedFiber')) document.getElementById('scannedFiber').value = lb.fiber || '';
            if (document.getElementById('scannedNa')) document.getElementById('scannedNa').value = lb.na || '';
            if (document.getElementById('scannedCa')) document.getElementById('scannedCa').value = lb.ca || '';
            if (document.getElementById('scannedFe')) document.getElementById('scannedFe').value = lb.fe || '';
            if (lb.weight && document.getElementById('scannedWeight')) document.getElementById('scannedWeight').value = lb.weight;
            if (lb.unit && document.getElementById('scannedUnit')) document.getElementById('scannedUnit').value = lb.unit;
            updateLabelStatus('✅ 已识别，请确认后保存', false);
          } else if (data.status === 'pending') {
            updateLabelStatus('识别中...（' + Math.ceil((maxPolls - pollCount) / 3) + '秒，可直接手动填）', false);
            setTimeout(poll, 333);
          } else {
            updateLabelStatus('未识别成功，请手动填写', true);
          }
        })
        .catch(function() { setTimeout(poll, 800); });
    }
    poll();
  }

  function updateLabelStatus(msg, isError) {
    var bar = document.getElementById('labelScanStatusBar');
    if (bar) {
      bar.className = 'label-scan-status' + (isError ? ' status-error' : '');
      bar.innerHTML = msg;
    }
  }

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>"']/g, function(ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function parseNutrientsFromText(rawText) {
    var label = { weight: 100, unit: '份', customNutrients: [] };
    var text = String(rawText || '');
    var nameMatch = text.match(/(?:产品名称|产品名|品名|名称)[：:]\s*([^\n,，。]+)/);
    if (nameMatch) label.name = nameMatch[1].trim();

    // 将 Unicode 下标转换为常规数字
    var subMap = {'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9'};
    text = text.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, function(c) { return subMap[c] || c; });

    var aliases = {
      '能量': 'cal', '热量': 'cal',
      '蛋白质': 'protein',
      '脂肪': 'fat', '总脂肪': 'fat',
      '碳水化合物': 'carb',
      '膳食纤维': 'fiber',
      '钠': 'na', '钙': 'ca', '铁': 'fe', '锌': 'zn', '硒': 'se', '钾': 'k',
      '镁': 'mg', '磷': 'p', '铜': 'cu', '锰': 'mn', '碘': 'i',
      '氯': null, // 氯不是标准字段，放入 customNutrients
      '维生素A': 'va', '维生素a': 'va',
      '维生素C': 'vc', '维生素c': 'vc',
      '维生素D': 'vd', '维生素d': 'vd',
      '维生素E': 've', '维生素e': 've',
      '维生素K': 'vk', '维生素k': 'vk', '维生素K1': 'vk', '维生素k1': 'vk',
      '维生素B1': 'vb1', '维生素b1': 'vb1', 'VB1': 'vb1', '硫胺素': 'vb1',
      '维生素B2': 'vb2', '维生素b2': 'vb2', 'VB2': 'vb2', '核黄素': 'vb2',
      '维生素B6': 'vb6', '维生素b6': 'vb6', 'VB6': 'vb6',
      '维生素B12': 'vb12', '维生素b12': 'vb12', 'VB12': 'vb12',
      '烟酸': 'niacin', '叶酸': 'folate', '泛酸': 'pantothenic'
    };
    var lines = text.split(/\r?\n|；|;/).map(function(line) { return line.trim(); }).filter(Boolean);
    lines.forEach(function(line) {
      var m = line.match(/^([\u4e00-\u9fa5A-Za-zαβγΩω\-]+)\s*[:：]?\s*(-?\d+(?:\.\d+)?)\s*(kJ|千焦|kcal|千卡|g|mg|μg|ug|%)?/i);
      if (!m) return;
      var name = m[1].trim();
      var value = parseFloat(m[2]);
      var unit = m[3] || '';
      // 尝试精确匹配，再尝试去空格匹配
      var key = aliases[name] || aliases[name.replace(/\s+/g, '')];
      if (key) {
        if (key === 'cal' && (/kJ|千焦/i).test(unit)) value = Math.round(value / 4.184 * 10) / 10;
        label[key] = value;
      } else if (!/产品|营养|其他|供能比/.test(name)) {
        label.customNutrients.push({ name: name, value: value, unit: unit || 'mg' });
      }
    });
    return label;
  }

  function fillLabelScanForm(label) {
    var resultDiv = document.getElementById('labelScanResult');

    // 构建营养素输入框（核心+矿物质+维生素）
    var nutrientRows = '';
    NUTRIENT_DEFS.forEach(function(n) {
      var val = label[n.key] !== undefined ? label[n.key] : '';
      nutrientRows +=
        '<div class="nutrient-input-item">' +
          '<label class="form-label">' + n.icon + ' ' + n.name + '<br><small>（每100g·' + n.unit + '）</small></label>' +
          '<input type="number" id="scanned_' + n.key + '" class="form-input nutrient-input" step="0.1" min="0" value="' + val + '" placeholder="0" data-key="' + n.key + '" data-name="' + n.name + '" data-unit="' + n.unit + '">' +
        '</div>';
    });

    resultDiv.innerHTML =
      '<h4 class="scan-result-title">🔍 AI 识别结果（可以修改）</h4>' +
      '<div class="profile-form">' +
        '<div class="form-row">' +
          '<label class="form-label">食物名称</label>' +
          '<input type="text" id="scannedFoodName" class="form-input" placeholder="请填写" value="' + escapeHtml(label.name || '') + '">' +
        '</div>' +
        '<div class="form-row">' +
          '<label class="form-label">选一个图标</label>' +
          '<div class="chip-group" id="scannedIconPicker">' +
            '<button type="button" class="chip' + (state.scannedIcon === '🍚' ? ' selected' : '') + '" data-icon="🍚">🍚 主食</button>' +
            '<button type="button" class="chip" data-icon="🥩">🥩 肉类</button>' +
            '<button type="button" class="chip" data-icon="🥚">🥚 蛋/奶</button>' +
            '<button type="button" class="chip" data-icon="🥬">🥬 蔬菜</button>' +
            '<button type="button" class="chip" data-icon="🍎">🍎 水果</button>' +
            '<button type="button" class="chip" data-icon="🥛">🥛 补剂</button>' +
            '<button type="button" class="chip" data-icon="🍫">🍫 零食</button>' +
            '<button type="button" class="chip" data-icon="☕">☕ 饮品</button>' +
          '</div>' +
        '</div>' +
        '<div class="nutrient-section-title">📊 营养成分（每100g）</div>' +
        '<div class="nutrient-input-grid">' +
          nutrientRows +
        '</div>' +
        // 自定义营养素区域
        '<div class="nutrient-section-title" style="margin-top:12px;">➕ 自定义营养素（可选）</div>' +
        '<div id="customNutrientList"></div>' +
        '<button type="button" class="add-custom-nutrient-btn" onclick="addCustomNutrient()">+ 添加自定义营养素</button>' +
        '<div class="form-row-two-col" style="margin-top:12px;">' +
          '<div><label class="form-label">每份量（g）</label><input type="number" id="scannedWeight" class="form-input" value="' + (label.weight || 100) + '" step="1" min="1"></div>' +
          '<div><label class="form-label">单位</label><input type="text" id="scannedUnit" class="form-input" value="' + escapeHtml(label.unit || '份') + '"></div>' +
        '</div>' +
      '</div>';

    (label.customNutrients || []).forEach(function(n) {
      window.addCustomNutrient(n);
    });
  }

  // 添加自定义营养素输入框
  window.addCustomNutrient = function(nutrient) {
    nutrient = nutrient || {};
    var container = document.getElementById('customNutrientList');
    var div = document.createElement('div');
    div.className = 'custom-nutrient-row';
    div.innerHTML =
      '<input type="text" class="form-input custom-nutrient-name" placeholder="营养素名称" style="flex:1" value="' + escapeHtml(String(nutrient.name || '')) + '">' +
      '<input type="number" class="form-input custom-nutrient-value" placeholder="数值" step="0.1" min="0" style="width:80px" value="' + (nutrient.value !== undefined ? nutrient.value : '') + '">' +
      '<input type="text" class="form-input custom-nutrient-unit" placeholder="单位" style="width:60px" value="' + escapeHtml(String(nutrient.unit || '')) + '">' +
      '<button type="button" class="remove-custom-nutrient" onclick="this.parentElement.remove()">✕</button>';
    container.appendChild(div);
  };

  window.saveScannedFood = function() {
    var name = document.getElementById('scannedFoodName').value.trim();
    var weight = parseFloat(document.getElementById('scannedWeight').value) || 100;
    var unit = document.getElementById('scannedUnit').value.trim() || '份';

    if (!name) { alert('请填食物名称'); return; }

    // 收集所有标准营养素
    var food = {
      id: 'custom_' + Date.now(),
      name: name,
      category: '自定义',
      unit: unit,
      unitWeight: weight,
      icon: state.scannedIcon
    };

    var hasNutrient = false;
    document.querySelectorAll('.nutrient-input').forEach(function(input) {
      var key = input.getAttribute('data-key');
      var val = parseFloat(input.value);
      if (!isNaN(val) && val > 0) {
        food[key] = val;
        hasNutrient = true;
      } else {
        food[key] = 0;
      }
    });

    // 收集自定义营养素
    var customNutrients = [];
    document.querySelectorAll('.custom-nutrient-row').forEach(function(row) {
      var cname = row.querySelector('.custom-nutrient-name').value.trim();
      var cval = parseFloat(row.querySelector('.custom-nutrient-value').value);
      var cunit = row.querySelector('.custom-nutrient-unit').value.trim() || 'mg';
      if (cname && !isNaN(cval)) {
        customNutrients.push({ name: cname, value: cval, unit: cunit });
      }
    });
    if (customNutrients.length > 0) {
      food.customNutrients = customNutrients;
    }

    if (!hasNutrient && customNutrients.length === 0) {
      alert('请至少填写一种营养成分');
      return;
    }

    if (typeof FOOD_DB !== 'undefined') FOOD_DB.unshift(food);
    try {
      var existing = [];
      var raw = localStorage.getItem('chidemingbai_custom_foods');
      if (raw) existing = JSON.parse(raw);
      existing.unshift(food);
      localStorage.setItem('chidemingbai_custom_foods', JSON.stringify(existing));
    } catch(e) {}

    closeLabelScanner();
    document.getElementById('customFoodContent').style.display = 'block';
    document.getElementById('customFoodToggle').textContent = '▲';
    renderCustomFoodList();
    alert('已添加：' + name);
  };

  function renderCustomFoodList() {
    var listEl = document.getElementById('customFoodList');
    if (!listEl) return;

    var foods = [];
    try {
      var raw = localStorage.getItem('chidemingbai_custom_foods');
      if (raw) foods = JSON.parse(raw);
    } catch(e) {}

    if (foods.length === 0) {
      listEl.innerHTML = '<div class="custom-food-empty">还没有自定义食物。扫描包装上的营养成分表，或手动添加。</div>';
      return;
    }

    listEl.innerHTML = '';
    foods.forEach(function(food) {
      var item = document.createElement('div');
      item.className = 'custom-food-item custom-food-item-lg';
      item.onclick = function() {
        var nutrition = calcNutrition(food, 1);
        var itemObj = { food: food, multiplier: 1, nutrition: nutrition };
        document.getElementById('resultSection').style.display = 'block';
        showResult([itemObj]);
        document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      };

      item.innerHTML =
        '<span class="custom-food-item-icon">' + food.icon + '</span>' +
        '<div class="custom-food-item-info">' +
          '<div class="custom-food-item-name">' + food.name + '</div>' +
          '<div class="custom-food-item-macro">' + food.cal + '千卡 · 蛋白' + food.protein + 'g · 每份' + food.unitWeight + 'g</div>' +
        '</div>' +
        '<button class="custom-food-item-edit" onclick="event.stopPropagation(); editCustomFoodItem(\'' + food.id + '\')" title="编辑">✏️</button>' +
        '<button class="custom-food-item-delete" onclick="event.stopPropagation(); deleteCustomFoodItem(\'' + food.id + '\')" title="删除">✕</button>';
      listEl.appendChild(item);
    });
  }

  // 编辑自定义食物
  window.editCustomFoodItem = function(foodId) {
    var food = null;
    // 从localStorage查找
    try {
      var raw = localStorage.getItem('chidemingbai_custom_foods');
      if (raw) {
        var foods = JSON.parse(raw);
        for (var i = 0; i < foods.length; i++) {
          if (String(foods[i].id) === String(foodId)) {
            food = foods[i];
            break;
          }
        }
      }
    } catch(e) {}

    if (!food) {
      alert('未找到该食物');
      return;
    }

    // 打开手动添加弹窗，预填数据
    var modal = document.getElementById('manualFoodModal');
    if (!modal) return;
    modal.style.display = 'flex';

    // 设置标题为编辑模式
    var header = modal.querySelector('.profile-modal-header h3');
    if (header) header.textContent = '✏️ 编辑食物';

    // 填入已有数据
    var nameInput = document.getElementById('manualFoodName');
    if (nameInput) nameInput.value = food.name || '';

    var weightInput = document.getElementById('manualWeight');
    if (weightInput) weightInput.value = food.unitWeight || 100;

    var unitInput = document.getElementById('manualUnit');
    if (unitInput) unitInput.value = food.unit || '份';

    // 填入营养素
    if (typeof NUTRIENT_DEFS !== 'undefined') {
      NUTRIENT_DEFS.forEach(function(n) {
        var input = document.getElementById('manual_' + n.key);
        if (input) input.value = food[n.key] !== undefined ? food[n.key] : '';
      });
    }

    // 标记为编辑模式
    modal.setAttribute('data-edit-id', foodId);

    // 修改保存按钮文字
    var saveBtn = document.getElementById('saveManualBtn');
    if (saveBtn) saveBtn.textContent = '保存修改';
  };

  window.deleteCustomFoodItem = function(foodId) {
    if (!confirm('删掉这个食物吗？')) return;
    // 从 FOOD_DB 移除
    if (typeof FOOD_DB !== 'undefined') {
      for (var i = 0; i < FOOD_DB.length; i++) {
        if (FOOD_DB[i].id === foodId) {
          FOOD_DB.splice(i, 1);
          break;
        }
      }
    }
    // 从 localStorage 移除
    try {
      var raw = localStorage.getItem('chidemingbai_custom_foods');
      if (raw) {
        var foods = JSON.parse(raw);
        foods = foods.filter(function(f) { return f.id !== foodId; });
        localStorage.setItem('chidemingbai_custom_foods', JSON.stringify(foods));
      }
    } catch(e) {}
    renderCustomFoodList();
  };

  // ==================== 存储 ====================
  // ====== 导出饮食报告 ======
  window.exportReport = function() {
    console.log('[报告] 开始生成饮食报告');

    // 收集最近7天数据
    var recentDays = loadRecentDays(7);
    if (recentDays.length === 0) {
      alert('暂无饮食记录数据。请先记录几天的饮食后再导出报告。');
      return;
    }

    // 计算每天的营养汇总（全部营养素）
    var dailyData = recentDays.map(function(day) {
      var totals = calcDayTotals(day.meals);
      // 三餐分布
      var mealDist = {};
      day.meals.forEach(function(m) {
        if (!mealDist[m.type]) mealDist[m.type] = { count: 0, cal: 0 };
        mealDist[m.type].count++;
        mealDist[m.type].cal += m.totalCal || totals.cal || 0;
      });
      return {
        dateStr: day.dateStr,
        weekday: day.weekday,
        mealCount: day.meals.length,
        totals: totals,
        mealDist: mealDist,
        meals: day.meals.map(function(m) {
          return {
            type: m.type,
            time: m.time,
            cal: m.totalCal || 0,
            protein: m.totalProtein || 0,
            items: (m.items || []).map(function(i) { return i.name; }).join('、')
          };
        })
      };
    });

    // 计算所有营养素的平均值
    var avg = {};
    if (typeof NUTRIENT_DEFS !== 'undefined') {
      NUTRIENT_DEFS.forEach(function(n) { avg[n.key] = 0; });
    } else {
      avg = { cal:0, protein:0, fat:0, carb:0, fiber:0, na:0, ca:0, fe:0, zn:0, va:0, vc:0 };
    }
    dailyData.forEach(function(d) {
      for (var k in avg) {
        avg[k] += d.totals[k] || 0;
      }
    });
    var n = dailyData.length;
    for (var k in avg) avg[k] = Math.round(avg[k] / n * 10) / 10;

    // 食物多样性统计
    var foodCount = {};
    var foodCalCount = {};
    dailyData.forEach(function(d) {
      d.meals.forEach(function(m) {
        m.items.split('、').forEach(function(name) {
          name = name.trim();
          if (name) {
            foodCount[name] = (foodCount[name] || 0) + 1;
          }
        });
      });
    });
    var topFoods = Object.keys(foodCount).sort(function(a, b) { return foodCount[b] - foodCount[a]; });
    var foodVariety = topFoods.length;

    // 用户档案
    var profile = state.profile || {};
    var reco = state.recommendation || {};

    // 生成就医话术
    var conditionLabels = {
      healthy: '健康', fatloss: '减脂', muscle: '增肌',
      stomach: '胃病/消化问题', recovery: '术后恢复', diabetes: '控糖/糖尿病',
      elderly: '老人照护', pregnancy: '孕期', lactation: '哺乳期'
    };
    var conditionLabel = conditionLabels[profile.condition] || '一般健康';
    // 追加补充健康情况
    if (profile.customCondition) {
      conditionLabel = conditionLabel + ' + ' + profile.customCondition;
    }
    var genderLabel = profile.gender === 'male' ? '男' : '女';

    // 话术生成（只描述客观状况，不加诉求）
    var calStatus = avg.cal < reco.cal * 0.8 ? '偏低' : (avg.cal > reco.cal * 1.1 ? '偏高' : '基本达标');
    var proteinStatus = avg.protein < reco.protein * 0.8 ? '偏低' : (avg.protein > reco.protein * 1.2 ? '偏高' : '基本达标');

    // 找出偏低/偏高的营养素
    var lowNutrients = [];
    var highNutrients = [];
    if (typeof NUTRIENT_DEFS !== 'undefined') {
      NUTRIENT_DEFS.forEach(function(nd) {
        var key = nd.key;
        var val = avg[key] || 0;
        var target = reco[key] || 0;
        if (target > 0 && val > 0) {
          var pct = val / target;
          if (pct < 0.5) {
            lowNutrients.push(nd.name + '（' + val + nd.unit + '，目标' + target + nd.unit + '）');
          } else if (pct > 1.5 && key !== 'cal') {
            highNutrients.push(nd.name + '（' + val + nd.unit + '）');
          }
        }
      });
    }

    // 通用话术：完整描述
    var script = '医生您好，我是' + (profile.age || '') + '岁' + genderLabel + '，';
    if (profile.condition && profile.condition !== 'healthy') {
      script += '有' + conditionLabel + '的情况。';
    }
    script += '最近' + n + '天记录了每天的饮食，';
    script += '平均每天摄入约' + avg.cal + '千卡热量、' + avg.protein + '克蛋白质、' + avg.fat + '克脂肪、' + avg.carb + '克碳水。';
    script += '膳食纤维' + avg.fiber + '克，钠' + avg.na + '毫克，';
    if (avg.ca) script += '钙' + avg.ca + '毫克，';
    if (avg.fe) script += '铁' + avg.fe + '毫克，';
    if (avg.zn) script += '锌' + avg.zn + '毫克，';
    if (avg.va) script += '维生素A ' + avg.va + '微克，';
    if (avg.vc) script += '维生素C ' + avg.vc + '毫克。';
    script += '营养目标是' + (reco.cal || 0) + '千卡、' + (reco.protein || 0) + '克蛋白质，';
    script += '热量摄入' + calStatus + '，蛋白质摄入' + proteinStatus + '。';
    if (lowNutrients.length > 0) {
      script += '偏低的营养素有：' + lowNutrients.slice(0, 5).join('、') + '。';
    }
    if (highNutrients.length > 0) {
      script += '偏高的营养素有：' + highNutrients.slice(0, 3).join('、') + '。';
    }

    // 详细话术（分场景，只描述状况）
    var scripts = {
      main: script,
      stomach: profile.condition === 'stomach' ?
        '医生，我胃不太好，最近' + n + '天平均每天吃' + avg.cal + '千卡，蛋白质' + avg.protein + '克。' +
        '常吃的有' + getTopFoods(dailyData, 3) + '。' +
        '膳食纤维每天' + avg.fiber + '克，钠' + avg.na + '毫克。' +
        (avg.fiber < 20 ? '膳食纤维偏低。' : '') +
        (avg.na > 2000 ? '钠偏高。' : '') : null,
      diabetes: profile.condition === 'diabetes' ?
        '医生，我有糖尿病，最近' + n + '天平均每天碳水摄入' + avg.carb + '克，' +
        '热量' + avg.cal + '千卡，蛋白质' + avg.protein + '克，脂肪' + avg.fat + '克。' +
        '膳食纤维' + avg.fiber + '克，钠' + avg.na + '毫克。' +
        (avg.fiber < 25 ? '膳食纤维偏低。' : '') : null,
      elderly: profile.condition === 'elderly' ?
        '医生，家里老人' + (profile.age || '') + '岁，最近' + n + '天平均每天吃' + avg.cal + '千卡，' +
        '蛋白质' + avg.protein + '克，膳食纤维' + avg.fiber + '克。' +
        '钙' + (avg.ca || 0) + '毫克，铁' + (avg.fe || 0) + '毫克，锌' + (avg.zn || 0) + '毫克。' +
        (avg.protein < 60 ? '蛋白质偏低。' : '') +
        (avg.ca < 800 ? '钙偏低。' : '') : null,
      recovery: profile.condition === 'recovery' ?
        '医生，我术后恢复期，最近' + n + '天平均每天摄入' + avg.cal + '千卡、' +
        '蛋白质' + avg.protein + '克、脂肪' + avg.fat + '克、碳水' + avg.carb + '克。' +
        '维生素C ' + (avg.vc || 0) + '毫克，锌' + (avg.zn || 0) + '毫克，铁' + (avg.fe || 0) + '毫克。' +
        (avg.protein < 60 ? '蛋白质偏低。' : '') +
        (avg.vc < 50 ? '维生素C偏低。' : '') : null
    };

    // 发送到后端生成HTML报告
    var reportData = {
      profile: profile,
      recommendation: reco,
      dailyData: dailyData,
      avg: avg,
      scripts: scripts,
      conditionLabel: conditionLabel,
      topFoods: topFoods.slice(0, 10),
      foodVariety: foodVariety,
      nutrientDefs: (typeof NUTRIENT_DEFS !== 'undefined') ? NUTRIENT_DEFS : null,
      generatedAt: new Date().toLocaleString('zh-CN')
    };

    console.log('[报告] 数据收集完成，发送到后端生成HTML');

    // 显示 loading 状态
    var exportBtn = document.querySelector('.btn-export-report');
    var originalText = '';
    if (exportBtn) {
      originalText = exportBtn.innerHTML;
      exportBtn.innerHTML = '⏳ 正在生成报告...';
      exportBtn.disabled = true;
      exportBtn.style.opacity = '0.7';
      exportBtn.style.pointerEvents = 'none';
    }

    // 显示提示
    var loadingHint = document.createElement('div');
    loadingHint.id = 'reportLoadingHint';
    loadingHint.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#2D2A24;color:#fff;padding:12px 24px;border-radius:10px;font-size:0.9rem;z-index:2147483647;text-align:center;max-width:90vw;';
    loadingHint.innerHTML = 'AI 正在整理饮食明细和建议，可能需要 10-30 秒，请不要关闭页面。';
    document.body.appendChild(loadingHint);

    var loadingTimer = setTimeout(function() {
      if (document.getElementById('reportLoadingHint')) {
        document.getElementById('reportLoadingHint').innerHTML = '生成时间较长，仍在处理中，请稍等。';
      }
    }, 45000);

    fetch('/api/export_report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    })
    .then(function(res) { return res.text(); })
    .then(function(html) {
      clearTimeout(loadingTimer);
      var hint = document.getElementById('reportLoadingHint');
      if (hint) hint.remove();

      // 恢复按钮
      if (exportBtn) {
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;
        exportBtn.style.opacity = '';
        exportBtn.style.pointerEvents = '';
      }

      // 优先用 window.open + document.write（比 Blob URL 更稳定）
      var win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
        console.log('[报告] 报告已在新窗口打开');
      } else {
        // 弹窗被拦截，降级为下载 report.html
        console.warn('[报告] 弹窗被拦截，降级为下载');
        var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '饮食报告_' + new Date().toLocaleDateString('zh-CN').replace(/\//g, '') + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function() { URL.revokeObjectURL(a.href); }, 1000);
        console.log('[报告] 报告已下载');
      }
    })
    .catch(function(err) {
      clearTimeout(loadingTimer);
      var hint = document.getElementById('reportLoadingHint');
      if (hint) hint.remove();

      // 恢复按钮
      if (exportBtn) {
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;
        exportBtn.style.opacity = '';
        exportBtn.style.pointerEvents = '';
      }

      console.error('[报告] 生成失败:', err);
      alert('报告生成失败: ' + err.message + '\n\n请重试，或检查网络连接。');
    });
  };

  // 获取出现频率最高的食物
  function getTopFoods(dailyData, topN) {
    var foodCount = {};
    dailyData.forEach(function(d) {
      d.meals.forEach(function(m) {
        m.items.split('、').forEach(function(name) {
          if (name.trim()) {
            foodCount[name.trim()] = (foodCount[name.trim()] || 0) + 1;
          }
        });
      });
    });
    var sorted = Object.keys(foodCount).sort(function(a, b) { return foodCount[b] - foodCount[a]; });
    return sorted.slice(0, topN).join('、');
  }

  function saveToStorage() {
    try {
      var today = new Date().toDateString();
      localStorage.setItem('chidemingbai_' + today, JSON.stringify({ date: today, meals: state.meals }));
    } catch(e) {}
  }

  // 读取最近N天的饮食记录
  function loadRecentDays(numDays) {
    var days = [];
    for (var i = 0; i < numDays; i++) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var key = 'chidemingbai_' + d.toDateString();
      var raw = localStorage.getItem(key);
      if (raw) {
        try {
          var data = JSON.parse(raw);
          if (data.meals && data.meals.length > 0) {
            days.push({
              date: d.toDateString(),
              dateStr: (d.getMonth()+1) + '月' + d.getDate() + '日',
              weekday: '日一二三四五六'[d.getDay()],
              meals: data.meals
            });
          }
        } catch(e) {}
      }
    }
    return days;
  }

  // 计算某天的营养汇总（全部28种营养素）
  function calcDayTotals(meals) {
    var t = {};
    // 初始化所有营养素
    if (typeof NUTRIENT_DEFS !== 'undefined') {
      NUTRIENT_DEFS.forEach(function(n) { t[n.key] = 0; });
    } else {
      t = { cal:0, protein:0, fat:0, carb:0, fiber:0, na:0, ca:0, fe:0, zn:0, va:0, vc:0 };
    }
    meals.forEach(function(meal) {
      if (meal.items) {
        meal.items.forEach(function(item) {
          if (typeof NUTRIENT_DEFS !== 'undefined') {
            NUTRIENT_DEFS.forEach(function(n) {
              t[n.key] += item[n.key] || 0;
            });
          } else {
            t.cal += item.cal || 0;
            t.protein += item.protein || 0;
            t.fat += item.fat || 0;
            t.carb += item.carb || 0;
            t.fiber += item.fiber || 0;
            t.na += item.na || 0;
            t.ca += item.ca || 0;
            t.fe += item.fe || 0;
            t.zn += item.zn || 0;
            t.va += item.va || 0;
            t.vc += item.vc || 0;
          }
        });
      }
    });
    for (var k in t) t[k] = Math.round(t[k] * 10) / 10;
    return t;
  }

  function loadFromStorage() {
    try {
      var today = new Date().toDateString();
      var raw = localStorage.getItem('chidemingbai_' + today);
      if (raw) {
        var data = JSON.parse(raw);
        if (data.meals) state.meals = data.meals;
      }
    } catch(e) {}
  }

  // 工具函数
  function padZero(n) { return n < 10 ? '0' + n : '' + n; }

})();
