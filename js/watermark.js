document.addEventListener('DOMContentLoaded', function() {
    // 確保showToast函數存在的容錯機制
    if (typeof showToast !== 'function') {
        window.showToast = function(message, type = 'info') {
            console.log(`[${type.toUpperCase()}] ${message}`);
            alert(message); // 降級方案
        };
    }
    
    // 獲取DOM元素
    const watermarkInput = document.getElementById('watermarkInput');
    const imagesInput = document.getElementById('imagesInput');
    const watermarkPreview = document.getElementById('watermarkPreview');
    const imagesPreview = document.getElementById('imagesPreview');
    const previewBtn = document.getElementById('previewBtn');
    const processBtn = document.getElementById('processBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const previewImage = document.getElementById('previewImage');
    const resultGallery = document.getElementById('resultGallery');
    
    // 進度指示器和成功動畫元素
    const processingOverlay = document.getElementById('processingOverlay');
    const successAnimation = document.getElementById('successAnimation');
    
    // 檢查關鍵DOM元素是否存在
    if (!watermarkInput || !imagesInput) {
        console.error('❌ 關鍵DOM元素不存在');
        showToast('頁面載入錯誤，請重新整理', 'error');
        return;
    }
    
    // 位置按鈕設定
    const positionBtns = document.querySelectorAll('.position-btn');
    
    // 大小設定
    const watermarkWidth = document.getElementById('watermarkWidth');
    const watermarkHeight = document.getElementById('watermarkHeight');
    const maintainAspect = document.getElementById('maintainAspect');
    
    // 透明度設定
    const opacityRange = document.getElementById('opacityRange');
    const opacityValue = document.getElementById('opacityValue');
    
    // 輸出格式設定
    const outputFormat = document.getElementById('outputFormat');
    const jpegQuality = document.getElementById('jpegQuality');
    const qualityValue = document.getElementById('qualityValue');
    const jpegQualityContainer = document.getElementById('jpegQualityContainer');
    
    // 狀態變數
    let watermarkImage = null;
    let imagesToProcess = [];
    let selectedPosition = 'center'; // 預設位置
    let processedImages = [];
    
    // 綁定上傳區域的點擊事件（可選元素，如果不存在則跳過）
    const watermarkUploadBtn = document.getElementById('watermarkUpload');
    const imagesUploadBtn = document.getElementById('imagesUpload');
    
    if (watermarkUploadBtn && watermarkInput) {
        watermarkUploadBtn.addEventListener('click', function() {
            watermarkInput.click();
        });
    }
    
    if (imagesUploadBtn && imagesInput) {
        imagesUploadBtn.addEventListener('click', function() {
            imagesInput.click();
        });
    }
    
    // 監聽浮水印圖片上傳（如果元素存在）
    if (watermarkInput) {
        watermarkInput.addEventListener('change', function(e) {
            if (this.files.length === 0) return;
            
            const file = this.files[0];
            if (!file.type.match('image.*')) {
                showToast('請上傳圖片文件', 'error');
                return;
            }
            
            // 顯示上傳進度
            showProcessing('正在上傳浮水印...', '正在處理您上傳的浮水印圖片');
            
            const reader = new FileReader();
            reader.onload = function(e) {
                // 預加載圖片以獲取尺寸
                const img = new Image();
                img.onload = function() {
                    watermarkImage = {
                        element: img,
                        width: img.width,
                        height: img.height,
                        aspectRatio: img.width / img.height
                    };
                    
                    if (watermarkWidth) watermarkWidth.value = watermarkImage.width;
                    if (watermarkHeight) watermarkHeight.value = watermarkImage.height;
                    
                    hideProcessing();
                    showToast('浮水印圖片上傳成功！', 'success');
                    updateButtonStates();
                };
                img.src = e.target.result;
                
                // 顯示預覽
                if (watermarkPreview) {
                    watermarkPreview.innerHTML = `<img src="${e.target.result}" alt="浮水印預覽" style="max-width: 100%; height: auto; border-radius: 8px;">`;
                }
            };
            reader.readAsDataURL(file);
        });
    }
    
    // 監聽待處理圖片上傳
    if (imagesInput) {
        imagesInput.addEventListener('change', function(e) {
            if (this.files.length === 0) return;
            
            // 顯示上傳進度
            showProcessing(`正在上傳 ${this.files.length} 張圖片...`, '正在處理您上傳的圖片，請稍候');
            
            if (imagesPreview) {
                imagesPreview.innerHTML = ''; // 清空預覽區域
            }
            imagesToProcess = [];
            
            // 處理上傳的每一張圖片
            const totalFiles = this.files.length;
            let loadedFiles = 0;
            
            Array.from(this.files).forEach(file => {
                if (!file.type.match('image.*')) {
                    loadedFiles++;
                    if (loadedFiles === totalFiles) {
                        hideProcessing();
                        showToast(`成功載入 ${imagesToProcess.length} 張圖片！`, 'success');
                        updateButtonStates();
                    }
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    // 預加載圖片
                    const img = new Image();
                    img.onload = function() {
                        imagesToProcess.push({
                            element: img,
                            file: file,
                            name: file.name,
                            width: img.width,
                            height: img.height
                        });
                        
                        loadedFiles++;
                        if (loadedFiles === totalFiles) {
                            hideProcessing();
                            showToast(`成功載入 ${imagesToProcess.length} 張圖片！`, 'success');
                            updateButtonStates();
                        }
                    };
                    img.src = e.target.result;
                    
                    // 添加到預覽畫廊
                    if (imagesPreview) {
                        const imgElement = document.createElement('img');
                        imgElement.src = e.target.result;
                        imgElement.alt = file.name;
                        imgElement.style.cssText = 'max-width: 100px; height: auto; margin: 5px; border-radius: 8px; border: 2px solid rgba(66, 245, 230, 0.3);';
                        imagesPreview.appendChild(imgElement);
                    }
                };
                reader.readAsDataURL(file);
            });
        });
    }
    
    // 位置選擇按鈕
    if (positionBtns.length > 0) {
        positionBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                positionBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                selectedPosition = this.dataset.position;
                
                // 添加按鈕按下效果
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 200);
                
                if (watermarkImage && imagesToProcess.length > 0) {
                    updatePreview();
                }
            });
        });
    }
    
    // 設定默認位置按鈕為活動狀態
    const defaultPositionBtn = document.getElementById('defaultPosition');
    if (defaultPositionBtn) {
        defaultPositionBtn.classList.add('active');
    }
    
    // 維持比例事件
    let originalAspectRatio = 1;
    
    if (watermarkWidth) {
        watermarkWidth.addEventListener('input', function() {
            if (maintainAspect && maintainAspect.checked && watermarkImage) {
                if (watermarkHeight) {
                    watermarkHeight.value = Math.round(parseInt(this.value) / watermarkImage.aspectRatio);
                }
            }
            updatePreview();
        });
    }
    
    if (watermarkHeight) {
        watermarkHeight.addEventListener('input', function() {
            if (maintainAspect && maintainAspect.checked && watermarkImage) {
                if (watermarkWidth) {
                    watermarkWidth.value = Math.round(parseInt(this.value) * watermarkImage.aspectRatio);
                }
            }
            updatePreview();
        });
    }
    
    // 透明度滑塊
    if (opacityRange && opacityValue) {
        opacityRange.addEventListener('input', function() {
            opacityValue.textContent = this.value + '%';
            updateRangeBackground(this);
            updatePreview();
        });
    }
    
    // 品質滑塊
    if (jpegQuality && qualityValue) {
        jpegQuality.addEventListener('input', function() {
            qualityValue.textContent = this.value + '%';
            updateRangeBackground(this);
        });
    }
    
    // 輸出格式變更
    if (outputFormat && jpegQualityContainer) {
        outputFormat.addEventListener('change', function() {
            jpegQualityContainer.style.display = this.value === 'jpeg' ? 'block' : 'none';
        });
    }
    
    // 預覽按鈕事件
    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            // 添加按鈕點擊動畫效果
            addEnhancedButtonEffect(this);
            updatePreview();
        });
    }
    
    // 處理按鈕事件
    if (processBtn) {
        processBtn.addEventListener('click', function() {
            addEnhancedButtonEffect(this);
            processImages();
        });
    }
    
    // 下載按鈕事件
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            addEnhancedButtonEffect(this);
            
            // 如果只有一張圖片，直接下載
            if (processedImages.length === 1) {
                downloadImage(processedImages[0].dataUrl, processedImages[0].filename);
                return;
            }
            
            // 如果有多張圖片，使用JSZip打包下載
            if (processedImages.length > 1) {
                showToast('正在準備下載...', 'info');
                
                // 動態加載JSZip庫
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
                script.onload = function() {
                    createZipAndDownload();
                };
                script.onerror = function() {
                    showToast('下載庫載入失敗，請重試', 'error');
                };
                document.head.appendChild(script);
            }
        });
    }
    
    // 顯示處理進度
    function showProcessing(text = '正在處理圖片...', details = '請稍候，星際處理系統正在為您的圖片添加浮水印') {
        if (processingOverlay) {
            const textElement = processingOverlay.querySelector('.processing-text');
            const detailsElement = processingOverlay.querySelector('.processing-details');
            
            if (textElement) textElement.textContent = text;
            if (detailsElement) detailsElement.textContent = details;
            
            processingOverlay.classList.add('active');
        }
    }
    
    // 隱藏處理進度
    function hideProcessing() {
        if (processingOverlay) {
            processingOverlay.classList.remove('active');
        }
    }
    
    // 顯示成功動畫
    function showSuccessAnimation(title = '處理完成！', subtitle = '您的圖片已成功添加浮水印') {
        if (successAnimation) {
            const titleElement = successAnimation.querySelector('.success-title');
            const subtitleElement = successAnimation.querySelector('.success-subtitle');
            
            if (titleElement) titleElement.textContent = title;
            if (subtitleElement) subtitleElement.textContent = subtitle;
            
            successAnimation.style.display = 'flex';
            
            // 3秒後自動隱藏
            setTimeout(() => {
                successAnimation.style.display = 'none';
            }, 3000);
        }
    }
    
    // 更新滑動條背景
    function updateRangeBackground(range) {
        if (!range) return;
        const value = ((range.value - range.min) / (range.max - range.min)) * 100;
        range.style.setProperty('--value', value + '%');
    }
    
    // 初始化滑動條背景
    if (opacityRange) {
        updateRangeBackground(opacityRange);
    }
    if (jpegQuality) {
        updateRangeBackground(jpegQuality);
    }
    
    // 更新預覽
    function updatePreview() {
        if (!watermarkImage || imagesToProcess.length === 0) {
            previewImage.innerHTML = '<p>請上傳浮水印和至少一張圖片</p>';
            return;
        }
        
        const imageToPreview = imagesToProcess[0]; // 使用第一張圖片預覽
        
        const canvas = document.createElement('canvas');
        canvas.width = imageToPreview.width;
        canvas.height = imageToPreview.height;
        
        const ctx = canvas.getContext('2d');
        
        // 繪製原始圖片
        ctx.drawImage(imageToPreview.element, 0, 0);
        
        // 取得浮水印尺寸
        const width = parseInt(watermarkWidth.value) || watermarkImage.width;
        const height = parseInt(watermarkHeight.value) || watermarkImage.height;
        
        // 取得浮水印位置
        let x, y;
        switch (selectedPosition) {
            case 'top-left':
                x = 20;
                y = 20;
                break;
            case 'top-right':
                x = imageToPreview.width - width - 20;
                y = 20;
                break;
            case 'center':
                x = (imageToPreview.width - width) / 2;
                y = (imageToPreview.height - height) / 2;
                break;
            case 'bottom-left':
                x = 20;
                y = imageToPreview.height - height - 20;
                break;
            case 'bottom-right':
                x = imageToPreview.width - width - 20;
                y = imageToPreview.height - height - 20;
                break;
            default:
                x = (imageToPreview.width - width) / 2;
                y = (imageToPreview.height - height) / 2;
        }
        
        // 設定透明度
        const opacity = parseInt(opacityRange.value) / 100;
        ctx.globalAlpha = opacity;
        
        // 繪製浮水印
        ctx.drawImage(watermarkImage.element, x, y, width, height);
        
        // 恢復透明度
        ctx.globalAlpha = 1.0;
        
        // 顯示預覽
        previewImage.innerHTML = '';
        previewImage.appendChild(canvas);
        
        // 添加預覽動畫效果
        canvas.style.opacity = '0';
        canvas.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            canvas.style.transition = 'all 0.3s ease';
            canvas.style.opacity = '1';
            canvas.style.transform = 'scale(1)';
        }, 10);
    }
    
    // 處理所有圖片
    function processImages() {
        if (!watermarkImage || imagesToProcess.length === 0) return;
        
        // 顯示處理進度
        showProcessing('正在處理圖片...', `準備處理 ${imagesToProcess.length} 張圖片`);
        
        processedImages = [];
        if (resultGallery) {
            resultGallery.innerHTML = '';
        }
        
        // 獲取浮水印設定
        const width = parseInt(watermarkWidth?.value) || (watermarkImage.width || 200);
        const height = parseInt(watermarkHeight?.value) || (watermarkImage.height || 200);
        const opacity = parseInt(opacityRange?.value || 50) / 100;
        
        // 處理每張圖片
        let processedCount = 0;
        const totalImages = imagesToProcess.length;
        
        imagesToProcess.forEach((image, index) => {
            // 使用setTimeout來非阻塞處理，讓UI能夠更新
            setTimeout(() => {
                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                
                const ctx = canvas.getContext('2d');
                
                // 繪製原始圖片
                ctx.drawImage(image.element, 0, 0);
                
                // 取得浮水印位置
                let x, y;
                switch (selectedPosition) {
                    case 'top-left':
                        x = 20;
                        y = 20;
                        break;
                    case 'top-right':
                        x = image.width - width - 20;
                        y = 20;
                        break;
                    case 'center':
                        x = (image.width - width) / 2;
                        y = (image.height - height) / 2;
                        break;
                    case 'bottom-left':
                        x = 20;
                        y = image.height - height - 20;
                        break;
                    case 'bottom-right':
                        x = image.width - width - 20;
                        y = image.height - height - 20;
                        break;
                    default:
                        x = (image.width - width) / 2;
                        y = (image.height - height) / 2;
                }
                
                // 設定透明度
                ctx.globalAlpha = opacity;
                
                // 繪製浮水印
                ctx.drawImage(watermarkImage.element, x, y, width, height);
                
                // 恢復透明度
                ctx.globalAlpha = 1.0;
                
                // 轉換為DataURL
                const format = outputFormat.value;
                let dataUrl;
                
                if (format === 'jpeg') {
                    const quality = parseInt(jpegQuality.value) / 100;
                    dataUrl = canvas.toDataURL('image/jpeg', quality);
                } else {
                    dataUrl = canvas.toDataURL('image/png');
                }
                
                // 處理檔案名稱
                let filename = image.name;
                const dotIndex = filename.lastIndexOf('.');
                if (dotIndex > -1) {
                    filename = filename.substring(0, dotIndex) + '_watermark.' + (format === 'jpeg' ? 'jpg' : 'png');
                } else {
                    filename = filename + '_watermark.' + (format === 'jpeg' ? 'jpg' : 'png');
                }
                
                // 保存處理結果
                processedImages.push({
                    dataUrl: dataUrl,
                    filename: filename
                });
                
                // 添加到結果畫廊
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                
                const resultImg = document.createElement('img');
                resultImg.src = dataUrl;
                resultImg.alt = filename;
                
                const actions = document.createElement('div');
                actions.className = 'item-actions';
                
                const downloadButton = document.createElement('button');
                downloadButton.className = 'download-btn';
                downloadButton.innerHTML = '<i class="fas fa-download me-2"></i>下載';
                downloadButton.addEventListener('click', function() {
                    downloadImage(dataUrl, filename);
                });
                
                actions.appendChild(downloadButton);
                resultItem.appendChild(resultImg);
                resultItem.appendChild(actions);
                
                resultGallery.appendChild(resultItem);
                
                // 添加淡入動畫效果
                resultItem.style.opacity = '0';
                resultItem.style.transform = 'translateY(20px)';
                
                setTimeout(() => {
                    resultItem.style.transition = 'all 0.3s ease';
                    resultItem.style.opacity = '1';
                    resultItem.style.transform = 'translateY(0)';
                }, 100 * (processedCount % 10)); // 錯開動畫時間
                
                processedCount++;
                
                // 當所有圖片都處理完成時
                if (processedCount === totalImages) {
                    hideProcessing();
                    showSuccessAnimation(`成功處理 ${totalImages} 張圖片！`, '所有圖片已成功添加浮水印');
                    if (downloadBtn) downloadBtn.disabled = false;
                    
                    // 顯示結果區域
                    const resultSection = document.getElementById('resultSection');
                    if (resultSection) {
                        resultSection.style.display = 'block';
                        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    
                    showToast(`成功處理 ${totalImages} 張圖片！`, 'success');
                    
                    // 平滑滾動到結果區域
                    setTimeout(() => {
                        if (resultGallery) {
                            resultGallery.scrollIntoView({behavior: 'smooth'});
                        }
                    }, 500);
                }
            }, index * 100); // 錯開處理時間，讓UI可以更新
        });
    }
    
    // 下載單個圖片
    function downloadImage(dataUrl, filename) {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast(`圖片 ${filename} 下載中...`, 'success');
    }
    
    // 打包下載所有圖片
    function createZipAndDownload() {
        const zip = new JSZip();
        let count = 0;
        
        processedImages.forEach((image, index) => {
            // 從 Data URL 中提取 Base64 數據
            const base64Data = image.dataUrl.split(',')[1];
            zip.file(image.filename, base64Data, {base64: true});
            count++;
            
            if (count === processedImages.length) {
                zip.generateAsync({type: 'blob'})
                    .then(function(content) {
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(content);
                        link.download = 'watermarked_images.zip';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        showToast('所有圖片已打包下載！', 'success');
                    });
            }
        });
    }
    
    // 更新按鈕狀態
    function updateButtonStates() {
        const canPreview = watermarkImage && imagesToProcess.length > 0;
        previewBtn.disabled = !canPreview;
        processBtn.disabled = !canPreview;
        
        if (canPreview) {
            updatePreview();
        }
    }
    
    // 按鈕點擊效果
    function addButtonClickEffect(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 200);
    }

    // 增強的按鈕點擊效果
    function addEnhancedButtonEffect(button) {
        if (!button) return;
        
        // 創建波紋效果
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.6)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s linear';
        ripple.style.pointerEvents = 'none';
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.transform = 'translate(-50%, -50%) scale(0)';
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        // 添加按鈕縮放效果
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
        
        // 清理波紋效果
        setTimeout(() => {
            if (ripple.parentNode) {
                ripple.parentNode.removeChild(ripple);
            }
        }, 600);
    }

    // 添加波紋動畫樣式
    if (!document.getElementById('rippleStyles')) {
        const style = document.createElement('style');
        style.id = 'rippleStyles';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: translate(-50%, -50%) scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
});  // 結束 DOMContentLoaded