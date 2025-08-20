#!/bin/bash

# QA Selector Helper Extension Installer
# Script untuk memudahkan setup dan testing extension

echo "🚀 QA Selector Helper Extension Installer"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "manifest.json" ]; then
    echo "❌ Error: manifest.json tidak ditemukan!"
    echo "Pastikan Anda menjalankan script ini dari direktori yang berisi file-file extension."
    exit 1
fi

# Check if all required files exist
echo "📋 Memeriksa file-file yang diperlukan..."

required_files=(
    "manifest.json"
    "qa-selector.html"
    "qa-selector.css"
    "qa-selector.js"
    "content-script.js"
    "content-style.css"
    "demo.html"
    "icons/icon16.png"
    "icons/icon48.png"
    "icons/icon128.png"
)

missing_files=()

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo "❌ File-file berikut tidak ditemukan:"
    for file in "${missing_files[@]}"; do
        echo "   - $file"
    done
    echo ""
    echo "Pastikan semua file extension ada di direktori ini."
    exit 1
fi

echo "✅ Semua file diperlukan ditemukan!"

# Validate manifest.json
echo "🔍 Memvalidasi manifest.json..."
if ! python3 -m json.tool manifest.json > /dev/null 2>&1; then
    echo "❌ Error: manifest.json memiliki syntax error!"
    echo "Memperbaiki manifest.json..."
    
    # Try to fix common issues
    sed -i 's/,$//' manifest.json  # Remove trailing commas
    sed -i 's/,\s*}/}/g' manifest.json  # Remove trailing commas before closing braces
    
    if ! python3 -m json.tool manifest.json > /dev/null 2>&1; then
        echo "❌ Tidak dapat memperbaiki manifest.json secara otomatis."
        echo "Silakan periksa file manifest.json secara manual."
        exit 1
    else
        echo "✅ manifest.json berhasil diperbaiki!"
    fi
else
    echo "✅ manifest.json valid!"
fi

# Create a simple test server for demo page
echo "🌐 Membuat test server untuk demo page..."
echo ""
echo "Untuk menguji extension:"
echo "1. Buka Chrome/Edge dan pergi ke chrome://extensions atau edge://extensions"
echo "2. Aktifkan 'Developer mode'"
echo "3. Klik 'Load unpacked' dan pilih direktori ini"
echo "4. Extension akan muncul di toolbar browser"
echo "5. Klik icon extension untuk membuka popup"
echo "6. Buka file demo.html di browser untuk testing"
echo ""

# Ask if user wants to start a simple HTTP server
read -p "Apakah Anda ingin menjalankan server lokal untuk demo page? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Menjalankan server lokal..."
    echo "Demo page tersedia di: http://localhost:8000/demo.html"
    echo "Tekan Ctrl+C untuk menghentikan server"
    echo ""
    
    # Check if Python 3 is available
    if command -v python3 &> /dev/null; then
        python3 -m http.server 8000
    elif command -v python &> /dev/null; then
        python -m http.server 8000
    else
        echo "❌ Python tidak ditemukan. Silakan install Python atau gunakan server lain."
        echo "Atau buka file demo.html langsung di browser."
    fi
fi

echo ""
echo "✅ Setup selesai! Extension siap digunakan."
echo ""
echo "📚 Dokumentasi lengkap tersedia di:"
echo "   - README.md (panduan umum)"
echo "   - test-extension.md (panduan testing)"
echo ""
echo "🐛 Jika ada masalah, periksa:"
echo "   - Console browser (F12) untuk error messages"
echo "   - Tab Extensions di Developer Tools"
echo "   - File test-extension.md untuk troubleshooting"
