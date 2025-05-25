import api from '../api/axios';

/**
 * Helper functions for diagnosing and fixing image upload issues
 */

// Test different image upload approaches to see which one works
export const debugImageUpload = async (
  imageFile: File,
  additionalData: Record<string, string> = {}
): Promise<{success: boolean, message: string, response?: any}> => {
  try {
    console.log('Image Debug Tool: Testing image upload with file:', imageFile.name, imageFile.type, imageFile.size);
    
    // Create a FormData with the image and test data
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('name', 'Debug Test Item ' + new Date().toISOString());
    formData.append('price', '10000');
    formData.append('description', 'This is a test item created by image upload debugging tool');
    
    // Add any additional fields
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    console.log('Image Debug Tool: Trying direct upload approach');
    try {
      // First approach - standard upload
      const response = await api.post('/menu', formData);
      console.log('Image Debug Tool: Direct upload successful', response.data);
      return {
        success: true,
        message: 'Upload successful with standard approach',
        response: response.data
      };
    } catch (error) {
      console.log('Image Debug Tool: Direct upload failed, trying fallback');
      
      try {
        // Second approach - try with explicit multipart header
        const response = await api.post('/menu', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        console.log('Image Debug Tool: Fallback upload successful', response.data);
        return {
          success: true,
          message: 'Upload successful with multipart header approach',
          response: response.data
        };
      } catch (finalError) {
        console.error('Image Debug Tool: All approaches failed', finalError);
        return {
          success: false,
          message: 'All upload approaches failed'
        };
      }
    }
  } catch (error) {
    console.error('Image Debug Tool: Unexpected error', error);
    return {
      success: false,
      message: 'Unexpected error during upload test'
    };
  }
};

// Inspect an image URL to help diagnose issues
export const inspectImageUrl = (url: string): string => {
  if (!url) {
    return 'URL is empty';
  }
  
  if (url.startsWith('data:image/')) {
    return 'This is a data URL (base64 encoded image)';
  }
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `This is a full URL: ${url}`;
  }
  
  if (url.startsWith('/')) {
    return `This is an absolute path: ${url}. Try accessing at http://localhost:3000${url}`;
  }
  
  return `This appears to be a relative path: ${url}. Try accessing at http://localhost:3000/uploads/${url}`;
}; 

/**
 * Helper untuk menangani gambar menu
 * 
 * File ini berisi fungsi-fungsi untuk membantu menampilkan gambar
 * tanpa bergantung pada path yang tersimpan di database
 */

// Pemetaan nama menu ke nama file gambar
export const menuToImageMap: Record<string, string> = {
  'nasgor': 'nasi_goreng.jpg',
  'nasi goreng': 'nasi_goreng.jpg',
  'es teh': 'es_teh.jpg', 
  'es jeruk': 'es_jeruk.jpg',
  'french fries': 'french_fries.jpg',
  'roti bakar': 'roti_bakar.jpg',
  'ayam bakar madu': 'ayam_bakar_madu.jpg',
  // Tambahkan variasi lain dari nama menu
  'nasgor spesial': 'nasi_goreng.jpg',
  'nasigor': 'nasi_goreng.jpg',
  'nasi': 'nasi_goreng.jpg',
  'teh': 'es_teh.jpg',
  'jeruk': 'es_jeruk.jpg',
  'roti': 'roti_bakar.jpg',
  'es': 'es_teh.jpg',
  'seger': 'es_jeruk.jpg',
  'ayam': 'ayam_bakar_madu.jpg',
  'ayam bakar': 'ayam_bakar_madu.jpg',
  'french': 'french_fries.jpg',
  'fries': 'french_fries.jpg',
  'bakar': 'roti_bakar.jpg',
  'enak': 'roti_bakar.jpg',
};

/**
 * Mendapatkan nama file gambar berdasarkan nama menu
 * @param menuName Nama menu
 * @returns Nama file gambar jika ditemukan, undefined jika tidak
 */
export const getImageFileNameByMenuName = (menuName: string): string | undefined => {
  const lowerCaseName = menuName.toLowerCase();
  
  // Periksa kecocokan langsung
  if (menuToImageMap[lowerCaseName]) {
    return menuToImageMap[lowerCaseName];
  }
  
  // Periksa kecocokan parsial
  for (const [key, value] of Object.entries(menuToImageMap)) {
    if (lowerCaseName.includes(key) || key.includes(lowerCaseName)) {
      return value;
    }
  }
  
  return undefined;
};

/**
 * Mendapatkan URL gambar menu
 * @param menuName Nama menu
 * @param databasePath Path yang tersimpan di database (opsional)
 * @param forceReload Flag untuk memaksa reload (opsional)
 * @returns URL gambar
 */
export const getMenuImageUrl = (
  menuName: string, 
  databasePath?: string,
  forceReload: number = 0
): string => {
  // Coba berbagai metode untuk mendapatkan nama file yang benar
  
  // 1. Deteksi otomatis dengan fungsi pemetaan
  const imageFileName = getImageFileNameByMenuName(menuName);
  
  if (imageFileName) {
    console.log(`ImageHelper - Auto-detected image for "${menuName}": ${imageFileName}`);
    // Always add cache-busting timestamp for auto-detected images
    return `/images/menu/${imageFileName}?v=${Date.now()}`;
  }
  
  // 2. Coba tebak nama file berdasarkan nama menu
  // Transformasi nama menu menjadi nama file yang mungkin
  const possibleFilename = menuName.toLowerCase()
    .replace(/\s+/g, '_')         // ganti spasi dengan underscore
    .replace(/[^\w\s]/gi, '')    // hapus karakter khusus
    + '.jpg';                    // tambah ekstensi .jpg
    
  console.log(`ImageHelper - Trying filename guess for "${menuName}": ${possibleFilename}`);
  
  // Coba langsung dari tebakan nama file ini, dengan timestamp untuk hindari cache
  return `/images/menu/${possibleFilename}?v=${Date.now()}`;
};

/**
 * Fungsi untuk auto-fix path gambar di database untuk semua menu
 * Catatan: Fungsi ini hanya contoh implementasi dan perlu integrasi ke MenuAPI
 * 
 * @param menus Array menu yang akan diupdate
 * @returns Array menu dengan path gambar yang sudah diperbaiki
 */
export const bulkFixMenuImages = (menus: any[]): any[] => {
  console.log('Starting bulk fix of menu images...');
  
  return menus.map(menu => {
    // Skip jika menu tidak memiliki id atau nama
    if (!menu.id || !menu.name) return menu;
    
    // Coba deteksi nama file berdasarkan nama menu
    const detectedFileName = getImageFileNameByMenuName(menu.name);
    
    // Jika tidak ada file terdeteksi, return menu asli
    if (!detectedFileName) {
      console.log(`[AUTO-FIX] No image mapping found for "${menu.name}"`);
      return menu;
    }
    
    // Path yang benar adalah images/menu/[nama_file]
    const correctPath = `images/menu/${detectedFileName}`;
    
    // Jika path sama dengan yang sudah ada, tidak perlu update
    if (menu.image === correctPath) {
      console.log(`[AUTO-FIX] Menu "${menu.name}" path already correct: ${correctPath}`);
      return menu;
    }
    
    console.log(`[AUTO-FIX] Menu "${menu.name}" (ID: ${menu.id}): 
      Path lama: ${menu.image || 'KOSONG'}
      Path baru: ${correctPath}`);
    
    // Return menu dengan path yang sudah diperbaiki
    return {
      ...menu,
      image: correctPath
    };
  });
};

/**
 * Helper untuk debug masalah gambar
 * @param imagePath Path gambar yang akan didiagnosis
 * @returns Informasi diagnostic
 */
export const diagnoseImagePath = (imagePath: string): string => {
  // Jika path kosong
  if (!imagePath || imagePath.trim() === '') {
    return 'ERROR: Path gambar kosong';
  }
  
  // Analisa format path
  let diagnosis = `Diagnosis path gambar: "${imagePath}"\n\n`;
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    diagnosis += '- Format: URL lengkap (http/https)\n';
    diagnosis += '- Tindakan: Cek apakah URL dapat diakses langsung di browser\n';
  } else if (imagePath.startsWith('data:image/')) {
    diagnosis += '- Format: Data URL (base64)\n';
    diagnosis += '- Tindakan: Data URL seharusnya berfungsi tanpa masalah\n';
  } else if (imagePath.startsWith('/')) {
    diagnosis += '- Format: Path absolut (dimulai dengan /)\n';
    
    if (imagePath.startsWith('/images/menu/')) {
      diagnosis += '- Format sudah benar (path absolut ke folder public)\n';
      const filename = imagePath.split('/').pop();
      diagnosis += `- Perlu cek apakah file "${filename}" ada di folder public/images/menu/\n`;
    } else {
      diagnosis += '- MASALAH: Path tidak mengarah ke folder images/menu\n';
      diagnosis += '- Tindakan: Ubah menjadi format /images/menu/[nama_file.jpg]\n';
    }
  } else if (imagePath.includes('/') || imagePath.includes('\\')) {
    diagnosis += '- Format: Path relatif dengan separator\n';
    
    if (imagePath.includes('images/menu/') || imagePath.includes('images\\menu\\')) {
      diagnosis += '- Format sudah benar (path ke folder images/menu)\n';
      const filename = imagePath.split(/[\/\\]/).pop();
      diagnosis += `- Perlu cek apakah file "${filename}" ada di folder public/images/menu/\n`;
    } else {
      diagnosis += '- MASALAH: Path tidak mengarah ke folder images/menu\n';
      diagnosis += '- Tindakan: Ubah menjadi format images/menu/[nama_file.jpg]\n';
    }
  } else {
    // Kemungkinan hanya nama file
    diagnosis += '- Format: Hanya nama file tanpa path\n';
    diagnosis += '- MASALAH: Format tidak sesuai standar\n';
    diagnosis += '- Tindakan: Ubah menjadi format images/menu/[nama_file.jpg]\n';
  }
  
  // Cek ekstensi file
  const filename = imagePath.split(/[\/\\]/).pop() || imagePath;
  const hasExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(filename);
  
  if (!hasExtension) {
    diagnosis += '\n- MASALAH KRITIS: Nama file tidak memiliki ekstensi gambar (.jpg, .png, dll)\n';
    diagnosis += '- Tindakan: Tambahkan ekstensi yang sesuai (contoh: .jpg)\n';
  }
  
  if (filename.includes(' ')) {
    diagnosis += '\n- MASALAH: Nama file mengandung spasi\n';
    diagnosis += `- Tindakan: Ganti spasi dengan underscore, contoh: "${filename.replace(/ /g, '_')}"\n`;
  }
  
  return diagnosis;
}; 