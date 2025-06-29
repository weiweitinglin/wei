// 增強版JavaScript功能
class EnhancedWebsite {
    constructor() {
        this.init();
    }

    init() {
        this.initializeComponents();
        this.setupEventListeners();
        this.setupAnimations();
        this.setupInteractions();
        this.setupInteractiveFeatures();
    }

    initializeComponents() {
        // 初始化AOS動畫
        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: 1000,
                once: true,
                offset: 100,
                easing: 'ease-out-cubic'
            });
        }

        // 初始化粒子效果
        this.initParticles();
        
        // 初始化載入動畫
        this.initLoader();
        
        // 初始化主題系統
        this.initTheme();
        
        // 初始化統計動畫
        this.initStatsAnimation();
    }

    initParticles() {
        if (typeof particlesJS !== 'undefined') {
            particlesJS("particles-js", {
                particles: {
                    number: { 
                        value: window.innerWidth > 768 ? 80 : 40, 
                        density: { enable: true, value_area: 800 } 
                    },
                    color: { value: "#ffffff" },
                    shape: { 
                        type: "circle",
                        stroke: { width: 0, color: "#000000" }
                    },
                    opacity: { 
                        value: 0.5, 
                        random: true,
                        anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false }
                    },
                    size: { 
                        value: 3, 
                        random: true,
                        anim: { enable: true, speed: 2, size_min: 0.1, sync: false }
                    },
                    line_linked: {
                        enable: true,
                        distance: 150,
                        color: "#ffffff",
                        opacity: 0.4,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 2,
                        direction: "none",
                        random: true,
                        straight: false,
                        out_mode: "out",
                        bounce: false,
                        attract: { enable: false, rotateX: 600, rotateY: 1200 }
                    }
                },
                interactivity: {
                    detect_on: "canvas",
                    events: {
                        onhover: { enable: true, mode: "repulse" },
                        onclick: { enable: true, mode: "push" },
                        resize: true
                    },
                    modes: {
                        grab: { distance: 400, line_linked: { opacity: 1 } },
                        bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
                        repulse: { distance: 200, duration: 0.4 },
                        push: { particles_nb: 4 },
                        remove: { particles_nb: 2 }
                    }
                },
                retina_detect: true
            });
        }
    }

    initLoader() {
        const loader = document.getElementById('loadingOverlay');
        
        if (!loader) {
            console.log('載入動畫元素未找到');
            return;
        }

        // 簡化的載入動畫
        let progress = 0;
        const loadingText = document.querySelector('.loading-text');
        
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 15 + 5; // 5-20之間的隨機增量
            
            if (progress >= 100) {
                progress = 100;
                clearInterval(loadingInterval);
                
                if (loadingText) {
                    loadingText.textContent = '載入完成！';
                }
                
                // 隱藏載入動畫
                setTimeout(() => {
                    console.log('initLoader: 開始隱藏載入動畫');
                    loader.classList.add('hidden');
                    setTimeout(() => {
                        loader.style.display = 'none';
                        loader.remove(); // 完全移除元素
                        document.body.classList.remove('loading'); // 移除 loading class
                        document.body.classList.add('loaded');
                        console.log('initLoader: 載入動畫已隱藏');
                        this.showNavbar();
                    }, 500);
                }, 300);
            } else {
                if (loadingText) {
                    loadingText.textContent = `正在進入廷造星球 ${Math.floor(progress)}%`;
                }
            }
        }, 200); // 每200ms更新一次
    }

    showNavbar() {
        const navbar = document.getElementById('mainNav');
        if (navbar) {
            setTimeout(() => {
                navbar.style.opacity = '1';
                navbar.style.visibility = 'visible';
                navbar.style.transition = 'opacity 0.8s ease, visibility 0.8s ease';
            }, 1000);
        }
    }

    initTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        const currentTheme = localStorage.getItem('theme') || 'dark';
        this.setTheme(currentTheme);
        
        themeToggle.addEventListener('click', () => {
            const theme = document.documentElement.getAttribute('data-theme');
            const newTheme = theme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle?.querySelector('i');
        
        if (icon) {
            icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        if (themeToggle) {
            themeToggle.title = theme === 'dark' ? '切換到亮色主題' : '切換到暗色主題';
        }

        // 更新粒子效果顏色和透明度
        this.updateParticlesTheme(theme);
        
        // 顯示主題切換通知
        this.showNotification(
            theme === 'dark' ? '🌙 已切換到暗色主題' : '☀️ 已切換到亮色主題', 
            'success'
        );
        
        // 添加主題切換動畫效果
        document.body.style.transition = 'all 0.3s ease';
        document.body.style.transform = 'scale(0.98)';
        
        setTimeout(() => {
            document.body.style.transform = 'scale(1)';
        }, 150);
    }

    updateParticlesTheme(theme) {
        if (typeof particlesJS === 'undefined') return;
        
        const particleColor = theme === 'dark' ? '#ffffff' : '#334155';
        const linkColor = theme === 'dark' ? '#ffffff' : '#334155';
        const particleOpacity = theme === 'dark' ? 0.8 : 0.4;
        
        // 重新初始化粒子效果
        setTimeout(() => {
            particlesJS("particles-js", {
                particles: {
                    number: { 
                        value: window.innerWidth > 768 ? 80 : 40, 
                        density: { enable: true, value_area: 800 } 
                    },
                    color: { value: particleColor },
                    shape: { 
                        type: "circle",
                        stroke: { width: 0, color: "#000000" }
                    },
                    opacity: { 
                        value: particleOpacity, 
                        random: true,
                        anim: { enable: true, speed: 1, opacity_min: 0.1, sync: false }
                    },
                    size: { 
                        value: 3, 
                        random: true,
                        anim: { enable: true, speed: 2, size_min: 0.1, sync: false }
                    },
                    line_linked: {
                        enable: true,
                        distance: 150,
                        color: linkColor,
                        opacity: particleOpacity * 0.8,
                        width: 1
                    },
                    move: {
                        enable: true,
                        speed: 2,
                        direction: "none",
                        random: true,
                        straight: false,
                        out_mode: "out",
                        bounce: false,
                        attract: { enable: false, rotateX: 600, rotateY: 1200 }
                    }
                },
                interactivity: {
                    detect_on: "canvas",
                    events: {
                        onhover: { enable: true, mode: "repulse" },
                        onclick: { enable: true, mode: "push" },
                        resize: true
                    },
                    modes: {
                        grab: { distance: 400, line_linked: { opacity: 1 } },
                        bubble: { distance: 400, size: 40, duration: 2, opacity: 8, speed: 3 },
                        repulse: { distance: 200, duration: 0.4 },
                        push: { particles_nb: 4 },
                        remove: { particles_nb: 2 }
                    }
                },
                retina_detect: true
            });
        }, 100);
    }

    initStatsAnimation() {
        const statsSection = document.querySelector('.stats-section');
        if (!statsSection) return;

        const animateStats = () => {
            const stats = document.querySelectorAll('.stat-number');
            stats.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-count'));
                let current = 0;
                const increment = target / 100;
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    stat.textContent = Math.floor(current);
                }, 30);
            });
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateStats();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(statsSection);
    }

    setupEventListeners() {
        // 平滑滾動
        document.querySelectorAll('.smooth-scroll').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // 回到頂部按鈕
        this.setupBackToTop();
        
        // 滾動效果
        this.setupScrollEffects();
        
        // 導航欄滾動效果
        this.setupNavbarScroll();
    }

    setupBackToTop() {
        const backToTopBtn = document.getElementById('backToTop') || document.querySelector('.back-to-top-btn');
        if (!backToTopBtn) return;

        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });

        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ 
                top: 0, 
                behavior: 'smooth' 
            });
            
            // 添加點擊動畫效果
            backToTopBtn.style.transform = 'translateY(-5px) scale(0.95)';
            setTimeout(() => {
                backToTopBtn.style.transform = '';
            }, 150);
        });
    }

    setupScrollEffects() {
        let lastScrollTop = 0;
        
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // 視差效果
            this.updateParallax(scrollTop);
            
            // 導航欄效果
            this.updateNavbar(scrollTop, lastScrollTop);
            
            lastScrollTop = scrollTop;
        });
    }

    updateParallax(scrollTop) {
        const parallaxElements = document.querySelectorAll('.slide__bg');
        parallaxElements.forEach(element => {
            const speed = 0.5;
            const yPos = -(scrollTop * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }

    updateNavbar(scrollTop, lastScrollTop) {
        const navbar = document.getElementById('mainNav');
        if (!navbar) return;

        if (scrollTop > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // 隱藏/顯示導航欄
        if (scrollTop > lastScrollTop && scrollTop > 200) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
    }

    setupNavbarScroll() {
        const navbar = document.getElementById('mainNav');
        if (!navbar) return;

        let isScrolling = false;
        
        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                window.requestAnimationFrame(() => {
                    const scrolled = window.scrollY > 50;
                    navbar.classList.toggle('scrolled', scrolled);
                    isScrolling = false;
                });
                isScrolling = true;
            }
        });
    }

    setupAnimations() {
        // 設置懸停動畫
        this.setupHoverAnimations();
        
        // 設置滾動觸發動畫
        this.setupScrollAnimations();
        
        // 設置打字機效果
        this.setupTypewriterEffect();
    }

    setupHoverAnimations() {
        // 工具卡片懸停效果
        const toolCards = document.querySelectorAll('.tool-card');
        toolCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // 按鈕波紋效果
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                const ripple = document.createElement('span');
                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                button.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        });
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // 觀察需要動畫的元素
        const animateElements = document.querySelectorAll('.tool-card, .feature-item, .stat-item');
        animateElements.forEach(el => observer.observe(el));
    }

    setupTypewriterEffect() {
        const typewriterElements = document.querySelectorAll('[data-typewriter]');
        
        typewriterElements.forEach(element => {
            const text = element.textContent;
            element.textContent = '';
            
            let i = 0;
            const typeWriter = () => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(typeWriter, 100);
                }
            };
            
            // 當元素進入視窗時開始打字效果
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        typeWriter();
                        observer.unobserve(entry.target);
                    }
                });
            });
            
            observer.observe(element);
        });
    }

    setupInteractions() {
        // 設置增強互動功能
        this.setupInteractiveFeatures();
        
        // 設置鍵盤快捷鍵
        this.setupKeyboardShortcuts();
        
        // 設置拖拽交互
        this.setupDragInteractions();
        
        // 設置觸控支持
        this.setupTouchSupport();
        
        // 設置手勢支持
        this.setupGestureSupport();
    }

    setupInteractiveFeatures() {
        this.setupRippleEffect();
        this.setupParallaxScrolling();
        this.setupAchievementSystem();
        this.setupTooltips();
        this.setupScrollEnhancements();
    }

    setupRippleEffect() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.click-ripple')) {
                const ripple = e.target.closest('.click-ripple');
                const rect = ripple.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                const rippleElement = document.createElement('span');
                rippleElement.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    left: ${x}px;
                    top: ${y}px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 50%;
                    transform: scale(0);
                    animation: ripple 0.6s ease-out;
                    pointer-events: none;
                    z-index: 1000;
                `;
                
                ripple.appendChild(rippleElement);
                
                setTimeout(() => {
                    rippleElement.remove();
                }, 600);
            }
        });
    }

    setupParallaxScrolling() {
        const parallaxElements = document.querySelectorAll('.parallax-element');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            parallaxElements.forEach(element => {
                element.style.transform = `translate3d(0, ${rate}px, 0)`;
            });
        });
    }

    setupAchievementSystem() {
        const achievements = [
            { id: 'first-visit', title: '歡迎探索！', desc: '首次造訪廷造星球', trigger: 'load' },
            { id: 'scroll-master', title: '滾動達人！', desc: '您已探索了大部分內容', trigger: 'scroll' },
            { id: 'tool-explorer', title: '工具探索者！', desc: '查看了所有工具卡片', trigger: 'hover' }
        ];

        // 首次訪問成就
        if (!localStorage.getItem('achievement-first-visit')) {
            setTimeout(() => {
                this.showAchievement(achievements[0]);
                localStorage.setItem('achievement-first-visit', 'true');
            }, 3000);
        }

        // 滾動成就
        let scrollAchievementShown = false;
        window.addEventListener('scroll', () => {
            if (!scrollAchievementShown && window.scrollY > document.body.scrollHeight * 0.7) {
                this.showAchievement(achievements[1]);
                scrollAchievementShown = true;
                localStorage.setItem('achievement-scroll-master', 'true');
            }
        });

        // 工具卡片懸停成就
        let hoveredCards = new Set();
        document.querySelectorAll('.tool-card').forEach((card, index) => {
            card.addEventListener('mouseenter', () => {
                hoveredCards.add(index);
                if (hoveredCards.size >= 3 && !localStorage.getItem('achievement-tool-explorer')) {
                    this.showAchievement(achievements[2]);
                    localStorage.setItem('achievement-tool-explorer', 'true');
                }
            });
        });
    }

    showAchievement(achievement) {
        const badge = document.getElementById('achievementBadge');
        const title = document.getElementById('achievementTitle');
        const desc = document.getElementById('achievementDesc');
        
        if (badge && title && desc) {
            title.textContent = achievement.title;
            desc.textContent = achievement.desc;
            badge.classList.add('show');
            
            setTimeout(() => {
                badge.classList.remove('show');
            }, 4000);
        }
    }

    setupTooltips() {
        // 工具提示已在CSS中實現，這裡添加額外的互動
        document.querySelectorAll('.tooltip-custom').forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'scale(1.05)';
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'scale(1)';
            });
        });
    }

    setupScrollEnhancements() {
        // 平滑滾動增強
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
    }

    // 手勢支持（移動端）
    setupGestureSupport() {
        let startY = 0;
        let currentY = 0;
        
        document.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchmove', (e) => {
            currentY = e.touches[0].clientY;
            const diff = startY - currentY;
            
            // 向上滑動顯示導航
            if (diff > 50) {
                document.getElementById('mainNav').style.transform = 'translateY(0)';
            }
            // 向下滑動隱藏導航
            else if (diff < -50) {
                document.getElementById('mainNav').style.transform = 'translateY(-100%)';
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ESC 鍵回到頂部
            if (e.key === 'Escape') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            
            // T 鍵切換主題
            if (e.key === 't' || e.key === 'T') {
                const themeToggle = document.getElementById('themeToggle');
                if (themeToggle) {
                    themeToggle.click();
                }
            }
        });
    }

    setupDragInteractions() {
        // 為特定元素添加拖拽功能
        const draggableElements = document.querySelectorAll('.draggable');
        
        draggableElements.forEach(element => {
            let isDragging = false;
            let startX, startY, initialX, initialY;
            
            element.addEventListener('mousedown', (e) => {
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                initialX = element.offsetLeft;
                initialY = element.offsetTop;
                
                element.style.cursor = 'grabbing';
            });
            
            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                element.style.left = (initialX + deltaX) + 'px';
                element.style.top = (initialY + deltaY) + 'px';
            });
            
            document.addEventListener('mouseup', () => {
                isDragging = false;
                element.style.cursor = 'grab';
            });
        });
    }

    setupTouchSupport() {
        // 添加觸控手勢支持
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            // 滑動手勢檢測
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > 50) {
                    // 向右滑動
                    this.handleSwipeRight();
                } else if (deltaX < -50) {
                    // 向左滑動
                    this.handleSwipeLeft();
                }
            } else {
                if (deltaY > 50) {
                    // 向下滑動
                    this.handleSwipeDown();
                } else if (deltaY < -50) {
                    // 向上滑動
                    this.handleSwipeUp();
                }
            }
        });
    }

    handleSwipeRight() {
        // 處理向右滑動
        console.log('向右滑動');
    }

    handleSwipeLeft() {
        // 處理向左滑動
        console.log('向左滑動');
    }

    handleSwipeDown() {
        // 處理向下滑動
        console.log('向下滑動');
    }

    handleSwipeUp() {
        // 處理向上滑動
        console.log('向上滑動');
    }

    // 公共方法
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    updateProgress(percentage) {
        const progressBar = document.querySelector('.loading-progress');
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
    }

    // 響應式處理
    handleResize() {
        const isMobile = window.innerWidth <= 768;
        
        // 重新初始化粒子效果
        if (typeof particlesJS !== 'undefined') {
            this.initParticles();
        }
        
        // 調整AOS設定
        if (typeof AOS !== 'undefined') {
            AOS.refreshHard();
        }
        
        // 移動設備特殊處理
        if (isMobile) {
            this.setupMobileOptimizations();
        }
    }

    setupMobileOptimizations() {
        // 移動設備優化
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport && window.innerWidth <= 768) {
            // 移動端特殊處理
            document.body.classList.add('mobile-device');
            
            // 優化觸摸滾動
            document.body.style.webkitOverflowScrolling = 'touch';
        }
        
        // 響應式字體大小調整
        this.adjustFontSizes();
        
        window.addEventListener('resize', () => {
            this.adjustFontSizes();
        });
    }

    adjustFontSizes() {
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        const baseFontSize = Math.max(14, Math.min(18, vw / 80));
        document.documentElement.style.fontSize = baseFontSize + 'px';
    }
}

// 初始化增強網站功能
document.addEventListener('DOMContentLoaded', () => {
    new EnhancedWebsite();
});

// 確保在頁面完全載入後也執行一次
window.addEventListener('load', () => {
    console.log('頁面載入完成，開始隱藏載入動畫');
    
    // 如果載入動畫還在顯示，強制隱藏
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        console.log('找到載入動畫元素，準備隱藏');
        
        setTimeout(() => {
            // 添加隱藏類別
            loadingOverlay.classList.add('hidden');
            
            setTimeout(() => {
                // 完全移除元素
                loadingOverlay.style.display = 'none';
                loadingOverlay.remove(); // 直接移除元素
                document.body.classList.remove('loading'); // 移除 loading class
                document.body.classList.add('loaded');
                console.log('載入動畫已隱藏，頁面可以正常互動');
            }, 500);
        }, 1500); // 減少顯示時間到1.5秒
    } else {
        console.log('未找到載入動畫元素');
        document.body.classList.remove('loading'); // 移除 loading class
        document.body.classList.add('loaded');
    }
});

// 備用隱藏機制 - DOMContentLoaded 事件
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 載入完成');
    
    // 設定最大載入時間
    setTimeout(() => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay && !document.body.classList.contains('loaded')) {
            console.log('備用隱藏機制觸發');
            loadingOverlay.classList.add('hidden');
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
                loadingOverlay.remove();
                document.body.classList.remove('loading'); // 移除 loading class
                document.body.classList.add('loaded');
            }, 500);
        }
    }, 3000); // 最多3秒後強制隱藏
});
