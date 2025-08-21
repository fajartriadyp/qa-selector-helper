class QASelectorHelper {
    constructor() {
        this.isHoverModeActive = false;
        // Pinning related properties - might be adjusted or removed if pinning is refactored/deferred
        this.isPinned = false; 
        // this.pinnedElement = null; // If pinning is handled by content script, this might not be needed here
        
        this.popup = null;
        // this.overlay = null; // Removed: Handled by content script
        // this.tooltip = null; // Removed: Handled by content script
        this.visibleSelectors = [];
        // this.lastMouseMoveEvent = null; // Removed: Mouse events on page handled by content script
        this.init();
    }

    init() {
        this.createPopup();
        // Sync hover mode state with content script when popup opens
        // Add small delay to ensure popup is rendered
        setTimeout(() => {
            this.syncHoverModeState();
        }, 100);
        // this.attachEventListeners(); // Removed: Event listeners for page hover are in content script
        // REMOVED: this.scanVisibleSelectors(); - Scanning should be user-initiated via content script
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
                    <button class="qa-button" id="remove-highlight-btn" style="width: auto; padding: 8px 12px; font-size: 12px; background: #ef4444; color: white;">
                        🗑️ Remove Highlight
                    </button>
                </div>
                <div class="qa-hover-instructions" style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 12px; margin: 12px 0; font-size: 12px; color: #374151;">
                    <strong>💡 Hover Mode Tips:</strong><br>
                    • <strong>Hover</strong> mouse ke elemen untuk melihat selector<br>
                    • <strong>Right click</strong> untuk pin tooltip di tempat<br>
                    • <strong>Right click lagi</strong> untuk unpin tooltip<br>
                    • <strong>Copy selector</strong> dengan klik tombol 📋 di tooltip<br>
                    • <strong>Pinned tooltip</strong> tetap menampilkan elemen yang di-pin meskipun hover ke elemen lain
                </div>
                <div class="qa-highlight-instructions" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px; padding: 12px; margin: 12px 0; font-size: 12px; color: #374151;">
                    <strong>🎯 Highlight Mode Tips:</strong><br>
                    • <strong>Klik selector</strong> di daftar untuk highlight elemen di website<br>
                    • <strong>Highlight otomatis hilang</strong> setelah 5 detik atau klik di luar elemen<br>
                    • <strong>Tombol 🗑️ Remove Highlight</strong> untuk menghapus semua highlight manual<br>
                    • <strong>Elemen akan di-scroll</strong> ke tengah layar saat di-highlight
                </div>
                <div class="qa-count" id="selector-count">Found: 0 selectors</div>
                <div class="qa-selector-list" id="selector-list"></div>
            </div>
        `;
        document.body.appendChild(this.popup);

        // Add event listeners for buttons inside the popup
        // Ensure qaHelper instance is correctly referenced if these are called from global scope
        document.getElementById('qa-close-extension-btn').addEventListener('click', () => this.closeExtension());
        // Modify the "Scan Visible Selectors" button to send a message
        document.getElementById('qa-scan-selectors-btn').addEventListener('click', () => this.requestPageScan()); // Updated to call renamed method
        document.getElementById('hover-toggle').addEventListener('click', () => this.toggleHoverMode());
        document.getElementById('pin-toggle').addEventListener('click', (event) => this.togglePin(event)); // Pass event
        document.getElementById('unpin-btn').addEventListener('click', () => this.unpinFromPopup());
        document.getElementById('remove-highlight-btn').addEventListener('click', () => this.removeHighlight());

        // Listen for messages from content script (or other parts of the extension)
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            console.log("QA Selector Helper: Message received in popup script:", request);
            if (request.from === "content_script" && request.action === "pong_response") {
                alert(`Received pong from content script: ${request.message}`);
            }
            // Allow other listeners to receive the message too, if any.
            // Or return true if you intend to sendResponse asynchronously.
            return false; 
        });
    }

    // Renamed from pingContentScript to reflect its new purpose
    requestPageScan() { 
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    // Changed action to "scan_page_elements"
                    { action: "scan_page_elements" }, 
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("QA Selector Helper: Error sending 'scan_page_elements' message:", chrome.runtime.lastError.message);
                            alert("Error requesting page scan: " + chrome.runtime.lastError.message + "\nEnsure the target page is refreshed after extension reload.");
                            this.updateSelectorList([]); // Clear list on error
                        } else {
                            console.log("QA Selector Helper: Response from content script for 'scan_page_elements':", response);
                            if (response && response.status === "success" && Array.isArray(response.data)) {
                                console.log("QA Selector Helper: Received element data from content script:", response.data);
                                this.updateSelectorList(response.data);
                            } else if (response && response.status === "error") {
                                console.error("QA Selector Helper: Content script reported an error during scan:", response.message);
                                alert("Error during page scan in content script: " + response.message);
                                this.updateSelectorList([]); // Clear list on error
                            } else {
                                console.warn("QA Selector Helper: Unexpected response from content script for scan:", response);
                                alert("Received an unexpected response from the content script during page scan. Check console.");
                                this.updateSelectorList([]); // Clear list
                            }
                        }
                    }
                );
            } else {
                console.error("QA Selector Helper: Could not get active tab ID.");
                alert("Could not get active tab to send message.");
            }
        });
    }

    scanVisibleSelectors() {
        // This function will now be triggered by a message from the content script in future steps.
        // For now, it can remain as is, operating on the popup's demo content if called directly.
        // Or, we can disable it/change its behavior if "Scan" button is solely for content script interaction.
        console.log("QA Selector Helper: scanVisibleSelectors (popup) called. This will be refactored for content script.");
        this.visibleSelectors = [];
        // The following query targets the popup's DOM.
        const allElements = document.querySelectorAll('*[id]'); 
        
        allElements.forEach(element => {
            // Skip elements from the extension UI itself.
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

    updateSelectorList(elementsDataArray) { // Parameter is now an array of data objects
        const listElement = document.getElementById('selector-list');
        const countElement = document.getElementById('selector-count');
        
        if (!listElement || !countElement) {
            console.error("QA Selector Helper: Popup list or count element not found.");
            return;
        }

        countElement.textContent = `Found: ${elementsDataArray.length} elements`;
        
        listElement.innerHTML = ''; // Clear existing items
        
        elementsDataArray.forEach((elementData) => {
            const div = document.createElement('div');
            div.className = 'qa-selector-item';
            div.style.cursor = 'pointer';
            div.style.transition = 'all 0.2s ease';
            div.style.borderRadius = '8px';
            div.style.padding = '8px';
            div.style.marginBottom = '8px';
            
            // Add hover effect
            div.addEventListener('mouseenter', () => {
                div.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                div.style.border = '1px solid rgba(16, 185, 129, 0.3)';
                div.style.transform = 'translateY(-1px)';
                div.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)';
            });
            
            div.addEventListener('mouseleave', () => {
                div.style.backgroundColor = 'transparent';
                div.style.border = '1px solid transparent';
                div.style.transform = 'translateY(0)';
                div.style.boxShadow = 'none';
            });
            
            const contentDiv = document.createElement('div');
            contentDiv.style.display = 'flex';
            contentDiv.style.justifyContent = 'space-between';
            contentDiv.style.alignItems = 'flex-start';
            contentDiv.style.flexDirection = 'column';
            contentDiv.style.gap = '8px';

            const infoDiv = document.createElement('div');
            const headerDiv = document.createElement('div');
            headerDiv.style.display = 'flex';
            headerDiv.style.justifyContent = 'space-between';
            headerDiv.style.alignItems = 'center';
            headerDiv.style.marginBottom = '8px';
            
            const strongTag = document.createElement('strong');
            strongTag.textContent = elementData.tagName; // Use data from object
            strongTag.style.color = '#374151';
            
            const clickIndicator = document.createElement('span');
            clickIndicator.textContent = '🎯 Klik untuk highlight';
            clickIndicator.style.fontSize = '10px';
            clickIndicator.style.color = '#10b981';
            clickIndicator.style.fontWeight = 'bold';
            
            headerDiv.appendChild(strongTag);
            headerDiv.appendChild(clickIndicator);
            infoDiv.appendChild(headerDiv);

            // Display all available selectors in order of priority
            if (elementData.selectors && elementData.selectors.length > 0) {
                elementData.selectors.forEach((selector, index) => {
                    const selectorDiv = document.createElement('div');
                    selectorDiv.style.display = 'flex';
                    selectorDiv.style.justifyContent = 'space-between';
                    selectorDiv.style.alignItems = 'center';
                    selectorDiv.style.marginTop = '4px';
                    selectorDiv.style.padding = '4px 8px';
                    selectorDiv.style.background = index === 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(66, 153, 225, 0.1)';
                    selectorDiv.style.borderRadius = '4px';
                    selectorDiv.style.borderLeft = index === 0 ? '3px solid #f59e0b' : '3px solid #4299e1';

                    const selectorInfo = document.createElement('div');
                    const typeSpan = document.createElement('span');
                    typeSpan.textContent = selector.type;
                    typeSpan.style.fontSize = '10px';
                    typeSpan.style.color = '#666';
                    typeSpan.style.fontWeight = 'bold';
                    typeSpan.style.textTransform = 'uppercase';
                    
                    const valueSpan = document.createElement('span');
                    valueSpan.textContent = selector.value;
                    valueSpan.style.color = '#4299e1';
                    valueSpan.style.fontFamily = 'monospace';
                    valueSpan.style.fontSize = '11px';
                    valueSpan.style.marginLeft = '8px';
                    valueSpan.style.wordBreak = 'break-all';

                    selectorInfo.appendChild(typeSpan);
                    selectorInfo.appendChild(document.createElement('br'));
                    selectorInfo.appendChild(valueSpan);

                    const copyButton = document.createElement('button');
                    copyButton.className = 'qa-copy-btn';
                    copyButton.textContent = '📋';
                    copyButton.style.fontSize = '10px';
                    copyButton.style.padding = '4px 8px';
                    copyButton.addEventListener('click', (e) => {
                        e.stopPropagation(); 
                        this.copyToClipboard(selector.value, copyButton);
                    });

                    selectorDiv.appendChild(selectorInfo);
                    selectorDiv.appendChild(copyButton);
                    infoDiv.appendChild(selectorDiv);
                });
            } else {
                // Fallback for elements without selectors array
                const spanSelector = document.createElement('span');
                spanSelector.style.color = '#4299e1';
                let primarySelector = elementData.cssPath;
                if (elementData.id) {
                    primarySelector = `#${elementData.id.replace(/"/g, '\\"')}`;
                } else if (elementData.dataTestId) {
                    primarySelector = `[data-testid="${elementData.dataTestId.replace(/"/g, '\\"')}"]`;
                }
                spanSelector.textContent = primarySelector;
                infoDiv.appendChild(document.createElement('br'));
                infoDiv.appendChild(spanSelector);
            }

            contentDiv.appendChild(infoDiv);
            div.appendChild(contentDiv);
            
            div.addEventListener('click', (e) => {
                if (!e.target.classList.contains('qa-copy-btn')) {
                    // Send message to content script to highlight element
                    console.log("Highlight request for:", elementData);
                    this.highlightElementOnPage(elementData);
                }
            });
            listElement.appendChild(div);
        });
    }

    // highlightElement method will need to be removed or completely refactored
    // as it can't operate on page elements directly from the popup.
    // For now, we'll leave it, but it's not being effectively used by the new updateSelectorList.

    highlightElement(element, selectors) { // This is now effectively dead code for live page interaction
        console.warn("highlightElement (popup) called - this path should be updated for content script interaction.");
        // Original logic for demo page:
        // document.querySelectorAll('.qa-highlighted-element').forEach(el => {
        //     el.classList.remove('qa-highlighted-element');
        // });
        // element.classList.add('qa-highlighted-element');
        // element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // alert(`Element Selectors:\n\n${selectors.join('\n')}`);
        // setTimeout(() => {
        //     if (element) { element.classList.remove('qa-highlighted-element'); }
        // }, 3000);
    }

    toggleHoverMode() {
        this.isHoverModeActive = !this.isHoverModeActive;
        const button = document.getElementById('hover-toggle');
        const pinButton = document.getElementById('pin-toggle'); // Pin button might need re-evaluation

        const action = this.isHoverModeActive ? "activate_hover_mode" : "deactivate_hover_mode";

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { action: action },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error(`QA Selector Helper: Error sending '${action}' message:`, chrome.runtime.lastError.message);
                            // Revert UI state on error
                            this.isHoverModeActive = !this.isHoverModeActive;
                            alert("Error toggling hover mode: " + chrome.runtime.lastError.message + "\nPlease refresh the page and try again.");
                        } else {
                            console.log(`QA Selector Helper: Content script response for '${action}':`, response);
                            if (response && response.status === "success") {
                                // Update UI based on successful state change in content script
                                this.updateHoverModeUI();

                            } else {
                                // Handle cases where content script didn't confirm, or error
                                console.warn(`QA Selector Helper: Content script did not successfully process '${action}'. Response:`, response);
                                // Revert UI change as message couldn't be sent
                                this.isHoverModeActive = !this.isHoverModeActive;
                                alert("Failed to toggle hover mode. Please refresh the page and try again.");
                            }
                        }
                    }
                );
            } else {
                console.error("QA Selector Helper: Could not get active tab ID to send message.");
                // Revert UI change as message couldn't be sent
                this.isHoverModeActive = !this.isHoverModeActive; // Toggle back
                alert("Could not get active tab. Please refresh the page and try again.");
            }
        });
    }

    // createOverlay(), removeOverlay(), attachEventListeners(), showHoverInfo() are removed
    // as per plan, their functionality is now handled by content-script.js

    syncHoverModeState(retryCount = 0) {
        const maxRetries = 3;
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { action: "get_hover_mode_state" },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("QA Selector Helper: Error getting hover mode state:", chrome.runtime.lastError.message);
                            // Check if error is due to content script not being loaded
                            if (chrome.runtime.lastError.message.includes("Could not establish connection") && retryCount < maxRetries) {
                                console.log(`QA Selector Helper: Content script not loaded yet, retrying... (${retryCount + 1}/${maxRetries})`);
                                // Retry after a delay
                                setTimeout(() => {
                                    this.syncHoverModeState(retryCount + 1);
                                }, 200);
                                return;
                            }
                            // Default to false if we can't get the state
                            this.isHoverModeActive = false;
                            this.updateHoverModeUI();
                        } else {
                            console.log("QA Selector Helper: Hover mode state from content script:", response);
                            if (response && response.status === "success") {
                                this.isHoverModeActive = response.hoverMode || false;
                                this.updateHoverModeUI();
                                
                                // Also sync pinned state
                                this.syncPinnedState();
                            } else {
                                this.isHoverModeActive = false;
                                this.updateHoverModeUI();
                            }
                        }
                    }
                );
            } else {
                console.error("QA Selector Helper: Could not get active tab ID for hover mode sync.");
                this.isHoverModeActive = false;
                this.updateHoverModeUI();
            }
        });
    }

    syncPinnedState() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { action: "get_pinned_state" },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("QA Selector Helper: Error getting pinned state:", chrome.runtime.lastError.message);
                        } else {
                            console.log("QA Selector Helper: Pinned state from content script:", response);
                            if (response && response.status === "success") {
                                this.isPinned = response.isPinned || false;
                                this.updatePinnedUI();
                            }
                        }
                    }
                );
            }
        });
    }

    updateHoverModeUI() {
        const button = document.getElementById('hover-toggle');
        const pinButton = document.getElementById('pin-toggle');
        
        console.log("QA Selector Helper: Updating hover mode UI, isHoverModeActive:", this.isHoverModeActive);
        
        if (button) {
            if (this.isHoverModeActive) {
                button.textContent = 'Disable Hover Mode';
                button.classList.add('active');
                console.log("QA Selector Helper: Hover mode UI updated to ACTIVE");
            } else {
                button.textContent = 'Enable Hover Mode';
                button.classList.remove('active');
                console.log("QA Selector Helper: Hover mode UI updated to INACTIVE");
            }
        }
        
        if (pinButton) {
            pinButton.disabled = !this.isHoverModeActive;
        }
        
        if (!this.isHoverModeActive) {
            this.unpin();
        }
    }

    updatePinnedUI() {
        const pinButton = document.getElementById('pin-toggle');
        const unpinButton = document.getElementById('unpin-btn');
        
        console.log("QA Selector Helper: Updating pinned UI, isPinned:", this.isPinned);
        
        if (pinButton && unpinButton) {
            if (this.isPinned) {
                pinButton.style.display = 'none';
                unpinButton.style.display = 'inline-block';
                console.log("QA Selector Helper: Pinned UI updated to PINNED");
            } else {
                pinButton.style.display = 'inline-block';
                unpinButton.style.display = 'none';
                console.log("QA Selector Helper: Pinned UI updated to UNPINNED");
            }
        }
    }

    closeExtension() {
        if (this.popup) this.popup.remove();
        // this.removeOverlay(); // Removed
        // document.removeEventListener('mousemove', this.mouseMoveHandler); // Removed
        // document.removeEventListener('click', this.clickHandler); // Removed
        // Nullify references to DOM elements to help GC
        this.popup = null;
        // this.overlay = null; // Removed
        // this.tooltip = null; // Removed
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
        // let elementToPin = null; // Pinning target selection logic needs to be re-evaluated for content script.
        // let eventForPinning = null; // This also needs re-evaluation.

        // For now, togglePin will just manage the visual state of the pin buttons in the popup.
        // Actual pinning/unpinning communication with content script is TBD.
        // console.warn("Pinning functionality needs to be reimplemented to communicate with content script.");


        // if (event && event.target && event.target !== pinButton && !pinButton.contains(event.target)) {
        //     // This case is unlikely if togglePin is called directly from pinButton's listener without passing event.
        //     // But if it were called from a general click listener that then decides to pin:
        //     elementToPin = event.target;
        //     eventForPinning = event;
        // } else if (this.lastMouseMoveEvent) { // this.lastMouseMoveEvent is removed
        //     // This is the more likely scenario if togglePin is called from the pin button's own click listener.
        //     // The `event` argument for `togglePin` would be the click on the pin button itself.
        //     // We need the element that was being hovered just before the pin button was clicked.
        //     // elementToPin = document.elementFromPoint(this.lastMouseMoveEvent.clientX, this.lastMouseMoveEvent.clientY);
        //     // eventForPinning = this.lastMouseMoveEvent;
        // }

        // if (elementToPin && !elementToPin.closest('.qa-extension-popup')) {
             // this.pinnedElement = elementToPin; // This state should likely live in content script or be passed to it.
             // this.showHoverInfo(this.pinnedElement, eventForPinning, true); // showHoverInfo is removed.
             // TODO: Send message to content script to pin the current element.
             console.log("Pinning action: Would need to message content script.");
        // } else {
        //     // If no valid element could be determined (e.g., mouse was over the popup),
        //     // it might be desirable to unpin or not pin anything.
        //     // For now, we'll just log or do nothing if elementToPin is not suitable.
        //     console.warn("Could not determine a valid element to pin from popup context. Pinning requires content script interaction.");
        //     // Potentially revert isPinned state if nothing was pinned:
        //     this.isPinned = false; 
        //     pinButton.style.display = 'inline-block';
        //     unpinButton.style.display = 'none';
        // }
    }

    unpinFromPopup() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { action: "unpin_tooltip" },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("QA Selector Helper: Error unpinning tooltip:", chrome.runtime.lastError.message);
                        } else {
                            console.log("QA Selector Helper: Unpin tooltip response:", response);
                            if (response && response.status === "success") {
                                this.isPinned = false;
                                this.updatePinnedUI();
                            }
                        }
                    }
                );
            } else {
                console.error("QA Selector Helper: Could not get active tab ID to unpin tooltip.");
            }
        });
    }

    unpin() {
        this.isPinned = false;
        this.pinnedElement = null;
        
        const pinButton = document.getElementById('pin-toggle');
        const unpinButton = document.getElementById('unpin-btn');
        
        pinButton.style.display = 'inline-block';
        unpinButton.style.display = 'none';
        
        // if (this.overlay) this.overlay.classList.remove('qa-overlay-pinned'); // overlay is removed
        // if (this.tooltip) this.tooltip.classList.remove('qa-tooltip-pinned'); // tooltip is removed
        
        // After unpinning, the hover info should ideally update to the current mouse position
        // if hover mode is still active. This logic now resides in content script.
        // if (this.isHoverModeActive && this.lastMouseMoveEvent) { // lastMouseMoveEvent is removed
        //    // this.showHoverInfo(document.elementFromPoint(this.lastMouseMoveEvent.clientX, this.lastMouseMoveEvent.clientY), this.lastMouseMoveEvent); // showHoverInfo is removed
        // }
        // TODO: Send message to content script to unpin.
        console.log("Unpin action: Would need to message content script.");
    }

    highlightElementOnPage(elementData) {
        if (!elementData || !elementData.selectors || elementData.selectors.length === 0) {
            console.warn("QA Selector Helper: No valid selectors found for highlighting");
            return;
        }

        // Use the first (highest priority) selector
        const selector = elementData.selectors[0].value;
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { 
                        action: "highlight_element",
                        selector: selector,
                        highlightType: 'temporary'
                    },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("QA Selector Helper: Error highlighting element:", chrome.runtime.lastError.message);
                            alert("Error highlighting element: " + chrome.runtime.lastError.message);
                        } else {
                            console.log("QA Selector Helper: Highlight element response:", response);
                            if (response && response.status === "success") {
                                console.log("QA Selector Helper: Element highlighted successfully");
                            } else if (response && response.status === "error") {
                                console.error("QA Selector Helper: Content script reported error:", response.message);
                                alert("Error highlighting element: " + response.message);
                            }
                        }
                    }
                );
            } else {
                console.error("QA Selector Helper: Could not get active tab ID to highlight element.");
                alert("Could not get active tab to highlight element.");
            }
        });
    }

    removeHighlight() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { action: "remove_highlight" },
                    (response) => {
                        if (chrome.runtime.lastError) {
                            console.error("QA Selector Helper: Error removing highlight:", chrome.runtime.lastError.message);
                            alert("Error removing highlight: " + chrome.runtime.lastError.message);
                        } else {
                            console.log("QA Selector Helper: Remove highlight response:", response);
                            if (response && response.status === "success") {
                                console.log("QA Selector Helper: All highlights removed successfully");
                            }
                        }
                    }
                );
            } else {
                console.error("QA Selector Helper: Could not get active tab ID to remove highlight.");
                alert("Could not get active tab to remove highlight.");
            }
        });
    }
}

// Initialize the QA Helper when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Make it a global variable for easy access from inline event handlers if any remain,
    // or for debugging.
    window.qaHelper = new QASelectorHelper();
});
