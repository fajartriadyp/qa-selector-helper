console.log("QA Selector Helper: Content Script Loaded.");

// --- Globals for Hover Mode ---
let isHoverModeActive = false;
let pageTooltip = null;
let currentlyHighlightedElement = null;
let isTooltipPinned = false;
let pinnedElement = null;
let pinnedElementData = null;
// ---

function getCSSPath(element) {
    if (!(element instanceof Element)) {
        console.warn("getCSSPath: input is not an Element", element);
        return null;
    }
    if (element.id) {
        // Ensure IDs are valid CSS identifiers. If not, escape them.
        // Basic check: if it contains spaces or starts with a digit, it might need escaping.
        // For simplicity here, we assume valid IDs or use attribute selector for problematics.
        if (/^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(element.id)) {
            return `#${element.id}`;
        } else {
            // If ID is not a simple valid identifier, use attribute selector form
            return `[id="${element.id.replace(/"/g, '\\"')}"]`;
        }
    }

    const path = [];
    let current = element;

    while (current && current.parentElement && current !== document.body && current !== document.documentElement) {
        let selector = current.tagName.toLowerCase();
        const parent = current.parentElement;

        if (parent) {
            // Check for data-testid on the element itself first
            const dataTestId = current.getAttribute('data-testid');
            if (dataTestId) {
                selector = `${selector}[data-testid="${dataTestId.replace(/"/g, '\\"')}"]`;
                // If unique enough with data-testid, we could potentially stop here or make it preferred.
                // For a full path, we continue, but this makes the segment more robust.
            } else if (current.className && typeof current.className === 'string') {
                const classes = current.className.trim().split(/\s+/).filter(c => c);
                if (classes.length > 0) {
                    // Add only the first class to keep it shorter, or all if desired
                    selector += `.${classes.join('.')}`;
                }
            }

            const siblings = Array.from(parent.children)
                .filter(sibling => sibling.tagName === current.tagName);

            if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                selector += `:nth-child(${index})`;
            }
        }
        path.unshift(selector);
        current = parent;
    }
    // Add body or html if path is very short (direct child of body/html)
    if (path.length === 0 && current === document.body) return 'body';
    if (path.length === 0 && current === document.documentElement) return 'html';
    
    return path.join(' > ');
}

function getXPath(element) {
    if (!(element instanceof Element)) {
        return null;
    }
    
    if (element.id) {
        return `//*[@id="${element.id}"]`;
    }
    
    if (element === document.body) {
        return '/html/body';
    }
    
    if (element === document.documentElement) {
        return '/html';
    }
    
    let path = '';
    let current = element;
    
    while (current && current.parentElement) {
        let index = 1;
        let sibling = current.previousElementSibling;
        
        while (sibling) {
            if (sibling.tagName === current.tagName) {
                index++;
            }
            sibling = sibling.previousElementSibling;
        }
        
        const tagName = current.tagName.toLowerCase();
        const pathIndex = (index > 1) ? `[${index}]` : '';
        path = `/${tagName}${pathIndex}${path}`;
        
        current = current.parentElement;
        
        if (current === document.body) {
            path = '/html/body' + path;
            break;
        }
    }
    
    return path;
}

function generateElementData(element) {
    if (!(element instanceof Element)) {
        return null;
    }

    const data = {
        tagName: element.tagName.toLowerCase(),
        id: element.id || null,
        classes: element.className && typeof element.className === 'string' ? element.className.trim() : null,
        cssPath: getCSSPath(element),
        dataAttributes: {},
        selectors: [] // Array untuk menyimpan semua selector yang mungkin
    };

    // Extract all data-* attributes
    for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes[i];
        if (attr.name.startsWith('data-')) {
            data.dataAttributes[attr.name] = attr.value;
        }
    }
    
    // Specifically pull out data-testid if it exists, for convenience
    data.dataTestId = element.getAttribute('data-testid') || null;

    // Generate semua selector yang mungkin dalam urutan prioritas QA
    if (element.id) {
        data.selectors.push({
            type: 'ID',
            value: `#${element.id.replace(/"/g, '\\"')}`,
            priority: 1
        });
    }

    if (data.dataTestId) {
        data.selectors.push({
            type: 'Data Test ID',
            value: `[data-testid="${data.dataTestId.replace(/"/g, '\\"')}"]`,
            priority: 2
        });
    }

    // Data attributes lainnya
    Object.keys(data.dataAttributes).forEach(attrName => {
        if (attrName !== 'data-testid') {
            data.selectors.push({
                type: attrName.charAt(0).toUpperCase() + attrName.slice(1),
                value: `[${attrName}="${data.dataAttributes[attrName].replace(/"/g, '\\"')}"]`,
                priority: 3
            });
        }
    });

    // Class selector
    if (data.classes) {
        const classList = data.classes.split(/\s+/).filter(c => c);
        if (classList.length > 0) {
            data.selectors.push({
                type: 'Class',
                value: `.${classList.join('.')}`,
                priority: 4
            });
        }
    }

    // XPath
    const xpath = getXPath(element);
    if (xpath) {
        data.selectors.push({
            type: 'XPath',
            value: xpath,
            priority: 5
        });
    }

    // CSS Path
    if (data.cssPath) {
        data.selectors.push({
            type: 'CSS Path',
            value: data.cssPath,
            priority: 6
        });
    }

    // Sort selectors by priority
    data.selectors.sort((a, b) => a.priority - b.priority);

    return data;
}

function scanPageForSelectors() {
    console.log("scanPageForSelectors called");
    const elementsData = [];
    const targetElements = document.querySelectorAll('*[id], *[data-testid]');

    targetElements.forEach(element => {
        if (element.closest('.qa-extension-popup') || element.closest('.qa-hover-overlay') || element.closest('.qa-hover-tooltip') || element.id === 'qa-cs-tooltip-unique-id') {
            return; 
        }
        const data = generateElementData(element);
        if (data) {
            elementsData.push(data);
        }
    });
    
    // Sort elements: ID elements first, then data-testid, then others
    elementsData.sort((a, b) => {
        const aHasId = a.id ? 1 : 0;
        const bHasId = b.id ? 1 : 0;
        const aHasDataTestId = a.dataTestId ? 1 : 0;
        const bHasDataTestId = b.dataTestId ? 1 : 0;
        
        // Sort by ID first (highest priority)
        if (aHasId !== bHasId) {
            return bHasId - aHasId;
        }
        
        // Then by data-testid
        if (aHasDataTestId !== bHasDataTestId) {
            return bHasDataTestId - aHasDataTestId;
        }
        
        // Then alphabetically by tag name
        return a.tagName.localeCompare(b.tagName);
    });
    
    console.log("Found elements data for scan:", elementsData);
    return elementsData;
}

// --- Tooltip and Highlight Functions ---
function createPageTooltip() {
    if (pageTooltip) return; // Already created
    pageTooltip = document.createElement('div');
    pageTooltip.id = 'qa-cs-tooltip-unique-id'; // Give it a unique ID
    pageTooltip.className = 'qa-cs-tooltip'; // Use class from content-styles.css
    
    // Ensure body exists before appending. In content scripts, it usually does by the time they run.
    if (document.body) {
        document.body.appendChild(pageTooltip);
        console.log("QA Selector Helper: Page tooltip created and appended to document.body.");
    } else {
        console.error("QA Selector Helper: document.body not found in content script when trying to create tooltip!");
    }
}

function showPageTooltip(elementData, event) {
    if (!pageTooltip || !elementData) return;

    let primarySelector = elementData.cssPath || 'N/A';
    if (elementData.id) primarySelector = `#${elementData.id.replace(/"/g, '\\"')}`;
    else if (elementData.dataTestId) primarySelector = `[data-testid="${elementData.dataTestId.replace(/"/g, '\\"')}"]`;

    // Build tooltip content with all available selectors
    let tooltipContent = `<strong>Tag:</strong> ${elementData.tagName}<br>`;
    
    if (elementData.selectors && elementData.selectors.length > 0) {
        tooltipContent += `<strong>Selectors:</strong><br>`;
        elementData.selectors.forEach((selector, index) => {
            const escapedValue = selector.value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            tooltipContent += `<span style="color: #fbbf24; font-size: 10px;">${selector.type}:</span> <span style="color: #e5e7eb; font-family: monospace; font-size: 11px;">${escapedValue}</span>`;
            
            // Add copy button for each selector
            tooltipContent += `<button class="qa-tooltip-copy-btn" data-selector="${selector.value.replace(/"/g, '&quot;')}" style="background: #f59e0b; color: white; border: none; border-radius: 3px; padding: 2px 6px; margin-left: 8px; font-size: 10px; cursor: pointer;">📋</button><br>`;
        });
    } else {
        tooltipContent += `<strong>Selector:</strong> ${primarySelector.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`;
    }

    if (elementData.classes) {
        tooltipContent += `<br><strong>Classes:</strong> ${elementData.classes.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`;
    }

    pageTooltip.innerHTML = tooltipContent;

    // Add event listeners for copy buttons
    pageTooltip.querySelectorAll('.qa-tooltip-copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const selector = btn.getAttribute('data-selector');
            copyToClipboard(selector, btn);
        });
    });

    let x = event.clientX + 15;
    let y = event.clientY + 15;
    pageTooltip.style.left = x + 'px';
    pageTooltip.style.top = y + 'px';
    pageTooltip.style.display = 'block';
    pageTooltip.classList.add('visible'); 

    requestAnimationFrame(() => { 
        const rect = pageTooltip.getBoundingClientRect();
        if (x + rect.width > window.innerWidth) {
            x = window.innerWidth - rect.width - 5;
        }
        if (y + rect.height > window.innerHeight) {
            y = window.innerHeight - rect.height - 5;
        }
        pageTooltip.style.left = x + 'px';
        pageTooltip.style.top = y + 'px';
    });
}

function hidePageTooltip() {
    if (pageTooltip) {
        pageTooltip.classList.remove('visible');
        pageTooltip.style.display = 'none';
    }
}

function applyElementHighlight(element) {
    if (!(element instanceof Element)) return;
    
    // Don't apply highlight if it's the pinned element (it already has pinned highlight)
    if (element === pinnedElement) {
        return;
    }
    
    removeElementHighlight(); // Remove from previous
    element.classList.add('qa-cs-highlight');
    currentlyHighlightedElement = element;
}

function removeElementHighlight() {
    if (currentlyHighlightedElement) {
        // Don't remove highlight if it's the pinned element
        if (currentlyHighlightedElement !== pinnedElement) {
            currentlyHighlightedElement.classList.remove('qa-cs-highlight');
        }
        currentlyHighlightedElement = null;
    }
}

function copyToClipboard(text, buttonElement) {
    navigator.clipboard.writeText(text).then(() => {
        const originalText = buttonElement.textContent;
        buttonElement.textContent = '✓';
        buttonElement.style.background = '#10b981';
        
        setTimeout(() => {
            buttonElement.textContent = originalText;
            buttonElement.style.background = '#f59e0b';
        }, 1000);
    }).catch(err => {
        console.warn('Async clipboard write failed, trying fallback:', err);
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        textArea.setSelectionRange(0, 99999);

        try {
            const successful = document.execCommand('copy');
            if(successful){
                const originalText = buttonElement.textContent;
                buttonElement.textContent = '✓';
                buttonElement.style.background = '#10b981';
                setTimeout(() => {
                    buttonElement.textContent = originalText;
                    buttonElement.style.background = '#f59e0b';
                }, 1000);
            } else {
                console.error('Fallback copy command failed');
            }
        } catch (e) {
            console.error('Fallback copy failed with exception', e);
        }
        document.body.removeChild(textArea);
    });
}

// --- Event Handlers for Hover Mode ---
function handlePageMouseOver(event) {
    if (!isHoverModeActive) {
        return;
    }
    const target = event.target;
    if (!target || target.id === 'qa-cs-tooltip-unique-id' || target.closest('.qa-cs-tooltip')) {
        return;
    }

    console.log("QA Selector Helper (Content Script): Processing hover for element:", target);
    
    // If tooltip is pinned, don't change it - only highlight the hovered element temporarily
    if (isTooltipPinned) {
        // Remove temporary highlight from all other elements except pinned element
        document.querySelectorAll('.qa-cs-temp-hover').forEach(el => {
            if (el !== target && el !== pinnedElement) {
                el.classList.remove('qa-cs-temp-hover');
            }
        });
        
        // Only apply temporary highlight to hovered element (not the pinned one)
        if (target !== pinnedElement) {
            // Apply temporary highlight to current hovered element
            target.classList.add('qa-cs-temp-hover');
        }
        return; // Don't change the pinned tooltip
    }
    
    // Normal hover behavior when not pinned
    const elementData = generateElementData(target);
    if (elementData) {
        applyElementHighlight(target);
        showPageTooltip(elementData, event);
    }
}

function handlePageMouseOut(event) {
    if (!isHoverModeActive) {
        return;
    }
    if (event.relatedTarget && (event.relatedTarget.id === 'qa-cs-tooltip-unique-id' || event.relatedTarget.closest('.qa-cs-tooltip'))) {
        return;
    }
    
    const target = event.target;
    
    // If tooltip is pinned, only remove temporary hover highlight
    if (isTooltipPinned) {
        if (target && target !== pinnedElement) {
            target.classList.remove('qa-cs-temp-hover');
        }
        return; // Don't hide pinned tooltip
    }
    
    // Normal behavior when not pinned
    hidePageTooltip();
    removeElementHighlight();
}

function handlePageRightClick(event) {
    if (!isHoverModeActive) {
        return;
    }
    
    const target = event.target;
    if (!target || target.id === 'qa-cs-tooltip-unique-id' || target.closest('.qa-cs-tooltip')) {
        return;
    }
    
    // Prevent default context menu
    event.preventDefault();
    
    console.log("QA Selector Helper (Content Script): Right click detected on element:", target);
    
    if (isTooltipPinned) {
        // Unpin current tooltip
        unpinTooltip();
    } else {
        // Pin tooltip to current element
        const elementData = generateElementData(target);
        if (elementData) {
            pinTooltip(target, elementData, event);
        }
    }
}

function pinTooltip(element, elementData, event) {
    isTooltipPinned = true;
    pinnedElement = element;
    pinnedElementData = elementData;
    
    console.log("QA Selector Helper (Content Script): Tooltip PINNED to element:", element);
    
    // Apply special highlight for pinned element
    applyElementHighlight(element);
    element.classList.add('qa-cs-pinned');
    
    // Show tooltip at the pinned position
    showPageTooltip(elementData, event);
    
    // Add pinned indicator to tooltip
    if (pageTooltip) {
        pageTooltip.classList.add('qa-cs-tooltip-pinned');
        addPinnedIndicator();
    }
}

function unpinTooltip() {
    isTooltipPinned = false;
    
    console.log("QA Selector Helper (Content Script): Tooltip UNPINNED");
    
    // Remove special highlight from pinned element
    if (pinnedElement) {
        pinnedElement.classList.remove('qa-cs-pinned');
        pinnedElement = null;
    }
    
    pinnedElementData = null;
    
    // Remove pinned indicator from tooltip
    if (pageTooltip) {
        pageTooltip.classList.remove('qa-cs-tooltip-pinned');
        removePinnedIndicator();
    }
    
    // Remove all temporary hover highlights
    document.querySelectorAll('.qa-cs-temp-hover').forEach(el => {
        el.classList.remove('qa-cs-temp-hover');
    });
    
    // Hide tooltip and remove highlight
    hidePageTooltip();
    removeElementHighlight();
}

function addPinnedIndicator() {
    if (pageTooltip) {
        // Add pinned indicator text
        const pinnedIndicator = pageTooltip.querySelector('.qa-pinned-indicator');
        if (!pinnedIndicator) {
            const indicator = document.createElement('div');
            indicator.className = 'qa-pinned-indicator';
            indicator.innerHTML = `
                <div style="background: #8b5cf6; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-bottom: 8px; text-align: center;">
                    📌 PINNED - Right click to unpin
                </div>
            `;
            pageTooltip.insertBefore(indicator, pageTooltip.firstChild);
        }
    }
}

function removePinnedIndicator() {
    if (pageTooltip) {
        const pinnedIndicator = pageTooltip.querySelector('.qa-pinned-indicator');
        if (pinnedIndicator) {
            pinnedIndicator.remove();
        }
    }
}

// Initialize tooltip once when script loads
createPageTooltip(); 

// Add event listeners for hover (will only act if isHoverModeActive is true)
document.addEventListener('mouseover', handlePageMouseOver, true); // Use capturing for broader reach
document.addEventListener('mouseout', handlePageMouseOut, true);   // Use capturing
document.addEventListener('contextmenu', handlePageRightClick, true); // Right click for pin/unpin

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("QA Selector Helper (Content Script): Message received:", request);

  if (request.action === "ping_content_script") {
    console.log("QA Selector Helper (Content Script): Received ping from popup.");
    sendResponse({ status: "success", message: "Pong from Content Script!" });
  } else if (request.action === "scan_page_elements") {
    console.log("QA Selector Helper (Content Script): Received scan_page_elements request.");
    const elementsArray = scanPageForSelectors();
    if (elementsArray) {
      console.log(`QA Selector Helper (Content Script): Sending ${elementsArray.length} elements to popup.`);
      sendResponse({ status: "success", data: elementsArray });
    } else {
      console.error("QA Selector Helper (Content Script): scanPageForSelectors returned undefined or null.");
      sendResponse({ status: "error", message: "Failed to scan page elements." });
    }
  } else if (request.action === "activate_hover_mode") {
    isHoverModeActive = true;
    console.log("QA Selector Helper (Content Script): Hover mode ACTIVATED.");
    sendResponse({ status: "success", hoverMode: isHoverModeActive });
  } else if (request.action === "deactivate_hover_mode") {
    isHoverModeActive = false;
    // Unpin tooltip if it's pinned
    if (isTooltipPinned) {
      unpinTooltip();
    } else {
      hidePageTooltip();
      removeElementHighlight();
    }
    
    // Remove all temporary hover highlights
    document.querySelectorAll('.qa-cs-temp-hover').forEach(el => {
      el.classList.remove('qa-cs-temp-hover');
    });
    
    console.log("QA Selector Helper (Content Script): Hover mode DEACTIVATED.");
    sendResponse({ status: "success", hoverMode: isHoverModeActive });
  } else if (request.action === "get_hover_mode_state") {
    console.log("QA Selector Helper (Content Script): Returning hover mode state:", isHoverModeActive);
    sendResponse({ status: "success", hoverMode: isHoverModeActive });
  } else if (request.action === "get_pinned_state") {
    console.log("QA Selector Helper (Content Script): Returning pinned state:", isTooltipPinned);
    sendResponse({ status: "success", isPinned: isTooltipPinned });
  } else if (request.action === "unpin_tooltip") {
    if (isTooltipPinned) {
      unpinTooltip();
      sendResponse({ status: "success", message: "Tooltip unpinned" });
    } else {
      sendResponse({ status: "success", message: "No tooltip to unpin" });
    }
  }
  else {
    console.log("QA Selector Helper (Content Script): Unknown action received:", request.action);
    sendResponse({ status: "error", message: `Unknown action: ${request.action}` });
  }
  
  return true; 
});
