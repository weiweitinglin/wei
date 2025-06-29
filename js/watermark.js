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
    
    // 結果操作按鈕
    const selectAllBtn = document.getElementById('selectAllBtn');
    const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
    const clearResultsBtn = document.getElementById('clearResultsBtn');
    
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
            
            // 更新狀態顯示
            updateWatermarkStatus('上傳中...', 'info');
            
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
                    
                    // 更新預覽區域
                    updateWatermarkPreview(img.src, file.name, file.size);
                    updateWatermarkStatus('已上傳', 'success');
                    
                    // 檢查是否可以啟用預覽
                    checkPreviewAvailability();
                    
                    showToast(`浮水印 "${file.name}" 上傳成功`, 'success');
                    updateButtonStates();
                };
                
                img.onerror = function() {
                    showToast('浮水印圖片載入失敗', 'error');
                    updateWatermarkStatus('載入失敗', 'error');
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = function() {
                showToast('文件讀取失敗', 'error');
                updateWatermarkStatus('讀取失敗', 'error');
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    // 監聽待處理圖片上傳
    if (imagesInput) {
        imagesInput.addEventListener('change', function(e) {
            if (this.files.length === 0) return;
            
            // 更新狀態
            updateImagesStatus('上傳中...', 0);
            
            imagesToProcess = [];
            
            // 處理上傳的每一張圖片
            const totalFiles = Math.min(this.files.length, 10); // 限制最多10張
            let loadedFiles = 0;
            
            Array.from(this.files).slice(0, 10).forEach((file, index) => {
                if (!file.type.match('image.*')) {
                    loadedFiles++;
                    if (loadedFiles === totalFiles) {
                        finishUploading();
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
                            finishUploading();
                        }
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
            
            function finishUploading() {
                updateImagesPreview(imagesToProcess.map(img => img.file));
                checkPreviewAvailability();
                showToast(`成功載入 ${imagesToProcess.length} 張圖片！`, 'success');
                updateButtonStates();
            }
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
    
    // 全選按鈕事件
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            addEnhancedButtonEffect(this);
            selectAllResults();
        });
    }
    
    // 下載選中按鈕事件
    if (downloadSelectedBtn) {
        downloadSelectedBtn.addEventListener('click', function() {
            addEnhancedButtonEffect(this);
            downloadSelectedResults();
        });
    }
    
    // 清空結果按鈕事件
    if (clearResultsBtn) {
        clearResultsBtn.addEventListener('click', function() {
            addEnhancedButtonEffect(this);
            clearResults();
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
                
                // 創建圖片標題
                const imageTitle = document.createElement('div');
                imageTitle.className = 'image-title';
                imageTitle.textContent = filename;
                
                // 創建圖片容器
                const imageContainer = document.createElement('div');
                imageContainer.className = 'image-container';
                
                const resultImg = document.createElement('img');
                resultImg.src = dataUrl;
                resultImg.alt = filename;
                
                // 將圖片放入容器
                imageContainer.appendChild(resultImg);
                
                const actions = document.createElement('div');
                actions.className = 'item-actions';
                
                const downloadButton = document.createElement('button');
                downloadButton.className = 'download-btn';
                downloadButton.innerHTML = '<i class="fas fa-download me-2"></i>下載';
                downloadButton.addEventListener('click', function() {
                    downloadImage(dataUrl, filename);
                });
                
                actions.appendChild(downloadButton);
                
                // 按順序添加元素到結果項目
                resultItem.appendChild(imageTitle);
                resultItem.appendChild(imageContainer);
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
                    
                    // 初始化結果選擇功能
                    setTimeout(() => {
                        initializeResultSelection();
                    }, 200);
                    
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

    // 美化預覽功能的輔助函數
    window.updateWatermarkStatus = function(text, type = 'info') {
        const statusElement = document.getElementById('watermarkStatus');
        if (statusElement) {
            const statusText = statusElement.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = text;
                statusText.className = `status-text status-${type}`;
            }
        }
    };

    window.updateImagesStatus = function(text, count = 0) {
        const statusElement = document.getElementById('imagesStatus');
        const countBadge = document.getElementById('imageCount');
        
        if (statusElement) {
            const statusText = statusElement.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = text;
            }
        }
        
        if (countBadge) {
            if (count > 0) {
                countBadge.textContent = count;
                countBadge.style.display = 'inline-block';
            } else {
                countBadge.style.display = 'none';
            }
        }
    };

    window.updateWatermarkPreview = function(imageSrc, fileName, fileSize) {
        const previewArea = document.getElementById('watermarkPreview');
        if (previewArea) {
            const formattedSize = formatFileSize(fileSize);
            previewArea.innerHTML = `
                <div class="image-preview-item">
                    <div class="preview-image-container">
                        <img src="${imageSrc}" alt="浮水印預覽" class="preview-image">
                        <div class="preview-overlay">
                            <div class="preview-info">
                                <div class="file-name">${fileName}</div>
                                <div class="file-size">${formattedSize}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    };

    window.updateImagesPreview = function(files) {
        const previewGallery = document.getElementById('imagesPreview');
        if (previewGallery && files.length > 0) {
            previewGallery.innerHTML = '';
            
            Array.from(files).slice(0, 10).forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'gallery-preview-item';
                    previewItem.innerHTML = `
                        <div class="gallery-image-container">
                            <img src="${e.target.result}" alt="圖片 ${index + 1}" class="gallery-image">
                            <div class="gallery-overlay">
                                <div class="gallery-actions">
                                    <button class="action-btn remove-btn" onclick="removeImage(${index})" title="移除">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div class="gallery-info">
                                    <div class="file-name">${file.name}</div>
                                    <div class="file-size">${formatFileSize(file.size)}</div>
                                </div>
                            </div>
                        </div>
                    `;
                    previewGallery.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            });
            
            updateImagesStatus('已上傳', files.length);
        }
    };

    window.checkPreviewAvailability = function() {
        const previewBtn = document.getElementById('previewBtn');
        if (previewBtn) {
            const canPreview = watermarkImage && imagesToProcess.length > 0;
            previewBtn.disabled = !canPreview;
            
            if (canPreview) {
                previewBtn.classList.add('ready');
                previewBtn.innerHTML = '<i class="fas fa-eye me-2"></i>預覽效果 ✨';
            } else {
                previewBtn.classList.remove('ready');
                previewBtn.innerHTML = '<i class="fas fa-eye me-2"></i>預覽效果';
            }
        }
    };

    window.formatFileSize = function(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    window.removeImage = function(index) {
        // 從 imagesToProcess 陣列中移除指定索引的圖片
        imagesToProcess.splice(index, 1);
        
        // 重新更新預覽
        updateImagesStatus(imagesToProcess.length > 0 ? '已上傳' : '尚未上傳', imagesToProcess.length);
        
        // 重新渲染預覽
        if (imagesToProcess.length > 0) {
            updateImagesPreview(imagesToProcess);
        } else {
            const previewGallery = document.getElementById('imagesPreview');
            if (previewGallery) {
                previewGallery.innerHTML = `
                    <div class="gallery-placeholder">
                        <div class="upload-icon">
                            <i class="fas fa-images"></i>
                        </div>
                        <p class="upload-text">點擊上方按鈕選擇圖片（可多選）</p>
                        <p class="upload-hint">支援 JPG、PNG 格式，最多 10 張</p>
                    </div>
                `;
            }
        }
        
        // 重新檢查預覽可用性
        checkPreviewAvailability();
        
        showToast(`已移除圖片`, 'info');
    };

    // 添加預覽圖片和畫廊的 CSS 樣式
    if (!document.getElementById('previewStyles')) {
        const style = document.createElement('style');
        style.id = 'previewStyles';
        style.textContent = `
            .image-preview-item, .gallery-preview-item {
                position: relative;
                border-radius: 8px;
                overflow: hidden;
                background: rgba(255, 255, 255, 0.05);
                transition: all 0.3s ease;
            }
            
            .image-preview-item:hover, .gallery-preview-item:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 25px rgba(66, 245, 230, 0.2);
            }
            
            .preview-image-container, .gallery-image-container {
                position: relative;
                width: 100%;
                height: 150px;
                overflow: hidden;
            }
            
            .preview-image, .gallery-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }
            
            .image-preview-item:hover .preview-image,
            .gallery-preview-item:hover .gallery-image {
                transform: scale(1.1);
            }
            
            .preview-overlay, .gallery-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.8));
                opacity: 0;
                transition: opacity 0.3s ease;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                padding: 10px;
            }
            
            .image-preview-item:hover .preview-overlay,
            .gallery-preview-item:hover .gallery-overlay {
                opacity: 1;
            }
            
            .gallery-actions {
                display: flex;
                justify-content: flex-end;
            }
            
            .action-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: #fff;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .remove-btn:hover {
                background: #ef4444;
                transform: scale(1.1);
            }
            
            .preview-info, .gallery-info {
                color: #fff;
            }
            
            .file-name {
                font-size: 0.8rem;
                font-weight: 500;
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .file-size {
                font-size: 0.7rem;
                color: #a3b2cc;
            }
            
            .gallery-preview-item {
                margin-bottom: 15px;
            }
            
            .status-success { color: #10b981 !important; }
            .status-error { color: #ef4444 !important; }
            .status-info { color: #42f5e6 !important; }
            
            .btn-cosmic.ready {
                background: linear-gradient(135deg, #10b981, #059669);
                animation: glow 2s ease-in-out infinite alternate;
            }
            
            @keyframes glow {
                from { box-shadow: 0 0 20px rgba(16, 185, 129, 0.3); }
                to { box-shadow: 0 0 30px rgba(16, 185, 129, 0.6); }
            }
        `;
        document.head.appendChild(style);
    }

    // 全選功能
    function selectAllResults() {
        const resultItems = document.querySelectorAll('.result-item');
        const allSelected = Array.from(resultItems).every(item => item.classList.contains('selected'));
        
        resultItems.forEach(item => {
            if (allSelected) {
                item.classList.remove('selected');
            } else {
                item.classList.add('selected');
            }
        });
        
        updateSelectionUI();
        showToast(allSelected ? '已取消全選' : '已全選所有圖片', 'info');
    }
    
    // 下載選中圖片功能
    function downloadSelectedResults() {
        const selectedItems = document.querySelectorAll('.result-item.selected');
        
        if (selectedItems.length === 0) {
            showToast('請先選擇要下載的圖片', 'warning');
            return;
        }
        
        showToast(`正在準備下載 ${selectedItems.length} 張選中的圖片...`, 'info');
        
        selectedItems.forEach((item, index) => {
            const img = item.querySelector('img');
            const filename = item.querySelector('.image-title').textContent;
            
            if (img && img.src) {
                setTimeout(() => {
                    downloadImage(img.src, filename);
                    
                    if (index === selectedItems.length - 1) {
                        showToast(`成功下載 ${selectedItems.length} 張圖片！`, 'success');
                    }
                }, index * 200);
            }
        });
    }
    
    // 清空結果功能
    function clearResults() {
        if (processedImages.length === 0) {
            showToast('沒有結果可以清空', 'info');
            return;
        }
        
        // 顯示確認對話框
        showClearConfirmation();
    }
    
    // 顯示清空確認對話框
    function showClearConfirmation() {
        const confirmDialog = document.createElement('div');
        confirmDialog.innerHTML = `
            <div id="clearConfirmDialog" class="confirm-overlay" style="display: flex;">
                <div class="confirm-dialog">
                    <div class="confirm-icon">
                        <i class="fas fa-trash-alt"></i>
                    </div>
                    <h3>確認清空結果</h3>
                    <p>確定要清空所有處理結果嗎？此操作無法復原。</p>
                    <div class="confirm-details">
                        <p>將會清空：</p>
                        <ul>
                            <li>${processedImages.length} 張已處理的圖片</li>
                            <li>所有選擇狀態</li>
                            <li>處理歷史記錄</li>
                        </ul>
                    </div>
                    <div class="confirm-buttons">
                        <button class="btn-confirm-cancel" onclick="closeClearConfirmation()">
                            <i class="fas fa-times me-2"></i>取消
                        </button>
                        <button class="btn-confirm-ok" onclick="confirmClearResults()">
                            <i class="fas fa-check me-2"></i>確認清空
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(confirmDialog);
    }
    
    // 關閉清空確認對話框
    window.closeClearConfirmation = function() {
        const dialog = document.getElementById('clearConfirmDialog');
        if (dialog) {
            dialog.remove();
        }
    };
    
    // 確認清空結果
    window.confirmClearResults = function() {
        processedImages = [];
        
        if (resultGallery) {
            resultGallery.innerHTML = `
                <div class="empty-results">
                    <div class="empty-icon">
                        <i class="fas fa-images"></i>
                    </div>
                    <h4>尚無處理結果</h4>
                    <p>處理圖片後，結果將顯示在這裡</p>
                </div>
            `;
        }
        
        // 隱藏結果區域
        const resultSection = document.getElementById('resultSection');
        if (resultSection) {
            resultSection.style.display = 'none';
        }
        
        // 重置計數器
        const processedCount = document.getElementById('processedCount');
        if (processedCount) {
            processedCount.textContent = '0';
        }
        
        closeClearConfirmation();
        showToast('結果已清空', 'success');
        
        // 重置按鈕狀態
        if (downloadBtn) downloadBtn.disabled = true;
        updateSelectionUI();
    };
    
    // 更新選擇狀態UI
    function updateSelectionUI() {
        const selectedItems = document.querySelectorAll('.result-item.selected');
        const allItems = document.querySelectorAll('.result-item');
        
        if (selectAllBtn) {
            selectAllBtn.innerHTML = selectedItems.length === allItems.length && allItems.length > 0 
                ? '<i class="fas fa-check-square me-2"></i>取消全選'
                : '<i class="fas fa-check-square me-2"></i>全選';
        }
        
        if (downloadSelectedBtn) {
            downloadSelectedBtn.disabled = selectedItems.length === 0;
        }
    }
    
    // 初始化結果項目的選擇功能
    function initializeResultSelection() {
        const resultItems = document.querySelectorAll('.result-item');
        
        resultItems.forEach(item => {
            // 添加點擊選擇功能
            item.addEventListener('click', function(e) {
                // 如果點擊的是下載按鈕，不觸發選擇
                if (e.target.closest('.download-btn')) {
                    return;
                }
                
                this.classList.toggle('selected');
                updateSelectionUI();
            });
        });
        
        updateSelectionUI();
    }

});  // 結束 DOMContentLoaded