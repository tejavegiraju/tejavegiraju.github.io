// Popup Script - JS Script Runner

class ScriptRunner {
  constructor() {
    this.userInput = document.getElementById('userInput');
    this.executeBtn = document.getElementById('executeBtn');
    this.clearBtn = document.getElementById('clearBtn');
    this.status = document.getElementById('status');
    this.history = document.getElementById('history');
    this.showDetailsToggle = document.getElementById('showDetailsToggle');
    this.detailsSection = document.getElementById('detailsSection');
    
    this.attachEventListeners();
    this.loadHistory();
    this.focusInput();
  }

  attachEventListeners() {
    // Execute button
    this.executeBtn.addEventListener('click', () => this.executeScript());
    
    // Clear button (now acts as Cancel - closes popup)
    this.clearBtn.addEventListener('click', () => window.close());
    
    // Toggle details section
    this.showDetailsToggle.addEventListener('change', (e) => {
      this.detailsSection.style.display = e.target.checked ? 'block' : 'none';
    });
    
    // Keyboard shortcuts
    this.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        this.executeScript();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        window.close();
      }
    });
  }

  focusInput() {
    setTimeout(() => this.userInput.focus(), 100);
  }

  clearInput() {
    this.userInput.value = '';
    this.hideStatus();
    this.focusInput();
  }

  async executeScript() {
    const rawInput = this.userInput.value.trim();
    
    if (!rawInput) {
      this.showStatus('Please enter some input', 'error');
      return;
    }

    // Extract and filter strings: 5 < length <= 10
    const extractedStrings = this.extractValidStrings(rawInput);
    
    if (extractedStrings.length === 0) {
      this.showStatus('No valid strings found (must be 5-10 characters)', 'error');
      return;
    }

    // Join extracted strings with space
    const input = extractedStrings.join(' ');

    // Disable button and show loading
    this.executeBtn.disabled = true;
    this.executeBtn.classList.add('loading');
    this.showStatus(`Executing with ${extractedStrings.length} string(s)...`, 'info');

    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }

      // Check if we can access this page
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || 
          tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
        throw new Error('Cannot execute scripts on browser internal pages');
      }

      // Send message to background script to execute on the page
      const response = await chrome.runtime.sendMessage({
        type: 'executeScript',
        input: input,
        tabId: tab.id
      });

      if (response && response.success) {
        this.showStatus('✓ Script executed successfully!', 'success');
        this.addToHistory(input);
        
        // Keep popup open for 1.5 seconds to show success, then close
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        console.error((response && response.error) || 'Execution failed');
      }

    } catch (error) {
      console.error('Execution error:', error);
      this.showStatus(`✗ Error: ${error.message}`, 'error');
    } finally {
      // Re-enable button
      this.executeBtn.disabled = false;
      this.executeBtn.classList.remove('loading');
    }
  }

  showStatus(message, type) {
    this.status.textContent = message;
    this.status.className = `status show ${type}`;
  }

  hideStatus() {
    this.status.className = 'status';
  }

  addToHistory(input) {
    // Get existing history
    chrome.storage.local.get(['executionHistory'], (result) => {
      const history = result.executionHistory || [];
      
      // Add new entry
      history.unshift({
        input: input,
        timestamp: Date.now()
      });

      // Keep only last 10 entries
      const trimmedHistory = history.slice(0, 10);

      // Save back
      chrome.storage.local.set({ executionHistory: trimmedHistory }, () => {
        this.loadHistory();
      });
    });
  }

  loadHistory() {
    chrome.storage.local.get(['executionHistory'], (result) => {
      const history = result.executionHistory || [];
      
      if (history.length === 0) {
        this.history.innerHTML = '<div class="history-empty">No executions yet</div>';
        return;
      }

      this.history.innerHTML = history.map(item => {
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        return `
          <div class="history-item" title="${this.escapeHtml(item.input)}">
            <span class="history-input">${this.escapeHtml(item.input)}</span>
            <span class="history-time">${timeStr}</span>
          </div>
        `;
      }).join('');

      // Add click handlers to history items
      this.history.querySelectorAll('.history-item').forEach((item, index) => {
        item.addEventListener('click', () => {
          this.userInput.value = history[index].input;
          this.focusInput();
        });
      });
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  extractValidStrings(input) {
    // Split by any whitespace (spaces, tabs, newlines) and punctuation
    const tokens = input.split(/[\s,;:|]+/);
    
    // Process each token: keep only alphanumeric characters, then filter by length
    const validStrings = tokens
      .map(str => {
        // Remove all non-alphanumeric characters (keep only A-Z, a-z, 0-9)
        return str.replace(/[^a-zA-Z0-9]/g, '');
      })
      .filter(str => {
        // Filter: length > 5 and length <= 10
        return str.length > 5 && str.length <= 10;
      });
    
    return validStrings;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ScriptRunner();
});
