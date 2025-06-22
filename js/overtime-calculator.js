// 全局變數聲明
let overtimeRecords = [];
let calendar;
let selectedDate;
let holidays = [];

// 添加全局渲染鎖定機制
let calendarRenderingLock = false;

// 主程式入口
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化加班計算器');
    
    // 定義 2025 年台灣國定假日
    holidays = [
        '2025-01-01', // 元旦
        '2025-02-08', // 農曆除夕
        '2025-02-09', // 農曆初一
        '2025-02-10', // 農曆初二
        '2025-02-28', // 和平紀念日
        '2025-04-05', // 清明節
        '2025-05-01', // 勞動節
        '2025-06-07', // 端午節
        '2025-09-13', // 中秋節
        '2025-10-10', // 國慶日
    ];
    
    // 確保現有記錄有分鐘欄位
    overtimeRecords.forEach(record => {
        if (record.minutes === undefined) {
            record.minutes = 0;
            record.totalHours = record.hours + (record.minutes / 60);
        }
    });
    
    // 初始化月曆
    initializeCalendar();
    
    // 綁定事件處理器
    bindEventHandlers();
    
    // 初始化渲染
    renderOvertimeRecords();
    calculateTotals();
    
    // 創建星星背景效果
    if (!document.querySelector('.stars')) {
        createStarsBackground();
    }
    
    // 初始化月曆後添加此代碼，確保初始渲染所有加班標記
    setTimeout(() => {
        console.log('初始渲染加班標記');
        overtimeRecords.forEach(record => {
            renderOvertimeEventOnDate(record.date, record);
        });
    }, 500);
    
    // 設置定期檢查
    setupPeriodicCheck();
});

// 初始化月曆
function initializeCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) {
        console.error('找不到月曆容器元素');
        return;
    }
    
    // 完全替換 FullCalendar 的 CSS
    replaceFullCalendarCSS();
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: ''
        },
        locale: 'zh-tw',
        firstDay: 1, // 星期一為第一天
        height: 'auto',
        fixedWeekCount: false,
        showNonCurrentDates: true,
        selectable: true,
        dateClick: handleDateClick,
        dayCellDidMount: dayCellRender,
        
        // 簡化所有樣式相關選項，避免使用不支援的屬性
        eventDisplay: 'block',
        eventBackgroundColor: 'transparent',
        
        views: {
            dayGridMonth: {
                dayMaxEventRows: true,
                dayHeaderFormat: { weekday: 'short' }
            }
        }
    });
    
    // 渲染月曆
    calendar.render();
}

// 完全替換 FullCalendar 的 CSS
function replaceFullCalendarCSS() {
    console.log('替換 FullCalendar 的 CSS');
    
    // 移除所有可能的 FullCalendar 原始樣式表
    document.querySelectorAll('link[href*="fullcalendar"]').forEach(link => {
        link.remove();
    });
    
    // 移除已有的自訂樣式
    const oldStyle = document.getElementById('fc-no-borders-style');
    if (oldStyle) {
        oldStyle.remove();
    }
    
    // 創建新的樣式表
    const styleEl = document.createElement('style');
    styleEl.id = 'fc-no-borders-style';
    
    // 完整重寫 FullCalendar 的關鍵樣式
    styleEl.textContent = `
        /* 核心容器 */
        .fc {
            max-width: 100%;
            background: transparent;
            font-family: 'Arial', sans-serif;
        }
        
        /* 移除所有邊框 */
        .fc * {
            border: none !important;
            box-sizing: border-box;
        }
        
        /* 表格設置 */
        .fc .fc-scrollgrid,
        .fc table {
            width: 100%;
            border-collapse: separate !important;
            border-spacing: 2px !important;
            background: transparent;
        }
        
        /* 星期標題 */
        .fc .fc-col-header-cell {
            background: linear-gradient(145deg, rgba(70, 80, 120, 0.8), rgba(50, 60, 100, 0.8)) !important;
            color: white;
            padding: 10px 0;
            border-radius: 8px !important;
            margin: 1px;
            text-align: center;
        }
        
        /* 設置日期格子 */
        .fc .fc-daygrid-day {
            background-color: rgba(255, 255, 255, 0.03);
            border-radius: 8px;
            margin: 1px;
            padding: 0;
            height: 80px;
            max-height: 80px;
            overflow: hidden;
            position: relative;
        }
        
        /* 日期數字樣式 */
        .fc .fc-daygrid-day-number {
            padding: 5px;
            color: #ddd;
            position: absolute;
            top: 2px;
            right: 4px;
            font-size: 14px;
            z-index: 3;
        }
        
        /* 日期格子內容 */
        .fc .fc-daygrid-day-frame {
            height: 100%;
            position: relative;
        }
        
        /* 工作日 */
        .fc .fc-day-workday {
            background-color: rgba(240, 240, 255, 0.05);
        }
        
        /* 休息日 */
        .fc .fc-day-restday {
            background-color: rgba(255, 200, 200, 0.1);
        }
        
        /* 假日 */
        .fc .fc-day-holiday {
            background-color: rgba(255, 150, 150, 0.15);
        }
        
        /* 加班標記 */
        .overtime-badge {
            background: rgba(111, 155, 255, 0.8);
            color: white;
            border-radius: 6px;
            padding: 3px 8px;
            margin: 5px auto;
            text-align: center;
            width: 80%;
            display: block;
            z-index: 4;
        }
        
        /* 移除工具列邊框 */
        .fc .fc-toolbar {
            margin-bottom: 10px;
            border: none;
        }
        
        /* 按鈕樣式 */
        .fc .fc-button-primary {
            background-color: rgba(70, 80, 120, 0.8);
            border: none;
            box-shadow: none;
        }
        
        /* 修復滾動網格問題 */
        .fc .fc-scrollgrid-section,
        .fc .fc-scrollgrid-section table,
        .fc .fc-scrollgrid-section > td {
            height: auto;
            border: none !important;
        }
        
        /* 修復內容區域 */
        .fc .fc-daygrid-body {
            width: 100% !important;
        }
        
        /* 處理事件容器 */
        .fc .fc-daygrid-event-harness {
            margin: 0;
        }
        
        /* 今日高亮 */
        .fc .fc-day-today {
            background-color: rgba(100, 150, 255, 0.1) !important;
        }
    `;
    
    // 將樣式添加到文檔頭部
    document.head.appendChild(styleEl);
    
    console.log('FullCalendar CSS 替换完成');
}

// 修復月曆顯示問題
function fixCalendarDisplay() {
    console.log('修復月曆顯示');
    
    // 移除所有邊框
    removeAllBorders();
    
    // 修正日期顯示
    fixDateDisplay();
    
    // 更新日期單元格樣式
    updateDateCells();
}

// 綁定事件處理器
function bindEventHandlers() {
    // 保存加班記錄按鈕
    const saveBtn = document.getElementById('saveOvertimeBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveOvertimeRecord);
    }
    
    // 計算按鈕
    const calcBtn = document.getElementById('calculateBtn');
    if (calcBtn) {
        calcBtn.addEventListener('click', function() {
            calculateTotals();
            showToast('加班費採四捨五入計算', 'info');
        });
    }
    
    // 重置按鈕
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetAllData);
    }
    
    // 薪資區域輸入變更事件
    ['monthlySalary', 'workingDays', 'workingHours'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', calculateTotals);
        }
    });
    
    // 日期點擊效果
    document.addEventListener('click', function(e) {
        const dayCells = document.querySelectorAll('.fc-daygrid-day');
        
        dayCells.forEach(cell => {
            cell.classList.remove('fc-day-clicked');
        });
        
        if (e.target.closest('.fc-daygrid-day')) {
            e.target.closest('.fc-daygrid-day').classList.add('fc-day-clicked');
        }
    });
    
    // 月曆卡片懸停效果
    const calendarCard = document.querySelector('.calendar-card');
    if (calendarCard) {
        calendarCard.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-5px)';
        });
        
        calendarCard.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    }
    
    // 刷新日曆按鈕
    const refreshBtn = document.getElementById('refreshCalendarBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            checkAndFixOvertimeEvents();
            showToast('日曆已刷新', 'info');
        });
    }
    
    // 監控 DOM 變化
    setupMutationObserver();
}

// 點擊日期處理函數
function handleDateClick(info) {
    console.log('日期點擊:', info.dateStr);
    selectedDate = info.dateStr;
    
    // 填充模態框中的日期
    const dateInput = document.getElementById('overtimeDate');
    if (dateInput) {
        dateInput.value = selectedDate;
    }
    
    // 設置日期類型
    const dayTypeSelect = document.getElementById('dayType');
    if (dayTypeSelect) {
        const date = new Date(selectedDate);
        let dayType = 'workday';
        
        if (holidays.includes(selectedDate)) {
            dayType = 'holiday';
        } else if (date.getDay() === 0 || date.getDay() === 6) {
            dayType = 'restday';
        }
        
        dayTypeSelect.value = dayType;
    }
    
    // 檢查是否已有加班記錄
    const existingRecord = overtimeRecords.find(record => record.date === selectedDate);
    
    // 設置默認值或已保存的值
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    
    if (startTimeInput && endTimeInput) {
        if (existingRecord && existingRecord.startTime && existingRecord.endTime) {
            startTimeInput.value = existingRecord.startTime;
            endTimeInput.value = existingRecord.endTime;
        } else {
            startTimeInput.value = '09:00';
            endTimeInput.value = '18:00';
        }
        
        // 計算加班時間
        calculateOvertimeHours();
        
        // 添加時間變更監聽
        startTimeInput.addEventListener('change', calculateOvertimeHours);
        endTimeInput.addEventListener('change', calculateOvertimeHours);
        
        const dayTypeInput = document.getElementById('dayType');
        if (dayTypeInput) {
            dayTypeInput.addEventListener('change', calculateOvertimeHours);
        }
    }
    
    // 顯示模態窗
    try {
        const overtimeModal = new bootstrap.Modal(document.getElementById('overtimeModal'));
        overtimeModal.show();
    } catch (error) {
        console.error('顯示模態窗錯誤:', error);
        alert('無法開啟加班時間設定視窗，請檢查網頁載入狀態');
    }
}

// 自動計算加班時數
function calculateOvertimeHours() {
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const dayTypeSelect = document.getElementById('dayType');
    
    if (!startTimeInput || !endTimeInput || !dayTypeSelect) return;
    
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    const dayType = dayTypeSelect.value;
    
    if (!startTime || !endTime) return;
    
    // 將時間轉換為分鐘
    const startMinutes = convertTimeToMinutes(startTime);
    const endMinutes = convertTimeToMinutes(endTime);
    
    // 處理跨日的情況
    let totalMinutes = endMinutes >= startMinutes ? 
                      (endMinutes - startMinutes) : 
                      (endMinutes + 24 * 60 - startMinutes);
    
    // 減去午休時間 (平日且工作超過5小時才減休息時間)
    let breakMinutes = 0;
    if (dayType === 'workday' && totalMinutes > 5 * 60) {
        breakMinutes = 60; // 1小時休息時間
    }
    
    // 實際工作時間（分鐘）
    const actualWorkMinutes = totalMinutes - breakMinutes;
    
    // 標準工時（分鐘）
    const standardWorkMinutes = 8 * 60; // 8小時
    
    // 計算加班時間（分鐘）
    let overtimeMinutes = 0;
    
    if (dayType === 'workday') {
        // 平日：超過8小時才算加班
        overtimeMinutes = actualWorkMinutes > standardWorkMinutes ? 
                         (actualWorkMinutes - standardWorkMinutes) : 0;
    } else if (dayType === 'restday' || dayType === 'holiday') {
        // 休息日和國定假日：全部算加班
        overtimeMinutes = actualWorkMinutes;
    }
    
    // 轉換回小時和分鐘
    const overtimeHours = Math.floor(overtimeMinutes / 60);
    const overtimeMinutesRemainder = overtimeMinutes % 60;
    
    // 顯示計算結果
    const calculatedOvertime = document.getElementById('calculatedOvertime');
    if (calculatedOvertime) {
        calculatedOvertime.value = overtimeMinutes > 0 ? 
            `${overtimeHours}.${Math.round(overtimeMinutesRemainder / 60 * 100)}` : '0';
    }
    
    // 顯示詳細說明
    const overtimeDetails = document.getElementById('overtimeDetails');
    if (overtimeDetails) {
        if (overtimeMinutes > 0) {
            let detailText = `總工作時間 ${formatMinutesToTime(actualWorkMinutes)}`;
            if (breakMinutes > 0) {
                detailText += `（含休息 ${formatMinutesToTime(breakMinutes)}）`;
            }
            
            if (dayType === 'workday') {
                detailText += `，超出標準工時 ${formatMinutesToTime(overtimeMinutes)}`;
            }
            
            overtimeDetails.textContent = detailText;
        } else {
            overtimeDetails.textContent = '未達加班標準';
        }
    }
}

// 保存加班記錄
function saveOvertimeRecord() {
    console.log('保存加班記錄');
    
    const startTimeInput = document.getElementById('startTime');
    const endTimeInput = document.getElementById('endTime');
    const dayTypeSelect = document.getElementById('dayType');
    const calculatedOvertime = document.getElementById('calculatedOvertime');
    
    if (!startTimeInput || !endTimeInput || !dayTypeSelect || !calculatedOvertime || !selectedDate) {
        alert('無法保存加班記錄，表單數據不完整');
        return;
    }
    
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    const dayType = dayTypeSelect.value;
    
    // 獲取計算結果
    const overtimeValue = parseFloat(calculatedOvertime.value) || 0;
    
    // 分解為小時和分鐘
    const overtimeHours = Math.floor(overtimeValue);
    const overtimeMinutes = Math.round((overtimeValue - overtimeHours) * 60);
    
    // 計算總時數（小時 + 分鐘轉小時）
    const totalHours = overtimeHours + (overtimeMinutes / 60);
    
    if (totalHours <= 0) {
        alert('未計算出加班時間，請檢查上下班時間設置。');
        return;
    }
    
    // 檢查是否已有紀錄
    const existingRecordIndex = overtimeRecords.findIndex(record => record.date === selectedDate);
    
    if (existingRecordIndex !== -1) {
        // 更新現有紀錄
        overtimeRecords[existingRecordIndex].hours = overtimeHours;
        overtimeRecords[existingRecordIndex].minutes = overtimeMinutes;
        overtimeRecords[existingRecordIndex].totalHours = totalHours;
        overtimeRecords[existingRecordIndex].dayType = dayType;
        overtimeRecords[existingRecordIndex].startTime = startTime;
        overtimeRecords[existingRecordIndex].endTime = endTime;
    } else {
        // 新增紀錄
        overtimeRecords.push({
            id: Date.now(),
            date: selectedDate,
            dayType: dayType,
            hours: overtimeHours,
            minutes: overtimeMinutes,
            totalHours: totalHours,
            startTime: startTime,
            endTime: endTime
        });
    }
    
    // 關閉模態窗
    try {
        const overtimeModal = bootstrap.Modal.getInstance(document.getElementById('overtimeModal'));
        overtimeModal.hide();
    } catch (error) {
        console.error('關閉模態窗錯誤:', error);
    }
    
    // 更新 UI
    renderOvertimeRecords();
    calculateTotals();
    
    // 立即更新日曆上的加班標記
    const record = overtimeRecords.find(r => r.date === selectedDate);
    if (record) {
        renderOvertimeEventOnDate(selectedDate, record);
    }
    
    // 顯示成功訊息
    showToast('加班記錄已保存', 'success');
}

// 更新特定日期單元格
function updateDateCell(dateStr) {
    const dateCell = document.querySelector(`[data-date="${dateStr}"]`);
    if (dateCell) {
        const date = new Date(dateStr);
        dayCellRender({date: date, el: dateCell});
    }
}

// 日期單元格渲染函數
function dayCellRender(info) {
    const date = info.date;
    const dateStr = formatDate(date);
    const cell = info.el;
    
    // 清除舊的元素和類別
    cell.className = cell.className
        .replace(/fc-day-(holiday|workday|restday)/g, '')
        .replace(/fc-day-clicked/g, '');
    
    const existingHolidayName = cell.querySelector('.holiday-name');
    if (existingHolidayName) {
        existingHolidayName.remove();
    }
    
    // 清除所有舊的事件點
    const existingEvents = cell.querySelectorAll('.fc-event');
    existingEvents.forEach(event => event.remove());
    
    // 清除數字後的日文字
    const dayNumber = cell.querySelector('.fc-daygrid-day-number');
    if (dayNumber) {
        dayNumber.textContent = date.getDate();
    }
    
    // 處理日期類型
    if (holidays.includes(dateStr)) {
        // 國定假日
        cell.classList.add('fc-day-holiday');
        
        // 顯示假日名稱
        const holidayName = getHolidayName(dateStr);
        if (holidayName) {
            const holidayEl = document.createElement('div');
            holidayEl.className = 'holiday-name';
            holidayEl.textContent = holidayName;
            cell.appendChild(holidayEl);
        }
    } else if (date.getDay() === 0 || date.getDay() === 6) {
        // 週末
        cell.classList.add('fc-day-restday');
    } else {
        // 工作日
        cell.classList.add('fc-day-workday');
    }
    
    // 修改這部分 - 如果已有加班紀錄，顯示事件點
    const record = overtimeRecords.find(r => r.date === dateStr);
    if (record) {
        // 創建新的事件點
        const eventEl = document.createElement('div');
        eventEl.classList.add('fc-event');
        
        // 顯示時間
        const timeDisplay = record.minutes > 0 ? 
            `${record.hours}h${record.minutes}m` : 
            `${record.hours}h`;
            
        eventEl.innerHTML = `<i class="fas fa-clock me-1"></i>${timeDisplay}`;
        eventEl.title = `上班: ${record.startTime || '未設定'}\n下班: ${record.endTime || '未設定'}`;
        
        // 確保有一個容器來放置事件點
        let eventsContainer = cell.querySelector('.fc-daygrid-day-events');
        
        if (!eventsContainer) {
            // 如果沒有找到容器，創建一個
            eventsContainer = document.createElement('div');
            eventsContainer.className = 'fc-daygrid-day-events';
            
            // 添加到日期單元格的內容區域
            const content = cell.querySelector('.fc-daygrid-day-frame');
            if (content) {
                content.appendChild(eventsContainer);
            } else {
                cell.appendChild(eventsContainer);
            }
        }
        
        // 添加到容器
        eventsContainer.appendChild(eventEl);
        
        // 直接設置樣式確保可見
        eventEl.style.position = 'relative';
        eventEl.style.display = 'block';
        eventEl.style.margin = '2px auto';
        eventEl.style.padding = '3px 8px';
        eventEl.style.backgroundColor = 'rgba(111, 155, 255, 0.8)';
        eventEl.style.color = '#fff';
        eventEl.style.borderRadius = '6px';
        eventEl.style.textAlign = 'center';
        eventEl.style.width = '80%';
        eventEl.style.zIndex = '5';
    }
}

// 為月份切換添加淡入淡出效果
function addCalendarTransitionEffects() {
    // 獲取 prev/next 按鈕
    const prevBtn = document.querySelector('.fc-prev-button');
    const nextBtn = document.querySelector('.fc-next-button');
    const todayBtn = document.querySelector('.fc-today-button');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            applyCalendarTransition();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            applyCalendarTransition();
        });
    }
    
    if (todayBtn) {
        todayBtn.addEventListener('click', function() {
            applyCalendarTransition();
        });
    }
}

// 應用日曆過渡效果
function applyCalendarTransition() {
    const viewHarness = document.querySelector('.fc-view-harness');
    if (viewHarness) {
        // 清除所有徽章，避免過渡期間的錯位
        clearAllOvertimeMarks();
        
        // 添加淡出效果
        viewHarness.style.opacity = '0.5';
        viewHarness.style.transform = 'translateY(10px)';
        
        // 淡入效果
        setTimeout(() => {
            viewHarness.style.opacity = '1';
            viewHarness.style.transform = 'translateY(0)';
            
            // 過渡完成後重新渲染徽章
            setTimeout(() => {
                throttledRenderOvertimeMarks();
                
                // 新增：確保創建顏色圖例
                createOvertimeLegend();
            }, 300);
        }, 150);
    }
}

// 修正渲染加班徽章的函數 - 確保時鐘圖標正確顯示
function renderOvertimeEventOnDate(dateStr, record) {
    // 找到日期單元格
    const dateCell = document.querySelector(`[data-date="${dateStr}"]`);
    if (!dateCell) return;
    
    // 清除舊的事件標記
    const existingEvents = dateCell.querySelectorAll('.fc-event, .overtime-badge');
    existingEvents.forEach(event => event.remove());
    
    // 如果沒有記錄，就只是清除
    if (!record) return;
    
    try {
        // 創建一個新的標記元素
        const badge = document.createElement('div');
        badge.className = 'overtime-badge';
        
        // 計算總加班時數 (小時 + 分鐘轉小時)
        const totalHours = record.hours + (record.minutes / 60);
        
        // 顯示時間 - 精簡格式
        let timeDisplay;
        if (record.hours >= 10) {
            timeDisplay = `${record.hours}h`;
        } else if (record.hours > 0 && record.minutes > 0) {
            timeDisplay = `${record.hours}:${String(record.minutes).padStart(2, '0')}`;
        } else if (record.hours > 0) {
            timeDisplay = `${record.hours}h`;
        } else {
            timeDisplay = `${record.minutes}m`;
        }
        
        // 根據加班時長明確設定顏色和類別
        if (totalHours >= 8) {
            badge.classList.add('overtime-long');
        } else if (totalHours >= 4) {
            badge.classList.add('overtime-medium');
        } else {
            badge.classList.add('overtime-normal');
        }
        
        // 使用 innerHTML 添加時鐘圖標 - 明確使用 Font Awesome 類名
        badge.innerHTML = `<i class="fas fa-clock" style="margin-right:4px;"></i>${timeDisplay}`;
        
        // 設置提示文字
        badge.title = `加班時間: ${record.hours}小時${record.minutes > 0 ? record.minutes + '分鐘' : ''}\n上班: ${record.startTime || '未設定'}\n下班: ${record.endTime || '未設定'}`;
        
        // 添加到日期單元格
        dateCell.appendChild(badge);
    } catch (error) {
        console.error(`渲染加班標記時出錯:`, error);
    }
}

// 優化渲染加班徽章的函數 - 添加時鐘圖標
function safeRenderOvertimeEventOnDate(dateStr, record) {
    try {
        // 找到日期單元格
        const dateCell = document.querySelector(`[data-date="${dateStr}"]`);
        if (!dateCell) return;
        
        // 清除舊的事件標記
        const existingEvents = dateCell.querySelectorAll('.fc-event, .overtime-badge');
        existingEvents.forEach(event => event.remove());
        
        // 如果沒有記錄，就只是清除
        if (!record) return;
        
        // 創建一個新的標記元素
        const badge = document.createElement('div');
        badge.className = 'overtime-badge';
        
        // 計算總加班時數 (小時 + 分鐘轉小時)
        const totalHours = record.hours + (record.minutes / 60);
        
        // 顯示時間 - 精簡格式
        let timeDisplay;
        if (record.hours >= 10) {
            timeDisplay = `${record.hours}h`;
        } else if (record.hours > 0 && record.minutes > 0) {
            timeDisplay = `${record.hours}:${String(record.minutes).padStart(2, '0')}`;
        } else if (record.hours > 0) {
            timeDisplay = `${record.hours}h`;
        } else {
            timeDisplay = `${record.minutes}m`;
        }
        
        // 根據加班時長明確設定顏色和類別
        if (totalHours >= 8) {
            badge.classList.add('overtime-long');
        } else if (totalHours >= 4) {
            badge.classList.add('overtime-medium');
        } else {
            badge.classList.add('overtime-normal');
        }
        
        // 添加時鐘圖標和時間顯示
        badge.innerHTML = `<i class="fas fa-clock"></i>${timeDisplay}`;
        
        // 設置提示文字
        badge.title = `加班時間: ${record.hours}小時${record.minutes > 0 ? record.minutes + '分鐘' : ''}\n上班: ${record.startTime || '未設定'}\n下班: ${record.endTime || '未設定'}`;
        
        // 添加到日期單元格
        dateCell.appendChild(badge);
    } catch (error) {
        console.error(`渲染加班標記時出錯:`, error);
    }
}

// 渲染加班記錄表格
function renderOvertimeRecords() {
    const tbody = document.getElementById('overtimeRecords');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (overtimeRecords.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="6" class="text-center">尚無加班記錄</td>`;
        tbody.appendChild(tr);
        return;
    }
    
    // 按日期排序
    overtimeRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    overtimeRecords.forEach(record => {
        const tr = document.createElement('tr');
        
        // 計算加班費率
        const rates = calculateRates(record.dayType, record.totalHours);
        const hourlyRate = calculateHourlyRate();
        const amount = calculateAmount(record.dayType, record.totalHours, hourlyRate);
        
        // 格式化為顯示用的日期
        const displayDate = new Date(record.date).toLocaleDateString('zh-TW');
        
        // 日期類型中文顯示
        let dayTypeText;
        switch(record.dayType) {
            case 'workday': dayTypeText = '平日'; break;
            case 'restday': dayTypeText = '休息日'; break;
            case 'holiday': dayTypeText = '國定假日'; break;
            default: dayTypeText = '一般日';
        }
        
        // 格式化時間顯示
        const timeDisplay = record.minutes > 0 ? 
            `${record.hours}小時${record.minutes}分` : 
            `${record.hours}小時`;
        
        // 工作時間顯示
        const workTimeDisplay = record.startTime && record.endTime ? 
            `${record.startTime}～${record.endTime}` : '未設定';
        
        tr.innerHTML = `
            <td>${displayDate}</td>
            <td>${dayTypeText}</td>
            <td title="工作時間: ${workTimeDisplay}">${timeDisplay}</td>
            <td>${rates}</td>
            <td data-bs-toggle="tooltip" title="四捨五入計算">${amount.toLocaleString()} 元</td>
            <td>
                <button class="delete-btn" data-id="${record.id}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // 在表格渲染完成後，立即明確調用
    setTimeout(() => {
        bindDeleteButtons();
        initializeTooltips();
        console.log('表格渲染完成並綁定了刪除按鈕');
    }, 0);
}

// 替換月份導航按鈕圖標為更美觀的版本
function replaceCalendarButtonIcons() {
    // 上個月按鈕
    const prevButton = document.querySelector('.fc-prev-button');
    if (prevButton) {
        const icon = prevButton.querySelector('.fc-icon');
        if (icon) {
            icon.innerHTML = '&#10094;'; // 左箭頭符號
            icon.style.fontSize = '1em';
        }
    }
    
    // 下個月按鈕
    const nextButton = document.querySelector('.fc-next-button');
    if (nextButton) {
        const icon = nextButton.querySelector('.fc-icon');
        if (icon) {
            icon.innerHTML = '&#10095;'; // 右箭頭符號
            icon.style.fontSize = '1em';
        }
    }
}

// 在適當的時機調用圖標替換函數
setTimeout(replaceCalendarButtonIcons, 500);

// 創建和添加顏色圖例函數
function createOvertimeLegend() {
    console.log('建立加班顏色圖例');
    
    // 檢查是否已存在圖例，避免重複添加
    if (document.querySelector('.overtime-legend')) {
        document.querySelector('.overtime-legend').remove();
    }
    
    // 創建圖例容器
    const legendContainer = document.createElement('div');
    legendContainer.className = 'overtime-legend mt-3';
    
    // 添加圖例內容
    legendContainer.innerHTML = `
        <div class="overtime-legend-item">
            <span class="overtime-color normal"></span>
            <span>一般加班 (< 4h)</span>
        </div>
        <div class="overtime-legend-item">
            <span class="overtime-color medium"></span>
            <span>中量加班 (4-8h)</span>
        </div>
        <div class="overtime-legend-item">
            <span class="overtime-color long"></span>
            <span>長時加班 (> 8h)</span>
        </div>
    `;
    
    // 找到日曆容器並添加圖例
    const calendarContainer = document.querySelector('.fc');
    if (calendarContainer) {
        // 如果日曆容器存在，將圖例添加到其后
        const parentElement = calendarContainer.parentElement;
        parentElement.insertBefore(legendContainer, calendarContainer.nextSibling);
    } else {
        // 如果找不到日曆容器，嘗試添加到頁面底部
        const mainContainer = document.querySelector('.container') || document.querySelector('.main-content');
        if (mainContainer) {
            mainContainer.appendChild(legendContainer);
        } else {
            // 最後嘗試，直接添加到body末尾
            document.body.appendChild(legendContainer);
        }
    }
    
    console.log('顏色圖例建立完成');
}

// 修復刪除加班記錄函數 - 使用自訂確認對話框
function deleteOvertimeRecord(id) {
    console.log('嘗試刪除記錄:', id);
    
    // 使用自訂確認對話框，不使用原生 confirm
    cosmicConfirm('確定要刪除此加班記錄嗎？', function() {
        console.log('用戶確認刪除');
        const recordToDelete = overtimeRecords.find(record => record.id === id);
        
        if (!recordToDelete) {
            console.error('找不到要刪除的記錄:', id);
            showToast('找不到要刪除的記錄', 'error');
            return;
        }
        
        const dateToUpdate = recordToDelete.date;
        console.log(`刪除 ${dateToUpdate} 的加班記錄`);
        
        // 刪除記錄
        overtimeRecords = overtimeRecords.filter(record => record.id !== id);
        
        // 更新 UI
        renderOvertimeRecords();
        calculateTotals();
        
        // 更新日曆 - 確保圖標被刪除
        renderOvertimeEventOnDate(dateToUpdate, null);
        
        // 顯示刪除成功訊息
        showToast('加班記錄已刪除', 'success');
    });
}

// 重置所有數據
function resetAllData() {
    // 使用自定義確認框，不使用原生 confirm
    cosmicConfirm('確定要重置所有資料嗎？這將清除所有加班記錄和設定。', function() {
        // 保存當前加班記錄的日期以便清除標記
        const datesToUpdate = overtimeRecords.map(record => record.date);
        console.log('需要清除標記的日期:', datesToUpdate);
        
        // 重置加班記錄
        overtimeRecords = [];
        
        // 重置薪資設定為預設值
        const monthlySalary = document.getElementById('monthlySalary');
        const workingDays = document.getElementById('workingDays');
        const workingHours = document.getElementById('workingHours');
        
        if (monthlySalary) monthlySalary.value = '40000';
        if (workingDays) workingDays.value = '30';
        if (workingHours) workingHours.value = '8';
        
        // 更新 UI
        renderOvertimeRecords();
        calculateTotals();
        
        // 清除所有日期上的加班標記
        datesToUpdate.forEach(dateStr => {
            renderOvertimeEventOnDate(dateStr, null);
        });
        
        // 顯示重置成功訊息
        showToast('資料已重置', 'success');
    });
}

// 添加新函數來清除所有日曆事件點
function clearAllCalendarEvents() {
    // 獲取所有日期單元格
    const dayCells = document.querySelectorAll('.fc-daygrid-day');
    
    // 遍歷單元格移除事件點
    dayCells.forEach(cell => {
        const events = cell.querySelectorAll('.fc-event');
        events.forEach(event => event.remove());
    });
}

// 強制重新渲染所有加班標記 - 確保顏色正確
function forceRefreshAllOvertimeBadges() {
    // 如果已經在刷新中，則不重複執行
    if (calendarRenderingLock) {
        console.log('日曆正在刷新中，跳過重複刷新請求');
        return;
    }
    
    // 設置鎖定
    calendarRenderingLock = true;
    console.log('開始全面刷新加班標記');
    
    try {
        // 清除所有現有徽章
        document.querySelectorAll('.fc-event, .overtime-badge').forEach(el => {
            el.remove();
        });
        
        // 延遲重新渲染，確保清除完成
        setTimeout(() => {
            // 再次確保清除完成
            document.querySelectorAll('.fc-event, .overtime-badge').forEach(el => {
                el.remove();
            });
            
            // 重新渲染所有徽章
            overtimeRecords.forEach(record => {
                renderOvertimeEventOnDate(record.date, record);
            });
            
            console.log('所有加班徽章已重新渲染');
            
            // 釋放鎖定
            setTimeout(() => {
                calendarRenderingLock = false;
            }, 200);
        }, 100);
    } catch (error) {
        console.error('刷新加班標記時出錯:', error);
        // 確保發生錯誤時也會釋放鎖定
        calendarRenderingLock = false;
    }
}

// 在適當的時機調用此函數
document.addEventListener('DOMContentLoaded', function() {
    // ...現有代碼...
    
    // 初始化完成後，等待一段時間確保顏色正確
    setTimeout(() => {
        forceRefreshAllOvertimeBadges();
        
        // 新增：確保創建顏色圖例
        createOvertimeLegend();
    }, 800);
});

// 移除所有底線和邊框
function removeAllBorders() {
    const elements = document.querySelectorAll('.fc table, .fc td, .fc th, .fc-theme-standard td, .fc-theme-standard th, .fc-scrollgrid, .fc-scrollgrid-section, .fc-scrollgrid-section > *');
    
    elements.forEach(el => {
        el.style.border = 'none';
        el.style.borderWidth = '0';
    });
}

// 完全移除所有白邊和表格線
function forceRemoveAllBorders() {
    console.log('強制移除所有白邊和邊框');
    
    // 所有可能有邊框的元素
    const selectors = [
        '.fc-theme-standard *',
        '.fc *', 
        '.fc-scrollgrid', 
        '.fc-scrollgrid-section', 
        '.fc-scrollgrid-section > *', 
        '.fc-scrollgrid-section-header > *', 
        '.fc-scrollgrid-section-body > *',
        '.fc-col-header',
        '.fc-col-header-cell',
        '.fc table',
        '.fc tr',
        '.fc td',
        '.fc th'
    ];
    
    // 選取所有匹配的元素
    const elements = document.querySelectorAll(selectors.join(', '));
    
    // 移除所有邊框和間隙
    elements.forEach(el => {
        el.style.border = 'none';
        el.style.borderWidth = '0';
        el.style.borderCollapse = 'separate';
        el.style.borderSpacing = '1px';
    });
    
    // 確保星期標題有正確的顏色
    const headerCells = document.querySelectorAll('.fc-col-header-cell');
    headerCells.forEach(cell => {
        cell.style.background = 'linear-gradient(145deg, rgba(70, 80, 120, 0.8), rgba(50, 60, 100, 0.8))';
    });
    
    console.log('白邊和邊框移除完成');
}

// 修正日期顯示
function fixDateDisplay() {
    document.querySelectorAll('.fc-daygrid-day-number').forEach(el => {
        // 檢查是否有重複的日期顯示或「日」字
        const text = el.textContent.trim();
        
        // 提取純數字
        const match = text.match(/\d+/);
        if (match) {
            el.textContent = match[0];
        }
    });
}

// 更新所有日期單元格
function updateDateCells() {
    document.querySelectorAll('.fc-daygrid-day').forEach(cell => {
        const dateStr = cell.getAttribute('data-date');
        if (dateStr) {
            const date = new Date(dateStr);
            dayCellRender({date: date, el: cell});
        }
    });
}

// 計算加班費率文字
function calculateRates(dayType, hours) {
    switch(dayType) {
        case 'workday':
            return hours <= 2 ? '1.33倍' : '前2小時1.33倍，後續1.67倍';
        case 'restday':
            return hours <= 2 ? '1.33倍' : '前2小時1.33倍，後續1.67倍';
        case 'holiday':
            return '2倍';
        default:
            return '1倍';
    }
}

// 計算時薪（四捨五入）
function calculateHourlyRate() {
    const monthlySalaryEl = document.getElementById('monthlySalary');
    const workingDaysEl = document.getElementById('workingDays');
    const workingHoursEl = document.getElementById('workingHours');
    
    if (!monthlySalaryEl || !workingDaysEl || !workingHoursEl) return 0;
    
    const monthlySalary = parseFloat(monthlySalaryEl.value);
    const workingDays = parseFloat(workingDaysEl.value);
    const workingHours = parseFloat(workingHoursEl.value);
    
    if (isNaN(monthlySalary) || isNaN(workingDays) || isNaN(workingHours) || 
        monthlySalary <= 0 || workingDays <= 0 || workingHours <= 0) {
        return 0;
    }
    
    // 先計算基本時薪
    const baseHourlyRate = monthlySalary / (workingDays * workingHours);
    
    // 使用 Math.round() 進行四捨五入
    return Math.round(baseHourlyRate);
}

// 計算單筆加班金額（四捨五入）
function calculateAmount(dayType, hours, hourlyRate) {
    if (hourlyRate <= 0) return 0;
    
    let amount = 0;
    
    switch(dayType) {
        case 'workday':
            if (hours <= 2) {
                amount = hourlyRate * 1.33 * hours;
            } else {
                amount = hourlyRate * 1.33 * 2 + hourlyRate * 1.67 * (hours - 2);
            }
            break;
        case 'restday':
            if (hours <= 2) {
                amount = hourlyRate * 1.33 * hours;
            } else {
                amount = hourlyRate * 1.33 * 2 + hourlyRate * 1.67 * (hours - 2);
            }
            break;
        case 'holiday':
            amount = hourlyRate * 2 * hours;
            break;
        default:
            amount = hourlyRate * hours;
    }
    
    // 使用 Math.round() 進行四捨五入
    return Math.round(amount);
}

// 計算總時數和總金額
function calculateTotals() {
    const hourlyRate = calculateHourlyRate();
    let totalHours = 0;
    let totalAmount = 0;
    
    overtimeRecords.forEach(record => {
        totalHours += record.totalHours;
        totalAmount += calculateAmount(record.dayType, record.totalHours, hourlyRate);
    });
    
    // 格式化總時數顯示（顯示小時和分鐘）
    const totalHoursInt = Math.floor(totalHours);
    const totalMinutes = Math.round((totalHours - totalHoursInt) * 60);
    const totalTimeDisplay = totalMinutes > 0 ? 
        `${totalHoursInt}小時${totalMinutes}分` : 
        `${totalHoursInt}小時`;
    
    // 顯示結果
    const totalHoursEl = document.getElementById('totalHours');
    const totalAmountEl = document.getElementById('totalAmount');
    const hourlyRateEl = document.getElementById('hourlyRate');
    
    if (totalHoursEl) totalHoursEl.textContent = totalTimeDisplay;
    if (totalAmountEl) totalAmountEl.innerHTML = `${totalAmount.toLocaleString()} <i class="fas fa-calculator text-info small ms-1" data-bs-toggle="tooltip" title="四捨五入計算"></i> 元`;
    if (hourlyRateEl) hourlyRateEl.innerHTML = `${hourlyRate} <i class="fas fa-calculator text-info small ms-1" data-bs-toggle="tooltip" title="四捨五入計算"></i> 元/時`;
    
    // 初始化工具提示
    initializeTooltips();
}

// 確保刪除按鈕綁定事件
function bindDeleteButtons() {
    console.log('正在綁定刪除按鈕事件...');
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        // 先移除所有現有事件
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // 重新綁定點擊事件 - 使用更簡單的方式
        newBtn.addEventListener('click', function() {
            const id = parseInt(this.getAttribute('data-id'));
            console.log('點擊刪除按鈕: ID =', id);
            deleteOvertimeRecord(id);
        });
    });
    
    console.log('刪除按鈕事件綁定完成');
}

// 初始化工具提示
function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        try {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        } catch (err) {
            console.warn('工具提示初始化失敗:', err);
            return null;
        }
    });
}

// 顯示提示訊息
function showToast(message, type = 'info') {
    // 創建 toast 元素
    const toastEl = document.createElement('div');
    toastEl.className = `cosmic-toast cosmic-toast-${type}`;
    
    // 選擇適當的圖標
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    toastEl.innerHTML = `
        <div class="cosmic-toast-content">
            <i class="fas ${icon} me-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    // 添加到頁面
    document.body.appendChild(toastEl);
    
    // 顯示 toast
    setTimeout(() => {
        toastEl.classList.add('show');
    }, 100);
    
    // 幾秒後隱藏並移除
    setTimeout(() => {
        toastEl.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(toastEl)) {
                document.body.removeChild(toastEl);
            }
        }, 300);
    }, 3000);
}

// 確保確認對話框能夠顯示並執行回調
function cosmicConfirm(message, confirmCallback, cancelCallback) {
    // 先嘗試使用自定義對話框
    try {
        // 創建模態對話框容器
        const modal = document.createElement('div');
        modal.className = 'cosmic-modal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        modal.style.zIndex = '9999';
        
        // 設置對話框內容
        const content = document.createElement('div');
        content.className = 'cosmic-modal-content';
        content.style.background = 'linear-gradient(145deg, rgba(25, 35, 65, 0.95), rgba(35, 45, 85, 0.95))';
        content.style.borderRadius = '10px';
        content.style.boxShadow = '0 5px 20px rgba(0, 0, 0, 0.5)';
        content.style.width = '90%';
        content.style.maxWidth = '400px';
        content.style.padding = '20px';
        content.style.color = 'white';
        content.style.border = '1px solid rgba(111, 155, 255, 0.3)';
        
        // 添加標題和內容
        content.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid rgba(111, 155, 255, 0.2); padding-bottom: 10px;">
                <h4 style="margin: 0;">確認操作</h4>
                <button class="close-btn" style="background: none; border: none; color: white; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            <div style="margin-bottom: 20px;">
                <p style="margin: 0;">${message}</p>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button class="cancel-btn" style="background: rgba(80, 90, 120, 0.8); border: none; border-radius: 5px; padding: 8px 15px; color: white; cursor: pointer;">取消</button>
                <button class="confirm-btn" style="background: rgba(111, 155, 255, 0.8); border: none; border-radius: 5px; padding: 8px 15px; color: white; cursor: pointer;">確認</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // 綁定按鈕事件
        const closeAction = () => {
            document.body.removeChild(modal);
            if (cancelCallback) cancelCallback();
        };
        
        const confirmAction = () => {
            document.body.removeChild(modal);
            if (confirmCallback) confirmCallback();
        };
        
        modal.querySelector('.close-btn').addEventListener('click', closeAction);
        modal.querySelector('.cancel-btn').addEventListener('click', closeAction);
        modal.querySelector('.confirm-btn').addEventListener('click', confirmAction);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeAction();
        });
    } catch (error) {
        console.error('自定義對話框失敗，使用原生對話框', error);
        // 如果自定義對話框失敗，使用原生對話框作為備用
        if (window.confirm(message)) {
            if (confirmCallback) confirmCallback();
        } else {
            if (cancelCallback) cancelCallback();
        }
    }
}

// 創建星星背景效果
function createStarsEffect(container, starCount) {
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'cosmic-star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 2}s`;
        star.style.width = `${Math.random() * 2 + 1}px`;
        star.style.height = star.style.width;
        container.appendChild(star);
    }
}

// 監控 DOM 變化
function setupMutationObserver() {
    try {
        const observer = new MutationObserver(function(mutations) {
            let needFix = false;
            
            mutations.forEach(function(mutation) {
                // 如果涉及到表格或邊框相關的變化
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style' || 
                     mutation.attributeName === 'class')) {
                    needFix = true;
                }
                
                // 如果是添加或刪除節點
                if (mutation.type === 'childList' && 
                    (mutation.target.classList.contains('fc-daygrid-day') ||
                     mutation.target.classList.contains('fc-scrollgrid'))) {
                    needFix = true;
                }
            });
            
            if (needFix) {
                fixDateDisplay();
            }
        });
        
        // 對日曆容器進行監視
        const calendarEl = document.querySelector('.fc');
        if (calendarEl) {
            observer.observe(calendarEl, {
                childList: true,
                subtree: true,
                attributes: true
            });
        }
    } catch (err) {
        console.error('設置觀察者時出錯:', err);
    }
}

// 刷新整個日曆顯示
function refreshCalendarDisplay() {
    // 獲取所有日期單元格
    const dayCells = document.querySelectorAll('.fc-daygrid-day');
    
    // 遍歷每個單元格重新渲染
    dayCells.forEach(cell => {
        const dateStr = cell.getAttribute('data-date');
        if (dateStr) {
            const date = new Date(dateStr);
            
            // 先移除所有事件點
            const existingEvents = cell.querySelectorAll('.fc-event');
            existingEvents.forEach(event => event.remove());
            
            // 重新渲染
            dayCellRender({date: date, el: cell});
        }
    });
    
    // 修復其他顯示問題
    removeAllBorders();
    fixDateDisplay();
    
    // 渲染所有加班記錄的標記
    console.log('刷新所有加班標記');
    overtimeRecords.forEach(record => {
        renderOvertimeEventOnDate(record.date, record);
    });
}

// 將時間轉換為分鐘
function convertTimeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

// 將分鐘格式化為小時:分鐘
function formatMinutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小時${mins > 0 ? `${mins}分鐘` : ''}`;
}

// 格式化日期到 YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 獲取假日名稱
function getHolidayName(dateStr) {
    const holidayNames = {
        '2025-01-01': '元旦',
        '2025-02-08': '除夕',
        '2025-02-09': '春節',
        '2025-02-10': '初二',
        '2025-02-28': '和平紀念日',
        '2025-04-05': '清明節',
        '2025-05-01': '勞動節',
        '2025-06-07': '端午節',
        '2025-09-13': '中秋節',
        '2025-10-10': '國慶日'
    };
    
    return holidayNames[dateStr] || '';
}

// 創建星星背景效果
function createStarsBackground() {
    // 星星背景實現（如果需要）
    console.log('星星背景創建完成');
}

// 全面檢查和修復加班標記
function checkAndFixOvertimeEvents() {
    console.log('執行全面檢查和修復加班標記');
    
    // 先清除所有可能的加班標記
    document.querySelectorAll('.fc-event, .overtime-badge').forEach(el => {
        el.remove();
    });
    
    // 然後為每個加班記錄重新渲染標記
    overtimeRecords.forEach(record => {
        renderOvertimeEventOnDate(record.date, record);
    });
    
    // 新增：確保創建顏色圖例
    createOvertimeLegend();
    
    console.log('檢查和修復完成');
}

// 添加一個定期檢查函數，每 5 秒執行一次
function setupPeriodicCheck() {
    setInterval(checkAndFixOvertimeEvents, 5000);
}

// 專門修復星期白邊的函數 - 不影響其他樣式
function fixHeaderWhiteEdges() {
    console.log('專門修復星期標頭白邊');
    
    // 獲取星期標頭行
    const headerRow = document.querySelector('.fc-col-header');
    if (!headerRow) return;
    
    // 確保星期標頭行沒有邊框
    headerRow.style.border = 'none';
    headerRow.style.borderWidth = '0';
    headerRow.style.background = 'transparent';
    headerRow.style.marginBottom = '8px';
    headerRow.style.borderRadius = '8px';
    headerRow.style.overflow = 'hidden';
    
    // 獲取所有星期標頭單元格
    const headerCells = document.querySelectorAll('.fc-col-header-cell');
    headerCells.forEach(cell => {
        // 移除所有邊框
        cell.style.border = 'none';
        cell.style.borderWidth = '0';
        
        // 設置背景漸變
        cell.style.background = 'linear-gradient(145deg, rgba(70, 80, 120, 0.8), rgba(50, 60, 100, 0.8))';
        
        // 設置內間距和外間距
        cell.style.padding = '8px 0';
        cell.style.margin = '0';
        
        // 確保單元格內容居中
        const cushion = cell.querySelector('.fc-col-header-cell-cushion');
        if (cushion) {
            cushion.style.padding = '8px 0';
        }
    });
    
    // 確保整個表格無邊框
    const scrollGrid = document.querySelector('.fc-scrollgrid');
    if (scrollGrid) {
        scrollGrid.style.border = 'none';
        scrollGrid.style.borderCollapse = 'separate';
        scrollGrid.style.borderSpacing = '1px';
    }
}

// 在頁面加載後執行
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(eliminateWeekdayBorders, 300);
    setupWhiteEdgeMonitor();
});

// 在日曆初始化後執行
setTimeout(eliminateWeekdayBorders, 500);

// 在月份切換時執行
calendar.on('datesSet', function() {
    setTimeout(eliminateWeekdayBorders, 200);
});

// 徹底解決星期白邊問題 - 專注於白邊不改動其他功能
function eliminateWeekdayBorders() {
    console.log('正在徹底清除星期表頭白邊');
    
    // 1. 先找到星期表頭區域 (fc-col-header)
    const headerRow = document.querySelector('.fc-col-header');
    if (!headerRow) {
        console.error('找不到星期表頭區域');
        return;
    }
    
    // 2. 查找 table 元素並移除其邊框
    const headerTable = headerRow.querySelector('table');
    if (headerTable) {
        headerTable.style.borderSpacing = '0px';
        headerTable.style.borderCollapse = 'collapse';
        headerTable.style.border = 'none';
    }
    
    // 3. 獲取所有星期單元格
    const headerCells = document.querySelectorAll('.fc-col-header-cell');
    
    // 4. 處理每個單元格 - 使用內聯樣式確保最高優先級
    headerCells.forEach((cell, index) => {
        // 移除所有邊框
        cell.style.border = 'none';
        cell.style.boxShadow = 'none';
        cell.style.outline = 'none';
        
        // 處理左邊界
        if (index > 0) {
            cell.style.borderLeft = 'none';
        }
        
        // 確保內部元素也沒有邊框
        const innerElements = cell.querySelectorAll('*');
        innerElements.forEach(el => {
            el.style.border = 'none';
            el.style.boxShadow = 'none';
        });
    });
    
    // 5. 檢查第一層表格結構
    const trElement = headerRow.querySelector('tr');
    if (trElement) {
        trElement.style.border = 'none';
        trElement.style.borderSpacing = '0px';
    }
    
    // 6. 修改表格的 table-layout 屬性，防止自動調整
    const tables = headerRow.querySelectorAll('table');
    tables.forEach(table => {
        table.style.tableLayout = 'fixed';
        table.style.borderCollapse = 'collapse';
        table.style.borderSpacing = '0px';
        table.style.border = 'none';
    });
    
    console.log('星期表頭白邊清除完成');
}

// 直接注入高優先級CSS解決星期白邊問題
function injectCriticalCSSFix() {
    const styleEl = document.createElement('style');
    styleEl.id = 'critical-weekday-border-fix';
    styleEl.innerHTML = `
        /* 徹底消除星期表頭白邊 */
        .fc-col-header table,
        .fc-col-header tr,
        .fc-col-header th,
        .fc-col-header td,
        .fc-col-header-cell {
            border: none !important;
            border-width: 0 !important;
            border-spacing: 0 !important;
            border-collapse: collapse !important;
            box-shadow: none !important;
            outline: none !important;
        }
        
        /* 防止表格自動調整 */
        .fc-col-header table {
            table-layout: fixed !important;
        }
        
        /* 確保單元格背景填滿 */
        .fc-col-header-cell {
            background: linear-gradient(145deg, rgba(70, 80, 120, 0.8), rgba(50, 60, 100, 0.8)) !important;
        }
        
        /* 確保表頭容器無邊框 */
        .fc-col-header {
            border: none !important;
            border-spacing: 0 !important;
            overflow: hidden !important;
        }
    `;
    
    document.head.appendChild(styleEl);
    console.log('已注入關鍵CSS修復星期白邊');
}

// 在頁面載入後立即執行
document.addEventListener('DOMContentLoaded', injectCriticalCSSFix);
// 確保在所有資源載入後也執行一次
window.addEventListener('load', injectCriticalCSSFix);

// 優化月份切換按鈕的互動體驗
function enhanceCalendarButtons() {
    console.log('增強月曆按鈕體驗');
    
    // 查找所有按鈕
    const buttons = document.querySelectorAll('.fc-button-primary');
    
    buttons.forEach(button => {
        // 添加點擊波紋效果
        button.addEventListener('click', function(e) {
            // 創建波紋元素
            const ripple = document.createElement('span');
            ripple.classList.add('btn-ripple');
            ripple.style.cssText = `
                position: absolute;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                pointer-events: none;
                transform: translate(-50%, -50%);
                animation: rippleEffect 0.8s linear;
            `;
            
            // 定位波紋
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            // 添加動畫關鍵幀
            const style = document.createElement('style');
            style.textContent = `
                @keyframes rippleEffect {
                    0% { width: 0; height: 0; opacity: 0.5; }
                    100% { width: 200px; height: 200px; opacity: 0; }
                }
            `;
            document.head.appendChild(style);
            
            // 添加波紋到按鈕
            button.style.position = 'relative';
            button.style.overflow = 'hidden';
            button.appendChild(ripple);
            
            // 移除波紋
            setTimeout(() => {
                ripple.remove();
                style.remove();
            }, 800);
        });
        
        // 添加工具提示
        if (button.classList.contains('fc-prev-button')) {
            button.title = '上個月';
        } else if (button.classList.contains('fc-next-button')) {
            button.title = '下個月';
        } else if (button.classList.contains('fc-today-button')) {
            button.title = '跳至今天';
        }
    });
    
    // 優化標題文本 - 可選：為日曆標題添加微妙的閃光效果
    const title = document.querySelector('.fc-toolbar-title');
    if (title) {
        title.innerHTML = `<span class="calendar-title-text">${title.textContent}</span>`;
        
        // 添加標題樣式
        const titleStyle = document.createElement('style');
        titleStyle.textContent = `
            .calendar-title-text {
                background: linear-gradient(90deg, #a0c9ff, #ffffff, #a0c9ff);
                background-size: 200% auto;
                background-clip: text;
                -webkit-background-clip: text;
                color: transparent;
                animation: title-shine 5s linear infinite;
            }
            
            @keyframes title-shine {
                0% { background-position: 0% center; }
                50% { background-position: 100% center; }
                100% { background-position: 0% center; }
            }
        `;
        document.head.appendChild(titleStyle);
    }
}

// 在初始化日曆後和月份切換時呼叫此函數
document.addEventListener('DOMContentLoaded', function() {
    // 在日曆初始化後延遲執行
    setTimeout(enhanceCalendarButtons, 500);
});

// 如果已有 datesSet 事件監聽器，請在其中添加對 enhanceCalendarButtons 的呼叫
// 或者添加這個監聽器
if (calendar) {
    calendar.on('datesSet', function() {
        setTimeout(enhanceCalendarButtons, 100);
    });
}