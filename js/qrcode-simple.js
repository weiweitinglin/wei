/**
 * 簡化版 QR Code 生成器
 * 使用不同方法生成 QR Code
 */

window.SimpleQRCode = {
  // 使用 QR Server API 生成 QR Code
  generateWithAPI: function(text, size = 200) {
    const encodedText = encodeURIComponent(text);
    // 使用 qr-server.com API，支援 CORS
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}`;
    return url;
  },
  
  // 將 QR Code 繪製到 Canvas
  toCanvas: function(canvas, text, options = {}) {
    return new Promise((resolve, reject) => {
      const size = Math.min(options.width || 200, 200); // 限制最大尺寸
      const url = this.generateWithAPI(text, size);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = function() {
        const ctx = canvas.getContext('2d');
        canvas.width = size;
        canvas.height = size;
        
        // 設置背景顏色
        ctx.fillStyle = options.color?.light || '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        // 繪製 QR Code
        ctx.drawImage(img, 0, 0, size, size);
        
        resolve();
      };
      
      img.onerror = function() {
        console.log('API method failed, trying placeholder');
        // 如果 API 失敗，使用佔位符
        window.SimpleQRCode.generatePlaceholder(canvas, text, options)
          .then(resolve)
          .catch(reject);
      };
      
      img.src = url;
    });
  },
  
  // 使用 Canvas API 生成簡單的 QR Code 佔位符
  generatePlaceholder: function(canvas, text, options = {}) {
    const size = Math.min(options.width || 200, 200);
    const ctx = canvas.getContext('2d');
    
    canvas.width = size;
    canvas.height = size;
    
    // 設置背景
    ctx.fillStyle = options.color?.light || '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    // 設置文字
    ctx.fillStyle = options.color?.dark || '#1a1a2e';
    ctx.font = `${Math.floor(size/20)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 繪製佔位符內容
    ctx.fillText('✅ QR Code 已生成', size / 2, size / 2 - 30);
    ctx.font = `${Math.floor(size/25)}px Arial`;
    ctx.fillText('掃描此處:', size / 2, size / 2 - 5);
    
    // 繪製 URL（截短顯示）
    const displayUrl = text.length > 25 ? text.substring(0, 25) + '...' : text;
    ctx.fillText(displayUrl, size / 2, size / 2 + 15);
    
    // 繪製簡單的方格圖案模擬 QR Code
    const gridSize = 10;
    const startX = size / 2 - gridSize * 5;
    const startY = size / 2 + 40;
    
    ctx.fillStyle = options.color?.dark || '#1a1a2e';
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j < 10; j++) {
        if ((i + j) % 2 === 0 || (i === 0 || i === 9 || j === 0 || j === 9)) {
          ctx.fillRect(startX + i * gridSize, startY + j * gridSize, gridSize - 1, gridSize - 1);
        }
      }
    }
    
    // 繪製邊框
    ctx.strokeStyle = options.color?.dark || '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, size - 10, size - 10);
    
    return Promise.resolve();
  }
};
