// Background Service Worker - JS Script Runner

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'executeScript') {
    executeScriptOnTab(message.tabId, message.input)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }
});

// Define the function that will be executed on the page
// This is the actual function that runs in the page context
// NOTE: This function runs in the page's JavaScript context, NOT in the extension context
// So it cannot access chrome.storage or other extension APIs
const funcToExecute = function(userInput) {
    console.log('funcToExecute called with input:', userInput);
    
    const copyToClipboard = async function (text) {
        try {
            await navigator.clipboard.writeText(text);
            console.log('Text successfully copied to clipboard:', text);
        } catch (err) {
            console.error('Failed to copy text to clipboard:', err);
        }
    }

    const getElementByXPath = function (xpath) {
        const result = document.evaluate(
            xpath, 
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE, 
            null
        );
        return result.singleNodeValue; 
    }

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    const claim = async function(str, index, total) {
        try {
            console.log(`\n=== Processing ${index}/${total}: ${str.toUpperCase()} ===`);
            
            // // Focus window before starting
            // focusWindow();
            await sleep(500);
            
            const MAIN_BUTTON_XPATH = '//button[text()="Claim"]';
            const PAST_BUTTON_XPATH = '//button[text()="Paste"]';
            const OPEN_BUTTON_XPATH = '//button[text()="Open"]';
            const CLOSE_BUTTON_XPATH = '//*[@fill="PrimaryText"]';

            // Step 1: Copy to clipboard
            console.log(`[${index}/${total}] Copying to clipboard:`, str);
            await copyToClipboard(str);
            await sleep(300);
            
            // Step 2: Click Paste button
            const pasteBtn = getElementByXPath(PAST_BUTTON_XPATH);
            if (pasteBtn) { 
                pasteBtn.click();
                console.log(`[${index}/${total}] Clicked 'Paste' button`);
            } else {
                console.warn(`[${index}/${total}] Paste button not found`);
            }
            await sleep(500);

            // Step 3: Click Claim button
            const mainButton = getElementByXPath(MAIN_BUTTON_XPATH);
            if (mainButton) {
                mainButton.click();
                console.log(`[${index}/${total}] Clicked 'Claim' button`);
            } else {
                console.warn(`[${index}/${total}] Claim button not found`);
            }
            await sleep(1500);
            
            // Step 4: Click Open button
            const openButton = getElementByXPath(OPEN_BUTTON_XPATH);
            if (openButton) {
                openButton.click();
                console.log(`[${index}/${total}] Clicked 'Open' button`);
                await sleep(4000);
            } else {
                console.log(`[${index}/${total}] Open button not found (may be optional)`);
                // await sleep(500);
            }
            
            // Step 5: Click Close button
            const closeButton = getElementByXPath(CLOSE_BUTTON_XPATH);
            if (closeButton) {
                closeButton.parentNode.click();
                console.log(`[${index}/${total}] Clicked 'Close' button`);
                await sleep(2000);
            } else {
                console.log(`[${index}/${total}] Close button not found (may be optional)`);
                // await sleep(500);
            }
            
            console.log(`[${index}/${total}] ✓ Completed: ${str.toUpperCase()}`);
            
        } catch (error) {
            console.error(`[${index}/${total}] ✗ Error processing ${str}:`, error);
            throw error;
        }
    }
    
    // Process the input string (already filtered by background script)
    const stringList = userInput
        .split(/[,\s]+/)
        .filter(item => item.trim() !== '');
    
    console.log(`\n🚀 Starting sequential processing of ${stringList.length} string(s):`, stringList);
    
    // Process all strings sequentially (one after another)
    // Return a promise that resolves when all processing is complete
    return (async () => {
        for (let i = 0; i < stringList.length; i++) {
            const str = stringList[i];
            const len = str.length;
            if (len <= 9 && len >= 5) {
                console.log(`\n--- Starting claim ${i + 1}/${stringList.length} ---`);
                await claim(str, i + 1, stringList.length);
            }
            
            // Wait between claims (except after the last one)
            if (i < stringList.length - 1) {
                console.log(`Waiting before next claim...`);
                await sleep(1000);
            }
        }
        console.log(`\n✅ All ${stringList.length} claims processed successfully!`);
        return { success: true, processed: stringList.length };
    })();
};

// Execute the script on the specified tab
async function executeScriptOnTab(tabId, input) {
    try {
        // Get the tab information to find its window
        const tab = await chrome.tabs.get(tabId);
        
        // Focus the window containing the tab
        await chrome.windows.update(tab.windowId, { focused: true });
        
        // Activate the specific tab within that window
        await chrome.tabs.update(tabId, { active: true });
        
        // Small delay to ensure window is focused
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('About to execute script with input:', input);
        
        // PRE-PROCESS: Get already processed strings from storage (in extension context)
        const processedStrings = await new Promise((resolve) => {
            chrome.storage.local.get(['processedStrings'], (result) => {
                console.log('Retrieved processed strings:', result.processedStrings);
                resolve(result.processedStrings || []);
            });
        });
        
        // Filter input to remove already-processed strings
        const inputStrings = input.split(/[\s,]+/).filter(item => item.trim() !== '');
        const newStringsToProcess = [];
        const filteredInput = [];
        
        inputStrings.forEach(str => {
            const len = str.length;
            if (len > 5 && len <= 10) {
                if (processedStrings.includes(str.toUpperCase())) {
                    console.log(`Skipping already processed string: ${str.toUpperCase()}`);
                } else {
                    console.log(`Will process string: ${str.toUpperCase()}`);
                    filteredInput.push(str);
                    newStringsToProcess.push(str.toUpperCase());
                }
            }
        });
        
        if (filteredInput.length === 0) {
            console.log('No new strings to process');
            showNotification('JS Script Runner', 'All strings already processed!');
            return { success: true, message: 'All strings already processed' };
        }
        
        // Join filtered strings back into space-separated string
        const filteredInputString = filteredInput.join(' ');
        
        console.log('Executing script on page with filtered input:', filteredInputString);
        
        // Execute the script in the page context
        const results = await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: funcToExecute,
            args: [filteredInputString],
            world: 'MAIN' // Execute in page's main world to access page's JavaScript
        });
        
        console.log('Script execution initiated, waiting for completion...');
        
        // Wait for the result from the injected function
        if (results && results[0] && results[0].result) {
            const result = await results[0].result; // Await the promise returned by funcToExecute
            console.log('Script execution completed:', result);
        } else {
            console.log('Script execution completed (no return value)');
        }
        
        // POST-PROCESS: Save newly processed strings to storage (in extension context)
        if (newStringsToProcess.length > 0) {
            await new Promise((resolve) => {
                const updatedList = [...processedStrings, ...newStringsToProcess];
                const trimmedList = updatedList.slice(-1000);
                
                chrome.storage.local.set({ processedStrings: trimmedList }, () => {
                    console.log(`Saved ${newStringsToProcess.length} new string(s) to storage`);
                    resolve();
                });
            });
        }
        
        // Show notification AFTER all processing is complete
        console.log('All processing complete, showing notification');
        showNotification('JS Script Runner', `✅ Processed ${filteredInput.length} claim(s) successfully!`);

        /*if (results && results[0]) {
            const result = results[0].result;
            
            if (result && result.success) {
                console.log('Script executed successfully:', result);
                
                // Show notification
                showNotification('Script Executed', result.message || 'Function executed successfully');
                
                return { success: true, result: result };
            } else {
                throw new Error(result?.error || 'Execution failed');
            }
        } else {
            throw new Error('No result returned from script execution');
        }*/
    } catch (error) {
        console.error('Error executing script:', error);

        // Show error notification
        showNotification('Execution Error', error.message);

        throw error;
    }
}

// Show notification (optional, with error handling)
function showNotification(title, message) {
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title,
      message: message,
      priority: 1,
      silent: true
    });
  } catch (error) {
    console.log('Notification error:', error);
  }
}

// Log when extension is installed
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('JS Script Runner extension installed');
    showNotification(
      'JS Script Runner Installed', 
      'Click the extension icon to run scripts on web pages'
    );
  }
});

console.log('JS Script Runner background service worker loaded');
