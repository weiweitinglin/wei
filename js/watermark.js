document.addEventListener('DOMContentLoaded', function() {
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
    
    // 綁定上傳區域的點擊事件
    document.getElementById('watermarkUpload').addEventListener('click', function() {
        watermarkInput.click();
    });
    
    document.getElementById('imagesUpload').addEventListener('click', function() {
        imagesInput.click();
    });
    
    // 監聽浮水印圖片上傳
    watermarkInput.addEventListener('change', function(e) {
        if (this.files.length === 0) return;
        
        const file = this.files[0];
        if (!file.type.match('image.*')) {
            showToast('請上傳圖片文件', 'error');
            return;
        }
        
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
                
                watermarkWidth.value = watermarkImage.width;
                watermarkHeight.value = watermarkImage.height;
                
                showToast('浮水印圖片上傳成功！', 'success');
                updateButtonStates();
            };
            img.src = e.target.result;
            
            // 顯示預覽
            watermarkPreview.innerHTML = `<img src="${e.target.result}" alt="浮水印預覽">`;
        };
        reader.readAsDataURL(file);
    });
    
    // 監聽待處理圖片上傳
    imagesInput.addEventListener('change', function(e) {
        if (this.files.length === 0) return;
        
        imagesPreview.innerHTML = ''; // 清空預覽區域
        imagesToProcess = [];
        
        // 處理上傳的每一張圖片
        const totalFiles = this.files.length;
        let loadedFiles = 0;
        
        Array.from(this.files).forEach(file => {
            if (!file.type.match('image.*')) {
                loadedFiles++;
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
                        showToast(`成功載入 ${imagesToProcess.length} 張圖片！`, 'success');
                        updateButtonStates();
                    }
                };
                img.src = e.target.result;
                
                // 添加到預覽畫廊
                const imgElement = document.createElement('img');
                imgElement.src = e.target.result;
                imgElement.alt = file.name;
                imagesPreview.appendChild(imgElement);
            };
            reader.readAsDataURL(file);
        });
    });
    
    // 位置選擇按鈕
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
    
    // 設定默認位置按鈕為活動狀態
    document.getElementById('defaultPosition').classList.add('active');
    
    // 維持比例事件
    let originalAspectRatio = 1;
    
    watermarkWidth.addEventListener('input', function() {
        if (maintainAspect.checked && watermarkImage) {
            watermarkHeight.value = Math.round(parseInt(this.value) / watermarkImage.aspectRatio);
        }
        updatePreview();
    });
    
    watermarkHeight.addEventListener('input', function() {
        if (maintainAspect.checked && watermarkImage) {
            watermarkWidth.value = Math.round(parseInt(this.value) * watermarkImage.aspectRatio);
        }
        updatePreview();
    });
    
    // 透明度滑塊
    opacityRange.addEventListener('input', function() {
        opacityValue.textContent = this.value + '%';
        updatePreview();
    });
    
    // 品質滑塊
    jpegQuality.addEventListener('input', function() {
        qualityValue.textContent = this.value + '%';
    });
    
    // 輸出格式變更
    outputFormat.addEventListener('change', function() {
        jpegQualityContainer.style.display = this.value === 'jpeg' ? 'block' : 'none';
    });
    
    // 預覽按鈕事件
    previewBtn.addEventListener('click', function() {
        // 添加按鈕點擊動畫效果
        addButtonClickEffect(this);
        updatePreview();
    });
    
    // 處理按鈕事件
    processBtn.addEventListener('click', function() {
        addButtonClickEffect(this);
        processImages();
    });
    
    // 下載按鈕事件
    downloadBtn.addEventListener('click', function() {
        addButtonClickEffect(this);
        
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
            document.head.appendChild(script);
        }
    });
    
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
        
        showToast('正在處理圖片...', 'info');
        
        processedImages = [];
        resultGallery.innerHTML = '';
        
        // 獲取浮水印設定
        const width = parseInt(watermarkWidth.value) || watermarkImage.width;
        const height = parseInt(watermarkHeight.value) || watermarkImage.height;
        const opacity = parseInt(opacityRange.value) / 100;
        
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
                    showToast(`成功處理 ${totalImages} 張圖片！`, 'success');
                    downloadBtn.disabled = false;
                    
                    // 平滑滾動到結果區域
                    setTimeout(() => {
                        resultGallery.scrollIntoView({behavior: 'smooth'});
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
    
    // 顯示 Toast 提示
    function showToast(message, type = 'info') {
        // 先移除可能存在的舊 Toast
        const oldToast = document.querySelector('.cosmic-toast');
        if (oldToast) {
            oldToast.remove();
        }
        
        // 根據類型決定圖示和顏色
        let icon, bgColor;
        switch(type) {
            case 'success':
                icon = 'check-circle';
                bgColor = 'linear-gradient(45deg, rgba(40, 167, 69, 0.9), rgba(46, 204, 113, 0.9))';
                break;
            case 'error':
                icon = 'exclamation-circle';
                bgColor = 'linear-gradient(45deg, rgba(220, 53, 69, 0.9), rgba(255, 99, 71, 0.9))';
                break;
            case 'warning':
                icon = 'exclamation-triangle';
                bgColor = 'linear-gradient(45deg, rgba(255, 193, 7, 0.9), rgba(255, 159, 26, 0.9))';
                break;
            default:
                icon = 'info-circle';
                bgColor = 'linear-gradient(145deg, rgba(30, 40, 70, 0.9), rgba(50, 60, 100, 0.9))';
        }
        
        // 創建Toast元素
        const toast = document.createElement('div');
        toast.className = 'cosmic-toast';
        toast.style.background = bgColor;
        toast.innerHTML = `
            <i class="fas fa-${icon} me-2"></i>
            <span>${message}</span>
        `;
        
        // 添加到頁面
        document.body.appendChild(toast);
        
        // 添加基本樣式
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '10000',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            transform: 'translateY(-20px)',
            opacity: '0',
            transition: 'all 0.3s ease',
            maxWidth: '300px',
            display: 'flex',
            alignItems: 'center',
            backdropFilter: 'blur(10px)'
        });
        
        // 顯示Toast
        setTimeout(() => {
            toast.style.transform = 'translateY(0)';
            toast.style.opacity = '1';
        }, 10);
        
        // 自動隱藏Toast
        setTimeout(() => {
            toast.style.transform = 'translateY(-20px)';
            toast.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    // 按鈕點擊效果
    function addButtonClickEffect(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = '';
        }, 200);
    }
});