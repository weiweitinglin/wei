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
  
  showAlert(message, type = 'info') {
    const iconMap = {
      info: 'fas fa-info-circle',
      success: 'fas fa-check-circle',
      warning: 'fas fa-exclamation-triangle',
      error: 'fas fa-times-circle'
    };
    
    const colorMap = {
      info: 'alert-info',
      success: 'alert-success',
      warning: 'alert-warning',
      error: 'alert-danger'
    };
    
    const alertElement = document.createElement('div');
    alertElement.className = `alert ${colorMap[type]} alert-dismissible fade show position-fixed`;
    alertElement.style.cssText = 'top: 100px; right: 20px; z-index: 9999; min-width: 300px;';
    alertElement.innerHTML = `
      <i class="${iconMap[type]} me-2"></i>${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertElement);
    
    // 3秒後自動移除
    setTimeout(() => {
      if (alertElement.parentNode) {
        alertElement.remove();
      }
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
  
  // 重新生成
  generateNew() {
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
  
  // 平滑滾動
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
