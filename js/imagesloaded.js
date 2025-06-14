import imagesLoaded from "https://esm.sh/imagesloaded";

console.clear();

// -------------------------------------------------
// ------------------ Utilities --------------------
// -------------------------------------------------

// Math utilities
const wrap = (n, max) => (n + max) % max;
const lerp = (a, b, t) => a + (b - a) * t;

// DOM utilities
const isHTMLElement = (el) => el instanceof HTMLElement;

const genId = (() => {
	let count = 0;
	return () => {
		return (count++).toString();
	};
})();

class Raf {
	constructor() {
		this.rafId = 0;
		this.raf = this.raf.bind(this);
		this.callbacks = [];

		this.start();
	}

	start() {
		this.raf();
	}

	stop() {
		cancelAnimationFrame(this.rafId);
	}

	raf() {
		this.callbacks.forEach(({ callback, id }) => callback({ id }));
		this.rafId = requestAnimationFrame(this.raf);
	}

	add(callback, id) {
		this.callbacks.push({ callback, id: id || genId() });
	}

	remove(id) {
		this.callbacks = this.callbacks.filter((callback) => callback.id !== id);
	}
}

class Vec2 {
	constructor(x = 0, y = 0) {
		this.x = x;
		this.y = y;
	}

	set(x, y) {
		this.x = x;
		this.y = y;
	}

	lerp(v, t) {
		this.x = lerp(this.x, v.x, t);
		this.y = lerp(this.y, v.y, t);
	}
}

const vec2 = (x = 0, y = 0) => new Vec2(x, y);

export function tilt(node, options) {
	let { trigger, target } = resolveOptions(node, options);

	let lerpAmount = 0.06;

	const rotDeg = { current: vec2(), target: vec2() };
	const bgPos = { current: vec2(), target: vec2() };

	const update = (newOptions) => {
		destroy();
		({ trigger, target } = resolveOptions(node, newOptions));
		init();
	};

	let rafId;

	function ticker({ id }) {
		rafId = id;

		rotDeg.current.lerp(rotDeg.target, lerpAmount);
		bgPos.current.lerp(bgPos.target, lerpAmount);

		for (const el of target) {
			el.style.setProperty("--rotX", rotDeg.current.y.toFixed(2) + "deg");
			el.style.setProperty("--rotY", rotDeg.current.x.toFixed(2) + "deg");

			el.style.setProperty("--bgPosX", bgPos.current.x.toFixed(2) + "%");
			el.style.setProperty("--bgPosY", bgPos.current.y.toFixed(2) + "%");
		}
	}

	const onMouseMove = ({ offsetX, offsetY }) => {
		lerpAmount = 0.1;

		for (const el of target) {
			const ox = (offsetX - el.clientWidth * 0.5) / (Math.PI * 3);
			const oy = -(offsetY - el.clientHeight * 0.5) / (Math.PI * 4);

			rotDeg.target.set(ox, oy);
			bgPos.target.set(-ox * 0.3, oy * 0.3);
		}
	};

	const onMouseLeave = () => {
		lerpAmount = 0.06;

		rotDeg.target.set(0, 0);
		bgPos.target.set(0, 0);
	};

	const addListeners = () => {
		trigger.addEventListener("mousemove", onMouseMove);
		trigger.addEventListener("mouseleave", onMouseLeave);
	};

	const removeListeners = () => {
		trigger.removeEventListener("mousemove", onMouseMove);
		trigger.removeEventListener("mouseleave", onMouseLeave);
	};

	const init = () => {
		addListeners();
		raf.add(ticker);

		// 確保背景元素正確設置
		const slideBgs = document.querySelectorAll('.slide__bg');
		const slideImages = document.querySelectorAll('.slide--image');
		
		// 從幻燈片圖片中獲取實際路徑
		let imagePaths = [];
		slideImages.forEach(img => {
			imagePaths.push(img.getAttribute('src'));
		});
		
		// 設置背景圖片
		slideBgs.forEach((bg, index) => {
			if (index < imagePaths.length) {
				bg.style.backgroundImage = `url('${imagePaths[index]}')`;
			}
			
			// 初始狀態屬性設置
			if (index === 0) {
				bg.setAttribute('data-current', '');
			} else if (index === 1) {
				bg.setAttribute('data-next', '');
			} else if (index === 2) {
				bg.setAttribute('data-next2', ''); 
			}
		});
	};

	const destroy = () => {
		removeListeners();
		raf.remove(rafId);
	};

	init();

	return { destroy, update };
}

function resolveOptions(node, options) {
	return {
		trigger: options?.trigger ?? node,
		target: options?.target
			? Array.isArray(options.target)
				? options.target
				: [options.target]
			: [node]
	};
}

// -----------------------------------------------------

// Global Raf Instance
const raf = new Raf();

function init() {
	const loader = document.querySelector(".loader");
	const slides = [...document.querySelectorAll(".slide")];
	const slidesInfo = [...document.querySelectorAll(".slide-info")];
	
	const buttons = {
		prev: document.querySelector(".slider--btn__prev"),
		next: document.querySelector(".slider--btn__next")
	};
	
	loader.style.opacity = 0;
	loader.style.pointerEvents = "none";
	
	slides.forEach((slide, i) => {
		const slideInner = slide.querySelector(".slide__inner");
		const slideInfoInner = slidesInfo[i].querySelector(".slide-info__inner");
		
		tilt(slide, { target: [slideInner, slideInfoInner] });
	});
	
	buttons.prev.addEventListener("click", change(-1));
	buttons.next.addEventListener("click", change(1));
	
	// 確保背景圖片初始化
	setupBackgroundImages();
}

function setup() {
	const loaderText = document.querySelector(".loader__text");

	const images = [...document.querySelectorAll("img")];
	const totalImages = images.length;
	let loadedImages = 0;
	let progress = {
		current: 0,
		target: 0
	};

	// update progress target
	images.forEach((image) => {
		imagesLoaded(image, (instance) => {
			if (instance.isComplete) {
				loadedImages++;
				progress.target = loadedImages / totalImages;
			}
		});
	});

	// lerp progress current to progress target
	raf.add(({ id }) => {
		progress.current = lerp(progress.current, progress.target, 0.06);

		const progressPercent = Math.round(progress.current * 100);
		loaderText.textContent = `${progressPercent}%`;

		// hide loader when progress is 100%
		if (progressPercent === 100) {
			init();

			// remove raf callback when progress is 100%
			raf.remove(id);
		}
	});
}

// 修正 change 函數的邏輯，使右箭頭正確指向下一張幻燈片

function change(direction) {
    return () => {
        // 獲取所有輪播元素
        const slides = [...document.querySelectorAll(".slide")];
        const slidesInfo = [...document.querySelectorAll(".slide-info")];
        const slidesBg = [...document.querySelectorAll(".slide__bg")];
        
        // 找出當前顯示的幻燈片索引
        let currentIndex = -1;
        for (let i = 0; i < slides.length; i++) {
            if (slides[i].hasAttribute("data-current")) {
                currentIndex = i;
                break;
            }
        }
        
        // 如果沒找到當前幻燈片，則默認為第一張
        if (currentIndex === -1) {
            currentIndex = 0;
        }
        
        // 根據方向計算下一張或上一張的索引
        // 修改方向邏輯，使其符合標準輪播行為
        // direction: 1 表示下一張（右箭頭），-1 表示上一張（左箭頭）
        let newIndex;
        if (direction === 1) {
            // 向右：顯示下一張
            newIndex = (currentIndex + 1) % slides.length;
        } else {
            // 向左：顯示上一張
            newIndex = (currentIndex - 1 + slides.length) % slides.length;
        }
        
        // 計算新的下一張索引
        let nextIndex = (newIndex + 1) % slides.length;
        
        // 計算新的上一張索引
        let prevIndex = (newIndex - 1 + slides.length) % slides.length;
        
        // 清除所有幻燈片的狀態
        for (let i = 0; i < slides.length; i++) {
            slides[i].removeAttribute("data-current");
            slides[i].removeAttribute("data-next");
            slides[i].removeAttribute("data-previous");
            slides[i].removeAttribute("data-next2");
            
            slidesInfo[i].removeAttribute("data-current");
            slidesInfo[i].removeAttribute("data-next");
            slidesInfo[i].removeAttribute("data-previous");
            slidesInfo[i].removeAttribute("data-next2");
            
            if (i < slidesBg.length) {
                slidesBg[i].removeAttribute("data-current");
                slidesBg[i].removeAttribute("data-next");
                slidesBg[i].removeAttribute("data-previous");
                slidesBg[i].removeAttribute("data-next2");
            }
        }
        
        // 設置新的當前幻燈片
        slides[newIndex].setAttribute("data-current", "");
        slidesInfo[newIndex].setAttribute("data-current", "");
        if (newIndex < slidesBg.length) {
            slidesBg[newIndex].setAttribute("data-current", "");
        }
        
        // 設置下一張幻燈片
        slides[nextIndex].setAttribute("data-next", "");
        slidesInfo[nextIndex].setAttribute("data-next", "");
        if (nextIndex < slidesBg.length) {
            slidesBg[nextIndex].setAttribute("data-next", "");
        }
        
        // 設置上一張幻燈片
        slides[prevIndex].setAttribute("data-previous", "");
        slidesInfo[prevIndex].setAttribute("data-previous", "");
        if (prevIndex < slidesBg.length) {
            slidesBg[prevIndex].setAttribute("data-previous", "");
        }
    };
}

// 新增一個函數來設置背景圖片
function setupBackgroundImages() {
    const slides = document.querySelectorAll(".slide");
    const bgElements = document.querySelectorAll(".slide__bg");
    
    // 從幻燈片圖片獲取圖片路徑並設置到背景元素
    slides.forEach((slide, index) => {
        if (index < bgElements.length) {
            const img = slide.querySelector('.slide--image');
            if (img) {
                const imgSrc = img.getAttribute('src');
                bgElements[index].style.backgroundImage = `url('${imgSrc}')`;
                
                // 保持與幻燈片相同的 data 屬性
                if (slide.hasAttribute("data-current")) {
                    bgElements[index].setAttribute("data-current", "");
                } else if (slide.hasAttribute("data-next")) {
                    bgElements[index].setAttribute("data-next", "");
                } else if (slide.hasAttribute("data-previous")) {
                    bgElements[index].setAttribute("data-previous", "");
                } else if (slide.hasAttribute("data-next2")) {
                    bgElements[index].setAttribute("data-next2", "");
                }
            }
        }
    });
}

// 確保在初始化時調用
document.addEventListener("DOMContentLoaded", function() {
    setupBackgroundImages();
});

// Start
setup();
