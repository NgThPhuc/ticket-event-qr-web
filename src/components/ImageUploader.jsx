import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { useState } from "react";
import { cloudinaryService } from "../services/cloudinaryService";

const ImageUploader = ({
  currentImageUrl,
  onImageUploaded,
  label = "Ảnh bìa",
  disabled = false,
}) => {
  const [preview, setPreview] = useState(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState(null);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate
    const validation = cloudinaryService.validateImage(selectedFile);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Show preview
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));

    // Upload immediately
    setUploading(true);
    try {
      const result = await cloudinaryService.uploadImageWithProgress(
        selectedFile,
        setProgress
      );
      onImageUploaded(result.secure_url);
      setPreview(result.secure_url);
    } catch (error) {
      alert(error.message);
      setPreview(currentImageUrl || null);
      setFile(null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setFile(null);
    onImageUploaded(null);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <div className="flex items-start gap-4">
        <div className="flex-1">
          <Input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className="cursor-pointer"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            JPG, PNG, WEBP. Tối đa 5MB
          </p>
        </div>

        {preview && (
          <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!uploading && (
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {progress}%
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Đang upload ảnh...
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
