import api from '../api/axios';
import type { Menu } from '../types';

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
  'es teler': 'es_teler.jpg',
  'french fries': 'french_fries.jpg',
  'roti bakar': 'roti_bakar.jpg',
  'ayam bakar madu': 'ayam_bakar_madu.jpg',
  'sate ayam': 'sate_ayam.jpg',
  // Tambahkan variasi lain dari nama menu
  'nasgor spesial': 'nasi_goreng.jpg',
  'nasigor': 'nasi_goreng.jpg',
  'nasi': 'nasi_goreng.jpg',
  'teh': 'es_teh.jpg',
  'jeruk': 'es_jeruk.jpg',
  'teler': 'es_teler.jpg',
  'roti': 'roti_bakar.jpg',
  'es': 'es_teh.jpg',
  'seger': 'es_jeruk.jpg',
  'ayam': 'ayam_bakar_madu.jpg',
  'ayam bakar': 'ayam_bakar_madu.jpg',
  'french': 'french_fries.jpg',
  'fries': 'french_fries.jpg',
  'bakar': 'roti_bakar.jpg',
  'enak': 'roti_bakar.jpg',
  'sate': 'sate_ayam.jpg',
};

/**
 * Mendapatkan nama file gambar berdasarkan nama menu
 * @param menuName Nama menu
 * @returns Nama file gambar jika ditemukan, undefined jika tidak
 */
export const getImageFileNameByMenuName = (menuName: string): string | null => {
  const nameToFileMap: Record<string, string> = {
    'Nasi Goreng': 'nasi_goreng.jpg',
    'Nasgor': 'nasi_goreng.jpg',
    'Ayam Bakar Madu': 'ayam_bakar_madu.jpg',
    'Es Teh': 'es_teh.jpg',
    'Es Jeruk': 'es_jeruk.jpg',
    'Es Teler': 'es_teler.jpg',
    'French Fries': 'french_fries.jpg',
    'Roti Bakar': 'roti_bakar.jpg',
    'Sate Ayam': 'sate_ayam.jpg'
  };

  // Try to find an exact match
  if (nameToFileMap[menuName]) {
    return nameToFileMap[menuName];
  }

  // Try to find a case-insensitive match
  const lowerMenuName = menuName.toLowerCase();
  for (const [key, value] of Object.entries(nameToFileMap)) {
    if (key.toLowerCase() === lowerMenuName) {
      return value;
    }
  }
  
  // Try to find a partial match
  for (const [key, value] of Object.entries(nameToFileMap)) {
    if (lowerMenuName.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerMenuName)) {
      return value;
    }
  }
  
  return null;
};

/**
 * Add this new function to check if a filename exists in the available images
 */
export const getAvailableMenuImages = (): string[] => {
  // This is a mock function since we can't read the file system directly in browser
  // In a real application, this would be fetched from an API
  return [
    'ayam_bakar_madu.jpg',
    'es_jeruk.jpg',
    'es_teh.jpg',
    'es_teler.jpg',
    'french_fries.jpg',
    'nasi_goreng.jpg',
    'roti_bakar.jpg',
    'sate_ayam.jpg'
  ];
};

/**
 * Add this function to check if an image exists in the available images
 */
export const isImageAvailable = (filename: string): boolean => {
  if (!filename) return false;
  
  // Clean up the filename - remove path if present
  let cleanFilename = filename;
  if (filename.includes('/')) {
    cleanFilename = filename.split('/').pop() || '';
  } else if (filename.includes('\\')) {
    cleanFilename = filename.split('\\').pop() || '';
  }
  
  // Remove any query parameters
  if (cleanFilename.includes('?')) {
    cleanFilename = cleanFilename.split('?')[0];
  }
  
  // Get the available images
  const availableImages = getAvailableMenuImages();
  
  // Direct match
  if (availableImages.includes(cleanFilename)) {
    return true;
  }
  
  // Case-insensitive match
  return availableImages.some(img => 
    img.toLowerCase() === cleanFilename.toLowerCase()
  );
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
  // Add cache busting for all image URLs
  const cacheBuster = `?v=${Date.now()}-${forceReload}`;
  
  // Check if the database path is valid and exists
  if (databasePath && databasePath.trim() !== '') {
    console.log(`ImageHelper - Using database path for "${menuName}": ${databasePath}`);
    
    // If the path is already a full URL, return it
    if (databasePath.startsWith('http')) {
      return `${databasePath}${cacheBuster}`;
    }
    
    // Extract just the filename if it's a path
    let filename = databasePath;
    if (databasePath.includes('/')) {
      filename = databasePath.split('/').pop() || '';
    }
    
    // Check if this filename exists in our available images
    if (isImageAvailable(filename)) {
      console.log(`ImageHelper - Found exact match for "${filename}" in available images`);
      return `/images/menu/${filename}${cacheBuster}`;
    }
    
    // If the path starts with a slash, it's already a root-relative path
    if (databasePath.startsWith('/')) {
      return `${databasePath}${cacheBuster}`;
    }
    
    // Otherwise, ensure it has the correct prefix
    if (databasePath.startsWith('images/')) {
      return `/${databasePath}${cacheBuster}`;
    } else {
      return `/images/menu/${databasePath}${cacheBuster}`;
    }
  }
  
  // If no valid database path, try auto-detection
  
  // 1. Deteksi otomatis dengan fungsi pemetaan
  const imageFileName = getImageFileNameByMenuName(menuName);
  
  if (imageFileName) {
    console.log(`ImageHelper - Auto-detected image for "${menuName}": ${imageFileName}`);
    // Always add cache-busting timestamp for auto-detected images
    return `/images/menu/${imageFileName}${cacheBuster}`;
  }
  
  // 2. Coba tebak nama file berdasarkan nama menu
  // Transformasi nama menu menjadi nama file yang mungkin
  const possibleFilename = menuName.toLowerCase()
    .replace(/\s+/g, '_')         // ganti spasi dengan underscore
    .replace(/[^\w\s]/gi, '')    // hapus karakter khusus
    + '.jpg';                    // tambah ekstensi .jpg
    
  console.log(`ImageHelper - Trying filename guess for "${menuName}": ${possibleFilename}`);
  
  // Coba langsung dari tebakan nama file ini, dengan timestamp untuk hindari cache
  return `/images/menu/${possibleFilename}${cacheBuster}`;
};

/**
 * Fungsi untuk auto-fix path gambar di database untuk semua menu
 * Catatan: Fungsi ini hanya contoh implementasi dan perlu integrasi ke MenuAPI
 * 
 * @param menus Array menu yang akan diupdate
 * @returns Array menu dengan path gambar yang sudah diperbaiki
 */
export const bulkFixMenuImages = async (menus: Menu[], updateFunction: (id: number, updates: Partial<Menu>) => Promise<any>): Promise<{ success: boolean; fixed: number; errors: number }> => {
  let fixed = 0;
  let errors = 0;

  try {
    for (const menu of menus) {
      // Skip if the menu already has a valid imageUrl
      if (menu.imageUrl && menu.imageUrl.trim() !== '') {
        continue;
      }

      // Try to find an image file name based on menu name
      const fileName = getImageFileNameByMenuName(menu.name);
      if (fileName) {
        try {
          // Create the correct path
          const imageUrl = `/images/menu/${fileName}`;
    
          // Update the menu with the corrected path
          await updateFunction(menu.id, { imageUrl });
          
          console.log(`Fixed image for "${menu.name}": ${imageUrl}`);
          fixed++;
        } catch (err) {
          console.error(`Error updating image for "${menu.name}":`, err);
          errors++;
        }
      }
    }

    return { success: true, fixed, errors };
  } catch (err) {
    console.error('Error in bulkFixMenuImages:', err);
    return { success: false, fixed, errors };
  }
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