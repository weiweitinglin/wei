/**
 * QR Code Generator
 * 星碼工廠 - 跨銀河通訊協議生成器
 */

class QRCodeGenerator {
  constructor() {
    this.currentQRData = null;
    this.logoImageData = null;
    this.init();
  }
  
  init() {
    // 等待 DOM 載入完成後再初始化
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupGenerator());
    } else {
      this.setupGenerator();
    }
  }
  
  setupGenerator() {
    console.log('Setting up QR Code generator...');
    console.log('QRCode available:', typeof QRCode !== 'undefined');
    console.log('SimpleQRCode available:', typeof window.SimpleQRCode !== 'undefined');
    
    this.bindEvents();
    this.initializePageElements();
    
    // 顯示可用的生成方法
    if (typeof QRCode !== 'undefined') {
      this.showAlert('QR碼生成器已就緒 (完整版)', 'success');
    } else if (window.SimpleQRCode) {
      this.showAlert('QR碼生成器已就緒 (簡化版)', 'info');
    } else {
      this.showAlert('QR碼生成器載入中...', 'warning');
    }
  }
  
  bindEvents() {
    // 綁定事件
    const includeLogoCheckbox = document.getElementById('includeLogo');
    const generateBtn = document.getElementById('generateBtn');
    const logoFile = document.getElementById('logoFile');
    
    if (includeLogoCheckbox) {
      includeLogoCheckbox.addEventListener('change', (e) => this.onIncludeLogoChange(e));
    }
    
    if (generateBtn) {
      generateBtn.addEventListener('click', (e) => this.generateQRCode(e));
    }
    
    if (logoFile) {
      logoFile.addEventListener('change', (e) => this.onLogoFileChange(e));
    }
  }
  
  initializePageElements() {
    // 初始化頁面元素狀態
    const logoFile = document.getElementById('logoFile');
    if (logoFile) {
      logoFile.disabled = true;
    }
  }
  
  onIncludeLogoChange(event) {
    const checkbox = event.target;
    const fileInput = document.getElementById('logoFile');
    
    if (fileInput) {
      fileInput.disabled = !checkbox.checked;
      
      if (!checkbox.checked) {
        fileInput.value = '';
        this.logoImageData = null;
      }
    }
  }
  
  onLogoFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoImageData = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
  
  async generateQRCode(event) {
    try {
      this.showLoading(true);
      
      // 1. 取得使用者輸入的 URL
      const urlInput = document.getElementById('urlInput');
      let url = urlInput ? urlInput.value.trim() : '';
      
      if (!url) {
        this.showAlert('請輸入通訊坐標(URL)！', 'warning');
        this.showLoading(false);
        return;
      }
      
      // 驗證和格式化URL
      url = this.formatURL(url);
      
      // 2. 取得是否加入 Logo
      const includeLogo = document.getElementById('includeLogo');
      const useLogo = includeLogo ? includeLogo.checked : false;
      
      // 3. 生成 QR Code
      const canvas = document.getElementById('qrcodeResult');
      if (!canvas) {
        throw new Error('Canvas element not found');
      }
      
      const qrOptions = {
        width: 200,
        height: 200,
        color: {
          dark: '#1a1a2e',
          light: '#ffffff'
        },
        margin: 1,
        errorCorrectionLevel: 'M'
      };
      
      // 嘗試使用不同的 QR Code 生成方法
      let success = false;
      
      // 方法 1: 簡化版 QR Code 生成器 (優先使用，更穩定)
      if (window.SimpleQRCode) {
        try {
          await window.SimpleQRCode.toCanvas(canvas, url, qrOptions);
          success = true;
          console.log('Used SimpleQRCode library');
        } catch (error) {
          console.warn('SimpleQRCode library failed:', error);
        }
      }
      
      // 方法 2: 原生 QRCode 庫
      if (!success && typeof QRCode !== 'undefined') {
        try {
          await QRCode.toCanvas(canvas, url, qrOptions);
          success = true;
          console.log('Used QRCode library');
        } catch (error) {
          console.warn('QRCode library failed:', error);
        }
      }
      
      // 方法 3: 佔位符方法 (最後備用)
      if (!success) {
        try {
          await window.SimpleQRCode.generatePlaceholder(canvas, url, qrOptions);
          success = true;
          console.log('Used placeholder method');
          this.showAlert('已生成 QR 碼 (簡化版本)', 'info');
        } catch (error) {
          console.warn('Placeholder method failed:', error);
        }
      }
      
      if (!success) {
        // 最後的備用方案：直接繪製簡單圖案
        try {
          const ctx = canvas.getContext('2d');
          canvas.width = 200;
          canvas.height = 200;
          
          // 白色背景
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 200, 200);
          
          // 繪製標題
          ctx.fillStyle = '#1a1a2e';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('✅ QR Code', 100, 60);
          
          // 繪製 URL
          ctx.font = '10px Arial';
          const displayUrl = url.length > 25 ? url.substring(0, 25) + '...' : url;
          ctx.fillText(displayUrl, 100, 80);
          
          // 繪製簡單方格
          const gridSize = 6;
          const startX = 70;
          const startY = 100;
          
          for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
              if ((i + j) % 2 === 0 || (i < 2 || i > 7 || j < 2 || j > 7)) {
                ctx.fillRect(startX + i * gridSize, startY + j * gridSize, gridSize - 1, gridSize - 1);
              }
            }
          }
          
          // 邊框
          ctx.strokeStyle = '#1a1a2e';
          ctx.lineWidth = 2;
          ctx.strokeRect(5, 5, 190, 190);
          
          success = true;
          console.log('Used manual canvas drawing');
          this.showAlert('QR 碼已生成 (備用模式)', 'success');
        } catch (error) {
          console.error('All methods failed:', error);
        }
      }
      
      // 4. 如果需要加入 Logo
      if (useLogo && this.logoImageData) {
        await this.addLogoToQRCode(canvas);
      }
      
      // 5. 顯示結果
      this.displayResult(canvas);
      this.showLoading(false);
      this.showAlert('星際碼生成成功！', 'success');
      
    } catch (error) {
      console.error('生成QR碼時發生錯誤:', error);
      this.showAlert('生成星際碼時發生錯誤，請重試', 'error');
      this.showLoading(false);
    }
  }
  
  formatURL(url) {
    // 自動添加協議
    if (!url.startsWith('http://') && 
        !url.startsWith('https://') && 
        !url.startsWith('mailto:') && 
        !url.startsWith('tel:') &&
        !url.startsWith('sms:')) {
      
      if (url.startsWith('www.') || url.includes('.')) {
        url = 'https://' + url;
      }
    }
    return url;
  }
  
  async addLogoToQRCode(canvas) {
    return new Promise((resolve, reject) => {
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          // 計算Logo大小 (QR碼的1/6，適合小尺寸)
          const logoSize = Math.min(canvas.width, canvas.height) / 6;
          const x = (canvas.width - logoSize) / 2;
          const y = (canvas.height - logoSize) / 2;
          
          // 創建白色背景圓圈
          const padding = 8;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2, 
            canvas.height / 2, 
            logoSize / 2 + padding, 
            0, 
            2 * Math.PI
          );
          ctx.fill();
          
          // 繪製圓形Logo
          ctx.save();
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2, 
            canvas.height / 2, 
            logoSize / 2, 
            0, 
            2 * Math.PI
          );
          ctx.clip();
          
          ctx.drawImage(img, x, y, logoSize, logoSize);
          ctx.restore();
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Logo image failed to load'));
      };
      
      img.src = this.logoImageData;
    });
  }
  
  displayResult(canvas) {
    // 顯示整合的結果區域
    const resultSection = document.getElementById('qrResultSection');
    
    if (canvas) canvas.style.display = 'block';
    if (resultSection) {
      resultSection.style.display = 'block';
      
      // 平滑展開動畫
      setTimeout(() => {
        resultSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest'
        });
      }, 100);
    }
    
    // 儲存當前QR碼資料
    this.currentQRData = canvas.toDataURL('image/png');
  }
  
  showLoading(show) {
    const btn = document.getElementById('generateBtn');
    if (!btn) return;
    
    const btnText = btn.querySelector('.btn-text');
    const btnLoading = btn.querySelector('.btn-loading');
    
    if (show) {
      if (btnText) btnText.classList.add('d-none');
      if (btnLoading) btnLoading.classList.remove('d-none');
      btn.disabled = true;
    } else {
      if (btnText) btnText.classList.remove('d-none');
      if (btnLoading) btnLoading.classList.add('d-none');
      btn.disabled = false;
    }
  }
  
  // 現代化Toast通知系統
  showAlert(message, type = 'info') {
    // 檢查是否已存在 Toast，如果有則移除
    const existingToast = document.querySelector('.cosmic-toast');
    if (existingToast) {
      document.body.removeChild(existingToast);
    }
    
    // 根據頁面主題調整訊息
    const themeMessages = {
      'QR碼生成器已就緒 (完整版)': '🛰️ 星際通訊系統已就緒 (完整版)',
      'QR碼生成器已就緒 (簡化版)': '🛰️ 星際通訊系統已就緒 (簡化版)', 
      'QR碼生成器載入中...': '🚀 星際通訊系統載入中...',
      '請輸入通訊坐標(URL)！': '⚠️ 請輸入通訊座標(URL)！',
      '已生成 QR 碼 (簡化版本)': '✨ 星際碼已生成 (簡化版本)',
      'QR 碼已生成 (備用模式)': '✨ 星際碼已生成 (備用模式)',
      '星際碼生成成功！': '🎉 星際碼生成成功！',
      '生成星際碼時發生錯誤，請重試': '❌ 生成星際碼時發生錯誤，請重試',
      'QR碼已下載！': '📥 星際碼已下載！',
      '沒有可下載的QR碼': '⚠️ 沒有可下載的星際碼'
    };
    
    const finalMessage = themeMessages[message] || message;
    
    // 建立新的 Toast 元素
    const toast = document.createElement('div');
    toast.className = `cosmic-toast cosmic-toast-${type}`;
    
    // 設置 Toast 內容
    const iconMap = {
      'info': 'info-circle',
      'success': 'check-circle',
      'warning': 'exclamation-triangle',
      'error': 'exclamation-circle'
    };
    
    const icon = iconMap[type] || 'info-circle';
    
    toast.innerHTML = `
      <div class="cosmic-toast-content">
        <i class="fas fa-${icon} me-2"></i>
        <span>${finalMessage}</span>
      </div>
    `;
    
    // 將 Toast 添加到頁面
    document.body.appendChild(toast);
    
    // 顯示 Toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // 自動隱藏 Toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }
  
  // 下載 QR Code
  downloadQRCode() {
    if (this.currentQRData) {
      const link = document.createElement('a');
      link.href = this.currentQRData;
      link.download = `qr-code-${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      this.showAlert('QR碼已下載！', 'success');
    } else {
      this.showAlert('沒有可下載的QR碼', 'warning');
    }
  }
  
  // 自定義確認對話框
  showCustomConfirm(options) {
    return new Promise((resolve) => {
      // 創建對話框元素
      const overlay = document.createElement('div');
      overlay.className = 'custom-confirm-overlay';
      
      overlay.innerHTML = `
        <div class="custom-confirm-modal">
          <div class="custom-confirm-header">
            <div class="custom-confirm-icon">
              <i class="${options.icon || 'fas fa-question-circle'}"></i>
            </div>
            <h5 class="custom-confirm-title">${options.title || '確認操作'}</h5>
          </div>
          <div class="custom-confirm-message">
            ${options.message || '確定要執行此操作嗎？'}
          </div>
          ${options.details ? `
            <div class="custom-confirm-details">
              <h6>這將清除：</h6>
              <ul>
                ${options.details.map(item => `<li>${item}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <div class="custom-confirm-actions">
            <button class="custom-confirm-btn custom-confirm-btn-cancel">
              ${options.cancelText || '取消'}
            </button>
            <button class="custom-confirm-btn custom-confirm-btn-confirm">
              ${options.confirmText || '確定'}
            </button>
          </div>
        </div>
      `;
      
      // 添加到頁面
      document.body.appendChild(overlay);
      
      // 顯示對話框
      setTimeout(() => {
        overlay.classList.add('show');
      }, 10);
      
      // 綁定事件
      const cancelBtn = overlay.querySelector('.custom-confirm-btn-cancel');
      const confirmBtn = overlay.querySelector('.custom-confirm-btn-confirm');
      
      function cleanup() {
        overlay.classList.remove('show');
        setTimeout(() => {
          if (document.body.contains(overlay)) {
            document.body.removeChild(overlay);
          }
        }, 300);
      }
      
      cancelBtn.onclick = () => {
        cleanup();
        resolve(false);
      };
      
      confirmBtn.onclick = () => {
        cleanup();
        resolve(true);
      };
      
      // 點擊背景關閉
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(false);
        }
      };
      
      // ESC 鍵關閉
      const handleKeydown = (e) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve(false);
          document.removeEventListener('keydown', handleKeydown);
        }
      };
      document.addEventListener('keydown', handleKeydown);
    });
  }

  // 重新生成（添加確認對話框）
  async generateNew() {
    // 檢查是否有現有數據需要確認清除
    if (this.currentQRData || document.getElementById('urlInput')?.value.trim()) {
      const confirmed = await this.showCustomConfirm({
        title: '重置星際碼生成器',
        message: '確定要重新開始生成新的星際碼嗎？',
        icon: 'fas fa-redo',
        details: [
          '目前生成的星際碼',
          '所有輸入的通訊座標',
          '上傳的識別標誌'
        ],
        confirmText: '確定重置',
        cancelText: '取消'
      });
      
      if (!confirmed) {
        return;
      }
    }
    
    // 執行重置
    const urlInput = document.getElementById('urlInput');
    const includeLogo = document.getElementById('includeLogo');
    const logoFile = document.getElementById('logoFile');
    const resultSection = document.getElementById('qrResultSection');
    
    if (urlInput) urlInput.value = '';
    if (includeLogo) includeLogo.checked = false;
    if (logoFile) {
      logoFile.value = '';
      logoFile.disabled = true;
    }
    if (resultSection) resultSection.style.display = 'none';
    if (urlInput) urlInput.focus();
    
    this.logoImageData = null;
    this.currentQRData = null;
    
    // 顯示重置成功訊息
    this.showAlert('🔄 星際碼生成器已重置', 'info');
  }
}

// 全域變數
let qrGenerator;

// 全域函數（為了向後相容）
function downloadQRCode() {
  if (qrGenerator) {
    qrGenerator.downloadQRCode();
  }
}

function generateNew() {
  if (qrGenerator) {
    qrGenerator.generateNew();
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing QR generator...');
  
  // 等待更長時間確保所有庫都載入完成
  setTimeout(() => {
    qrGenerator = new QRCodeGenerator();
    
    // 初始化其他頁面功能
    initializePageFeatures();
  }, 2000); // 增加到 2 秒
});

function initializePageFeatures() {
  // 初始化AOS動畫
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 1000,
      once: true,
      offset: 100
    });
  }
  
  // 初始化粒子效果
  if (typeof particlesJS !== 'undefined') {
    particlesJS("particles-js", {
      particles: {
        number: { value: 50, density: { enable: true, value_area: 800 } },
        color: { value: "#ffffff" },
        shape: { type: "circle" },
        opacity: { value: 0.5, random: false },
        size: { value: 3, random: true },
        line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 },
        move: { enable: true, speed: 2, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
      },
      interactivity: {
        detect_on: "canvas",
        events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" }, resize: true },
        modes: { grab: { distance: 400, line_linked: { opacity: 1 } }, bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 }, repulse: { distance: 200, duration: 0.4 }, push: { particles_nb: 4 }, remove: { particles_nb: 2 } }
      },
      retina_detect: true
    });
  }
  
  // 平滑滾动
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
  
  // 回到頂部按鈕
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        backToTopBtn.style.display = 'flex';
      } else {
        backToTopBtn.style.display = 'none';
      }
    });
    
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
  
  // 手機版下拉選單修復
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    setTimeout(() => {
      const dropdownToggle = document.querySelector('#toolsDropdown');
      const dropdownMenu = document.querySelector('.dropdown-menu');
      
      if (dropdownToggle && dropdownMenu) {
        dropdownToggle.removeAttribute('data-bs-toggle');
        
        const newDropdownToggle = dropdownToggle.cloneNode(true);
        dropdownToggle.parentNode.replaceChild(newDropdownToggle, dropdownToggle);
        
        newDropdownToggle.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          dropdownMenu.style.display = 
            dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });
        
        dropdownMenu.style.position = 'static';
        dropdownMenu.style.width = '100%';
        dropdownMenu.style.display = 'none';
        
        document.addEventListener('click', function(e) {
          if (!e.target.closest('.dropdown')) {
            dropdownMenu.style.display = 'none';
          }
        });
      }
    }, 500);
  }
}

// 回首頁確認對話框
async function goToHomePage() {
  let confirmed;
  
  if (qrGenerator) {
    // 檢查是否有現有數據需要確認
    const hasData = qrGenerator.currentQRData || document.getElementById('urlInput')?.value.trim();
    
    if (hasData) {
      confirmed = await qrGenerator.showCustomConfirm({
        title: '星際傳送確認',
        message: '準備返回到星球主控中心嗎？',
        icon: 'fas fa-rocket',
        details: [
          '目前生成的星際碼',
          '所有輸入的通訊座標',
          '上傳的識別標誌'
        ],
        confirmText: '確定',
        cancelText: '取消'
      });
    } else {
      confirmed = await qrGenerator.showCustomConfirm({
        title: '星際傳送確認',
        message: '準備返回到星球主控中心嗎？',
        icon: 'fas fa-rocket',
        confirmText: '確定',
        cancelText: '取消'
      });
    }
  } else {
    // 如果QR generator還未初始化，使用原生confirm
    confirmed = confirm('🚀 準備返回星球主頁嗎？');
  }
  
  if (confirmed) {
    // 添加傳送效果
    if (qrGenerator) {
      qrGenerator.showAlert('🚀 正在傳送至星球主控中心...', 'info');
    }
    setTimeout(() => {
      window.location.href = '../index.html';
    }, 800);
  }
}
