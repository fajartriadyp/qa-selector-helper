console.log("QA Selector Helper: Content Script Loaded.");

// --- Globals for Hover Mode ---
let isHoverModeActive = false;
let pageTooltip = null;
let currentlyHighlightedElement = null;
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

function generateElementData(element) {
    if (!(element instanceof Element)) {
        return null;
    }

    const data = {
        tagName: element.tagName.toLowerCase(),
        id: element.id || null,
        classes: element.className && typeof element.className === 'string' ? element.className.trim() : null,
        cssPath: getCSSPath(element),
        dataAttributes: {}
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

    pageTooltip.innerHTML = `
        <strong>Tag:</strong> ${elementData.tagName}<br>
        <strong>Selector:</strong> ${primarySelector.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
        ${elementData.classes ? `<br><strong>Classes:</strong> ${elementData.classes.replace(/</g, "&lt;").replace(/>/g, "&gt;")}` : ''}
    `;

    let x = event.clientX + 15;
    let y = event.clientY + 15;
    pageTooltip.style.left = x + 'px';
    pageTooltip.style.top = y + 'px';
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
    }
}

function applyElementHighlight(element) {
    if (!(element instanceof Element)) return;
    removeElementHighlight(); // Remove from previous
    element.classList.add('qa-cs-highlight');
    currentlyHighlightedElement = element;
}

function removeElementHighlight() {
    if (currentlyHighlightedElement) {
        currentlyHighlightedElement.classList.remove('qa-cs-highlight');
        currentlyHighlightedElement = null;
    }
}

// --- Event Handlers for Hover Mode ---
function handlePageMouseOver(event) {
    console.log("QA Selector Helper (Content Script): handlePageMouseOver triggered. Target:", event.target); // DIAGNOSTIC LOG
    if (!isHoverModeActive) {
        // console.log("QA Selector Helper (Content Script): Hover mode is OFF, exiting handlePageMouseOver."); // Optional: too noisy
        return;
    }
    const target = event.target;
    if (!target || target.id === 'qa-cs-tooltip-unique-id' || target.closest('.qa-cs-tooltip')) {
        // console.log("QA Selector Helper (Content Script): Ignoring hover on tooltip or self."); // Optional: too noisy
        return;
    }

    console.log("QA Selector Helper (Content Script): Processing hover for element:", target); // DIAGNOSTIC LOG
    const elementData = generateElementData(target);
    if (elementData) {
        applyElementHighlight(target);
        showPageTooltip(elementData, event);
    }
}

function handlePageMouseOut(event) {
    console.log("QA Selector Helper (Content Script): handlePageMouseOut triggered. Target:", event.target, "RelatedTarget:", event.relatedTarget); // DIAGNOSTIC LOG
    if (!isHoverModeActive) {
        // console.log("QA Selector Helper (Content Script): Hover mode is OFF, exiting handlePageMouseOut."); // Optional: too noisy
        return;
    }
    if (event.relatedTarget && (event.relatedTarget.id === 'qa-cs-tooltip-unique-id' || event.relatedTarget.closest('.qa-cs-tooltip'))) {
        // console.log("QA Selector Helper (Content Script): Mouse moved to tooltip, not hiding."); // Optional: too noisy
        return;
    }
    console.log("QA Selector Helper (Content Script): Hiding tooltip and removing highlight due to mouseout."); // DIAGNOSTIC LOG
    hidePageTooltip();
    removeElementHighlight();
}

// Initialize tooltip once when script loads
createPageTooltip(); 

// Add event listeners for hover (will only act if isHoverModeActive is true)
document.addEventListener('mouseover', handlePageMouseOver, true); // Use capturing for broader reach
document.addEventListener('mouseout', handlePageMouseOut, true);   // Use capturing


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
    hidePageTooltip();
    removeElementHighlight();
    console.log("QA Selector Helper (Content Script): Hover mode DEACTIVATED.");
    sendResponse({ status: "success", hoverMode: isHoverModeActive });
  }
  else {
    console.log("QA Selector Helper (Content Script): Unknown action received:", request.action);
    sendResponse({ status: "error", message: `Unknown action: ${request.action}` });
  }
  
  return true; 
});
