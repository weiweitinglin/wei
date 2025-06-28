// 手機版下拉選單修復
document.addEventListener('DOMContentLoaded', function() {
    // 檢查是否存在下拉選單元素
    const dropdownToggle = document.querySelector('#toolsDropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    // 如果沒有找到下拉選單，直接返回（避免錯誤）
    if (!dropdownToggle || !dropdownMenu) {
        console.log('📝 當前頁面無下拉選單，跳過修復');
        return;
    }
    
    // 簡單直接的修復方法
    const isMobile = window.innerWidth <= 768;
    
    // 手機版專用的下拉選單處理
    function handleMobileDropdown() {
        // 移除 Bootstrap 原生事件
        dropdownToggle.setAttribute('data-bs-toggle', '');
        
        // 添加自定義點擊事件
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // 切換下拉選單顯示狀態
            if (dropdownMenu.style.display === 'block') {
                dropdownMenu.style.display = 'none';
            } else {
                dropdownMenu.style.display = 'block';
            }
        });
        
        // 防止點擊選單時收起
        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // 點擊其他區域關閉選單
        document.addEventListener('click', function() {
            dropdownMenu.style.display = 'none';
        });
    }
    
    // 視窗大小改變時重新檢查
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            handleMobileDropdown();
        }
    }
    
    // 初始檢查
    checkScreenSize();
    
    // 監聽窗口大小變更
    window.addEventListener('resize', checkScreenSize);
});