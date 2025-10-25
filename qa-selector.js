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
        this.allSelectors = []; // Store all selectors for filtering
        this.searchTimeout = null; // For debouncing search
        this.favorites = this.loadFavorites(); // Store favorite selectors
        this.history = this.loadHistory(); // Store selector history
        this.isFavoritesView = false; // Track current view mode
        this.selectedSelectors = new Set(); // Store selected selectors for bulk operations
        this.isDarkMode = this.loadTheme(); // Store theme preference
        // this.lastMouseMoveEvent = null; // Removed: Mouse events on page handled by content script
        this.init();
    }

    init() {
        this.createPopup();
        // Sync hover mode state with content script when popup opens
        // Add small delay to ensure popup is rendered
        setTimeout(() => {
            this.syncHoverModeState();
            // Auto-scan page elements when popup opens
            this.requestPageScan();
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
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="qa-theme-toggle-btn" id="qa-theme-toggle" title="Toggle Dark Mode">
                        🌙
                    </button>
                    <button class="qa-close-btn" id="qa-close-extension-btn">×</button>
                </div>
            </div>
            <div class="qa-popup-content">
                <button class="qa-button" id="qa-scan-selectors-btn">
                    Scan Visible Selectors
                </button>
                <button class="qa-button" id="hover-toggle">
                    Enable Hover Mode
                </button>
                <div class="qa-search-container" style="margin: 12px 0;">
                    <input type="text" id="qa-search-input" placeholder="🔍 Cari selector... (auto-scan saat mengetik)" 
                           style="width: 100%; padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; background: white; box-sizing: border-box;">
                    <div id="qa-loading-indicator" style="display: none; text-align: center; margin-top: 8px; color: #f59e0b; font-size: 12px;">
                        ⏳ Memindai halaman...
                    </div>
                </div>
                <div style="display: flex; gap: 8px; margin: 8px 0; flex-wrap: wrap;">
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
                <div style="display: flex; gap: 8px; margin: 8px 0; flex-wrap: wrap;">
                    <button class="qa-button" id="export-selectors-btn" style="width: auto; padding: 8px 12px; font-size: 12px; background: #10b981; color: white;">
                        📤 Export
                    </button>
                    <button class="qa-button" id="import-selectors-btn" style="width: auto; padding: 8px 12px; font-size: 12px; background: #3b82f6; color: white;">
                        📥 Import
                    </button>
                    <button class="qa-button" id="validate-selectors-btn" style="width: auto; padding: 8px 12px; font-size: 12px; background: #f59e0b; color: white;">
                        ✅ Validate
                    </button>
                    <button class="qa-button" id="favorites-btn" style="width: auto; padding: 8px 12px; font-size: 12px; background: #8b5cf6; color: white;">
                        ⭐ Favorites
                    </button>
                </div>
                <div id="bulk-operations-container" style="display: none; margin: 8px 0; padding: 8px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.3);">
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                        <span style="font-size: 12px; color: #374151; font-weight: bold;">Bulk Operations:</span>
                        <button class="qa-button" id="select-all-btn" style="width: auto; padding: 6px 10px; font-size: 11px; background: #3b82f6; color: white;">
                            ☑️ Select All
                        </button>
                        <button class="qa-button" id="deselect-all-btn" style="width: auto; padding: 6px 10px; font-size: 11px; background: #6b7280; color: white;">
                            ☐ Deselect All
                        </button>
                        <button class="qa-button" id="bulk-copy-btn" style="width: auto; padding: 6px 10px; font-size: 11px; background: #10b981; color: white;">
                            📋 Copy Selected
                        </button>
                        <button class="qa-button" id="bulk-export-btn" style="width: auto; padding: 6px 10px; font-size: 11px; background: #f59e0b; color: white;">
                            📤 Export Selected
                        </button>
                        <button class="qa-button" id="bulk-favorite-btn" style="width: auto; padding: 6px 10px; font-size: 11px; background: #8b5cf6; color: white;">
                            ⭐ Add to Favorites
                        </button>
                    </div>
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

        // Initialize theme
        this.applyTheme();

        // Add event listeners for buttons inside the popup
        // Ensure qaHelper instance is correctly referenced if these are called from global scope
        document.getElementById('qa-close-extension-btn').addEventListener('click', () => this.closeExtension());
        // Modify the "Scan Visible Selectors" button to send a message
        document.getElementById('qa-scan-selectors-btn').addEventListener('click', () => this.requestPageScan()); // Updated to call renamed method
        document.getElementById('hover-toggle').addEventListener('click', () => this.toggleHoverMode());
        document.getElementById('pin-toggle').addEventListener('click', (event) => this.togglePin(event)); // Pass event
        document.getElementById('unpin-btn').addEventListener('click', () => this.unpinFromPopup());
        document.getElementById('remove-highlight-btn').addEventListener('click', () => this.removeHighlight());
        document.getElementById('export-selectors-btn').addEventListener('click', () => this.exportSelectors());
        document.getElementById('import-selectors-btn').addEventListener('click', () => this.importSelectors());
        document.getElementById('validate-selectors-btn').addEventListener('click', () => this.validateSelectors());
        document.getElementById('favorites-btn').addEventListener('click', () => this.toggleFavoritesView());
        document.getElementById('select-all-btn').addEventListener('click', () => this.selectAllSelectors());
        document.getElementById('deselect-all-btn').addEventListener('click', () => this.deselectAllSelectors());
        document.getElementById('bulk-copy-btn').addEventListener('click', () => this.bulkCopySelectors());
        document.getElementById('bulk-export-btn').addEventListener('click', () => this.bulkExportSelectors());
        document.getElementById('bulk-favorite-btn').addEventListener('click', () => this.bulkAddToFavorites());
        document.getElementById('qa-theme-toggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('qa-search-input').addEventListener('input', (e) => this.debouncedFilterSelectors(e.target.value));

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
        this.showLoadingIndicator();
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    // Changed action to "scan_page_elements"
                    { action: "scan_page_elements" }, 
                    (response) => {
                        this.hideLoadingIndicator();
                        
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
                this.hideLoadingIndicator();
                console.error("QA Selector Helper: Could not get active tab ID.");
                alert("Could not get active tab to send message.");
            }
        });
    }

    showLoadingIndicator() {
        const loadingIndicator = document.getElementById('qa-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
    }

    hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('qa-loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
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

        // Store all selectors for filtering
        this.allSelectors = elementsDataArray;
        
        // Clear search input when new data is loaded
        const searchInput = document.getElementById('qa-search-input');
        if (searchInput) {
            searchInput.value = '';
        }
        
        // Render the full list
        this.renderSelectorList(elementsDataArray);
    }

    debouncedFilterSelectors(searchTerm) {
        // Clear existing timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Set new timeout for debouncing
        this.searchTimeout = setTimeout(() => {
            this.filterSelectors(searchTerm);
        }, 300); // 300ms delay
    }

    filterSelectors(searchTerm) {
        // If no data available and user is searching, trigger auto-scan
        if ((!this.allSelectors || this.allSelectors.length === 0) && searchTerm && searchTerm.trim() !== '') {
            console.log("QA Selector Helper: No data available, triggering auto-scan for search");
            this.requestPageScan();
            return;
        }

        if (!this.allSelectors || this.allSelectors.length === 0) {
            return;
        }

        const filteredSelectors = this.allSelectors.filter(elementData => {
            if (!searchTerm || searchTerm.trim() === '') {
                return true;
            }

            const searchLower = searchTerm.toLowerCase();
            
            // Search in tag name
            if (elementData.tagName && elementData.tagName.toLowerCase().includes(searchLower)) {
                return true;
            }
            
            // Search in ID
            if (elementData.id && elementData.id.toLowerCase().includes(searchLower)) {
                return true;
            }
            
            // Search in data-testid
            if (elementData.dataTestId && elementData.dataTestId.toLowerCase().includes(searchLower)) {
                return true;
            }
            
            // Search in classes
            if (elementData.classes && elementData.classes.toLowerCase().includes(searchLower)) {
                return true;
            }
            
            // Search in all selectors
            if (elementData.selectors && elementData.selectors.length > 0) {
                return elementData.selectors.some(selector => 
                    selector.value.toLowerCase().includes(searchLower) ||
                    selector.type.toLowerCase().includes(searchLower)
                );
            }
            
            // Search in CSS path
            if (elementData.cssPath && elementData.cssPath.toLowerCase().includes(searchLower)) {
                return true;
            }
            
            return false;
        });

        this.renderSelectorList(filteredSelectors);
    }

    renderSelectorList(elementsDataArray) {
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

                    const buttonContainer = document.createElement('div');
                    buttonContainer.style.display = 'flex';
                    buttonContainer.style.gap = '4px';
                    buttonContainer.style.alignItems = 'center';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = this.selectedSelectors.has(selector.value);
                    checkbox.style.marginRight = '4px';
                    checkbox.addEventListener('change', (e) => {
                        e.stopPropagation();
                        this.toggleSelectorSelection(selector.value);
                    });

                    const copyButton = document.createElement('button');
                    copyButton.className = 'qa-copy-btn';
                    copyButton.textContent = '📋';
                    copyButton.style.fontSize = '10px';
                    copyButton.style.padding = '4px 8px';
                    copyButton.addEventListener('click', (e) => {
                        e.stopPropagation(); 
                        this.copyToClipboard(selector.value, copyButton);
                    });

                    const favoriteButton = document.createElement('button');
                    favoriteButton.className = 'qa-favorite-btn';
                    favoriteButton.textContent = this.isFavorite(selector.value) ? '⭐' : '☆';
                    favoriteButton.style.fontSize = '10px';
                    favoriteButton.style.padding = '4px 8px';
                    favoriteButton.style.background = this.isFavorite(selector.value) ? '#f59e0b' : '#6b7280';
                    favoriteButton.style.color = 'white';
                    favoriteButton.style.border = 'none';
                    favoriteButton.style.borderRadius = '4px';
                    favoriteButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.toggleFavorite(selector.value, favoriteButton);
                    });

                    buttonContainer.appendChild(checkbox);
                    buttonContainer.appendChild(copyButton);
                    buttonContainer.appendChild(favoriteButton);

                    selectorDiv.appendChild(selectorInfo);
                    selectorDiv.appendChild(buttonContainer);
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
                if (!e.target.classList.contains('qa-copy-btn') && !e.target.classList.contains('qa-favorite-btn') && e.target.type !== 'checkbox') {
                    // Send message to content script to highlight element
                    console.log("Highlight request for:", elementData);
                    this.highlightElementOnPage(elementData);
                }
            });
            listElement.appendChild(div);
        });
    }

    // Export/Import Functions
    exportSelectors() {
        if (!this.allSelectors || this.allSelectors.length === 0) {
            alert("Tidak ada selector untuk di-export. Silakan scan halaman terlebih dahulu.");
            return;
        }

        const exportData = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            selectors: this.allSelectors.map(elementData => ({
                tagName: elementData.tagName,
                id: elementData.id,
                dataTestId: elementData.dataTestId,
                classes: elementData.classes,
                cssPath: elementData.cssPath,
                selectors: elementData.selectors,
                dataAttributes: elementData.dataAttributes
            }))
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `qa-selectors-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log("QA Selector Helper: Selectors exported successfully");
    }

    importSelectors() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const importData = JSON.parse(e.target.result);
                        if (importData.selectors && Array.isArray(importData.selectors)) {
                            this.allSelectors = importData.selectors;
                            this.renderSelectorList(this.allSelectors);
                            alert(`Berhasil mengimport ${importData.selectors.length} selector dari file.`);
                        } else {
                            alert("Format file tidak valid. Pastikan file adalah export dari QA Selector Helper.");
                        }
                    } catch (error) {
                        console.error("QA Selector Helper: Error importing selectors:", error);
                        alert("Error membaca file. Pastikan file adalah format JSON yang valid.");
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    validateSelectors() {
        if (!this.allSelectors || this.allSelectors.length === 0) {
            alert("Tidak ada selector untuk di-validate. Silakan scan halaman terlebih dahulu.");
            return;
        }

        this.showLoadingIndicator();
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].id) {
                chrome.tabs.sendMessage(
                    tabs[0].id,
                    { action: "validate_selectors", selectors: this.allSelectors },
                    (response) => {
                        this.hideLoadingIndicator();
                        
                        if (chrome.runtime.lastError) {
                            console.error("QA Selector Helper: Error validating selectors:", chrome.runtime.lastError.message);
                            alert("Error validating selectors: " + chrome.runtime.lastError.message);
                        } else {
                            console.log("QA Selector Helper: Validation response:", response);
                            if (response && response.status === "success") {
                                this.displayValidationResults(response.data);
                            } else {
                                alert("Error during validation: " + (response?.message || "Unknown error"));
                            }
                        }
                    }
                );
            } else {
                this.hideLoadingIndicator();
                alert("Could not get active tab to validate selectors.");
            }
        });
    }

    displayValidationResults(validationResults) {
        const validCount = validationResults.filter(r => r.isValid).length;
        const invalidCount = validationResults.filter(r => !r.isValid).length;
        
        let message = `Hasil Validasi:\n✅ Valid: ${validCount}\n❌ Invalid: ${invalidCount}\n\n`;
        
        if (invalidCount > 0) {
            message += "Selector yang tidak valid:\n";
            validationResults.filter(r => !r.isValid).forEach(result => {
                message += `• ${result.selector}: ${result.error}\n`;
            });
        }
        
        alert(message);
        
        // Update UI to show validation status
        this.renderSelectorListWithValidation(this.allSelectors, validationResults);
    }

    renderSelectorListWithValidation(elementsDataArray, validationResults) {
        const listElement = document.getElementById('selector-list');
        const countElement = document.getElementById('selector-count');
        
        if (!listElement || !countElement) {
            console.error("QA Selector Helper: Popup list or count element not found.");
            return;
        }

        const validCount = validationResults.filter(r => r.isValid).length;
        countElement.textContent = `Found: ${elementsDataArray.length} elements (${validCount} valid)`;
        
        listElement.innerHTML = ''; // Clear existing items
        
        elementsDataArray.forEach((elementData, index) => {
            const validationResult = validationResults[index];
            const div = document.createElement('div');
            div.className = 'qa-selector-item';
            div.style.cursor = 'pointer';
            div.style.transition = 'all 0.2s ease';
            div.style.borderRadius = '8px';
            div.style.padding = '8px';
            div.style.marginBottom = '8px';
            
            // Add validation status styling
            if (validationResult && !validationResult.isValid) {
                div.style.border = '2px solid #ef4444';
                div.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            } else if (validationResult && validationResult.isValid) {
                div.style.border = '2px solid #10b981';
                div.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
            }
            
            // Add hover effect
            div.addEventListener('mouseenter', () => {
                if (!validationResult || validationResult.isValid) {
                    div.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                    div.style.border = '1px solid rgba(16, 185, 129, 0.3)';
                }
                div.style.transform = 'translateY(-1px)';
                div.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)';
            });
            
            div.addEventListener('mouseleave', () => {
                if (validationResult && !validationResult.isValid) {
                    div.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                    div.style.border = '2px solid #ef4444';
                } else if (validationResult && validationResult.isValid) {
                    div.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                    div.style.border = '2px solid #10b981';
                } else {
                    div.style.backgroundColor = 'transparent';
                    div.style.border = '1px solid transparent';
                }
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
            strongTag.textContent = elementData.tagName;
            strongTag.style.color = '#374151';
            
            const statusIndicator = document.createElement('span');
            if (validationResult) {
                statusIndicator.textContent = validationResult.isValid ? '✅ Valid' : '❌ Invalid';
                statusIndicator.style.fontSize = '10px';
                statusIndicator.style.color = validationResult.isValid ? '#10b981' : '#ef4444';
                statusIndicator.style.fontWeight = 'bold';
            } else {
                statusIndicator.textContent = '🎯 Klik untuk highlight';
                statusIndicator.style.fontSize = '10px';
                statusIndicator.style.color = '#10b981';
                statusIndicator.style.fontWeight = 'bold';
            }
            
            headerDiv.appendChild(strongTag);
            headerDiv.appendChild(statusIndicator);
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

                    const buttonContainer = document.createElement('div');
                    buttonContainer.style.display = 'flex';
                    buttonContainer.style.gap = '4px';
                    buttonContainer.style.alignItems = 'center';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = this.selectedSelectors.has(selector.value);
                    checkbox.style.marginRight = '4px';
                    checkbox.addEventListener('change', (e) => {
                        e.stopPropagation();
                        this.toggleSelectorSelection(selector.value);
                    });

                    const copyButton = document.createElement('button');
                    copyButton.className = 'qa-copy-btn';
                    copyButton.textContent = '📋';
                    copyButton.style.fontSize = '10px';
                    copyButton.style.padding = '4px 8px';
                    copyButton.addEventListener('click', (e) => {
                        e.stopPropagation(); 
                        this.copyToClipboard(selector.value, copyButton);
                    });

                    const favoriteButton = document.createElement('button');
                    favoriteButton.className = 'qa-favorite-btn';
                    favoriteButton.textContent = this.isFavorite(selector.value) ? '⭐' : '☆';
                    favoriteButton.style.fontSize = '10px';
                    favoriteButton.style.padding = '4px 8px';
                    favoriteButton.style.background = this.isFavorite(selector.value) ? '#f59e0b' : '#6b7280';
                    favoriteButton.style.color = 'white';
                    favoriteButton.style.border = 'none';
                    favoriteButton.style.borderRadius = '4px';
                    favoriteButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.toggleFavorite(selector.value, favoriteButton);
                    });

                    buttonContainer.appendChild(checkbox);
                    buttonContainer.appendChild(copyButton);
                    buttonContainer.appendChild(favoriteButton);

                    selectorDiv.appendChild(selectorInfo);
                    selectorDiv.appendChild(buttonContainer);
                    infoDiv.appendChild(selectorDiv);
                });
            }

            contentDiv.appendChild(infoDiv);
            div.appendChild(contentDiv);
            
            div.addEventListener('click', (e) => {
                if (!e.target.classList.contains('qa-copy-btn') && !e.target.classList.contains('qa-favorite-btn')) {
                    console.log("Highlight request for:", elementData);
                    this.highlightElementOnPage(elementData);
                }
            });
            listElement.appendChild(div);
        });
    }

    // Favorites Functions
    toggleFavoritesView() {
        this.isFavoritesView = !this.isFavoritesView;
        const favoritesBtn = document.getElementById('favorites-btn');
        
        if (this.isFavoritesView) {
            favoritesBtn.textContent = '📋 All Selectors';
            favoritesBtn.style.background = '#6b7280';
            this.renderFavoritesList();
        } else {
            favoritesBtn.textContent = '⭐ Favorites';
            favoritesBtn.style.background = '#8b5cf6';
            this.renderSelectorList(this.allSelectors);
        }
    }

    renderFavoritesList() {
        if (this.favorites.length === 0) {
            const listElement = document.getElementById('selector-list');
            const countElement = document.getElementById('selector-count');
            
            if (listElement && countElement) {
                countElement.textContent = 'No favorites yet';
                listElement.innerHTML = '<div style="text-align: center; padding: 20px; color: #6b7280;">Belum ada selector favorit. Klik ⭐ pada selector untuk menambahkannya ke favorites.</div>';
            }
            return;
        }

        // Filter all selectors to show only favorites
        const favoriteSelectors = this.allSelectors.filter(elementData => {
            return elementData.selectors && elementData.selectors.some(selector => 
                this.favorites.includes(selector.value)
            );
        });

        this.renderSelectorList(favoriteSelectors);
    }

    isFavorite(selectorValue) {
        return this.favorites.includes(selectorValue);
    }

    toggleFavorite(selectorValue, buttonElement) {
        const index = this.favorites.indexOf(selectorValue);
        
        if (index > -1) {
            // Remove from favorites
            this.favorites.splice(index, 1);
            buttonElement.textContent = '☆';
            buttonElement.style.background = '#6b7280';
        } else {
            // Add to favorites
            this.favorites.push(selectorValue);
            buttonElement.textContent = '⭐';
            buttonElement.style.background = '#f59e0b';
        }
        
        this.saveFavorites();
        this.addToHistory(selectorValue);
    }

    addToHistory(selectorValue) {
        // Remove if already exists
        const index = this.history.indexOf(selectorValue);
        if (index > -1) {
            this.history.splice(index, 1);
        }
        
        // Add to beginning
        this.history.unshift(selectorValue);
        
        // Keep only last 50 items
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }
        
        this.saveHistory();
    }

    // Bulk Operations Functions
    selectAllSelectors() {
        this.selectedSelectors.clear();
        this.allSelectors.forEach(elementData => {
            if (elementData.selectors && elementData.selectors.length > 0) {
                elementData.selectors.forEach(selector => {
                    this.selectedSelectors.add(selector.value);
                });
            }
        });
        this.updateBulkOperationsUI();
        this.renderSelectorList(this.allSelectors);
    }

    deselectAllSelectors() {
        this.selectedSelectors.clear();
        this.updateBulkOperationsUI();
        this.renderSelectorList(this.allSelectors);
    }

    toggleSelectorSelection(selectorValue) {
        if (this.selectedSelectors.has(selectorValue)) {
            this.selectedSelectors.delete(selectorValue);
        } else {
            this.selectedSelectors.add(selectorValue);
        }
        this.updateBulkOperationsUI();
    }

    updateBulkOperationsUI() {
        const bulkContainer = document.getElementById('bulk-operations-container');
        const bulkCopyBtn = document.getElementById('bulk-copy-btn');
        const bulkExportBtn = document.getElementById('bulk-export-btn');
        const bulkFavoriteBtn = document.getElementById('bulk-favorite-btn');
        
        if (this.selectedSelectors.size > 0) {
            bulkContainer.style.display = 'block';
            bulkCopyBtn.textContent = `📋 Copy Selected (${this.selectedSelectors.size})`;
            bulkExportBtn.textContent = `📤 Export Selected (${this.selectedSelectors.size})`;
            bulkFavoriteBtn.textContent = `⭐ Add to Favorites (${this.selectedSelectors.size})`;
        } else {
            bulkContainer.style.display = 'none';
        }
    }

    bulkCopySelectors() {
        if (this.selectedSelectors.size === 0) {
            alert("Tidak ada selector yang dipilih.");
            return;
        }

        const selectedArray = Array.from(this.selectedSelectors);
        const textToCopy = selectedArray.join('\n');
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert(`Berhasil menyalin ${selectedArray.length} selector ke clipboard!`);
        }).catch(err => {
            console.error('Error copying to clipboard:', err);
            alert("Error menyalin ke clipboard.");
        });
    }

    bulkExportSelectors() {
        if (this.selectedSelectors.size === 0) {
            alert("Tidak ada selector yang dipilih.");
            return;
        }

        const selectedArray = Array.from(this.selectedSelectors);
        const exportData = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            type: 'bulk_export',
            selectedCount: selectedArray.length,
            selectors: selectedArray.map(selectorValue => {
                // Find the element data for this selector
                const elementData = this.allSelectors.find(el => 
                    el.selectors && el.selectors.some(s => s.value === selectorValue)
                );
                const selector = elementData?.selectors?.find(s => s.value === selectorValue);
                
                return {
                    selector: selectorValue,
                    type: selector?.type || 'Unknown',
                    tagName: elementData?.tagName || 'Unknown',
                    id: elementData?.id || null,
                    dataTestId: elementData?.dataTestId || null
                };
            })
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `qa-selectors-selected-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log("QA Selector Helper: Selected selectors exported successfully");
    }

    bulkAddToFavorites() {
        if (this.selectedSelectors.size === 0) {
            alert("Tidak ada selector yang dipilih.");
            return;
        }

        let addedCount = 0;
        this.selectedSelectors.forEach(selectorValue => {
            if (!this.favorites.includes(selectorValue)) {
                this.favorites.push(selectorValue);
                addedCount++;
            }
        });

        this.saveFavorites();
        alert(`Berhasil menambahkan ${addedCount} selector ke favorites!`);
        
        // Clear selection after adding to favorites
        this.selectedSelectors.clear();
        this.updateBulkOperationsUI();
        this.renderSelectorList(this.allSelectors);
    }

    // Storage Functions
    loadFavorites() {
        try {
            const stored = localStorage.getItem('qa-selector-favorites');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("QA Selector Helper: Error loading favorites:", error);
            return [];
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem('qa-selector-favorites', JSON.stringify(this.favorites));
        } catch (error) {
            console.error("QA Selector Helper: Error saving favorites:", error);
        }
    }

    loadHistory() {
        try {
            const stored = localStorage.getItem('qa-selector-history');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error("QA Selector Helper: Error loading history:", error);
            return [];
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('qa-selector-history', JSON.stringify(this.history));
        } catch (error) {
            console.error("QA Selector Helper: Error saving history:", error);
        }
    }

    // Theme Functions
    toggleTheme() {
        this.isDarkMode = !this.isDarkMode;
        this.applyTheme();
        this.saveTheme();
    }

    applyTheme() {
        const popup = document.querySelector('.qa-extension-popup');
        const themeToggle = document.getElementById('qa-theme-toggle');
        
        if (this.isDarkMode) {
            popup.classList.add('dark-mode');
            themeToggle.textContent = '☀️';
            themeToggle.title = 'Switch to Light Mode';
        } else {
            popup.classList.remove('dark-mode');
            themeToggle.textContent = '🌙';
            themeToggle.title = 'Switch to Dark Mode';
        }
    }

    loadTheme() {
        try {
            const stored = localStorage.getItem('qa-selector-theme');
            return stored === 'dark';
        } catch (error) {
            console.error("QA Selector Helper: Error loading theme:", error);
            return false; // Default to light mode
        }
    }

    saveTheme() {
        try {
            localStorage.setItem('qa-selector-theme', this.isDarkMode ? 'dark' : 'light');
        } catch (error) {
            console.error("QA Selector Helper: Error saving theme:", error);
        }
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
