import React, { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Upload, Loader2, X, Check, AlertCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ScannedData {
  vendor: string;
  amount: string;
  date: string;
  description: string;
  category: string;
  confidence: 'high' | 'medium' | 'low';
}

interface ReceiptScannerProps {
  onScanComplete: (data: ScannedData, imageBase64: string) => void;
  onCancel?: () => void;
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ 
  onScanComplete,
  onCancel 
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scannedData, setScannedData] = useState<ScannedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    setIsScanning(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const imageBase64 = await base64Promise;
      
      setImagePreview(imageBase64);

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('scan-receipt', {
        body: { imageBase64 }
      });

      if (error) throw error;
      
      if (data?.success && data?.data) {
        setScannedData(data.data);
        toast.success('Receipt scanned successfully!');
      } else {
        throw new Error(data?.error || 'Failed to scan receipt');
      }
    } catch (error: any) {
      console.error('Scan error:', error);
      toast.error(error.message || 'Failed to scan receipt. Please try again.');
      setImagePreview(null);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImage(file);
    }
  }, [processImage]);

  const handleConfirm = useCallback(() => {
    if (scannedData && imagePreview) {
      onScanComplete(scannedData, imagePreview);
    }
  }, [scannedData, imagePreview, onScanComplete]);

  const handleReset = useCallback(() => {
    setImagePreview(null);
    setScannedData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, []);

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">High confidence</span>;
      case 'medium':
        return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Medium confidence</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Low confidence - please verify</span>;
    }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        {!imagePreview ? (
          <div className="space-y-4">
            <div className="text-center py-6 border-2 border-dashed border-muted-foreground/25 rounded-lg">
              <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-4">
                Scan a receipt to auto-fill expense details
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isScanning}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isScanning}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="relative w-24 h-24 flex-shrink-0">
                <img
                  src={imagePreview}
                  alt="Receipt preview"
                  className="w-full h-full object-cover rounded-lg border"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
              
              {scannedData && (
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Scanned Data</span>
                    {getConfidenceBadge(scannedData.confidence)}
                  </div>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p><span className="font-medium text-foreground">Vendor:</span> {scannedData.vendor}</p>
                    <p><span className="font-medium text-foreground">Amount:</span> ${scannedData.amount}</p>
                    <p><span className="font-medium text-foreground">Date:</span> {scannedData.date}</p>
                    <p><span className="font-medium text-foreground">Category:</span> {scannedData.category}</p>
                  </div>
                </div>
              )}
            </div>

            {scannedData && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>Review the extracted data. You can edit the values after confirming.</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Rescan
              </Button>
              {scannedData && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleConfirm}
                  className="flex-1"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Use Data
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
