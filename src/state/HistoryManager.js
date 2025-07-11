// History Manager for undo/redo

class HistoryManager {
    constructor(maxSize = 50) {
        this.history = [];
        this.historyIndex = -1;
        this.maxSize = maxSize;
    }

    save(state) {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(JSON.parse(JSON.stringify(state)));
        if (this.history.length > this.maxSize) this.history.shift();
        this.historyIndex = this.history.length - 1;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            return JSON.parse(JSON.stringify(this.history[this.historyIndex]));
        }
        return null;
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            return JSON.parse(JSON.stringify(this.history[this.historyIndex]));
        }
        return null;
    }

    canUndo() {
        return this.historyIndex > 0;
    }

    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }
}

export default HistoryManager;