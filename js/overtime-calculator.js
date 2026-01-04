// 全局變數聲明
let overtimeRecords = [];
let calendar;
let selectedDate;
let holidays = [];

// 添加全局渲染鎖定機制
let calendarRenderingLock = false;

// 主程式入口 - 確保只有一個版本
document.addEventListener('DOMContentLoaded', function() {
    console.log('初始化加班計算器');
    
    // 定義假日資料 - 根據中華民國115年政府行政機關辦公日曆表
    holidays = [
        // 一月
        '2026-01-01', // 元旦(四)
        
        // 二月 - 春節連假 (2/14-2/22，共9天)
        '2026-02-16', // 除夕(一)
        '2026-02-17', // 初一(二)
        '2026-02-18', // 初二(三)
        '2026-02-19', // 初三(四)
        '2026-02-20', // 初四(五)
        '2026-02-21', // 初五(六)
        '2026-02-22', // 初六(日)

        // 二月 - 228和平紀念日 (2/27-3/1，共3天)
        '2026-02-27', // 和平紀念日(五)
        
        // 四月 - 兒童節清明節 (4/3-4/6，共4天)
        '2026-04-03', // 兒童節前一日(五)
        '2026-04-06', // 清明節補假(一)

        // 五月 - 勞動節
        '2026-05-01', // 勞動節(五)

        // 六月 - 端午節 (6/19-6/21，共3天)
        '2026-06-19', // 端午節(五)

        // 九月 - 教師節中秋節 (9/25-9/28，共4天)
        '2026-09-25', // 中秋節(五)
        '2026-09-28', // 教師節(一)

        // 十月 - 國慶日 (10/9-10/11，共3天)
        '2026-10-09', // 國慶日補假(五)

        // 十月 - 台灣光復日 (10/24-10/26，共3天)
        '2026-10-26', // 台灣光復日補假(一)

         // 十二月 - 行憲紀念日(12/25-12/27，共3天)
        '2026-12-25', // 行憲紀念日(五)

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
        
        // 明確設置日期顯示格式，避免中文本地化導致的重複問題
        dayCellContent: function(arg) {
            return {
                html: `<div class="fc-daygrid-day-number" style="font-size: 14px; font-weight: bold;">${arg.date.getDate()}</div>`
            };
        },
        
        // 簡化所有樣式相關選項，避免使用不支援的屬性
        eventDisplay: 'block',
        eventBackgroundColor: 'transparent',
        
        views: {
            dayGridMonth: {
                dayMaxEventRows: true,
                dayHeaderFormat: { weekday: 'short' },
                // 確保日期格式正確
                dayCellContent: function(arg) {
                    return arg.date.getDate().toString();
                }
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
        saveBtn.addEventListener('click', function() {
            saveOvertimeRecord();
            // 立即更新統計
            setTimeout(updateTotalDisplay, 100);
        });
    }
    
    // 薪資區域輸入變更事件 - 實時更新
    ['monthlySalary', 'workingDays', 'workingHours'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('input', function() {
                // 實時更新計算結果
                debounce(updateTotalDisplay, 300)();
            });
            el.addEventListener('change', updateTotalDisplay);
        }
    });
    
    // 移除原本的計算按鈕綁定，添加匯出按鈕綁定
    bindExportButton();
    
    // 重置按鈕 - 檢查多個可能的ID
    const resetBtnIds = ['resetDataBtn', 'resetAllDataBtn', 'resetBtn'];
    let resetBtn = null;
    
    for (const id of resetBtnIds) {
        resetBtn = document.getElementById(id);
        if (resetBtn) {
            console.log(`找到重置按鈕，ID: ${id}`);
            break;
        }
    }
    
    if (resetBtn) {
        // 移除舊的事件監聽器
        resetBtn.removeEventListener('click', resetAllData);
        // 重新綁定
        resetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('重置按鈕被點擊');
            resetAllData();
        });
        console.log('重置按鈕綁定完成');
    } else {
        console.error('找不到重置按鈕元素，請檢查HTML中的按鈕ID');
        
        // 嘗試通過類名或其他屬性找到按鈕
        const resetBtnByClass = document.querySelector('.cosmic-btn[onclick*="reset"], button[onclick*="reset"]');
        if (resetBtnByClass) {
            console.log('通過類名找到重置按鈕');
            resetBtnByClass.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                resetAllData();
            });
        }
    }

    // 其他事件綁定...
    ['monthlySalary', 'workingDays', 'workingHours'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', calculateTotals);
        }
    });

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

// 防抖函數
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 顯示匯出選擇對話框
function showExportDialog() {
    // 檢查是否有資料可匯出
    if (overtimeRecords.length === 0) {
        showToast('沒有可匯出的資料！', 'warning');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'export-modal';
    modal.innerHTML = `
        <div class="export-dialog">
            <h3>📊 選擇匯出格式</h3>
            <div class="export-options">
                <button class="export-option-btn" onclick="exportToExcel()">
                    <span class="option-icon">📗</span>
                    <div class="option-content">
                        <div class="option-title">Excel 檔案</div>
                        <div class="option-desc">完整的試算表格式，支援公式計算</div>
                    </div>
                </button>
                <button class="export-option-btn" onclick="exportToCSV()">
                    <span class="option-icon">📄</span>
                    <div class="option-content">
                        <div class="option-title">CSV 檔案</div>
                        <div class="option-desc">通用格式，可在各種程式中開啟</div>
                    </div>
                </button>
                <button class="export-option-btn" onclick="exportToPDF()">
                    <span class="option-icon">📋</span>
                    <div class="option-content">
                        <div class="option-title">PDF 報表</div>
                        <div class="option-desc">專業格式的加班費報表</div>
                    </div>
                </button>
            </div>
            <div class="export-dialog-buttons">
                <button class="export-cancel-btn" onclick="closeExportDialog()">取消</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // 添加點擊背景關閉功能
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeExportDialog();
        }
    });

    // 顯示動畫
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // 創建星星背景效果
    createStarsEffect(modal.querySelector('.export-dialog'), 20);
}

// 關閉匯出對話框
function closeExportDialog() {
    const modal = document.querySelector('.export-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// 簡化 Excel 匯出函數
function exportToExcel() {
    try {
        if (typeof XLSX === 'undefined') {
            showToast('Excel 匯出功能需要 XLSX 函式庫', 'error');
            return;
        }
        
        if (overtimeRecords.length === 0) {
            showToast('沒有可匯出的資料！', 'warning');
            closeExportDialog();
            return;
        }
        
        const data = prepareExportDataWithSummary();
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "加班記錄");
        
        const fileName = `加班記錄_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        showToast('Excel 檔案匯出成功！', 'success');
        closeExportDialog();
    } catch (error) {
        console.error('Excel 匯出失敗:', error);
        showToast('Excel 匯出失敗: ' + error.message, 'error');
    }
}

// 簡化 CSV 匯出函數
function exportToCSV() {
    try {
        if (overtimeRecords.length === 0) {
            showToast('沒有可匯出的資料！', 'warning');
            closeExportDialog();
            return;
        }
        
        const data = prepareExportDataWithSummary();
        const headers = ['日期', '星期', '日期類型', '開始時間', '結束時間', '加班時數', '休息狀態', '費率說明', '加班費'];
        
        let csvContent = '\uFEFF' + headers.join(',') + '\n';
        
        data.forEach(row => {
            const values = Object.values(row).map(val => `"${val}"`);
            csvContent += values.join(',') + '\n';
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const fileName = `加班記錄_${new Date().toISOString().slice(0, 10)}.csv`;
        downloadFile(blob, fileName);
        
        showToast('CSV 檔案匯出成功！', 'success');
        closeExportDialog();
    } catch (error) {
        console.error('CSV 匯出失敗:', error);
        showToast('CSV 匯出失敗: ' + error.message, 'error');
    }
}

// 修復 PDF 匯出函數 - 使用英文避免亂碼
function exportToPDF() {
    try {
        if (typeof window.jspdf === 'undefined') {
            showToast('PDF 匯出功能需要 jsPDF 函式庫', 'error');
            return;
        }
        
        if (overtimeRecords.length === 0) {
            showToast('沒有可匯出的資料！', 'warning');
            closeExportDialog();
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const data = prepareExportData();
        const totals = calculateTotals();
        
        // 設定字體（使用內建的字體處理中文）
        doc.setFont('helvetica');
        
        // 標題 - 使用英文避免亂碼
        doc.setFontSize(18);
        doc.text('Galaxy Working Hour Calculator', 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text('Overtime Report', 105, 30, { align: 'center' });
        
        // 統計資訊 - 使用英文
        doc.setFontSize(12);
        const reportDate = new Date().toLocaleDateString('en-US');
        doc.text(`Report Date: ${reportDate}`, 20, 45);
        doc.text(`Total Hours: ${totals.totalHours} hours`, 20, 55);
        doc.text(`Total Amount: $${totals.totalAmount} TWD`, 20, 65);
        
        // 時薪信息
        const hourlyRate = calculateHourlyRate();
        doc.text(`Hourly Rate: $${hourlyRate} TWD/hour`, 20, 75);
        
        // 準備表格資料 - 轉換為英文
        const tableRows = data.map(row => [
            row.日期,                                    // Date
            translateWeekday(row.星期),                   // Day
            translateDayType(row.日期類型),               // Type  
            row.開始時間,                                 // Start
            row.結束時間,                                 // End
            formatHours(row.加班時數),                    // Hours
            '$' + row.加班費                             // Amount
        ]);
        
        // 添加總計行
        tableRows.push([
            '', '', '', '', 'Total:', 
            totals.totalHours + 'h', 
            '$' + totals.totalAmount
        ]);
        
        if (typeof doc.autoTable === 'function') {
            doc.autoTable({
                head: [['Date', 'Day', 'Type', 'Start', 'End', 'Hours', 'Amount']],
                body: tableRows,
                startY: 85,
                styles: { 
                    fontSize: 9,
                    cellPadding: 3,
                    halign: 'center'
                },
                headStyles: { 
                    fillColor: [70, 90, 150],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { cellWidth: 25 }, // Date
                    1: { cellWidth: 15 }, // Day  
                    2: { cellWidth: 20 }, // Type
                    3: { cellWidth: 18 }, // Start
                    4: { cellWidth: 18 }, // End
                    5: { cellWidth: 20 }, // Hours
                    6: { cellWidth: 25 }  // Amount
                },
                // 設定最後一行（總計行）的樣式
                didParseCell: function(data) {
                    if (data.row.index === tableRows.length - 1) {
                        data.cell.styles.fillColor = [200, 200, 200];
                        data.cell.styles.textColor = [0, 0, 0];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            });
        } else {
            // 如果 autoTable 不可用，使用簡單的文字輸出
            let yPosition = 90;
            doc.setFontSize(10);
            
            // 表頭
            doc.text('Date      Day  Type      Start   End     Hours   Amount', 20, yPosition);
            yPosition += 10;
            
            // 畫線
            doc.line(20, yPosition - 5, 190, yPosition - 5);
            
            // 資料行
            tableRows.forEach(row => {
                const rowText = row.map(cell => String(cell).padEnd(8)).join(' ');
                doc.text(rowText, 20, yPosition);
                yPosition += 8;
                
                // 避免超出頁面
                if (yPosition > 280) {
                    doc.addPage();
                    yPosition = 20;
                }
            });
        }
        
        // 添加頁腳
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.text('Generated by Galaxy Working Hour Calculator', 105, 290, { align: 'center' });
        }
        
        const fileName = `Overtime_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
        
        showToast('PDF 報表匯出成功！', 'success');
        closeExportDialog();
    } catch (error) {
        console.error('PDF 匯出失敗:', error);
        showToast('PDF 匯出失敗: ' + error.message, 'error');
    }
}

// 輔助函數：翻譯星期
function translateWeekday(chineseDay) {
    const dayMap = {
        '日': 'Sun',
        '一': 'Mon', 
        '二': 'Tue',
        '三': 'Wed',
        '四': 'Thu',
        '五': 'Fri',
        '六': 'Sat'
    };
    return dayMap[chineseDay] || chineseDay;
}

// 輔助函數：翻譯日期類型
function translateDayType(chineseType) {
    const typeMap = {
        '工作日': 'Workday',
        '休息日': 'Weekend', 
        '國定假日': 'Holiday'
    };
    return typeMap[chineseType] || 'Workday';
}

// 輔助函數：格式化時數顯示
function formatHours(chineseHours) {
    // 如果包含中文字符，提取數字部分
    if (typeof chineseHours === 'string' && chineseHours.includes('小時')) {
        const match = chineseHours.match(/(\d+)小時(\d+)?分?/);
        if (match) {
            const hours = parseInt(match[1]) || 0;
            const minutes = parseInt(match[2]) || 0;
            if (minutes > 0) {
                return `${hours}:${minutes.toString().padStart(2, '0')}`;
            } else {
                return `${hours}h`;
            }
        }
    }
    return chineseHours;
}

// 支援中文的 PDF 匯出函數 - 使用圖片方式
function exportToPDFWithChinese() {
    try {
        if (typeof window.jspdf === 'undefined') {
            showToast('PDF 匯出功能需要 jsPDF 函式庫', 'error');
            return;
        }
        
        if (overtimeRecords.length === 0) {
            showToast('沒有可匯出的資料！', 'warning');
            closeExportDialog();
            return;
        }
        
        // 創建一個臨時的 HTML 表格
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        tempDiv.style.background = 'white';
        tempDiv.style.padding = '20px';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        
        const data = prepareExportData();
        const totals = calculateTotals();
        
        tempDiv.innerHTML = `
            <h2 style="text-align: center; color: #333;">銀河工時計量器 - 加班費報表</h2>
            <p><strong>報表日期:</strong> ${new Date().toLocaleDateString('zh-TW')}</p>
            <p><strong>總加班時數:</strong> ${totals.totalHours} 小時</p>
            <p><strong>總加班費:</strong> $${totals.totalAmount} 元</p>
            <table border="1" style="border-collapse: collapse; width: 100%; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #4e5aa3; color: white;">
                        <th style="padding: 8px;">日期</th>
                        <th style="padding: 8px;">星期</th>
                        <th style="padding: 8px;">類型</th>
                        <th style="padding: 8px;">時數</th>
                        <th style="padding: 8px;">加班費</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(row => `
                        <tr>
                            <td style="padding: 6px; text-align: center;">${row.日期}</td>
                            <td style="padding: 6px; text-align: center;">${row.星期}</td>
                            <td style="padding: 6px; text-align: center;">${row.日期類型}</td>
                            <td style="padding: 6px; text-align: center;">${row.加班時數}</td>
                            <td style="padding: 6px; text-align: right;">$${row.加班費}</td>
                        </tr>
                    `).join('')}
                    <tr style="background-color: #f0f0f0; font-weight: bold;">
                        <td colspan="3" style="padding: 8px; text-align: right;">總計:</td>
                        <td style="padding: 8px; text-align: center;">${totals.totalHours}小時</td>
                        <td style="padding: 8px; text-align: right;">$${totals.totalAmount}元</td>
                    </tr>
                </tbody>
            </table>
        `;
        
        document.body.appendChild(tempDiv);
        
        // 使用 html2canvas 轉換為圖片，然後加入 PDF
        if (typeof html2canvas !== 'undefined') {
            html2canvas(tempDiv).then(canvas => {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const imgData = canvas.toDataURL('image/png');
                
                doc.addImage(imgData, 'PNG', 10, 10, 190, 0);
                
                const fileName = `加班費報表_${new Date().toISOString().slice(0, 10)}.pdf`;
                doc.save(fileName);
                
                document.body.removeChild(tempDiv);
                showToast('PDF 報表匯出成功！', 'success');
                closeExportDialog();
            });
        } else {
            document.body.removeChild(tempDiv);
            // 降級到英文版本
            exportToPDF();
        }
        
    } catch (error) {
        console.error('PDF 匯出失敗:', error);
        showToast('PDF 匯出失敗: ' + error.message, 'error');
    }
}

// 修復準備匯出資料函數 - 使用實際選擇的日期類型
function prepareExportData() {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    return overtimeRecords.map(record => {
        const date = new Date(record.date);
        const dayOfWeek = weekdays[date.getDay()];
        const hourlyRate = calculateHourlyRate();
        
        // 使用記錄中實際保存的日期類型，而不是自動判斷
        let dayTypeDisplay;
        switch(record.dayType) {
            case 'workday': dayTypeDisplay = '工作日'; break;
            case 'restday': dayTypeDisplay = '休息日'; break;
            case 'holiday': dayTypeDisplay = '國定假日'; break;
            default: dayTypeDisplay = '工作日';
        }
        
        // 計算實際加班時數
        const hours = parseFloat(record.hours) || 0;
        const minutes = parseFloat(record.minutes) || 0;
        const totalTime = hours + (minutes / 60);
        
        // 安全地計算費率和金額 - 使用記錄中的實際日期類型
        let rates = '';
        let amount = 0;
        
        try {
            rates = calculateRates(record.dayType, totalTime);  // 使用 record.dayType
            amount = calculateAmount(record.dayType, totalTime, hourlyRate);  // 使用 record.dayType
        } catch (error) {
            console.error('計算費率時發生錯誤:', error);
            rates = '計算錯誤';
            amount = 0;
        }
        
        return {
            '日期': record.date || '',
            '星期': dayOfWeek || '',
            '日期類型': dayTypeDisplay,  // 使用實際選擇的類型
            '開始時間': record.startTime || '',
            '結束時間': record.endTime || '',
            '加班時數': record.hours + (record.minutes ? '小時' + record.minutes + '分' : '小時'),
            '休息狀態': record.noLunchBreak ? '中午沒有休息' : '有休息時間',
            '費率說明': rates,
            '加班費': amount
        };
    });
}

// 渲染加班記錄表格 - 確保顯示一致
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
        
        // 使用記錄中實際選擇的日期類型，而不是自動判斷
        let dayTypeText;
        switch(record.dayType) {
            case 'workday': dayTypeText = '工作日'; break;
            case 'restday': dayTypeText = '休息日'; break;
            case 'holiday': dayTypeText = '國定假日'; break;
            default: dayTypeText = '工作日';
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
// 新增函數：準備包含總計的匯出資料
function prepareExportDataWithSummary() {
    const detailData = prepareExportData();
    const totals = calculateTotals(); // 確保調用正確的函數
    
    // 添加空行
    detailData.push({
        '日期': '',
        '星期': '',
        '日期類型': '',
        '開始時間': '',
        '結束時間': '',
        '加班時數': '',
        '費率說明': '',
        '加班費': ''
    });
    
    // 添加總計行
    detailData.push({
        '日期': '',
        '星期': '',
        '日期類型': '',
        '開始時間': '',
        '結束時間': '總計',
        '加班時數': totals.totalHours + '小時',
        '費率說明': '',
        '加班費': '$' + totals.totalAmount + '元'
    });
    
    return detailData;
}

// 檔案下載輔助函數
function downloadFile(blob, fileName) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

// 綁定匯出按鈕事件
function bindExportButton() {
    const exportBtn = document.getElementById('exportDataBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', showExportDialog);
    }
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
    const noLunchBreakCheckbox = document.getElementById('noLunchBreak');
    
    if (startTimeInput && endTimeInput) {
        if (existingRecord && existingRecord.startTime && existingRecord.endTime) {
            startTimeInput.value = existingRecord.startTime;
            endTimeInput.value = existingRecord.endTime;
            // 載入已保存的中午沒有休息狀態
            if (noLunchBreakCheckbox) {
                noLunchBreakCheckbox.checked = existingRecord.noLunchBreak || false;
            }
        } else {
            startTimeInput.value = '08:00';
            endTimeInput.value = '17:00';
            // 重置中午沒有休息選項
            if (noLunchBreakCheckbox) {
                noLunchBreakCheckbox.checked = false;
            }
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
        
        // 添加中午沒有休息選項的監聽
        const noLunchBreakInput = document.getElementById('noLunchBreak');
        if (noLunchBreakInput) {
            noLunchBreakInput.addEventListener('change', calculateOvertimeHours);
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
    const noLunchBreakCheckbox = document.getElementById('noLunchBreak');
    
    if (!startTimeInput || !endTimeInput || !dayTypeSelect) return;
    
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    const dayType = dayTypeSelect.value;
    const noLunchBreak = noLunchBreakCheckbox ? noLunchBreakCheckbox.checked : false;
    
    if (!startTime || !endTime) return;
    
    // 將時間轉換為分鐘
    const startMinutes = convertTimeToMinutes(startTime);
    const endMinutes = convertTimeToMinutes(endTime);
    
    // 處理跨日的情況
    let totalMinutes = endMinutes >= startMinutes ? 
                      (endMinutes - startMinutes) : 
                      (endMinutes + 24 * 60 - startMinutes);
    
    // 減去午休時間 (如果有勾選中午沒有休息，就不扣除休息時間)
    let breakMinutes = 0;
    if (!noLunchBreak && totalMinutes > 5 * 60) {
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
        // 休息日和國定假日：全部算加班，但已扣除休息時間
        overtimeMinutes = actualWorkMinutes > 0 ? actualWorkMinutes : 0;
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
    
    // 更新工作時間說明
    const workTimeDescription = document.getElementById('workTimeDescription');
    if (workTimeDescription) {
        if (noLunchBreak) {
            workTimeDescription.textContent = '已選擇中午沒有休息：不扣除休息時間，直接計算工作時數';
        } else {
            workTimeDescription.textContent = '標準工時：8小時工作 + 1小時休息（所有日期類型皆會自動扣除休息時間）';
        }
    }
    
    // 顯示詳細說明
    const overtimeDetails = document.getElementById('overtimeDetails');
    if (overtimeDetails) {
        if (overtimeMinutes > 0) {
            let detailText = `總工作時間 ${formatMinutesToTime(totalMinutes)}`;
            if (breakMinutes > 0) {
                detailText += `，扣除休息 ${formatMinutesToTime(breakMinutes)}`;
                detailText += ` = 實際工作 ${formatMinutesToTime(actualWorkMinutes)}`;
            } else if (noLunchBreak) {
                detailText += `（中午沒有休息）= 實際工作 ${formatMinutesToTime(actualWorkMinutes)}`;
            }
            
            if (dayType === 'workday') {
                detailText += `，超出標準工時 ${formatMinutesToTime(overtimeMinutes)}`;
            } else {
                detailText += `，${dayType === 'holiday' ? '國定假日' : '休息日'}全部算加班`;
            }
            
            overtimeDetails.textContent = detailText;
        } else {
            let detailText = '未達加班標準';
            if (totalMinutes > 0) {
                detailText = `總工作時間 ${formatMinutesToTime(totalMinutes)}`;
                if (breakMinutes > 0) {
                    detailText += `，扣除休息 ${formatMinutesToTime(breakMinutes)}`;
                    detailText += ` = 實際工作 ${formatMinutesToTime(actualWorkMinutes)}`;
                } else if (noLunchBreak) {
                    detailText += `（中午沒有休息）= 實際工作 ${formatMinutesToTime(actualWorkMinutes)}`;
                }
                if (dayType === 'workday') {
                    detailText += `，未超出標準工時`;
                }
            }
            overtimeDetails.textContent = detailText;
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
    const noLunchBreakCheckbox = document.getElementById('noLunchBreak');
    
    if (!startTimeInput || !endTimeInput || !dayTypeSelect || !calculatedOvertime || !selectedDate) {
        alert('無法保存加班記錄，表單數據不完整');
        return;
    }
    
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;
    const dayType = dayTypeSelect.value;
    const noLunchBreak = noLunchBreakCheckbox ? noLunchBreakCheckbox.checked : false;
    
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
        overtimeRecords[existingRecordIndex].noLunchBreak = noLunchBreak;
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
            endTime: endTime,
            noLunchBreak: noLunchBreak
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
    

    // 重要：清除處理標記，允許重新處理
    cell.dataset.processed = 'false';

    // 清除舊的元素和類別
    cell.className = cell.className
        .replace(/fc-day-(holiday|workday|restday)/g, '')
        .replace(/fc-day-clicked/g, '');

    // 清除現有的假日名稱
    const existingHolidayName = cell.querySelector('.holiday-name');
    if (existingHolidayName) {
        existingHolidayName.remove();
    }
    
    // 清除現有的加班標記
    const existingBadges = cell.querySelectorAll('.fc-event, .overtime-badge');
    existingBadges.forEach(badge => badge.remove());

    // 清除所有舊的事件點
    const existingEvents = cell.querySelectorAll('.fc-event');
    existingEvents.forEach(event => event.remove());
    
   // 修復日期數字重複問題 - 簡化處理，避免與 FullCalendar 內建處理衝突
    setTimeout(() => {
        const dayNumber = cell.querySelector('.fc-daygrid-day-number');
        if (dayNumber) {
            // 只有在發現重複內容時才處理
            const currentText = dayNumber.textContent;
            const correctDate = date.getDate().toString();
            
            // 檢查是否有重複（如 "28日28" 或其他異常格式）
            if (currentText !== correctDate && (currentText.includes('日') || currentText.length > 2)) {
                console.log(`修復重複日期顯示: "${currentText}" -> "${correctDate}"`);
                dayNumber.innerHTML = '';
                dayNumber.textContent = correctDate;
                
                // 確保樣式正確
                dayNumber.style.fontSize = '14px';
                dayNumber.style.fontWeight = 'bold';
                dayNumber.style.color = 'inherit';
            }
        }
    }, 10);

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
    
    // 檢查是否有加班記錄，如果有就重新渲染徽章
    const record = overtimeRecords.find(r => r.date === dateStr);
    if (record) {
        // 延遲一點時間確保DOM穩定後再渲染徽章
        setTimeout(() => {
            renderOvertimeEventOnDate(dateStr, record);
        }, 50);
    }
}
    
// 添加一個專門修復日期顯示的函數
function fixDateNumberDisplay() {
    console.log('修復日期數字顯示');
    
    document.querySelectorAll('.fc-daygrid-day-number').forEach(dayNumberEl => {
        // 獲取原始日期數字
        const dayText = dayNumberEl.textContent.trim();
        
        // 如果出現重複數字（如 "26日26"），只保留數字部分
        const match = dayText.match(/(\d+)/);
        if (match) {
            const dayNum = match[1];
            dayNumberEl.innerHTML = '';
            dayNumberEl.textContent = dayNum;
        }
    });
}

// 修復月份切換處理函數
function handleMonthChange() {
    console.log('處理月份切換');
    
    setTimeout(() => {
        // 1. 修復日期數字顯示
        fixDateNumberDisplay();
        
        // 2. 重新渲染加班徽章
        forceRefreshAllOvertimeBadges();
        
        // 3. 修復其他樣式
        eliminateWeekdayBorders();
        createOvertimeLegend();
        
        console.log('月份切換處理完成');
    }, 100);
}


// 修復月份切換按鈕事件綁定
function addCalendarTransitionEffects() {
    // 獲取按鈕
    const prevBtn = document.querySelector('.fc-prev-button');
    const nextBtn = document.querySelector('.fc-next-button');
    const todayBtn = document.querySelector('.fc-today-button');
    
    // 移除舊的事件監聽器
    if (prevBtn) {
        prevBtn.removeEventListener('click', applyCalendarTransition);
        prevBtn.addEventListener('click', applyCalendarTransition);
    }
    
    if (nextBtn) {
        nextBtn.removeEventListener('click', applyCalendarTransition);
        nextBtn.addEventListener('click', applyCalendarTransition);
    }
    
    if (todayBtn) {
        todayBtn.removeEventListener('click', applyCalendarTransition);
        todayBtn.addEventListener('click', applyCalendarTransition);
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
        tr.innerHTML = `<td colspan="7" class="text-center">尚無加班記錄</td>`;
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
        
        // 休息狀態顯示
        const breakStatus = record.noLunchBreak ? 
            '<span class="badge bg-warning text-dark"><i class="fas fa-utensils-slash me-1"></i>無休息</span>' : 
            '<span class="badge bg-success"><i class="fas fa-utensils me-1"></i>有休息</span>';
        
        tr.innerHTML = `
            <td>${displayDate}</td>
            <td>${dayTypeText}</td>
            <td title="工作時間: ${workTimeDisplay}">${timeDisplay}</td>
            <td>${breakStatus}</td>
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

// 修復重置所有數據函數
function resetAllData() {
    console.log('嘗試重置所有數據');
    
    cosmicConfirm(
        '確定要重置所有資料嗎？<br><br>這將清除：<br>• 所有加班記錄<br>• 薪資設定將還原為預設值', 
        function() {
            console.log('用戶確認重置數據');
            
            // 保存需要清除標記的日期
            const datesToClear = overtimeRecords.map(record => record.date);
            
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
            datesToClear.forEach(dateStr => {
                renderOvertimeEventOnDate(dateStr, null);
            });
            
            // 顯示成功訊息
            showToast('所有資料已重置', 'success');
            
            console.log('數據重置完成');
        },
        function() {
            console.log('用戶取消重置');
        }
    );
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

// 秋除所有底線和邊框
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
        cell.style.background = 'linear-gradient(145deg, rgba(70, 80, 120, 0.8), rgba(50, 60,  100, 0.8))';
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

// 計算費率說明
function calculateRates(dayType, hours) {
    if (dayType === 'workday') {
        if (hours <= 2) {
            return '前2小時1.33倍';
        } else {
            return '前2小時1.33倍，後續1.67倍';
        }
    } else if (dayType === 'restday') {
        if (hours <= 2) {
            return '前2小時1.33倍';
        } else if (hours <= 8) {
            return '前2小時1.33倍，後續1.67倍';
        } else {
            return '前2小時1.33倍，3-8小時1.67倍，超過8小時2倍';
        }
    } else { // holiday
        return '國定假日2倍';
    }
}

// 計算加班費金額
function calculateAmount(dayType, hours, hourlyRate) {
    let amount = 0;
    
    if (dayType === 'workday') {
        if (hours <= 2) {
            amount = hours * hourlyRate * 1.33;
        } else {
            amount = (2 * hourlyRate * 1.33) + ((hours - 2) * hourlyRate * 1.67);
        }
    } else if (dayType === 'restday') {
        if (hours <= 2) {
            amount = hours * hourlyRate * 1.33;
        } else if (hours <= 8) {
            amount = (2 * hourlyRate * 1.33) + ((hours - 2) * hourlyRate * 1.67);
        } else {
            amount = (2 * hourlyRate * 1.33) + (6 * hourlyRate * 1.67) + ((hours - 8) * hourlyRate * 2);
        }
    } else { // holiday
        amount = hours * hourlyRate * 2;
    }
    
    return Math.round(amount);
}

// 修復計算總計函數並立即更新顯示
function calculateTotals() {
    let totalHours = 0;
    let totalAmount = 0;
    
    overtimeRecords.forEach(record => {
        const hours = parseFloat(record.hours) || 0;
        const minutes = parseFloat(record.minutes) || 0;
        const totalTime = hours + (minutes / 60);
        
        totalHours += totalTime;
        
        const hourlyRate = calculateHourlyRate();
        const amount = calculateAmount(record.dayType, totalTime, hourlyRate);
        totalAmount += amount;
    });
    
    const result = {
        totalHours: totalHours.toFixed(1),
        totalAmount: Math.round(totalAmount)
    };
    
    // 立即更新顯示
    updateTotalDisplay(result);
    
    return result;
}

// 創建統一的總計更新函數
function updateTotalDisplay(totals) {
    if (!totals) {
        totals = calculateTotals();
    }
    
    console.log('更新統計顯示:', totals);
    
    // 更新總時數顯示 - 多種選擇器確保找到元素
    const totalHoursSelectors = [
        '.stats-card .stat-value:first-child',
        '#totalHours',
        '.total-hours',
        '[data-stat="totalHours"]'
    ];
    
    for (const selector of totalHoursSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = totals.totalHours + ' 小時';
            break;
        }
    }
    
    // 更新總金額顯示
    const totalAmountSelectors = [
        '.stats-card .stat-value:nth-child(3)',
        '#totalAmount', 
        '.total-amount',
        '[data-stat="totalAmount"]'
    ];
    
    for (const selector of totalAmountSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = totals.totalAmount + ' 元';
            break;
        }
    }
    
    // 更新時薪顯示
    const hourlyRate = calculateHourlyRate();
    const hourlyRateSelectors = [
        '.stats-card .stat-value:last-child',
        '#hourlyRate',
        '.hourly-rate',
        '[data-stat="hourlyRate"]'
    ];
    
    for (const selector of hourlyRateSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            element.textContent = hourlyRate + ' 元/時';
            break;
        }
    }
    
    console.log('統計顯示更新完成');
}

// 修復刪除按鈕綁定函數
function bindDeleteButtons() {
    console.log('綁定刪除按鈕事件');
    
    // 移除所有舊的事件監聽器
    document.querySelectorAll('.delete-btn').forEach(btn => {
        // 克隆節點來移除所有事件監聽器
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
    });
    
    // 重新綁定新的事件監聽器
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const recordId = parseInt(this.getAttribute('data-id'));
            console.log('點擊刪除按鈕，記錄ID:', recordId);
            
            if (!recordId) {
                console.error('無效的記錄ID');
                showToast('刪除失敗：無效的記錄ID', 'error');
                return;
            }
            
            // 使用修復後的確認對話框
            cosmicConfirm('確定要刪除此加班記錄嗎？', function() {
                deleteOvertimeRecord(recordId);
            });
        });
    });
    
    console.log('刪除按鈕綁定完成，共綁定', document.querySelectorAll('.delete-btn').length, '個按鈕');
}

// 處理刪除點擊事件
function handleDeleteClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const recordId = this.getAttribute('data-id');
    console.log('點擊刪除按鈕，記錄ID:', recordId);
    
    if (recordId && confirm('確定要刪除這筆加班記錄嗎？')) {
        deleteOvertimeRecord(recordId);
    }
}

// 修復刪除加班記錄函數
function deleteOvertimeRecord(recordId) {
    console.log('開始刪除記錄:', recordId);
    
    // 找到要刪除的記錄
    const recordIndex = overtimeRecords.findIndex(record => record.id == recordId);
    
    if (recordIndex === -1) {
        console.error('找不到要刪除的記錄:', recordId);
        showToast('找不到要刪除的記錄', 'error');
        return;
    }
    
    const recordToDelete = overtimeRecords[recordIndex];
    const dateToUpdate = recordToDelete.date;
    
    console.log(`刪除 ${dateToUpdate} 的加班記錄`);
    
    // 從陣列中移除記錄
    overtimeRecords.splice(recordIndex, 1);
    
    // 更新 UI
    renderOvertimeRecords();
    calculateTotals();
    
    // 更新日曆 - 移除該日期的加班標記
    renderOvertimeEventOnDate(dateToUpdate, null);
    
    // 顯示成功訊息
    showToast('加班記錄已刪除', 'success');
    
    console.log('記錄刪除完成，剩餘記錄數:', overtimeRecords.length);
}

// 從日曆中移除加班事件
function removeOvertimeEventFromDate(dateStr) {
    if (!calendar) return;
    
    try {
        const dayCell = calendar.el.querySelector(`[data-date="${dateStr}"]`);
        if (dayCell) {
            const overtimeIndicator = dayCell.querySelector('.overtime-indicator');
            if (overtimeIndicator) {
                overtimeIndicator.remove();
            }
        }
    } catch (error) {
        console.error('移除日曆事件時發生錯誤:', error);
    }
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

// 改進提示訊息函數
function showToast(message, type = 'info') {
    console.log(`Toast: ${message} (${type})`);
    
    // 創建 toast 元素
    const toast = document.createElement('div');
    toast.className = 'cosmic-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10001;
        transform: translateX(400px);
        transition: transform 0.3s;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // 選擇圖標
    const icons = {
        info: 'ℹ️',
        success: '✅',
        error: '❌',
        warning: '⚠️'
    };
    
    toast.innerHTML = `${icons[type] || icons.info} ${message}`;
    
    document.body.appendChild(toast);
    
    // 顯示動畫
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // 自動隱藏
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// 修復確認對話框函數
function cosmicConfirm(message, confirmCallback, cancelCallback) {
    // 先嘗試使用原生 confirm 作為備用
    if (typeof confirmCallback !== 'function') {
        console.error('confirmCallback 必須是一個函數');
        return;
    }
    
    try {
        // 創建模態對話框
        const modal = document.createElement('div');
        modal.className = 'cosmic-confirm-modal';
        modal.innerHTML = `
            <div class="cosmic-confirm-overlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                transition: opacity 0.3s;
            ">
                <div class="cosmic-confirm-dialog" style="
                    background: linear-gradient(145deg, #1a2550, #2a3570);
                    border: 2px solid rgba(111, 155, 255, 0.3);
                    border-radius: 15px;
                    padding: 25px;
                    width: 90%;
                    max-width: 400px;
                    color: white;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                    transform: scale(0.9);
                    transition: transform 0.3s;
                ">
                    <h4 style="margin: 0 0 15px 0; color: #6f9bff;">確認操作</h4>
                    <p style="margin: 0 0 20px 0; line-height: 1.5;">${message}</p>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button class="cosmic-confirm-cancel" style="
                            background: #f44336;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: bold;
                            transition: all 0.3s;
                        ">取消</button>
                        <button class="cosmic-confirm-ok" style="
                            background: #4caf50;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: bold;
                            transition: all 0.3s;
                        ">確定</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 獲取按鈕元素
        const confirmBtn = modal.querySelector('.cosmic-confirm-ok');
        const cancelBtn = modal.querySelector('.cosmic-confirm-cancel');
        const overlay = modal.querySelector('.cosmic-confirm-overlay');
        const dialog = modal.querySelector('.cosmic-confirm-dialog');
        
        // 顯示動畫
        setTimeout(() => {
            overlay.style.opacity = '1';
            dialog.style.transform = 'scale(1)';
        }, 10);
        
        // 綁定確認按鈕
        confirmBtn.addEventListener('click', function() {
            closeConfirmModal();
            confirmCallback();
        });
        
        // 綁定取消按鈕
        cancelBtn.addEventListener('click', function() {
            closeConfirmModal();
            if (typeof cancelCallback === 'function') {
                cancelCallback();
            }
        });
        
        // 點擊背景關閉
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) {
                closeConfirmModal();
                if (typeof cancelCallback === 'function') {
                    cancelCallback();
                }
            }
        });
        
        // 關閉對話框函數
        function closeConfirmModal() {
            overlay.style.opacity = '0';
            dialog.style.transform = 'scale(0.9)';
            setTimeout(() => {
                if (modal && modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
        
        // ESC 鍵關閉
        const escHandler = function(e) {
            if (e.key === 'Escape') {
                closeConfirmModal();
                if (typeof cancelCallback === 'function') {
                    cancelCallback();
                }
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
    } catch (error) {
        console.error('顯示確認對話框失敗:', error);
        // 降級到原生 confirm
        if (confirm(message)) {
            confirmCallback();
        } else if (typeof cancelCallback === 'function') {
            cancelCallback();
        }
    }
}

// 關閉模態對話框的輔助函數
function closeModal(modal) {
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
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
        '2026-01-01': '元旦',
        '2026-02-16': '除夕',
        '2026-02-17': '春節',
        '2026-02-18': '初二',
        '2026-02-19': '初三',
        '2026-02-20': '初四',
        '2026-02-21': '初五',
        '2026-02-22': '初六',
        '2026-02-27': '228補假',
        '2026-04-03': '兒童節補假',
        '2026-04-06': '清明補假',
        '2026-05-01': '勞動節',
        '2026-06-19': '端午節',
        '2026-09-25': '中秋節',
        '2026-09-28': '教師節',
        '2026-10-09': '國慶補假',
        '2026-10-26': '台灣光復節補假',
        '2026-12-25': '行憲紀念日'

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
    
    // 獲取星期標題行
    const headerRow = document.querySelector('.fc-col-header');
    if (!headerRow) return;
    
    // 確保星期標題行沒有邊框
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
        cell.style.background = 'linear-gradient(145deg, rgba(70, 80, 120, 0.8), rgba(50, 60,  100, 0.8))';
        
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
    
    console.log('星期標頭白邊修復完成');
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
    console.log('月曆切換事件觸發');
    
    // 增加延遲，確保月曆完全渲染完成
    setTimeout(() => {
        console.log('開始處理月曆切換後的渲染');
        
        // 1. 修復樣式
        eliminateWeekdayBorders();
        enhanceCalendarButtons();
        
        // 2. 等待更長時間確保DOM完全穩定
        setTimeout(() => {
            console.log('重新渲染所有加班徽章');
            
            // 強制重新渲染所有加班徽章
            overtimeRecords.forEach(record => {
                renderOvertimeEventOnDate(record.date, record);
            });
            
            // 創建圖例
            createOvertimeLegend();
            
            console.log('月曆切換處理完成');
        }, 300);
        
    }, 500);
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

// 修復 getDayType 函數 - 正確處理字串陣列格式
function getDayType(dateStr) {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    
    // 檢查是否為國定假日 - 直接比較字串
    const isHoliday = holidays.includes(dateStr);
    
    if (isHoliday) {
        return 'holiday';
    }
    
    // 檢查是否為休息日（週六、週日）
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'restday';
    }
    
    // 工作日
    return 'workday';
}

// 獲取正確的工作類型顯示文字
function getDayTypeDisplay(dateStr) {
    const dayType = getDayType(dateStr);
    
    switch(dayType) {
        case 'workday':
            return '工作日';
        case 'restday':
            return '休息日';
        case 'holiday':
            return '國定假日';
        default:
            return '工作日';
    }
}
// 確保這些函數存在
function calculateHourlyRate() {
    const monthlySalary = parseFloat(document.getElementById('monthlySalary')?.value) || 30000;
    return Math.round(monthlySalary / 30 / 8);
}

function showToast(message, type = 'info') {
    console.log(`Toast: ${message} (${type})`);
    // 這裡可以添加實際的提示功能
}

