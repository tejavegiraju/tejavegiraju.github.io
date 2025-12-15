# Installation Guide - JS Script Runner Extension

## Quick Start

### 1. Generate Icons (Required)

1. Open `generate-icons.html` in your browser
2. Download all three icons:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`
3. Save them in the `js-extension/icons/` folder

### 2. Install Extension

#### Chrome:
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `js-extension` folder

#### Edge:
1. Open `edge://extensions/`
2. Enable "Developer mode" (left sidebar)
3. Click "Load unpacked"
4. Select the `js-extension` folder

### 3. Test the Extension

1. Navigate to any webpage (e.g., google.com)
2. Click the extension icon
3. Enter some text in the input field
4. Click "Execute Script"
5. Open browser console (F12) to see output

## Usage

### Basic Workflow

```
1. Click extension icon
   ↓
2. Enter input text
   ↓
3. Press "Execute Script" or Ctrl+Enter
   ↓
4. Popup closes automatically
   ↓
5. Script runs in background
   ↓
6. Check console for output
```

### Customizing the Function

Edit `background.js` and find this section:

```javascript
function abc(arg) {
  console.log(arg);
  
  // Add your custom code here:
  // Example: Click a button
  // document.querySelector('button')?.click();
  
  // Example: Fill input
  // document.querySelector('input')?.value = arg;
}
```

### Example Modifications

#### 1. Click Elements
```javascript
function abc(arg) {
  // Click element matching the input
  const element = document.querySelector(arg);
  if (element) element.click();
}
```

#### 2. Fill Forms
```javascript
function abc(arg) {
  // Fill all text inputs with the value
  const inputs = document.querySelectorAll('input[type="text"]');
  inputs.forEach(input => input.value = arg);
}
```

#### 3. Navigate Pages
```javascript
function abc(arg) {
  // Navigate to URL from input
  window.location.href = arg;
}
```

#### 4. Modify Page Content
```javascript
function abc(arg) {
  // Replace page content
  document.body.innerHTML = `<h1>${arg}</h1>`;
}
```

## Troubleshooting

### Extension Won't Load

**Check:**
- All files are present
- Icons are in `icons/` folder
- `manifest.json` is valid JSON
- No syntax errors in JS files

**Fix:**
- Reload extension in `chrome://extensions/`
- Check for error messages
- View service worker console

### Script Doesn't Execute

**Check:**
- Page is not a browser internal page
- Console is open to see errors
- Extension has permission for the page

**Fix:**
- Try on a simple webpage first (e.g., google.com)
- Check background service worker console
- Look for error notifications

### No Console Output

**Check:**
- DevTools is open (F12)
- Console tab is selected
- Filter is set to "All levels"

**Fix:**
- Ensure function actually logs to console
- Check if function completed successfully
- Look for JavaScript errors

### Permission Denied

**Issue:** Extension can't access certain pages

**Fix:**
- Extension cannot run on:
  - `chrome://` pages
  - `edge://` pages
  - Extension pages
  - Chrome Web Store
- Try on regular websites instead

## Advanced Configuration

### Change Execution Method

By default, scripts run in the page's main world. To change:

```javascript
// In background.js, find executeScript call:
const results = await chrome.scripting.executeScript({
  target: { tabId: tabId },
  func: funcToExecute,
  args: [input],
  world: 'MAIN' // Change to 'ISOLATED' for content script context
});
```

### Add Keyboard Shortcuts

Edit `manifest.json`:

```json
"commands": {
  "_execute_action": {
    "suggested_key": {
      "default": "Ctrl+Shift+J"
    }
  }
}
```

### Restrict to Specific Sites

Edit `manifest.json`:

```json
"host_permissions": [
  "https://*.example.com/*"
]
```

## Best Practices

### 1. Test on Simple Pages First
Start with basic websites before complex applications

### 2. Check Console Regularly
Always have DevTools open when testing

### 3. Handle Errors Gracefully
Wrap code in try-catch blocks:

```javascript
function abc(arg) {
  try {
    // Your code here
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### 4. Validate User Input
Always validate before using:

```javascript
function abc(arg) {
  if (!arg || typeof arg !== 'string') {
    console.error('Invalid input');
    return;
  }
  // Process valid input
}
```

### 5. Use Meaningful Logs
Help with debugging:

```javascript
console.log('Step 1: Starting execution');
console.log('Step 2: Found element:', element);
console.log('Step 3: Completed');
```

## Updating the Extension

After making changes:

1. Go to `chrome://extensions/`
2. Find "JS Script Runner"
3. Click the refresh icon 🔄
4. Test your changes

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "JS Script Runner"
3. Click "Remove"
4. Confirm removal

## Security Notes

- Extension only runs when you explicitly trigger it
- Requires active tab permission
- No automatic execution
- All code runs locally
- No data collection

## Getting Help

If you encounter issues:

1. **Check the console**: Look for error messages
2. **View service worker**: Inspect background script
3. **Test on simple page**: Verify basic functionality
4. **Check permissions**: Ensure extension can access page

### Useful Console Commands

```javascript
// In page console:
// Check if extension loaded
console.log('Extension active');

// Test element selection
document.querySelector('button');

// Check page context
window.location.href;
```

## Example Use Cases

### Auto-Fill Search Box
```javascript
function abc(arg) {
  const searchBox = document.querySelector('input[name="q"]');
  if (searchBox) {
    searchBox.value = arg;
    searchBox.form?.submit();
  }
}
```

### Auto-Click by Text
```javascript
function abc(arg) {
  const buttons = Array.from(document.querySelectorAll('button'));
  const target = buttons.find(btn => btn.textContent.includes(arg));
  if (target) target.click();
}
```

### Extract Page Data
```javascript
function abc(arg) {
  const data = {
    title: document.title,
    url: window.location.href,
    links: Array.from(document.querySelectorAll('a')).length
  };
  console.log(JSON.stringify(data, null, 2));
}
```

---

**Ready to use!** Load the extension and start executing scripts on web pages! ⚡

