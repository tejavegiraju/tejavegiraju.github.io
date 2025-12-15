# JS Script Runner - Chrome/Edge Extension

A production-level Chrome/Edge extension for executing custom JavaScript functions on web pages with user input.

## Features

### 🚀 Core Functionality
- **User Input Interface**: Clean popup to enter custom input
- **Background Execution**: Script runs even after popup closes
- **Page Interaction**: Can interact with page elements (click, type, etc.)
- **Execution History**: Keeps track of recent executions
- **Real-time Feedback**: Visual status updates and notifications

### ⚡ Technical Features
- **Manifest V3**: Uses latest Chrome extension architecture
- **Content Scripts**: Runs in page context for full DOM access
- **Background Service Worker**: Manages execution lifecycle
- **Keyboard Shortcuts**: Ctrl+Enter to execute, Esc to close
- **Error Handling**: Comprehensive error catching and reporting

## Installation

### From Source (Developer Mode)

1. **Download/Clone** the `js-extension` folder

2. **Open Extension Management**:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

3. **Enable Developer Mode**:
   - Toggle "Developer mode" in the top right

4. **Load Extension**:
   - Click "Load unpacked"
   - Select the `js-extension` folder

5. **Generate Icons** (Optional but recommended):
   - Open `generate-icons.html` in browser
   - Download the 3 icons
   - Save to `js-extension/icons/` folder

## Usage

### Basic Usage

1. **Navigate** to any webpage
2. **Click** the extension icon
3. **Enter** your input in the text field
4. **Click** "Execute Script" or press `Ctrl+Enter`
5. **Check** the browser console for output

### The JavaScript Function

The extension executes this function with your input:

```javascript
function abc(arg) {
  console.log(arg);
  
  // Can interact with page elements:
  // document.querySelector('button')?.click();
  // document.querySelector('input')?.value = arg;
}
```

### Example Use Cases

#### 1. Console Logging
```
Input: "Hello World"
Result: Logs "Hello World" to console
```

#### 2. Fill Form Fields
```javascript
// Modify function in background.js:
function abc(arg) {
  const input = document.querySelector('input[type="text"]');
  if (input) input.value = arg;
}
```

#### 3. Click Buttons
```javascript
function abc(arg) {
  const button = document.querySelector(`button:contains("${arg}")`);
  if (button) button.click();
}
```

#### 4. Change Page Content
```javascript
function abc(arg) {
  document.body.innerHTML = `<h1>${arg}</h1>`;
}
```

## Customization

### Modify the Function

Edit `background.js`, find the `abc` function:

```javascript
function abc(arg) {
  // Your custom logic here
  console.log(arg);
  
  // Example: Click first button
  document.querySelector('button')?.click();
  
  // Example: Fill input field
  document.querySelector('input')?.value = arg;
  
  // Example: Submit form
  document.querySelector('form')?.submit();
}
```

### Add Multiple Functions

You can add multiple functions:

```javascript
function abc(arg) {
  // Function 1
  console.log(arg);
}

function xyz(arg) {
  // Function 2
  alert(arg);
}

// Call both
abc(userInput);
xyz(userInput);
```

## File Structure

```
js-extension/
├── manifest.json           # Extension configuration
├── background.js           # Background service worker
├── popup.html             # Popup interface
├── generate-icons.html    # Icon generator tool
├── README.md              # This file
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── scripts/
│   ├── popup.js          # Popup logic
│   └── content.js        # Content script (optional)
└── styles/
    └── popup.css         # Popup styling
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Enter` | Execute script |
| `Esc` | Close popup |

## Permissions

- **activeTab**: Access current tab
- **scripting**: Execute scripts on pages
- **storage**: Save execution history
- **host_permissions**: Access all URLs

## Browser Compatibility

- ✅ Chrome 88+
- ✅ Edge 88+
- ✅ Any Chromium-based browser with Manifest V3

## Limitations

### Cannot Run On:
- ❌ Browser internal pages (`chrome://`, `edge://`)
- ❌ Extension pages (`chrome-extension://`)
- ❌ Chrome Web Store pages

### Security:
- ✅ Runs only when user triggers it
- ✅ Requires active tab permission
- ✅ Shows which tab is being accessed

## Debugging

### Check Console Output

1. Open DevTools on the webpage (`F12`)
2. Go to Console tab
3. Execute script from extension
4. See output in console

### Check Extension Logs

1. Go to `chrome://extensions/`
2. Find "JS Script Runner"
3. Click "Inspect views: service worker"
4. View background script logs

### Check Popup Logs

1. Open extension popup
2. Right-click popup → Inspect
3. View popup console

## Common Issues

### Script Doesn't Execute

**Check:**
1. Page is not a browser internal page
2. Extension has permission for the page
3. Console shows no errors
4. Input field is not empty

### No Output in Console

**Check:**
1. DevTools is open on the correct page
2. Console filter is set to "All levels"
3. Function is actually logging output

### Function Can't Find Elements

**Solution:**
```javascript
// Wait for element
function abc(arg) {
  const element = document.querySelector(arg);
  if (!element) {
    console.error('Element not found:', arg);
    return;
  }
  element.click();
}
```

## Advanced Usage

### Wait for Page Load

```javascript
function abc(arg) {
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => abc(arg));
    return;
  }
  // Execute when page is ready
  console.log(arg);
}
```

### Execute Multiple Times

```javascript
function abc(arg) {
  // Execute every second
  setInterval(() => {
    console.log(arg);
  }, 1000);
}
```

### Access Page Variables

```javascript
function abc(arg) {
  // Access page's jQuery (if available)
  if (typeof $ !== 'undefined') {
    $(arg).click();
  }
}
```

## Security Best Practices

1. **Validate Input**: Always validate user input
2. **Sanitize HTML**: Escape HTML if inserting into DOM
3. **Use Permissions Wisely**: Only request needed permissions
4. **Error Handling**: Always catch errors
5. **User Consent**: Make it clear what script does

## Examples

### Example 1: Search Page
```javascript
function abc(arg) {
  const searchBox = document.querySelector('input[type="search"]');
  if (searchBox) {
    searchBox.value = arg;
    searchBox.form?.submit();
  }
}
```

### Example 2: Auto-Fill Form
```javascript
function abc(arg) {
  const fields = document.querySelectorAll('input[type="text"]');
  fields.forEach(field => field.value = arg);
}
```

### Example 3: Highlight Text
```javascript
function abc(arg) {
  const text = document.body.innerText;
  if (text.includes(arg)) {
    document.body.innerHTML = text.replace(
      new RegExp(arg, 'g'),
      `<mark>${arg}</mark>`
    );
  }
}
```

## Future Enhancements

- [ ] Save custom functions
- [ ] Function templates
- [ ] Multiple function execution
- [ ] Scheduled execution
- [ ] Variable substitution
- [ ] Import/Export scripts

## Privacy

This extension:
- ✅ Runs entirely locally
- ✅ No data collection
- ✅ No network requests
- ✅ No analytics
- ✅ Open source

## Support

For issues:
1. Check console for errors
2. Verify page permissions
3. Test on simple webpage first
4. Check extension is enabled

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Manifest Version**: 3
