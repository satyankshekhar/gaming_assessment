export class Timer {
    constructor(durationSeconds, onTick, onComplete) {
        this.durationMs = durationSeconds * 1000;
        this.onTick = onTick;
        this.onComplete = onComplete;
        this.startTime = null;
        this.pausedTime = null;
        this.accumulatedTime = 0;
        this.running = false;
        this.animationFrameId = null;
        
        this.tick = this.tick.bind(this);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.startTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.tick);
    }

    pause() {
        if (!this.running) return;
        this.running = false;
        this.accumulatedTime += performance.now() - this.startTime;
        cancelAnimationFrame(this.animationFrameId);
    }

    resume() {
        if (this.running) return;
        this.running = true;
        this.startTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this.tick);
    }

    stop() {
        this.running = false;
        cancelAnimationFrame(this.animationFrameId);
    }

    tick(now) {
        if (!this.running) return;
        
        const elapsed = this.accumulatedTime + (now - this.startTime);
        const remainingMs = Math.max(0, this.durationMs - elapsed);
        const remainingSec = Math.ceil(remainingMs / 1000);
        const progress = remainingMs / this.durationMs;

        if (this.onTick) {
            this.onTick(remainingSec, progress);
        }

        if (remainingMs <= 0) {
            this.running = false;
            if (this.onComplete) this.onComplete();
        } else {
            this.animationFrameId = requestAnimationFrame(this.tick);
        }
    }
    
    getElapsedMs() {
        if (!this.running) return this.accumulatedTime;
        return this.accumulatedTime + (performance.now() - this.startTime);
    }
}
