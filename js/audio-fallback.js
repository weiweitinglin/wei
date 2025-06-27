// 音頻備用方案 - 使用 Web Audio API 生成環境音效
class AudioFallback {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.gainNode = null;
        this.oscillators = [];
        this.initAudioContext();
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            this.gainNode.connect(this.audioContext.destination);
        } catch (error) {
            console.warn('Web Audio API 不支援');
        }
    }

    play() {
        if (!this.audioContext || this.isPlaying) return;
        
        try {
            // 恢復 AudioContext（如果被暫停）
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            this.createAmbientSound();
            this.isPlaying = true;
        } catch (error) {
            console.warn('音頻播放失敗:', error);
        }
    }

    pause() {
        if (!this.audioContext || !this.isPlaying) return;
        
        this.oscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // 忽略已停止的振盪器錯誤
            }
        });
        
        this.oscillators = [];
        this.isPlaying = false;
    }

    createAmbientSound() {
        // 創建多個振盪器來模擬環境音效
        const frequencies = [220, 330, 440, 550]; // 基礎頻率
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            
            // 設定音量包絡
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + 2);
            
            // 連接節點
            oscillator.connect(gainNode);
            gainNode.connect(this.gainNode);
            
            // 啟動振盪器
            oscillator.start(this.audioContext.currentTime);
            
            // 添加頻率調變以創造更有趣的音效
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            
            lfo.frequency.setValueAtTime(0.1 + index * 0.1, this.audioContext.currentTime);
            lfoGain.gain.setValueAtTime(2, this.audioContext.currentTime);
            
            lfo.connect(lfoGain);
            lfoGain.connect(oscillator.frequency);
            lfo.start(this.audioContext.currentTime);
            
            this.oscillators.push(oscillator);
            this.oscillators.push(lfo);
        });
    }

    setVolume(volume) {
        if (this.gainNode) {
            this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        }
    }
}

// 導出給全局使用
window.AudioFallback = AudioFallback;
