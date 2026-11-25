'use client';

import { useEffect, useRef, useState } from 'react';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_IMAGE_EXT_REGEX = /\.(jpe?g|png|webp)$/i;

/**
 * Manage client-side raster image selection, validation, object URL preview, and removal.
 */
export function useImageUploadField({
  maxBytes,
  sizeErrorMessage,
  onError,
  onClearError,
}) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState('');
  const [removeImage, setRemoveImage] = useState(false);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    };
  }, [localPreviewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validType =
      ALLOWED_IMAGE_TYPES.includes(file.type) ||
      (!file.type && ALLOWED_IMAGE_EXT_REGEX.test(file.name));

    if (!validType) {
      onError?.('Format foto harus JPG, PNG, atau WebP.');
      e.target.value = '';
      return;
    }

    if (file.size > maxBytes) {
      onError?.(sizeErrorMessage);
      e.target.value = '';
      return;
    }

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }

    onClearError?.();
    setSelectedFile(file);
    setLocalPreviewUrl(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const handleCancelSelectedFile = () => {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setSelectedFile(null);
    setLocalPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    handleCancelSelectedFile();
    setRemoveImage(true);
    onClearError?.();
  };

  return {
    fileInputRef,
    selectedFile,
    localPreviewUrl,
    removeImage,
    setRemoveImage,
    handleFileChange,
    handleCancelSelectedFile,
    handleRemoveImage,
  };
}
