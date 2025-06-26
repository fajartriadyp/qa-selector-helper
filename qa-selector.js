<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QA Selector Helper Extension</title>
    <style>
        /* Extension Popup Styles */
        .qa-extension-popup {
            position: fixed;
            top: 20px;
            right: 20px;
            width: 320px;
            background: linear-gradient(135deg, #fef3c7, #fcd34d);
            color: #1f2937;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(251, 191, 36, 0.3), 0 0 0 1px rgba(251, 191, 36, 0.2);
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            backdrop-filter: blur(10px);
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        .qa-popup-header {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            padding: 16px 20px;
            border-radius: 16px 16px 0 0;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: white;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .qa-popup-content {
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 0 0 16px 16px;
        }

        .qa-button {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 10px;
            cursor: pointer;
            margin: 6px 0;
            width: 100%;
            transition: all 0.3s ease;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
            position: relative;
            overflow: hidden;
        }

        .qa-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s;
        }

        .qa-button:hover::before {
            left: 100%;
        }

        .qa-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
        }

        .qa-button.active {
            background: linear-gradient(135deg, #10b981, #059669);
            box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .qa-close-btn {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            border: none;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(239, 68, 68, 0.3);
        }

        .qa-close-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
        }

        .qa-selector-list {
            margin-top: 16px;
        }

        .qa-selector-item {
            background: linear-gradient(135deg, #fef3c7, #fde68a);
            margin: 8px 0;
            padding: 12px;
            border-radius: 12px;
            font-family: monospace;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
        }

        .qa-selector-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.3), transparent);
            transition: left 0.5s;
        }

        .qa-selector-item:hover {
            transform: translateY(-2px);
            border-color: #f59e0b;
            box-shadow: 0 8px 25px rgba(245, 158, 11, 0.2);
        }

        .qa-selector-item:hover::before {
            left: 100%;
        }

        .qa-count {
            color: #92400e;
            font-size: 12px;
            font-weight: 600;
            background: rgba(245, 158, 11, 0.1);
            padding: 8px 12px;
            border-radius: 8px;
            margin: 8px 0;
            text-align: center;
        }

        .qa-copy-btn {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: white;
            border: none;
            border-radius: 8px;
            padding: 6px 10px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
            font-weight: 600;
        }

        .qa-copy-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
        }

        .qa-copy-btn.copied {
            background: linear-gradient(135deg, #10b981, #059669);
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
        }

        .qa-pin-btn {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed) !important;
            box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3) !important;
        }

        .qa-pin-btn:hover {
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4) !important;
        }

        .qa-pin-btn:disabled {
            background: linear-gradient(135deg, #9ca3af, #6b7280) !important;
            box-shadow: none !important;
            cursor: not-allowed;
            opacity: 0.5;
        }

        .qa-unpin-btn {
            background: linear-gradient(135deg, #ef4444, #dc2626) !important;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3) !important;
        }

        .qa-unpin-btn:hover {
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4) !important;
        }

        .qa-tooltip-pinned {
            border: 2px solid #8b5cf6 !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3), 
                        0 0 0 1px rgba(139, 92, 246, 0.5),
                        0 0 20px rgba(139, 92, 246, 0.3) !important;
        }

        .qa-overlay-pinned {
            border-color: #8b5cf6 !important;
            background: rgba(139, 92, 246, 0.15) !important;
            animation: pinnedPulse 2s infinite !important;
        }

        @keyframes pinnedPulse {
            0% { box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.2); }
            50% { box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.5), 0 0 30px rgba(139, 92, 246, 0.4); }
            100% { box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.2); }
        }

        /* Hover Overlay Styles */
        .qa-hover-overlay {
            position: absolute;
            pointer-events: none;
            border: 3px solid #f59e0b;
            background: rgba(245, 158, 11, 0.15);
            z-index: 9999;
            transition: all 0.1s ease;
            box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.3), 
                        0 0 20px rgba(245, 158, 11, 0.2);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.3), 0 0 20px rgba(245, 158, 11, 0.2); }
            50% { box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.5), 0 0 30px rgba(245, 158, 11, 0.4); }
            100% { box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.3), 0 0 20px rgba(245, 158, 11, 0.2); }
        }

        .qa-hover-tooltip {
            position: absolute;
            background: linear-gradient(135deg, #1f2937, #374151);
            color: white;
            padding: 16px;
            border-radius: 12px;
            font-family: monospace;
            font-size: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3), 
                        0 0 0 1px rgba(245, 158, 11, 0.3);
            z-index: 10001;
            min-width: 250px;
            line-height: 1.4;
            backdrop-filter: blur(10px);
            animation: tooltipIn 0.2s ease-out;
        }

        @keyframes tooltipIn {
            from {
                opacity: 0;
                transform: scale(0.9) translateY(10px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }

        .qa-tooltip-section {
            margin-bottom: 12px;
            padding: 8px;
            background: rgba(245, 158, 11, 0.1);
            border-radius: 8px;
            border-left: 3px solid #f59e0b;
        }

        .qa-tooltip-label {
            color: #fbbf24;
            font-weight: bold;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 10px;
        }

        .qa-tooltip-value {
            color: #e5e7eb;
            word-break: break-all;
        }

        /* Element highlighting when clicked from list */
        .qa-highlighted-element {
            outline: 4px solid #f59e0b !important;
            outline-offset: 3px;
            background: rgba(245, 158, 11, 0.2) !important;
            box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.4), 
                        0 0 30px rgba(245, 158, 11, 0.3) !important;
            animation: highlight 1s ease-in-out;
        }

        @keyframes highlight {
            0% { 
                outline-color: #f59e0b;
                box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.4), 0 0 30px rgba(245, 158, 11, 0.3);
            }
            50% { 
                outline-color: #fbbf24;
                box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.6), 0 0 50px rgba(251, 191, 36, 0.5);
            }
            100% { 
                outline-color: #f59e0b;
                box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.4), 0 0 30px rgba(245, 158, 11, 0.3);
            }
        }
    </style>
</head>
<body>
    <!-- Demo webpage content -->
    <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1 id="main-title" class="page-header">QA Selector Helper Demo</h1>
        <p class="description">This demo shows how the QA extension works.</p>
        
        <div id="content-section" class="content-wrapper">
            <button id="demo-button" class="btn primary-btn" data-testid="demo-btn">Click Me</button>
            <input type="text" id="demo-input" class="form-input" placeholder="Enter text here" data-automation="text-input">
            
            <div class="card-container">
                <div class="card" id="card-1" data-card-id="first">
                    <h3>Card 1</h3>
                    <p>Sample content</p>
                </div>
                <div class="card" id="card-2" data-card-id="second">
                    <h3>Card 2</h3>
                    <p>More content</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        class QASelectorHelper {
            constructor() {
                this.isHoverModeActive = false;
                this.isPinned = false;
                this.pinnedElement = null;
                this.popup = null;
                this.overlay = null;
                this.tooltip = null;
                this.visibleSelectors = [];
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
                        <button class="qa-close-btn" onclick="qaHelper.closeExtension()">×</button>
                    </div>
                    <div class="qa-popup-content">
                        <button class="qa-button" onclick="qaHelper.scanVisibleSelectors()">
                            Scan Visible Selectors
                        </button>
                        <button class="qa-button" id="hover-toggle" onclick="qaHelper.toggleHoverMode()">
                            Enable Hover Mode
                        </button>
                        <div style="display: flex; gap: 8px; margin: 8px 0;">
                            <button class="qa-button qa-pin-btn" id="pin-toggle" onclick="qaHelper.togglePin()" style="width: auto; padding: 8px 12px; font-size: 12px;" disabled>
                                📌 Pin Tooltip
                            </button>
                            <button class="qa-button qa-unpin-btn" id="unpin-btn" onclick="qaHelper.unpin()" style="width: auto; padding: 8px 12px; font-size: 12px; display: none;">
                                🔓 Unpin
                            </button>
                        </div>
                        <div class="qa-count" id="selector-count">Found: 0 selectors</div>
                        <div class="qa-selector-list" id="selector-list"></div>
                    </div>
                `;
                document.body.appendChild(this.popup);
            }

            scanVisibleSelectors() {
                this.visibleSelectors = [];
                const allElements = document.querySelectorAll('*[id]'); // Only elements with ID
                
                allElements.forEach(element => {
                    // Skip the extension elements
                    if (element.closest('.qa-extension-popup') || 
                        element.classList.contains('qa-hover-overlay') ||
                        element.classList.contains('qa-hover-tooltip')) {
                        return;
                    }

                    // Check if element is visible
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
                
                // ID selector
                if (element.id) {
                    selectors.push(`#${element.id}`);
                }
                
                // Class selectors
                if (element.className && typeof element.className === 'string') {
                    const classes = element.className.trim().split(/\s+/);
                    if (classes.length > 0 && classes[0]) {
                        selectors.push(`.${classes.join('.')}`);
                    }
                }
                
                // Tag selector
                selectors.push(element.tagName.toLowerCase());
                
                // Data attributes
                Array.from(element.attributes).forEach(attr => {
                    if (attr.name.startsWith('data-')) {
                        selectors.push(`[${attr.name}="${attr.value}"]`);
                    }
                });
                
                // Generate CSS path
                const path = this.getCSSPath(element);
                if (path) selectors.push(path);
                
                return selectors;
            }

            getCSSPath(element) {
                if (element.id) return `#${element.id}`;
                
                const path = [];
                let current = element;
                
                while (current && current !== document.body) {
                    let selector = current.tagName.toLowerCase();
                    
                    if (current.className && typeof current.className === 'string') {
                        const classes = current.className.trim().split(/\s+/);
                        if (classes.length > 0 && classes[0]) {
                            selector += `.${classes[0]}`;
                        }
                    }
                    
                    // Add nth-child if needed for uniqueness
                    const siblings = Array.from(current.parentNode?.children || [])
                        .filter(sibling => sibling.tagName === current.tagName);
                    
                    if (siblings.length > 1) {
                        const index = siblings.indexOf(current) + 1;
                        selector += `:nth-child(${index})`;
                    }
                    
                    path.unshift(selector);
                    current = current.parentElement;
                }
                
                return path.join(' > ');
            }

            updateSelectorList() {
                const listElement = document.getElementById('selector-list');
                const countElement = document.getElementById('selector-count');
                
                countElement.textContent = `Found: ${this.visibleSelectors.length} ID selectors`;
                
                listElement.innerHTML = '';
                
                this.visibleSelectors.forEach((item, index) => {
                    const div = document.createElement('div');
                    div.className = 'qa-selector-item';
                    div.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong>${item.element.tagName.toLowerCase()}</strong><br>
                                <span style="color: #4299e1;">${item.selector}</span>
                            </div>
                            <button class="qa-copy-btn" onclick="qaHelper.copyToClipboard('${item.selector}', this)">📋</button>
                        </div>
                    `;
                    
                    div.onclick = (e) => {
                        if (!e.target.classList.contains('qa-copy-btn')) {
                            this.highlightElement(item.element, [item.selector]);
                        }
                    };
                    listElement.appendChild(div);
                });
            }

            highlightElement(element, selectors) {
                // Remove previous highlighting
                document.querySelectorAll('.qa-highlighted-element').forEach(el => {
                    el.classList.remove('qa-highlighted-element');
                });
                
                // Highlight the selected element
                element.classList.add('qa-highlighted-element');
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Show detailed selector info
                alert(`Element Selectors:\n\n${selectors.join('\n')}`);
                
                // Remove highlight after 3 seconds
                setTimeout(() => {
                    element.classList.remove('qa-highlighted-element');
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
                    this.unpin(); // Unpin if hovering is disabled
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
                document.addEventListener('mousemove', (e) => {
                    if (!this.isHoverModeActive || this.isPinned) return;
                    
                    const element = e.target;
                    
                    // Skip extension elements
                    if (element.closest('.qa-extension-popup') || 
                        element.classList.contains('qa-hover-overlay') ||
                        element.classList.contains('qa-hover-tooltip')) {
                        return;
                    }
                    
                    this.showHoverInfo(element, e);
                });

                // Add click listener to pin/unpin
                document.addEventListener('click', (e) => {
                    if (!this.isHoverModeActive) return;
                    
                    const element = e.target;
                    
                    // Skip extension elements and copy buttons
                    if (element.closest('.qa-extension-popup') || 
                        element.classList.contains('qa-hover-overlay') ||
                        element.classList.contains('qa-hover-tooltip') ||
                        element.classList.contains('qa-copy-btn')) {
                        return;
                    }
                    
                    // If clicking on a different element while pinned, switch to that element
                    if (this.isPinned && element !== this.pinnedElement) {
                        this.pinnedElement = element;
                        this.showHoverInfo(element, e, true);
                    }
                });
            }

            showHoverInfo(element, event, forcePin = false) {
                if (!this.overlay || !this.tooltip) return;
                
                // If pinned and not forcing a new pin, don't update
                if (this.isPinned && !forcePin) return;
                
                const rect = element.getBoundingClientRect();
                const selectors = this.generateSelectors(element);
                
                // Position overlay
                this.overlay.style.left = rect.left + 'px';
                this.overlay.style.top = rect.top + 'px';
                this.overlay.style.width = rect.width + 'px';
                this.overlay.style.height = rect.height + 'px';
                
                // Update overlay appearance based on pin state
                if (this.isPinned) {
                    this.overlay.classList.add('qa-overlay-pinned');
                } else {
                    this.overlay.classList.remove('qa-overlay-pinned');
                }

                // Create tooltip content with copy buttons
                const tooltipContent = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(245, 158, 11, 0.3);">
                        <span style="color: #fbbf24; font-weight: bold;">Element Inspector</span>
                        ${this.isPinned ? '<span style="color: #8b5cf6; font-size: 10px;">📌 PINNED</span>' : ''}
                    </div>
                    <div class="qa-tooltip-section">
                        <div class="qa-tooltip-label">Tag:</div>
                        <div class="qa-tooltip-value" style="display: flex; justify-content: space-between; align-items: center;">
                            <span>${element.tagName.toLowerCase()}</span>
                            <button class="qa-copy-btn" onclick="qaHelper.copyToClipboard('${element.tagName.toLowerCase()}', this)">📋</button>
                        </div>
                    </div>
                    ${element.id ? `
                    <div class="qa-tooltip-section">
                        <div class="qa-tooltip-label">ID:</div>
                        <div class="qa-tooltip-value" style="display: flex; justify-content: space-between; align-items: center;">
                            <span>#${element.id}</span>
                            <button class="qa-copy-btn" onclick="qaHelper.copyToClipboard('#${element.id}', this)">📋</button>
                        </div>
                    </div>` : ''}
                    ${element.className ? `
                    <div class="qa-tooltip-section">
                        <div class="qa-tooltip-label">Classes:</div>
                        <div class="qa-tooltip-value" style="display: flex; justify-content: space-between; align-items: center;">
                            <span>.${element.className.toString().replace(/\s+/g, '.')}</span>
                            <button class="qa-copy-btn" onclick="qaHelper.copyToClipboard('.${element.className.toString().replace(/\s+/g, '.')}', this)">📋</button>
                        </div>
                    </div>` : ''}
                    <div class="qa-tooltip-section">
                        <div class="qa-tooltip-label">CSS Path:</div>
                        <div class="qa-tooltip-value" style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="word-break: break-all; margin-right: 8px;">${this.getCSSPath(element)}</span>
                            <button class="qa-copy-btn" onclick="qaHelper.copyToClipboard('${this.getCSSPath(element).replace(/'/g, "\\'")}', this)">📋</button>
                        </div>
                    </div>
                    ${Array.from(element.attributes).filter(attr => attr.name.startsWith('data-')).length > 0 ? `
                    <div class="qa-tooltip-section">
                        <div class="qa-tooltip-label">Data Attributes:</div>
                        ${Array.from(element.attributes)
                            .filter(attr => attr.name.startsWith('data-'))
                            .map(attr => `
                                <div class="qa-tooltip-value" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                    <span>[${attr.name}="${attr.value}"]</span>
                                    <button class="qa-copy-btn" onclick="qaHelper.copyToClipboard('[${attr.name}=&quot;${attr.value}&quot;]', this)">📋</button>
                                </div>
                            `).join('')}
                    </div>` : ''}
                `;
                
                this.tooltip.innerHTML = tooltipContent;
                
                // Update tooltip appearance based on pin state
                if (this.isPinned) {
                    this.tooltip.classList.add('qa-tooltip-pinned');
                } else {
                    this.tooltip.classList.remove('qa-tooltip-pinned');
                }
                
                // Position tooltip (only if not pinned or forcing new position)
                if (!this.isPinned || forcePin) {
                    let tooltipX = event.clientX + 10;
                    let tooltipY = event.clientY + 10;
                    
                    // Adjust if tooltip goes off screen
                    const tooltipRect = this.tooltip.getBoundingClientRect();
                    if (tooltipX + tooltipRect.width > window.innerWidth) {
                        tooltipX = event.clientX - tooltipRect.width - 10;
                    }
                    if (tooltipY + tooltipRect.height > window.innerHeight) {
                        tooltipY = event.clientY - tooltipRect.height - 10;
                    }
                    
                    this.tooltip.style.left = tooltipX + 'px';
                    this.tooltip.style.top = tooltipY + 'px';
                }
            }

            closeExtension() {
                if (this.popup) this.popup.remove();
                this.removeOverlay();
            }

            copyToClipboard(text, buttonElement) {
                navigator.clipboard.writeText(text).then(() => {
                    // Visual feedback
                    const originalText = buttonElement.textContent;
                    buttonElement.textContent = '✓';
                    buttonElement.classList.add('copied');
                    
                    setTimeout(() => {
                        buttonElement.textContent = originalText;
                        buttonElement.classList.remove('copied');
                    }, 1000);
                }).catch(err => {
                    // Fallback for older browsers
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    
                    // Visual feedback
                    const originalText = buttonElement.textContent;
                    buttonElement.textContent = '✓';
                    buttonElement.classList.add('copied');
                    
                    setTimeout(() => {
                        buttonElement.textContent = originalText;
                        buttonElement.classList.remove('copied');
                    }, 1000);
                });
            }

            togglePin() {
                if (!this.isHoverModeActive) return;
                
                this.isPinned = true;
                const pinButton = document.getElementById('pin-toggle');
                const unpinButton = document.getElementById('unpin-btn');
                
                pinButton.style.display = 'none';
                unpinButton.style.display = 'inline-block';
                
                // Store current hovered element as pinned element
                const hoveredElement = document.elementFromPoint(event.clientX, event.clientY);
                if (hoveredElement && !hoveredElement.closest('.qa-extension-popup')) {
                    this.pinnedElement = hoveredElement;
                    this.showHoverInfo(hoveredElement, event, true);
                }
            }

            unpin() {
                this.isPinned = false;
                this.pinnedElement = null;
                
                const pinButton = document.getElementById('pin-toggle');
                const unpinButton = document.getElementById('unpin-btn');
                
                pinButton.style.display = 'inline-block';
                unpinButton.style.display = 'none';
                
                // Remove pinned styling
                if (this.overlay) this.overlay.classList.remove('qa-overlay-pinned');
                if (this.tooltip) this.tooltip.classList.remove('qa-tooltip-pinned');
            }
        }

        // Initialize the QA Helper
        const qaHelper = new QASelectorHelper();
        
        // Add some demo styles for the test page
        const demoStyles = `
            <style>
                .page-header { color: #2d3748; margin-bottom: 20px; }
                .description { color: #718096; margin-bottom: 30px; }
                .content-wrapper { background: #f7fafc; padding: 20px; border-radius: 8px; }
                .btn { padding: 10px 20px; margin: 10px; border: none; border-radius: 4px; cursor: pointer; }
                .primary-btn { background: #4299e1; color: white; }
                .form-input { padding: 8px; margin: 10px; border: 1px solid #cbd5e0; border-radius: 4px; width: 200px; }
                .card-container { display: flex; gap: 20px; margin-top: 20px; }
                .card { background: white; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); flex: 1; }
            </style>
        `;
        document.head.insertAdjacentHTML('beforeend', demoStyles);
    </script>
</body>
</html>