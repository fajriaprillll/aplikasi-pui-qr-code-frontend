import React, { useState, useRef } from 'react';
import { debugImageUpload } from '../utils/imageHelper';
import Button from './Button';

interface ImageUploadTesterProps {
  onSuccess?: (response: any) => void;
}

const ImageUploadTester: React.FC<ImageUploadTesterProps> = ({ onSuccess }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      setResult(null);
      setIsSuccess(false);
    };
    reader.readAsDataURL(file);
  };

  const runTest = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setResult('Please select an image file first');
      setIsSuccess(false);
      return;
    }

    setIsTesting(true);
    setResult('Testing image upload...');
    
    try {
      const testResult = await debugImageUpload(file, {
        name: 'Test Image Upload',
        category: 'Test',
        description: 'This is a test image uploaded at ' + new Date().toLocaleString(),
        price: '12500'
      });
      
      if (testResult.success) {
        setIsSuccess(true);
        setResult(`Success: ${testResult.message}`);
        
        // Additional details if we have a response
        if (testResult.response) {
          setResult(prev => `${prev}\n\nImage URL: ${testResult.response.image || 'Not returned'}\nID: ${testResult.response.id || 'Not returned'}`);
          
          // Call the success callback if provided
          if (onSuccess) {
            onSuccess(testResult.response);
          }
        }
      } else {
        setIsSuccess(false);
        setResult(`Failed: ${testResult.message}`);
      }
    } catch (error) {
      setIsSuccess(false);
      setResult(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-medium mb-3">Image Upload Tester</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Test Image File
        </label>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="w-full p-2 border rounded-md"
          onChange={handleFileChange}
          disabled={isTesting}
        />
      </div>
      
      {imagePreview && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
          <img 
            src={imagePreview}
            alt="Preview"
            className="h-32 object-cover rounded-md"
          />
        </div>
      )}
      
      <Button
        onClick={runTest}
        disabled={isTesting || !imagePreview}
        isLoading={isTesting}
        variant="primary"
        className="w-full"
      >
        {isTesting ? 'Testing...' : 'Test Upload'}
      </Button>
      
      {result && (
        <div className={`mt-4 p-3 rounded-md ${isSuccess ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default ImageUploadTester; 