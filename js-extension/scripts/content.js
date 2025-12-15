// Content Script - JS Script Runner
// This script runs in every webpage and can communicate with the page

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'executeFunction') {
    try {
      // Execute the function in the page context
      const result = executeInPageContext(message.input);
      sendResponse({ success: true, result: result });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
    return true;
  }
});

// Execute function in the page's context
function executeInPageContext(input) {
  // This function will have access to the page's DOM and JavaScript
  
  // Define your custom function here
  function abc(arg) {
    console.log('JS Script Runner - Received input:', arg);
    
    // Your custom logic here
    // This can interact with page elements
    
    // Example: Log to console
    console.log(arg);
    
    // Return result
    return {
      success: true,
      input: arg,
      timestamp: new Date().toISOString()
    };
  }
  
  // Execute the function
  const result = abc(input);
  return result;
}

// Log when content script loads
console.log('JS Script Runner content script loaded');
