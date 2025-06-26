class QASelectorHelper {
    constructor() {
        this.isHoverModeActive = false;
        this.isPinned = false;
        this.pinnedElement = null;
        this.popup = null;
        this.overlay = null;
        this.tooltip = null;
        this.visibleSelectors = [];
        // Store the last mouse move event to use for pinning if click event is not directly on an element
        this.lastMouseMoveEvent = null;
        this.init();
    }

    init() {
        this.createPopup();
        this.attachEventListeners();
        this.scanVisibleSelectors();
    }

    createPopup() {
        this.popup = document.createElement('div');
        this.popup.className = 'qa-extension-popup';
        this.popup.innerHTML = `
            <div class="qa-popup-header">
                <span>QA Selector Helper</span>
                <button class="qa-close-btn" id="qa-close-extension-btn">×</button>
            </div>
            <div class="qa-popup-content">
                <button class="qa-button" id="qa-scan-selectors-btn">
                    Scan Visible Selectors
                </button>
                <button class="qa-button" id="hover-toggle">
                    Enable Hover Mode
                </button>
                <div style="display: flex; gap: 8px; margin: 8px 0;">
                    <button class="qa-button qa-pin-btn" id="pin-toggle" style="width: auto; padding: 8px 12px; font-size: 12px;" disabled>
                        📌 Pin Tooltip
                    </button>
                    <button class="qa-button qa-unpin-btn" id="unpin-btn" style="width: auto; padding: 8px 12px; font-size: 12px; display: none;">
                        🔓 Unpin
                    </button>
                </div>
                <div class="qa-count" id="selector-count">Found: 0 selectors</div>
                <div class="qa-selector-list" id="selector-list"></div>
            </div>
        `;
        document.body.appendChild(this.popup);

        // Add event listeners for buttons inside the popup
        // Ensure qaHelper instance is correctly referenced if these are called from global scope
        document.getElementById('qa-close-extension-btn').addEventListener('click', () => this.closeExtension());
        document.getElementById('qa-scan-selectors-btn').addEventListener('click', () => this.scanVisibleSelectors());
        document.getElementById('hover-toggle').addEventListener('click', () => this.toggleHoverMode());
        document.getElementById('pin-toggle').addEventListener('click', (event) => this.togglePin(event)); // Pass event
        document.getElementById('unpin-btn').addEventListener('click', () => this.unpin());
    }

    scanVisibleSelectors() {
        this.visibleSelectors = [];
        const allElements = document.querySelectorAll('*[id]');

        allElements.forEach(element => {
            if (element.closest('.qa-extension-popup') ||
                element.classList.contains('qa-hover-overlay') ||
                element.classList.contains('qa-hover-tooltip')) {
                return;
            }

            const rect = element.getBoundingClientRect();
            const style = window.getComputedStyle(element);

            if (rect.width > 0 && rect.height > 0 &&
                style.visibility !== 'hidden' &&
                style.display !== 'none') {

                this.visibleSelectors.push({
                    element: element,
                    id: element.id,
                    selector: `#${element.id}`
                });
            }
        });

        this.updateSelectorList();
    }

    generateSelectors(element) {
        const selectors = [];

        if (element.id) {
            selectors.push(`#${element.id}`);
        }

        if (element.className && typeof element.className === 'string') {
            const classes = element.className.trim().split(/\s+/).filter(c => c); // Filter out empty strings
            if (classes.length > 0) {
                selectors.push(`.${classes.join('.')}`);
            }
        }

        selectors.push(element.tagName.toLowerCase());

        Array.from(element.attributes).forEach(attr => {
            if (attr.name.startsWith('data-')) {
                selectors.push(`[${attr.name}="${attr.value}"]`);
            }
        });

        const path = this.getCSSPath(element);
        if (path) selectors.push(path);

        return selectors;
    }

    getCSSPath(element) {
        if (element.id) return `#${element.id}`;

        const path = [];
        let current = element;

        while (current && current.parentElement && current !== document.body) { // Added current.parentElement check
            let selector = current.tagName.toLowerCase();

            if (current.className && typeof current.className === 'string') {
                const classes = current.className.trim().split(/\s+/).filter(c => c);
                if (classes.length > 0) {
                     // Prefer a data-testid if available for more robustness
                    let dataTestId = null;
                    for(let i=0; i < current.attributes.length; i++){
                        if(current.attributes[i].name.startsWith('data-testid')){
                            dataTestId = `[${current.attributes[i].name}="${current.attributes[i].value}"]`;
                            break;
                        }
                    }
                    if(dataTestId){
                        selector = dataTestId; // Use data-testid if present
                    } else if (classes[0]) {
                         selector += `.${classes[0]}`; // Fallback to first class
                    }
                }
            }

            const parent = current.parentElement;
            if (parent) { // Ensure parent exists
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

        return path.join(' > ');
    }

    updateSelectorList() {
        const listElement = document.getElementById('selector-list');
        const countElement = document.getElementById('selector-count');

        countElement.textContent = `Found: ${this.visibleSelectors.length} ID selectors`;

        listElement.innerHTML = ''; // Clear existing items

        this.visibleSelectors.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'qa-selector-item';

            const contentDiv = document.createElement('div');
            contentDiv.style.display = 'flex';
            contentDiv.style.justifyContent = 'space-between';
            contentDiv.style.alignItems = 'center';

            const infoDiv = document.createElement('div');
            const strongTag = document.createElement('strong');
            strongTag.textContent = item.element.tagName.toLowerCase();
            const br = document.createElement('br');
            const spanSelector = document.createElement('span');
            spanSelector.style.color = '#4299e1';
            spanSelector.textContent = item.selector;
            infoDiv.appendChild(strongTag);
            infoDiv.appendChild(br);
            infoDiv.appendChild(spanSelector);

            const copyButton = document.createElement('button');
            copyButton.className = 'qa-copy-btn';
            copyButton.textContent = '📋';
            copyButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyToClipboard(item.selector, copyButton);
            });

            contentDiv.appendChild(infoDiv);
            contentDiv.appendChild(copyButton);
            div.appendChild(contentDiv);

            // Attach click event to the div, not affecting the copy button
            div.addEventListener('click', (e) => {
                // Ensure the click is not on the copy button itself
                if (e.target !== copyButton && !copyButton.contains(e.target)) {
                    this.highlightElement(item.element, this.generateSelectors(item.element));
                }
            });
            listElement.appendChild(div);
        });
    }

    highlightElement(element, selectors) {
        document.querySelectorAll('.qa-highlighted-element').forEach(el => {
            el.classList.remove('qa-highlighted-element');
        });

        element.classList.add('qa-highlighted-element');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Consider a less intrusive way to show selectors, like updating the tooltip
        // For now, keeping alert for simplicity as per original code
        alert(`Element Selectors:\n\n${selectors.join('\n')}`);

        setTimeout(() => {
            if (element) { // Check if element still exists
                element.classList.remove('qa-highlighted-element');
            }
        }, 3000);
    }

    toggleHoverMode() {
        this.isHoverModeActive = !this.isHoverModeActive;
        const button = document.getElementById('hover-toggle');
        const pinButton = document.getElementById('pin-toggle');

        if (this.isHoverModeActive) {
            button.textContent = 'Disable Hover Mode';
            button.classList.add('active');
            pinButton.disabled = false;
            this.createOverlay();
        } else {
            button.textContent = 'Enable Hover Mode';
            button.classList.remove('active');
            pinButton.disabled = true;
            this.unpin();
            this.removeOverlay();
        }
    }

    createOverlay() {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'qa-hover-overlay';
            document.body.appendChild(this.overlay);
        }

        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'qa-hover-tooltip';
            document.body.appendChild(this.tooltip);
        }
    }

    removeOverlay() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
    }

    attachEventListeners() {
        // Use .bind(this) or arrow functions to ensure `this` context is correct
        this.mouseMoveHandler = (e) => {
            this.lastMouseMoveEvent = e; // Store the event
            if (!this.isHoverModeActive || this.isPinned) return;

            const element = e.target;

            if (element.closest('.qa-extension-popup') ||
                element.classList.contains('qa-hover-overlay') ||
                element.classList.contains('qa-hover-tooltip')) {
                return;
            }

            this.showHoverInfo(element, e);
        };

        this.clickHandler = (e) => {
            if (!this.isHoverModeActive) return;

            const element = e.target;

            if (element.closest('.qa-extension-popup') ||
                element.classList.contains('qa-hover-overlay') ||
                element.classList.contains('qa-hover-tooltip') ||
                element.classList.contains('qa-copy-btn') || // Also ignore clicks on copy buttons in tooltip
                element.closest('.qa-copy-btn')) { // Check parent for clicks within copy button (e.g. icon)
                return;
            }

            // If clicking on a different element while pinned, switch to that element
            if (this.isPinned && element !== this.pinnedElement) {
                this.pinnedElement = element;
                this.showHoverInfo(element, e, true);
            }
        };

        document.addEventListener('mousemove', this.mouseMoveHandler);
        document.addEventListener('click', this.clickHandler);
    }

    showHoverInfo(element, event, forcePin = false) {
        if (!this.overlay || !this.tooltip) return;
        if (!element || !event) return; // Ensure element and event are valid

        if (this.isPinned && !forcePin) return;

        const rect = element.getBoundingClientRect();
        // Ensure selectors are generated for the current element, not potentially stale one
        const currentSelectors = this.generateSelectors(element);

        this.overlay.style.left = rect.left + window.scrollX + 'px'; // Add scrollX for correct positioning
        this.overlay.style.top = rect.top + window.scrollY + 'px';   // Add scrollY
        this.overlay.style.width = rect.width + 'px';
        this.overlay.style.height = rect.height + 'px';

        if (this.isPinned) {
            this.overlay.classList.add('qa-overlay-pinned');
        } else {
            this.overlay.classList.remove('qa-overlay-pinned');
        }

        this.tooltip.innerHTML = '';

        const headerDiv = document.createElement('div');
        headerDiv.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(245, 158, 11, 0.3);
        `;

        const titleSpan = document.createElement('span');
        titleSpan.style.cssText = `color: #fbbf24; font-weight: bold;`;
        titleSpan.textContent = 'Element Inspector';
        headerDiv.appendChild(titleSpan);

        if (this.isPinned) {
            const pinnedSpan = document.createElement('span');
            pinnedSpan.style.cssText = `color: #8b5cf6; font-size: 10px;`;
            pinnedSpan.textContent = '📌 PINNED';
            headerDiv.appendChild(pinnedSpan);
        }
        this.tooltip.appendChild(headerDiv);

        const createSection = (label, value, copyValue = null) => {
            if (value === undefined || value === null || value === '') return;

            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'qa-tooltip-section';

            const labelDiv = document.createElement('div');
            labelDiv.className = 'qa-tooltip-label';
            labelDiv.textContent = label;
            sectionDiv.appendChild(labelDiv);

            const valueDivContainer = document.createElement('div');
            valueDivContainer.className = 'qa-tooltip-value'; // This class primarily sets color
            valueDivContainer.style.display = 'flex';
            valueDivContainer.style.justifyContent = 'space-between';
            valueDivContainer.style.alignItems = 'center';

            const valueSpan = document.createElement('span');
            valueSpan.style.wordBreak = 'break-all';
            valueSpan.style.marginRight = '8px';
            valueSpan.textContent = value;
            valueDivContainer.appendChild(valueSpan);

            const copyBtn = document.createElement('button');
            copyBtn.className = 'qa-copy-btn';
            copyBtn.textContent = '📋';
            copyBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent click event from bubbling up
                this.copyToClipboard(copyValue !== null ? copyValue : value, copyBtn);
            });
            valueDivContainer.appendChild(copyBtn);

            sectionDiv.appendChild(valueDivContainer);
            this.tooltip.appendChild(sectionDiv);
        };

        createSection('Tag:', element.tagName.toLowerCase());
        if (element.id) createSection('ID:', `#${element.id}`);

        const classNameString = (element.className && typeof element.className === 'string') ? element.className.trim() : (element.getAttribute('class') || '').trim();
        if (classNameString) {
            createSection('Classes:', `.${classNameString.replace(/\s+/g, '.')}`);
        }

        createSection('CSS Path:', this.getCSSPath(element));

        const dataAttributes = Array.from(element.attributes).filter(attr => attr.name.startsWith('data-'));
        if (dataAttributes.length > 0) {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'qa-tooltip-section';
            const labelDiv = document.createElement('div');
            labelDiv.className = 'qa-tooltip-label';
            labelDiv.textContent = 'Data Attributes:';
            sectionDiv.appendChild(labelDiv);

            dataAttributes.forEach(attr => {
                const valueDivContainer = document.createElement('div');
                valueDivContainer.className = 'qa-tooltip-value';
                valueDivContainer.style.display = 'flex';
                valueDivContainer.style.justifyContent = 'space-between';
                valueDivContainer.style.alignItems = 'center';
                valueDivContainer.style.marginBottom = '4px';

                const valueSpan = document.createElement('span');
                valueSpan.textContent = `[${attr.name}="${attr.value}"]`;
                valueDivContainer.appendChild(valueSpan);

                const copyBtn = document.createElement('button');
                copyBtn.className = 'qa-copy-btn';
                copyBtn.textContent = '📋';
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.copyToClipboard(`[${attr.name}="${attr.value}"]`, copyBtn);
                });
                valueDivContainer.appendChild(copyBtn);
                sectionDiv.appendChild(valueDivContainer);
            });
            this.tooltip.appendChild(sectionDiv);
        }

        if (this.isPinned) {
            this.tooltip.classList.add('qa-tooltip-pinned');
        } else {
            this.tooltip.classList.remove('qa-tooltip-pinned');
        }

        if (!this.isPinned || forcePin) {
            // Ensure event.clientX and event.clientY are valid numbers
            const clientX = typeof event.clientX === 'number' ? event.clientX : 0;
            const clientY = typeof event.clientY === 'number' ? event.clientY : 0;

            let tooltipX = clientX + 10;
            let tooltipY = clientY + 10;

            const tooltipRect = this.tooltip.getBoundingClientRect(); // Get dimensions after content is added
            if (tooltipX + tooltipRect.width > window.innerWidth) {
                tooltipX = clientX - tooltipRect.width - 10;
            }
            if (tooltipY + tooltipRect.height > window.innerHeight) {
                tooltipY = clientY - tooltipRect.height - 10;
            }

            this.tooltip.style.left = tooltipX + window.scrollX + 'px'; // Add scrollX
            this.tooltip.style.top = tooltipY + window.scrollY + 'px';   // Add scrollY
        }
    }

    closeExtension() {
        if (this.popup) this.popup.remove();
        this.removeOverlay();
        document.removeEventListener('mousemove', this.mouseMoveHandler);
        document.removeEventListener('click', this.clickHandler);
        // Nullify references to DOM elements to help GC
        this.popup = null;
        this.overlay = null;
        this.tooltip = null;
    }

    copyToClipboard(text, buttonElement) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = buttonElement.textContent;
            buttonElement.textContent = '✓';
            buttonElement.classList.add('copied');

            setTimeout(() => {
                buttonElement.textContent = originalText;
                buttonElement.classList.remove('copied');
            }, 1000);
        }).catch(err => {
            console.warn('Async clipboard write failed, trying fallback:', err);
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed'; // Prevent scrolling to bottom of page
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            textArea.setSelectionRange(0, 99999); // For mobile devices

            try {
                const successful = document.execCommand('copy');
                if(successful){
                    const originalText = buttonElement.textContent;
                    buttonElement.textContent = '✓';
                    buttonElement.classList.add('copied');
                    setTimeout(() => {
                        buttonElement.textContent = originalText;
                        buttonElement.classList.remove('copied');
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

    togglePin(event) {
        if (!this.isHoverModeActive) return;

        this.isPinned = true; // Set pinned state
        const pinButton = document.getElementById('pin-toggle');
        const unpinButton = document.getElementById('unpin-btn');

        pinButton.style.display = 'none';
        unpinButton.style.display = 'inline-block';

        // Determine the element to pin
        // If the click event for pinning has a target, use that.
        // Otherwise, fall back to the element under the mouse from the last mousemove event.
        let elementToPin = null;
        let eventForPinning = null;

        if (event && event.target && event.target !== pinButton && !pinButton.contains(event.target)) {
            // This case is unlikely if togglePin is called directly from pinButton's listener without passing event.
            // But if it were called from a general click listener that then decides to pin:
            elementToPin = event.target;
            eventForPinning = event;
        } else if (this.lastMouseMoveEvent) {
            // This is the more likely scenario if togglePin is called from the pin button's own click listener.
            // The `event` argument for `togglePin` would be the click on the pin button itself.
            // We need the element that was being hovered just before the pin button was clicked.
            elementToPin = document.elementFromPoint(this.lastMouseMoveEvent.clientX, this.lastMouseMoveEvent.clientY);
            eventForPinning = this.lastMouseMoveEvent;
        }

        if (elementToPin && !elementToPin.closest('.qa-extension-popup')) {
            this.pinnedElement = elementToPin;
            this.showHoverInfo(this.pinnedElement, eventForPinning, true); // forcePin = true
        } else {
            // If no valid element could be determined (e.g., mouse was over the popup),
            // it might be desirable to unpin or not pin anything.
            // For now, we'll just log or do nothing if elementToPin is not suitable.
            console.warn("Could not determine a valid element to pin.");
            // Potentially revert isPinned state if nothing was pinned:
            // this.isPinned = false;
            // pinButton.style.display = 'inline-block';
            // unpinButton.style.display = 'none';
        }
    }

    unpin() {
        this.isPinned = false;
        this.pinnedElement = null;

        const pinButton = document.getElementById('pin-toggle');
        const unpinButton = document.getElementById('unpin-btn');

        pinButton.style.display = 'inline-block';
        unpinButton.style.display = 'none';

        if (this.overlay) this.overlay.classList.remove('qa-overlay-pinned');
        if (this.tooltip) this.tooltip.classList.remove('qa-tooltip-pinned');
        // After unpinning, the hover info should ideally update to the current mouse position
        // if hover mode is still active. We can simulate a mouse move.
        if (this.isHoverModeActive && this.lastMouseMoveEvent) {
            this.showHoverInfo(document.elementFromPoint(this.lastMouseMoveEvent.clientX, this.lastMouseMoveEvent.clientY), this.lastMouseMoveEvent);
        }
    }
}

// Initialize the QA Helper when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Make it a global variable for easy access from inline event handlers if any remain,
    // or for debugging.
    window.qaHelper = new QASelectorHelper();
});
