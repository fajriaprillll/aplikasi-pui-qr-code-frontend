/**
 * Utility for testing image accessibility
 */

// List of image paths to test
const TEST_IMAGES = [
  '/images/menu/nasi_goreng.jpg',
  '/images/menu/es_teh.jpg',
  '/images/menu/es_jeruk.jpg',
  '/images/menu/roti_bakar.jpg',
  '/images/menu/french_fries.jpg', 
  '/images/menu/ayam_bakar_madu.jpg'
];

/**
 * Tests if images are accessible from the browser
 * @returns Promise with results of test
 */
export const testImagesAccessibility = async (): Promise<{
  success: boolean;
  results: {path: string; success: boolean; error?: string}[];
}> => {
  console.log('Starting image accessibility test...');
  
  const results = await Promise.all(
    TEST_IMAGES.map(async (path) => {
      try {
        // Add cache buster
        const testUrl = `${path}?v=${Date.now()}`;
        
        // Try to fetch the image
        const response = await fetch(testUrl, { 
          method: 'HEAD',
          cache: 'no-cache' // Bypass cache
        });
        
        const success = response.ok;
        console.log(`Image test ${success ? 'SUCCESS' : 'FAILED'}: ${path} - Status: ${response.status}`);
        
        return {
          path,
          success,
          error: success ? undefined : `HTTP status: ${response.status}`
        };
      } catch (error) {
        console.error(`Image test ERROR: ${path}`, error);
        return {
          path,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    })
  );
  
  const overallSuccess = results.every(r => r.success);
  
  console.log('Image accessibility test complete:');
  console.log(`Overall success: ${overallSuccess}`);
  console.log(`${results.filter(r => r.success).length}/${results.length} images accessible`);
  
  return {
    success: overallSuccess,
    results
  };
};

/**
 * Opens each image in a new window/tab to force browser to load it
 * This can help with debugging image loading issues
 */
export const openImagesInNewTabs = () => {
  TEST_IMAGES.forEach(path => {
    // Add cache buster
    const testUrl = `${path}?v=${Date.now()}`;
    window.open(testUrl, '_blank');
  });
  
  alert(`Opened ${TEST_IMAGES.length} images in new tabs to force load them.`);
}; 