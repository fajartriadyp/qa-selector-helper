# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-08-21

### Added
- **Highlight Element Feature**: Fitur untuk menampilkan elemen yang dipilih dari popup di website
- **Click to Highlight**: Klik selector di popup untuk highlight elemen di website
- **Auto Scroll**: Elemen yang di-highlight akan otomatis di-scroll ke tengah layar
- **Temporary Highlight**: Highlight otomatis hilang setelah 5 detik atau klik di luar elemen
- **Remove Highlight Button**: Tombol "🗑️ Remove Highlight" untuk menghapus semua highlight manual
- **Visual Feedback**: Item selector di popup memiliki hover effect dan indikator "🎯 Klik untuk highlight"
- **Highlight Instructions**: Petunjuk penggunaan fitur highlight di popup
- **Test Page**: File `test-highlight.html` untuk testing fitur highlight

### Technical Improvements
- **Message Handlers**: Handler baru untuk `highlight_element` dan `remove_highlight`
- **CSS Highlight Classes**: Class CSS untuk temporary dan permanent highlight
- **Animation Effects**: Animasi pulse untuk highlight element
- **Event Management**: Auto-remove highlight dengan click outside dan timeout
- **Error Handling**: Error handling untuk selector not found dan invalid selector

### UI/UX Enhancements
- **Hover Effects**: Item selector memiliki hover effect untuk menunjukkan bisa diklik
- **Visual Indicators**: Indikator visual untuk menunjukkan selector bisa diklik
- **Better Styling**: Styling yang lebih baik untuk highlight element
- **User Instructions**: Instruksi lengkap untuk penggunaan fitur highlight

### Documentation
- **HIGHLIGHT_FEATURE.md**: Dokumentasi lengkap untuk fitur highlight element
- **Troubleshooting Guide**: Panduan troubleshooting untuk masalah highlight
- **Future Enhancement**: Daftar fitur yang bisa ditambahkan di masa depan

## [1.1.1] - 2025-08-20

### Fixed
- **Pinned Tooltip Behavior**: Tooltip yang di-pin sekarang tetap menampilkan elemen yang di-pin meskipun hover ke elemen lain
- **Temporary Hover Highlight**: Elemen lain yang di-hover mendapat highlight sementara (kuning) tanpa mengubah tooltip yang di-pin
- **Highlight Management**: Perbaikan management highlight untuk pinned element dan temporary hover elements

### Changed
- **Mouse Over Behavior**: Ketika tooltip di-pin, hover ke elemen lain tidak mengubah tooltip yang sudah di-pin
- **Visual Feedback**: Pinned element tetap di-highlight ungu, elemen lain yang di-hover mendapat highlight kuning sementara
- **Tooltip Persistence**: Tooltip yang di-pin benar-benar persisten sampai di-unpin

### Technical Improvements
- **Enhanced Mouse Event Handling**: Logic yang lebih baik untuk handle mouse over/out ketika tooltip di-pin
- **Temporary Highlight System**: Sistem highlight sementara untuk elemen yang di-hover ketika tooltip di-pin
- **CSS Class Management**: Perbaikan management CSS classes untuk berbagai jenis highlight

## [1.1.0] - 2025-08-20

### Added
- **Pin/Unpin Tooltip dengan Right Click**: Klik kanan untuk membuat tooltip tetap stay di tempat
- **Visual Feedback untuk Pinned Element**: Elemen yang di-pin akan di-highlight dengan warna ungu dan animasi pulse
- **Pinned Indicator**: Tooltip menampilkan indikator "📌 PINNED - Right click to unpin"
- **Multiple Unpin Methods**: 
  - Klik kanan lagi pada elemen yang sama
  - Klik tombol "🔓 Unpin" di popup extension
- **Pinned State Synchronization**: State pinned tersinkronisasi antara popup dan content script
- **Enhanced Hover Instructions**: Instruksi lengkap di popup untuk penggunaan hover mode

### Technical Improvements
- **Context Menu Prevention**: Mencegah context menu default browser saat right click
- **Pinned Element Styling**: CSS khusus untuk elemen yang di-pin dengan animasi pulse
- **State Management**: Tracking state pinned di content script dan popup
- **Message Handlers**: Handler baru untuk get_pinned_state dan unpin_tooltip

### UI/UX Enhancements
- **Hover Mode Tips**: Instruksi visual di popup untuk penggunaan fitur
- **Pinned Tooltip Styling**: Tooltip dengan border ungu saat di-pin
- **Better Visual Feedback**: Animasi dan styling yang jelas untuk elemen yang di-pin

## [1.0.1] - 2025-08-20

### Fixed
- **Hover Mode State Synchronization**: Memperbaiki masalah dimana state hover mode tidak tersinkronisasi antara popup dan content script
- **Popup State Management**: Ketika extension di-close dan dibuka kembali, popup sekarang akan mengecek state hover mode dari content script
- **Retry Mechanism**: Menambahkan retry mechanism untuk sync state jika content script belum ter-load
- **Better Error Handling**: Error handling yang lebih baik untuk kasus content script tidak tersedia

### Added
- **syncHoverModeState()**: Fungsi untuk sinkronisasi state hover mode dengan content script
- **updateHoverModeUI()**: Fungsi untuk update UI berdasarkan state hover mode
- **get_hover_mode_state**: Message handler baru di content script untuk mengembalikan state hover mode
- **Enhanced Logging**: Logging yang lebih detail untuk debugging state synchronization

### Technical Improvements
- **State Persistence**: Hover mode state sekarang persisten di content script meskipun popup di-close
- **UI Consistency**: UI popup selalu konsisten dengan state hover mode yang sebenarnya
- **Robust Communication**: Komunikasi antara popup dan content script yang lebih robust

## [1.0.0] - 2025-08-20

### Added
- **Prioritas ID Selector**: Selector ID sekarang muncul paling atas dalam daftar hasil scan
- **Multi-Selector Display**: Tooltip hover mode sekarang menampilkan semua jenis selector yang tersedia
- **XPath Support**: Menambahkan generate XPath selector untuk setiap elemen
- **Enhanced Selector Generation**: 
  - ID Selector (prioritas 1)
  - Data Test ID Selector (prioritas 2)
  - Data Attributes Selector (prioritas 3)
  - Class Selector (prioritas 4)
  - XPath Selector (prioritas 5)
  - CSS Path Selector (prioritas 6)
- **Copy to Clipboard untuk Setiap Selector**: Tombol copy individual untuk setiap jenis selector di tooltip
- **Improved Tooltip Design**: Tooltip yang lebih besar dan informatif dengan semua selector
- **Enhanced Popup Display**: Daftar selector di popup menampilkan semua jenis selector dengan urutan prioritas
- **Better Visual Feedback**: Tombol copy dengan feedback visual yang lebih baik
- **Comprehensive Demo Page**: Halaman demo yang lebih lengkap dengan berbagai jenis elemen untuk testing

### Changed
- **Selector Sorting**: Elemen dengan ID sekarang diurutkan paling atas dalam hasil scan
- **Tooltip Layout**: Tooltip sekarang lebih besar dan dapat menampung semua selector
- **Popup Layout**: Layout popup diubah untuk menampilkan multiple selector per elemen
- **CSS Styling**: Styling yang lebih baik untuk tooltip dan popup elements
- **Content Script**: Logika generate selector diperbaiki untuk mendukung semua jenis selector

### Fixed
- **Tooltip Pointer Events**: Tooltip sekarang dapat berinteraksi dengan tombol copy
- **Selector Escaping**: Perbaikan escaping untuk selector yang mengandung karakter khusus
- **Copy Functionality**: Copy to clipboard sekarang berfungsi dengan baik di content script
- **Event Handling**: Perbaikan event handling untuk hover mode

### Technical Improvements
- **getXPath Function**: Menambahkan fungsi untuk generate XPath selector
- **generateElementData Enhancement**: Fungsi diperluas untuk generate semua jenis selector
- **Priority-based Sorting**: Implementasi sorting berdasarkan prioritas selector
- **Better Error Handling**: Error handling yang lebih robust untuk copy functionality

## [0.9.0] - 2025-06-26

### Added
- Initial release of QA Selector Helper Extension
- Basic scan functionality for elements with ID and data-testid
- Hover mode with basic tooltip
- Copy to clipboard functionality
- Element highlighting
- Demo page for testing

### Features
- Scan visible selectors
- Hover mode activation
- Basic selector generation (ID, data-testid, CSS path)
- Copy selector to clipboard
- Highlight elements on page
- Pin tooltip functionality (basic implementation)

## [Unreleased]

### Planned Features
- Custom selector preferences
- Export selectors to file
- Integration with popular testing frameworks
- Advanced filtering options
- Selector validation
- Performance improvements for large pages
