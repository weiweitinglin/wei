/*!
* Start Bootstrap - Grayscale v7.0.6 (https://startbootstrap.com/theme/grayscale)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-grayscale/blob/master/LICENSE)
*/
//
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {

    // Navbar shrink function
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink')
        } else {
            navbarCollapsible.classList.add('navbar-shrink')
        }

    };

    // Shrink the navbar 
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

});

// 頁面加載完成後調整為移動設備
document.addEventListener('DOMContentLoaded', function() {
    // 檢測是否為移動設備
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // 調整輪播為適合移動設備
        const slider = document.querySelector('.slider');
        if (slider) {
            slider.style.maxHeight = '70vh';
        }
        
        // 調整導航欄層級
        const mainNav = document.getElementById('mainNav');
        if (mainNav) {
            mainNav.style.zIndex = '1050';
        }
    } else {
        // 電腦版特定調整 - 恢復原始尺寸
        const slides = document.querySelectorAll('.slide');
        slides.forEach(slide => {
            slide.style.setProperty('--slide-width', 'min(25vw, 300px)', 'important');
        });
        
        // 確保輪播容器有適當的高度
        const slider = document.querySelector('.slider');
        if (slider) {
            slider.style.height = 'calc(2 * var(--slide-height))';
            slider.style.maxHeight = 'none';
        }
    }
    
    // 監聽窗口大小改變
    window.addEventListener('resize', function() {
        const isMobile = window.innerWidth <= 768;
        
        // 根據視窗大小動態調整
        if (isMobile) {
            const slider = document.querySelector('.slider');
            if (slider) {
                slider.style.maxHeight = '70vh';
            }
            
            // 調整手機版幻燈片尺寸
            const slides = document.querySelectorAll('.slide');
            slides.forEach(slide => {
                slide.style.setProperty('--slide-width', '90vw', 'important');
            });
        } else {
            // 恢復電腦版尺寸
            const slides = document.querySelectorAll('.slide');
            slides.forEach(slide => {
                slide.style.setProperty('--slide-width', 'min(25vw, 300px)', 'important');
            });
            
            // 恢復輪播容器高度
            const slider = document.querySelector('.slider');
            if (slider) {
                slider.style.height = 'calc(2 * var(--slide-height))';
                slider.style.maxHeight = 'none';
            }
        }
    });
});

// 初始化下拉選單
document.addEventListener('DOMContentLoaded', function() {
    // 處理下拉選單
    const dropdownElementList = [].slice.call(document.querySelectorAll('.dropdown-toggle'));
    const dropdownList = dropdownElementList.map(function(dropdownToggleEl) {
        return new bootstrap.Dropdown(dropdownToggleEl);
    });
    
    // 特別處理移動端的下拉選單
    if (window.innerWidth <= 768) {
        const dropdowns = document.querySelectorAll('.dropdown');
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // 切換下拉選單顯示狀態
                if (menu.classList.contains('show')) {
                    menu.classList.remove('show');
                } else {
                    // 關閉其他選單
                    document.querySelectorAll('.dropdown-menu.show').forEach(openMenu => {
                        if (openMenu !== menu) openMenu.classList.remove('show');
                    });
                    menu.classList.add('show');
                }
            });
        });
        
        // 點擊下拉選單項目不關閉導航欄
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                e.stopPropagation(); // 阻止事件冒泡
            });
        });
    }
});