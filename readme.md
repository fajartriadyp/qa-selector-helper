# QA Selector Helper Extension

Extension Chrome untuk membantu QA Engineer dalam menemukan dan menggunakan selector CSS yang tepat untuk testing automation.

## 🚀 Fitur Utama

### 1. **Scan Visible Selectors**
- Scan otomatis semua elemen yang memiliki ID atau data-testid
- **Selector ID muncul paling atas** dalam daftar hasil scan
- Urutan prioritas selector: ID → Data Test ID → Data Attributes → Class → XPath → CSS Path

### 2. **Hover Mode dengan Multi-Selector**
- Aktifkan hover mode untuk melihat selector secara real-time
- **Menampilkan semua jenis selector** yang tersedia untuk setiap elemen:
  - **ID Selector** (prioritas tertinggi)
  - **Data Test ID Selector**
  - **Data Attributes Selector**
  - **Class Selector**
  - **XPath Selector**
  - **CSS Path Selector**
- **Copy selector langsung dari tooltip** dengan tombol copy untuk setiap jenis selector
- **Pin Tooltip dengan Right Click**: Klik kanan untuk membuat tooltip tetap stay di tempat
- **Unpin Tooltip**: Klik kanan lagi atau gunakan tombol unpin di popup untuk menghilangkan pin

### 3. **Copy to Clipboard**
- Copy selector dengan satu klik
- Visual feedback saat berhasil copy (tombol berubah menjadi ✓)
- Support untuk semua jenis selector

### 4. **Highlight Element**
- Highlight elemen yang dipilih dari daftar
- Visual feedback yang jelas dengan border dan glow effect

## 📋 Jenis Selector yang Didukung

### 1. **ID Selector** (Prioritas Tertinggi)
```css
#submit-btn
#username-input
#card-1
```

### 2. **Data Test ID Selector**
```css
[data-testid="submit-button"]
[data-testid="username-field"]
[data-testid="user-card"]
```

### 3. **Data Attributes Selector**
```css
[data-action="submit"]
[data-field="username"]
[data-card-type="user"]
```

### 4. **Class Selector**
```css
.btn.btn-primary
.form-input
.card
```

### 5. **XPath Selector**
```xpath
//*[@id="submit-btn"]
//button[@data-testid="submit-button"]
//div[@class="card"]
```

### 6. **CSS Path Selector**
```css
body > div.container > div.demo-section > button#submit-btn
```

## 🛠️ Cara Penggunaan

### 1. **Install Extension**
```bash
# Clone repository
git clone <repository-url>
cd qa-selector-helper

# Install extension di Chrome
# 1. Buka Chrome Extensions (chrome://extensions/)
# 2. Aktifkan "Developer mode"
# 3. Klik "Load unpacked"
# 4. Pilih folder qa-selector-helper
```

### 2. **Scan Selectors**
1. Buka halaman web yang ingin di-test
2. Klik icon extension QA Selector Helper
3. Klik tombol "Scan Visible Selectors"
4. Lihat hasil scan dengan **ID selector muncul paling atas**

### 3. **Hover Mode**
1. Klik tombol "Enable Hover Mode"
2. Hover mouse ke elemen yang ingin dilihat selectornya
3. Tooltip akan muncul dengan **semua jenis selector** yang tersedia
4. Klik tombol copy (📋) untuk copy selector yang diinginkan

### 4. **Pin/Unpin Tooltip**
1. **Pin Tooltip**: Klik kanan pada elemen untuk membuat tooltip tetap stay di tempat
2. **Visual Feedback**: Elemen akan di-highlight dengan warna ungu dan animasi pulse
3. **Unpin Tooltip**: 
   - Klik kanan lagi pada elemen yang sama, atau
   - Klik tombol "🔓 Unpin" di popup extension
4. **Pinned Indicator**: Tooltip akan menampilkan indikator "📌 PINNED - Right click to unpin"
5. **Persistent Display**: Tooltip yang di-pin tetap menampilkan elemen yang di-pin meskipun hover ke elemen lain
6. **Temporary Hover**: Elemen lain yang di-hover akan mendapat highlight sementara (kuning) tanpa mengubah tooltip

### 4. **Copy Selector**
- Dari daftar scan: Klik tombol copy di sebelah selector
- Dari hover mode: Klik tombol copy di tooltip
- Visual feedback: Tombol berubah menjadi ✓ saat berhasil copy

## 🎯 Contoh Penggunaan untuk QA

### Selenium WebDriver
```python
# Menggunakan ID selector (prioritas tertinggi)
element = driver.find_element(By.ID, "submit-btn")

# Menggunakan data-testid selector
element = driver.find_element(By.CSS_SELECTOR, '[data-testid="submit-button"]')

# Menggunakan XPath selector
element = driver.find_element(By.XPATH, '//*[@id="submit-btn"]')
```

### Playwright
```javascript
// Menggunakan ID selector
await page.click('#submit-btn');

// Menggunakan data-testid selector
await page.click('[data-testid="submit-button"]');

// Menggunakan XPath selector
await page.click('//*[@id="submit-btn"]');
```

### Cypress
```javascript
// Menggunakan ID selector
cy.get('#submit-btn').click();

// Menggunakan data-testid selector
cy.get('[data-testid="submit-button"]').click();

// Menggunakan XPath selector
cy.xpath('//*[@id="submit-btn"]').click();
```

## 📁 Struktur File

```
qa-selector-helper/
├── manifest.json          # Konfigurasi extension
├── qa-selector.html       # Popup HTML
├── qa-selector.js         # Popup JavaScript
├── qa-selector.css        # Popup styles
├── content-script.js      # Content script untuk interaksi dengan halaman
├── content-style.css      # Styles untuk content script
├── demo.html             # Halaman demo untuk testing
├── icons/                # Icon extension
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── readme.md             # Dokumentasi
```

## 🔧 Konfigurasi

### Manifest.json
```json
{
  "manifest_version": 3,
  "name": "QA Selector Helper",
  "version": "1.0.0",
  "description": "Helper untuk QA Engineer dalam menemukan selector CSS",
  "permissions": [
    "activeTab",
    "clipboardWrite"
  ],
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "css": ["content-style.css"],
      "js": ["content-script.js"]
    }
  ],
  "action": {
    "default_popup": "qa-selector.html"
  }
}
```

## 🎨 Customization

### Mengubah Urutan Prioritas Selector
Edit file `content-script.js`, fungsi `generateElementData()`:

```javascript
// Prioritas selector (1 = tertinggi, 6 = terendah)
if (element.id) {
    data.selectors.push({
        type: 'ID',
        value: `#${element.id}`,
        priority: 1  // Prioritas tertinggi
    });
}
```

### Mengubah Style Tooltip
Edit file `content-style.css`:

```css
.qa-cs-tooltip {
    background-color: #2d3748;
    color: #e2e8f0;
    /* Customize sesuai kebutuhan */
}
```

## 🐛 Troubleshooting

### Extension tidak muncul
1. Pastikan Developer mode aktif di Chrome Extensions
2. Refresh halaman web setelah install extension
3. Periksa console browser untuk error

### Hover mode tidak berfungsi
1. Pastikan halaman web sudah di-refresh setelah install extension
2. Periksa apakah ada error di console browser
3. Pastikan tidak ada extension lain yang konflik

### Pin/Unpin tooltip tidak berfungsi
1. Pastikan hover mode sudah diaktifkan
2. Klik kanan pada elemen (bukan pada tooltip)
3. Periksa apakah ada error di console browser
4. Pastikan tidak ada script lain yang mencegah context menu

### Copy to clipboard tidak berfungsi
1. Pastikan permission `clipboardWrite` sudah diberikan
2. Coba refresh halaman dan extension
3. Periksa console browser untuk error

### Hover mode state tidak sinkron
**Gejala**: 
- Enable hover mode, close extension, buka kembali → button menunjukkan "Enable Hover Mode" padahal hover mode masih aktif
- Hover mode tetap berfungsi di halaman tapi UI popup tidak konsisten

**Solusi**:
1. **Reload extension**: Klik tombol reload di Chrome Extensions
2. **Refresh halaman**: Refresh halaman web yang sedang dibuka
3. **Check console**: Periksa console browser untuk error message
4. **Manual sync**: Klik tombol "Enable Hover Mode" lagi untuk sync state

**Penyebab**:
- Content script belum ter-load saat popup dibuka
- Komunikasi antara popup dan content script terputus
- Extension belum di-reload setelah update

**Pencegahan**:
- Extension sudah diperbaiki dengan auto-sync state
- Retry mechanism untuk handle content script yang belum ter-load
- Better error handling untuk kasus komunikasi terputus

## 🤝 Kontribusi

1. Fork repository
2. Buat branch fitur baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📝 Changelog

### v1.0.0
- ✅ Scan visible selectors dengan ID prioritas tertinggi
- ✅ Hover mode dengan multi-selector display
- ✅ Copy to clipboard untuk semua jenis selector
- ✅ Highlight element dari daftar
- ✅ Support untuk ID, data-testid, data-attributes, class, XPath, dan CSS Path
- ✅ Tooltip yang informatif dengan semua selector yang tersedia

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.
