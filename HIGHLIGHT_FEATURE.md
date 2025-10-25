# Fitur Highlight Element - QA Selector Helper

## Deskripsi
Fitur highlight element memungkinkan pengguna untuk menampilkan elemen yang dipilih dari daftar selector di popup extension pada bagian website. Ketika selector diklik di popup, elemen yang sesuai akan di-highlight di halaman website dengan animasi dan scroll otomatis ke elemen tersebut.

## Cara Kerja

### 1. Klik Selector di Popup
- Setelah scan selector, daftar selector akan ditampilkan di popup
- Setiap item selector memiliki indikator visual "🎯 Klik untuk highlight"
- Klik pada item selector untuk highlight elemen di website

### 2. Highlight Element di Website
- Elemen akan di-highlight dengan outline hijau dan animasi pulse
- Elemen akan otomatis di-scroll ke tengah layar
- Highlight akan otomatis hilang setelah 5 detik
- Highlight juga akan hilang jika mengklik di luar elemen

### 3. Remove Highlight Manual
- Tombol "🗑️ Remove Highlight" tersedia di popup
- Klik tombol untuk menghapus semua highlight secara manual

## Jenis Highlight

### Temporary Highlight (Default)
- Outline hijau dengan animasi pulse
- Otomatis hilang setelah 5 detik
- Hilang jika klik di luar elemen
- Class CSS: `.qa-cs-temp-highlight`

### Permanent Highlight (Untuk pengembangan)
- Outline merah dengan animasi pulse
- Tidak hilang otomatis
- Class CSS: `.qa-cs-permanent-highlight`

## CSS Styling

```css
/* Temporary highlight */
.qa-cs-temp-highlight {
    outline: 3px solid #10b981 !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.4), 
                0 0 20px rgba(16, 185, 129, 0.4) !important;
    background-color: rgba(16, 185, 129, 0.1) !important;
    position: relative !important;
    z-index: 2147483646 !important;
    animation: popupHighlightPulse 1s infinite !important;
}

/* Permanent highlight */
.qa-cs-permanent-highlight {
    outline: 3px solid #ef4444 !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.4), 
                0 0 20px rgba(239, 68, 68, 0.4) !important;
    background-color: rgba(239, 68, 68, 0.1) !important;
    position: relative !important;
    z-index: 2147483646 !important;
    animation: permanentHighlightPulse 2s infinite !important;
}
```

## Implementasi Teknis

### Content Script (content-script.js)
1. **Message Handler**: Menangani pesan `highlight_element` dan `remove_highlight`
2. **highlightElementOnPage()**: Fungsi untuk highlight elemen dengan scroll dan auto-remove
3. **removeAllHighlights()**: Fungsi untuk menghapus semua highlight

### Popup Script (qa-selector.js)
1. **highlightElementOnPage()**: Mengirim pesan ke content script untuk highlight
2. **removeHighlight()**: Mengirim pesan ke content script untuk remove highlight
3. **Event Listener**: Menangani klik pada item selector di popup

### UI Enhancement
1. **Hover Effect**: Item selector memiliki hover effect untuk menunjukkan bisa diklik
2. **Visual Indicator**: Indikator "🎯 Klik untuk highlight" di setiap item
3. **Remove Button**: Tombol "🗑️ Remove Highlight" di popup
4. **Instructions**: Petunjuk penggunaan di popup

## Testing

### File Test
- `test-highlight.html`: File demo untuk testing fitur highlight
- Berisi berbagai jenis elemen dengan ID, class, dan data attributes

### Cara Test
1. Load extension di browser
2. Buka file `test-highlight.html`
3. Klik extension icon
4. Klik "Scan Visible Selectors"
5. Klik salah satu selector di daftar
6. Perhatikan elemen di-highlight di website
7. Test tombol "Remove Highlight"

## Error Handling

### Selector Not Found
- Jika selector tidak ditemukan, akan menampilkan error message
- Error ditampilkan di console dan alert

### Content Script Not Loaded
- Jika content script belum load, akan menampilkan error
- User diminta refresh halaman

### Invalid Selector
- Jika selector tidak valid, akan menampilkan error
- Error ditampilkan di console dan alert

## Future Enhancement

### Fitur yang Bisa Ditambahkan
1. **Multiple Highlight**: Highlight beberapa elemen sekaligus
2. **Highlight History**: Menyimpan riwayat highlight
3. **Custom Highlight Color**: Pilihan warna highlight
4. **Highlight Duration**: Pengaturan durasi highlight
5. **Keyboard Shortcuts**: Shortcut keyboard untuk highlight/remove

### Performance Optimization
1. **Debounce**: Mencegah multiple highlight request
2. **Cleanup**: Membersihkan event listener yang tidak terpakai
3. **Memory Management**: Mengoptimalkan penggunaan memory

## Troubleshooting

### Highlight Tidak Muncul
1. Pastikan content script sudah load
2. Refresh halaman dan coba lagi
3. Periksa console untuk error message
4. Pastikan selector valid dan elemen ada di halaman

### Highlight Tidak Hilang
1. Klik tombol "Remove Highlight"
2. Refresh halaman
3. Periksa apakah ada CSS yang konflik

### Scroll Tidak Berfungsi
1. Pastikan elemen tidak di dalam container dengan overflow hidden
2. Periksa apakah elemen memiliki position fixed/absolute
3. Pastikan elemen tidak tersembunyi (display: none)

