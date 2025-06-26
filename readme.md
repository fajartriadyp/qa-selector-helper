# QA Selector Helper

## Overview

The QA Selector Helper is a simple browser tool designed to assist Quality Assurance engineers and developers in identifying and copying various CSS selectors for web elements. It provides an interactive way to inspect elements on a demo page, view their potential selectors, and copy them to the clipboard.

This tool is built with HTML, CSS, and vanilla JavaScript, and includes a demo page to showcase its functionality.

## Features

*   **Scan Visible Selectors:** Analyzes the page (specifically elements with IDs in the current version) and lists them in the helper popup.
*   **Hover Mode:** Enables an overlay and tooltip that displays selector information for the element currently under the mouse cursor.
*   **Element Inspector Tooltip:** Shows detailed selector information:
    *   Tag Name
    *   ID
    *   Classes
    *   Full CSS Path
    *   Data Attributes
*   **Pin Tooltip:** Allows the user to "pin" the tooltip to the currently hovered element, keeping its information visible even when the mouse moves away.
*   **Copy Selectors:** Easily copy individual selectors to the clipboard with a single click from the tooltip or the scanned list.
*   **Highlight Element:** Clicking an element in the "Scan Visible Selectors" list will highlight and scroll to the corresponding element on the page.

## File Structure

The project is organized into three main files:

*   `qa-selector.html`: The main HTML file that includes the demo page content and the structure for the QA Selector Helper. It links the CSS and JavaScript files.
*   `qa-selector.css`: Contains all the styles for the QA Selector Helper popup, tooltips, overlays, and the basic styling for the demo page elements.
*   `qa-selector.js`: Holds all the JavaScript logic for the QA Selector Helper, including element scanning, selector generation, event handling, and DOM manipulation for the interactive features.

## Usage

There are two main ways to use the QA Selector Helper:

**1. As a Standalone Page:**

1.  Clone or download the repository/files.
2.  Open the `qa-selector.html` file directly in your web browser.
3.  The QA Selector Helper popup will appear on the top right of the page, and it will interact with the demo content provided within `qa-selector.html`.
4.  Interact with the buttons and features:
    *   Click "Scan Visible Selectors" to populate the list with elements (from the demo page) that have an ID.
    *   Click "Enable Hover Mode" to inspect elements (on the demo page) by hovering over them.
    *   While in Hover Mode, click the "Pin Tooltip" button (📌) in the popup to pin the inspector tooltip. Click "Unpin" (🔓) to release it.
    *   Use the copy buttons (📋) next to each selector in the tooltip or the list to copy them.

**2. As a Browser Extension (e.g., in Chrome/Edge):**

A `manifest.json` file is included to allow loading the tool as an unpacked browser extension. When loaded as an extension, the `qa-selector.html` page will serve as the popup.

A `content-script.js` has been added and is injected into web pages. This script is responsible for interacting directly with the web page's content. The popup script (`qa-selector.js`) communicates with this content script to perform actions on the live page.

*Development Status:* The extension is currently being developed to transition its core functionality (element scanning, inspection, highlighting) from operating on its internal demo content to operating on the live web page viewed by the user. The initial communication bridge between the popup and the content script is being established.

**Loading as an Unpacked Extension (Chrome/Edge Example):**

1.  Clone or download the repository/files to a local directory.
2.  Open your browser (e.g., Chrome or Edge).
3.  Navigate to the extensions page:
    *   Chrome: `chrome://extensions`
    *   Edge: `edge://extensions`
4.  Enable "Developer mode" (usually a toggle switch on the top right).
5.  Click the "Load unpacked" button.
6.  Select the directory where you cloned/downloaded the files (the directory containing `manifest.json`).
7.  The "QA Selector Helper" extension should now appear in your list of extensions. You can click its icon in the browser toolbar to open the popup (which is `qa-selector.html`).
8.  Remember to create placeholder icon files (`icon16.png`, `icon48.png`, `icon128.png`) in an `icons` sub-directory if you want to avoid "missing icon" errors, or replace them with actual icons.

## Configuration

Currently, the QA Selector Helper does not have a dedicated configuration file or UI for settings. Customization requires direct modification of the source code:

*   **`qa-selector.js`**:
    *   `scanVisibleSelectors()`: You could modify the initial query (e.g., `document.querySelectorAll('*[id]')`) to scan for different types of elements or attributes.
    *   `generateSelectors()`: The logic for which types of selectors are generated can be altered here.
    *   `getCSSPath()`: The method for generating the full CSS path can be customized (e.g., to prefer different attributes or avoid certain patterns).
*   **`qa-selector.css`**:
    *   The visual appearance (colors, fonts, layout) of the popup, tooltips, and highlights can be changed by modifying the CSS rules.

This tool is intended as a foundational helper and can be extended or modified to fit more specific needs.
