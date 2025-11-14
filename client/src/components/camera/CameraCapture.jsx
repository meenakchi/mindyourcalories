import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Camera, X, Upload, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../common/Button';

const CameraCapture = ({ onCapture, onClose }) => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [isLoading, setIsLoading] = useState(false);

  const capturePhoto = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const confirmPhoto = async () => {
    setIsLoading(true);
    try {
      await onCapture(capturedImage);
      toast.success('Photo captured!');
      onClose();
    } catch (error) {
      toast.error('Failed to process image');
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition"
        >
          <X size={24} />
        </button>
        <h2 className="text-lg font-semibold">Capture Meal</h2>
        <button
          onClick={toggleCamera}
          className="p-2 hover:bg-white/10 rounded-full transition"
        >
          <RotateCcw size={24} />
        </button>
      </div>

      {/* Camera/Preview */}
      <div className="flex-1 flex items-center justify-center p-4">
        {capturedImage ? (
          <div className="relative max-w-2xl w-full">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-auto rounded-lg"
            />
          </div>
        ) : (
          <div className="relative max-w-2xl w-full">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode }}
              className="w-full rounded-lg"
            />
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white/20"></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/50">
        {capturedImage ? (
          <div className="flex gap-4 justify-center">
            <Button variant="ghost" onClick={retakePhoto} disabled={isLoading}>
              Retake
            </Button>
            <Button onClick={confirmPhoto} isLoading={isLoading}>
              Use Photo
            </Button>
          </div>
        ) : (
          <div className="flex gap-4 justify-center">
            <label className="btn bg-gray-600 hover:bg-gray-700 text-white cursor-pointer flex items-center gap-2">
              <Upload size={20} />
              Upload
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <Button onClick={capturePhoto}>
              <Camera size={20} />
              Capture
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;