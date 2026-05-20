import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, FileText, AlertCircle, Copy, Check } from 'lucide-react';
import { extractTextFromPdf, ExtractionResult } from '@/lib/pdf-ocr';
import { Badge } from '@/components/ui/badge';

export default function ExtractorPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('Initializing...');
    setResult(null);

    try {
      const extractionResult = await extractTextFromPdf(file, (p, msg) => {
        setProgress(Math.round(p * 100));
        setStatusMessage(msg);
      });

      if (extractionResult.error) {
        toast.error(`Extraction failed: ${extractionResult.error}`);
      } else if (!extractionResult.text) {
        toast.warning('No text content found in the PDF');
      } else {
        toast.success('Text extracted successfully');
      }
      setResult(extractionResult);
    } catch (error: any) {
      console.error('Extraction error:', error);
      toast.error(`Failed to extract text from PDF: ${error?.message || String(error)}`);
    } finally {
      setIsProcessing(false);
      setProgress(100);
      setStatusMessage('');
    }
  };

  const copyToClipboard = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard');
    }
  };

  return (
    <div className="container max-w-4xl py-12 space-y-8 animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-6">
          <img 
            src="https://miaoda-site-img.s3cdn.medo.dev/images/KLing_589dd6aa-2afc-445d-a270-6181d63d6107.jpg" 
            alt="PDF Text Extraction Illustration" 
            className="w-48 h-48 object-contain opacity-80"
          />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-balance">{"PDF Text Extractor"}</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
          Upload any PDF to extract its text content. Our tool automatically detects images and performs OCR when necessary.
        </p>
      </div>
      <Card className="border-dashed border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4 py-8 text-center">
            <div className="p-4 bg-primary/5 rounded-full">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <span className="text-lg font-medium text-primary hover:underline">
                  Click to upload
                </span>
                <span className="text-muted-foreground"> or drag and drop</span>
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
              </label>
              <p className="text-sm text-muted-foreground">PDF files only (max 10MB recommended)</p>
            </div>
            {file && (
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-md">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">{file.name}</span>
                <Badge variant="outline" className="text-[10px]">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </Badge>
              </div>
            )}
            <Button
              onClick={handleProcess}
              disabled={!file || isProcessing}
              className="px-8"
            >
              {isProcessing ? 'Processing...' : 'Extract Text'}
            </Button>
          </div>

          {isProcessing && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{statusMessage}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
      {result && (
        <Card className="animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <CardTitle className="text-xl">Extracted Content</CardTitle>
              <CardDescription>
                {result.pageCount} {result.pageCount === 1 ? 'page' : 'pages'} processed
                {result.isOcr && <span className="ml-2 text-primary font-medium">(OCR Applied)</span>}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy Text'}
            </Button>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={result.text}
              placeholder="No text extracted"
              className="min-h-[400px] font-mono text-sm resize-none bg-muted/30"
            />
          </CardContent>
        </Card>
      )}
      {!result && !isProcessing && (
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <AlertCircle className="w-5 h-5" />
          <p>
            Large or image-heavy PDFs may take longer to process as they require optical character recognition.
          </p>
        </div>
      )}
    </div>
  );
}
