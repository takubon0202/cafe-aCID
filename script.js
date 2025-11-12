// ===================================
// カフェマニュアル - メインスクリプト
// ===================================

// グローバル変数
let menuData = {};
let cleaningData = {};
let settings = {};

// ===================================
// 初期化
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // データの読み込み
    loadData();

    // イベントリスナーの設定
    setupEventListeners();

    // 初期ページの表示
    showPage('dashboard');

    // ダッシュボードの更新
    updateDashboard();

    // カレンダーの初期化
    renderCalendar();

    // 設定ページのカレンダー設定を読み込む
    loadCalendarSettings();
}

// ===================================
// データ管理
// ===================================

function loadData() {
    // メニューデータの読み込み
    const savedMenuData = localStorage.getItem(STORAGE_KEYS.MENU_DATA);
    menuData = savedMenuData ? JSON.parse(savedMenuData) : initialData.menu;

    // 清掃データの読み込み
    const savedCleaningData = localStorage.getItem(STORAGE_KEYS.CLEANING_DATA);
    cleaningData = savedCleaningData ? JSON.parse(savedCleaningData) : initialData.cleaning;

    // 設定の読み込み
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    settings = savedSettings ? JSON.parse(savedSettings) : defaultSettings;

    // 日付が変わっていたらチェックリストをリセット
    resetDailyChecklist();

    // メニューページをレンダリング
    renderMenuPages();

    // 清掃ページをレンダリング
    renderCleaningPages();

    // トラブルシューティングをレンダリング
    renderTroubleshooting();
}

function saveData() {
    localStorage.setItem(STORAGE_KEYS.MENU_DATA, JSON.stringify(menuData));
    localStorage.setItem(STORAGE_KEYS.CLEANING_DATA, JSON.stringify(cleaningData));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

    // 更新履歴を記録
    addUpdateHistory('データを保存しました');
}

function resetDailyChecklist() {
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('lastChecklistReset');

    if (lastReset !== today) {
        // 日次清掃のチェックをリセット
        if (cleaningData.daily && cleaningData.daily.tasks) {
            cleaningData.daily.tasks.forEach(task => {
                task.completed = false;
                task.completedAt = null;
            });
            saveData();
        }
        localStorage.setItem('lastChecklistReset', today);
    }
}

// ===================================
// イベントリスナー
// ===================================

function setupEventListeners() {
    // ナビゲーションリンク
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.currentTarget.dataset.page;
            navigateToPage(page);
        });
    });

    // メニューボタン
    document.querySelectorAll('.menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.currentTarget.dataset.page;
            navigateToPage(page);
        });
    });

    // メニュートグル（モバイル）
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('open');
    });

    // タブ切り替え
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.currentTarget.dataset.tab;
            switchTab(tab);
        });
    });

    // 画像モーダル
    const modal = document.getElementById('imageModal');
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // 編集モード
    const editModeToggle = document.getElementById('editMode');
    editModeToggle.checked = settings.editMode;
    editModeToggle.addEventListener('change', (e) => {
        settings.editMode = e.target.checked;
        saveData();
    });
}

// ===================================
// ナビゲーション
// ===================================

function navigateToPage(pageId) {
    showPage(pageId);

    // ナビゲーションのアクティブ状態を更新
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === pageId) {
            link.classList.add('active');
        }
    });

    // モバイルメニューを閉じる
    document.getElementById('mainNav').classList.remove('open');

    // ページに応じた処理
    if (pageId === 'dashboard') {
        updateDashboard();
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

// ===================================
// ダッシュボード
// ===================================

function updateDashboard() {
    const dailyTasks = cleaningData.daily.tasks || [];
    const completedTasks = dailyTasks.filter(task => task.completed).length;
    const totalTasks = dailyTasks.length;

    document.getElementById('completedCount').textContent = completedTasks;
    document.getElementById('totalCount').textContent = totalTasks;
}

// ===================================
// メニューページのレンダリング
// ===================================

function renderMenuPages() {
    Object.keys(menuData).forEach(menuId => {
        const menu = menuData[menuId];
        const contentDiv = document.getElementById(`${menuId}Content`);

        if (!contentDiv) return;

        let html = '';

        // 材料セクション
        html += '<div class="ingredients-section">';
        html += '<h3><i class="fas fa-shopping-basket"></i> 材料</h3>';
        html += '<ul class="ingredients-list">';
        menu.ingredients.forEach(ingredient => {
            html += `<li>${ingredient}</li>`;
        });
        html += '</ul>';
        html += '</div>';

        // 器具セクション
        html += '<div class="equipment-section">';
        html += '<h3><i class="fas fa-tools"></i> 必要な器具</h3>';
        html += '<ul class="equipment-list">';
        menu.equipment.forEach(equipment => {
            html += `<li>${equipment}</li>`;
        });
        html += '</ul>';
        html += '</div>';

        // ステップセクション
        html += '<div class="steps-section">';
        html += '<h3><i class="fas fa-list-ol"></i> 作り方</h3>';
        menu.steps.forEach(step => {
            html += renderStep(step);
        });
        html += '</div>';

        // トラブルシューティング
        if (menu.troubleshooting && menu.troubleshooting.length > 0) {
            html += '<div class="troubleshooting-section">';
            html += '<h3><i class="fas fa-question-circle"></i> よくある問題と対処法</h3>';
            menu.troubleshooting.forEach(item => {
                html += '<div class="troubleshooting-item">';
                html += `<div class="problem"><i class="fas fa-exclamation-circle"></i> ${item.problem}</div>`;
                html += `<div class="solution"><strong>解決策:</strong> ${item.solution}</div>`;
                html += '</div>';
            });
            html += '</div>';
        }

        contentDiv.innerHTML = html;

        // 画像クリックイベントを追加
        contentDiv.querySelectorAll('.step-image').forEach(img => {
            img.addEventListener('click', () => {
                showImageModal(img.src, img.alt);
            });
        });
    });
}

function renderStep(step) {
    let html = '<div class="step">';
    html += '<div class="step-header">';
    html += `<div class="step-number">${step.number}</div>`;
    html += `<div class="step-title">${step.title}</div>`;
    html += '</div>';
    html += '<div class="step-content">';
    html += `<div class="step-description">${step.description}</div>`;

    // ヒント
    if (step.tips && step.tips.length > 0) {
        html += '<div class="step-tips">';
        html += '<h4><i class="fas fa-lightbulb"></i> ポイント</h4>';
        html += '<ul>';
        step.tips.forEach(tip => {
            html += `<li>${tip}</li>`;
        });
        html += '</ul>';
        html += '</div>';
    }

    html += '</div>';
    html += '</div>';
    return html;
}

// ===================================
// 清掃ページのレンダリング
// ===================================

function renderCleaningPages() {
    ['daily', 'weekly', 'monthly'].forEach(period => {
        const container = document.getElementById(`${period}Tasks`);
        if (!container) return;

        const data = cleaningData[period];
        if (!data || !data.tasks) return;

        let html = '';
        data.tasks.forEach(task => {
            html += renderCleaningTask(task, period);
        });

        container.innerHTML = html;

        // チェックボックスイベントを追加
        container.querySelectorAll('.task-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const taskId = e.target.dataset.taskId;
                const period = e.target.dataset.period;
                toggleTaskCompletion(taskId, period);
            });
        });

        // 画像クリックイベントを追加
        container.querySelectorAll('.task-image').forEach(img => {
            img.addEventListener('click', () => {
                showImageModal(img.src, img.alt);
            });
        });
    });
}

function renderCleaningTask(task, period) {
    let html = `<div class="cleaning-task ${task.completed ? 'completed' : ''}">`;
    html += '<div class="task-checkbox">';
    html += `<input type="checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}" data-period="${period}">`;
    html += '</div>';
    html += '<div class="task-content">';
    html += `<div class="task-title">${task.title}</div>`;
    html += `<div class="task-description">${task.description}</div>`;

    // 画像がある場合は表示（新しい形式）
    if (task.images && task.images.length > 0) {
        html += '<div class="task-images">';
        task.images.forEach(image => {
            html += `<img src="${image.path}" class="task-image" alt="${image.alt}" onerror="this.style.display='none'">`;
        });
        html += '</div>';
    }

    if (task.completed && task.completedAt) {
        const date = new Date(task.completedAt);
        html += `<div class="task-completion">✓ 完了: ${date.toLocaleString('ja-JP')}</div>`;
    }

    html += '</div>';
    html += '</div>';
    return html;
}

function toggleTaskCompletion(taskId, period) {
    const task = cleaningData[period].tasks.find(t => t.id === taskId);
    if (!task) return;

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date().toISOString() : null;

    saveData();
    renderCleaningPages();
    updateDashboard();
}

// ===================================
// タブ切り替え
// ===================================

function switchTab(tabName) {
    // タブボタンのアクティブ状態を更新
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // タブコンテンツの表示切り替え
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// ===================================
// 画像表示
// ===================================

function showImageModal(src, alt) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const caption = document.getElementById('caption');

    modal.style.display = 'block';
    modalImg.src = src;
    caption.textContent = alt;
}

// ===================================
// トラブルシューティング
// ===================================

function renderTroubleshooting() {
    const container = document.getElementById('troubleshootingContent');
    if (!container) return;

    let html = '';

    initialData.troubleshooting.forEach(item => {
        html += '<div class="troubleshooting-item">';
        html += `<h3><i class="fas fa-exclamation-triangle"></i> ${item.title}</h3>`;
        html += `<div class="problem"><strong>問題:</strong> ${item.problem}</div>`;
        html += '<div class="solution">';
        html += '<strong>解決策:</strong>';
        html += '<ul>';
        item.solutions.forEach(solution => {
            html += `<li>${solution}</li>`;
        });
        html += '</ul>';
        html += '</div>';
        html += '</div>';
    });

    container.innerHTML = html;
}

// ===================================
// 設定
// ===================================

function backupData() {
    const backup = {
        menu: menuData,
        cleaning: cleaningData,
        settings: settings,
        timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `cafe-manual-backup-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);

    alert('バックアップが完了しました');
}

function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const backup = JSON.parse(event.target.result);

                if (backup.menu) menuData = backup.menu;
                if (backup.cleaning) cleaningData = backup.cleaning;
                if (backup.settings) settings = backup.settings;

                saveData();
                location.reload();
            } catch (error) {
                alert('バックアップファイルの読み込みに失敗しました');
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

function addUpdateHistory(message) {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.UPDATE_HISTORY) || '[]');
    history.unshift({
        message,
        timestamp: new Date().toISOString()
    });

    // 最新50件まで保存
    if (history.length > 50) {
        history.splice(50);
    }

    localStorage.setItem(STORAGE_KEYS.UPDATE_HISTORY, JSON.stringify(history));
    renderUpdateHistory();
}

function renderUpdateHistory() {
    const container = document.getElementById('updateHistory');
    if (!container) return;

    const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.UPDATE_HISTORY) || '[]');

    if (history.length === 0) {
        container.innerHTML = '<p>履歴がありません</p>';
        return;
    }

    let html = '<ul style="list-style: none; padding: 0;">';
    history.slice(0, 10).forEach(item => {
        const date = new Date(item.timestamp);
        html += `<li style="padding: 0.5rem 0; border-bottom: 1px solid #ddd;">`;
        html += `<small>${date.toLocaleString('ja-JP')}</small><br>`;
        html += item.message;
        html += '</li>';
    });
    html += '</ul>';

    container.innerHTML = html;
}

// ============================================
// カレンダー関連の機能（埋め込みコード版）
// ============================================

/**
 * カレンダー設定を保存
 */
function saveCalendarSettings() {
    const embedCode = document.getElementById('calendarEmbedCode').value.trim();
    const statusDiv = document.getElementById('calendarSaveStatus');

    if (!embedCode) {
        statusDiv.innerHTML = '<p style="color: #f44336;">⚠️ 埋め込みコードを入力してください</p>';
        return;
    }

    // iframeタグの基本的な検証
    if (!embedCode.includes('<iframe') || !embedCode.includes('</iframe>')) {
        statusDiv.innerHTML = '<p style="color: #f44336;">⚠️ 有効なiframe埋め込みコードを入力してください</p>';
        return;
    }

    try {
        // LocalStorageに保存
        localStorage.setItem(STORAGE_KEYS.CALENDAR_EMBED, embedCode);

        // 成功メッセージを表示
        statusDiv.innerHTML = '<p style="color: #4caf50;">✓ カレンダー設定を保存しました</p>';

        // 更新履歴に記録
        addUpdateHistory('カレンダーの設定を更新しました');

        // カレンダーを再描画
        renderCalendar();

        // 3秒後にメッセージを消す
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
    } catch (error) {
        console.error('カレンダー設定の保存に失敗:', error);
        statusDiv.innerHTML = '<p style="color: #f44336;">⚠️ 保存に失敗しました</p>';
    }
}

/**
 * カレンダー設定をクリア
 */
function clearCalendarSettings() {
    if (!confirm('カレンダー設定を削除してもよろしいですか？')) {
        return;
    }

    const statusDiv = document.getElementById('calendarSaveStatus');

    try {
        // LocalStorageから削除
        localStorage.removeItem(STORAGE_KEYS.CALENDAR_EMBED);

        // テキストエリアをクリア
        document.getElementById('calendarEmbedCode').value = '';

        // 成功メッセージを表示
        statusDiv.innerHTML = '<p style="color: #4caf50;">✓ カレンダー設定を削除しました</p>';

        // 更新履歴に記録
        addUpdateHistory('カレンダーの設定を削除しました');

        // カレンダーを再描画（空にする）
        renderCalendar();

        // 3秒後にメッセージを消す
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 3000);
    } catch (error) {
        console.error('カレンダー設定の削除に失敗:', error);
        statusDiv.innerHTML = '<p style="color: #f44336;">⚠️ 削除に失敗しました</p>';
    }
}

/**
 * カレンダー設定を読み込んでテキストエリアに表示
 */
function loadCalendarSettings() {
    const embedCode = localStorage.getItem(STORAGE_KEYS.CALENDAR_EMBED);
    const textarea = document.getElementById('calendarEmbedCode');

    if (textarea && embedCode) {
        textarea.value = embedCode;
    }
}

/**
 * カレンダーを埋め込んで表示
 */
function renderCalendar() {
    const calendarContainer = document.getElementById('cleaningCalendar');
    if (!calendarContainer) return;

    const embedCode = localStorage.getItem(STORAGE_KEYS.CALENDAR_EMBED);

    // デフォルトカレンダー（日本の祝日カレンダー + サンプルカレンダー）
    const defaultCalendarSrc = 'https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=Asia%2FTokyo&showNav=1&showTitle=0&showPrint=0&showCalendars=0&mode=MONTH&hl=ja&src=amEuamFwYW5lc2UjaG9saWRheUBncm91cC52LmNhbGVuZGFyLmdvb2dsZS5jb20&color=%230B8043';

    if (embedCode) {
        // ユーザーが設定したカレンダーがある場合
        const parser = new DOMParser();
        const doc = parser.parseFromString(embedCode, 'text/html');
        const iframe = doc.querySelector('iframe');

        if (iframe) {
            // レスポンシブ対応のためにスタイルを調整
            iframe.style.width = '100%';
            iframe.style.height = '600px';
            iframe.style.border = '0';

            calendarContainer.innerHTML = '';
            calendarContainer.appendChild(iframe);
        } else {
            calendarContainer.innerHTML = `
                <p style="text-align: center; color: #f44336; padding: 2rem;">
                    <i class="fas fa-exclamation-triangle"></i>
                    カレンダーの埋め込みコードが正しくありません。設定を確認してください。
                </p>
            `;
        }
    } else {
        // デフォルトカレンダーを表示（日本の祝日カレンダー）
        const iframe = document.createElement('iframe');
        iframe.src = defaultCalendarSrc;
        iframe.style.border = '0';
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.frameborder = '0';
        iframe.style.scrolling = 'no';

        calendarContainer.innerHTML = '';
        calendarContainer.appendChild(iframe);
    }
}
