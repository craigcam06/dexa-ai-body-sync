import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { CSVParser } from '@/utils/csvParser';
import { ParsedWhoopData } from '@/types/whoopData';

interface CSVUploaderProps {
  onDataUpdate: (data: ParsedWhoopData) => void;
}

interface UploadedFile {
  file: File;
  name: string;
  type: 'recovery' | 'sleep' | 'workout' | 'daily' | 'journal' | 'stronglifts' | 'unknown';
  rows: number;
  status: 'uploaded' | 'processing' | 'processed' | 'error';
  data?: ParsedWhoopData;
  error?: string;
}

export const CSVUploader = ({ onDataUpdate }: CSVUploaderProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const csvFiles = acceptedFiles.filter(file => 
      file.type === 'text/csv' || file.name.endsWith('.csv')
    );

    if (csvFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload CSV files only",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    for (const file of csvFiles) {
      const newFile: UploadedFile = {
        file,
        name: file.name,
        type: 'unknown',
        rows: 0,
        status: 'uploaded'
      };

      setUploadedFiles(prev => [...prev, newFile]);

      try {
        console.log('Processing file:', file.name);
        newFile.status = 'processing';
        setUploadedFiles(prev => prev.map(f => f.file === file ? newFile : f));

        console.log('About to parse CSV file...');
        const result = await CSVParser.parseWhoopCSV(file);
        console.log('Parse result:', result);

        if (result.success && result.data) {
          let dataType: 'recovery' | 'sleep' | 'workout' | 'daily' | 'journal' | 'stronglifts' | 'unknown' = 'unknown';
          
          if (result.data.recovery.length > 0) dataType = 'recovery';
          else if (result.data.sleep.length > 0) dataType = 'sleep';
          else if (result.data.workouts.length > 0) dataType = 'workout';
          else if (result.data.daily.length > 0) dataType = 'daily';
          else if (result.data.journal.length > 0) dataType = 'journal';
          else if (result.data.stronglifts.length > 0) dataType = 'stronglifts';
          
          console.log('Detected data type:', dataType, 'Data counts:', {
            recovery: result.data.recovery.length,
            sleep: result.data.sleep.length,
            workouts: result.data.workouts.length,
            daily: result.data.daily.length,
            journal: result.data.journal.length,
            stronglifts: result.data.stronglifts.length
          });
          
          newFile.status = 'processed';
          newFile.type = dataType;
          newFile.rows = result.rowsProcessed || 0;
          newFile.data = result.data;
          
          // Update dashboard with all data types
          console.log(`📤 CSVUploader processed ${dataType} data:`, result.data);
          console.log('Data summary:', {
            recovery: result.data.recovery?.length || 0,
            sleep: result.data.sleep?.length || 0,
            workouts: result.data.workouts?.length || 0,
            daily: result.data.daily?.length || 0,
            stronglifts: result.data.stronglifts?.length || 0
          });
          
          // Don't call onDataUpdate here - wait for manual consolidation
          // This prevents individual files from overwriting each other
          
          toast({
            title: "File processed successfully",
            description: `${file.name} - ${result.rowsProcessed} rows processed`,
          });
        } else {
          newFile.status = 'error';
          newFile.error = result.error;
          
          toast({
            title: "Processing failed",
            description: result.error,
            variant: "destructive",
          });
        }

        setUploadedFiles(prev => prev.map(f => f.file === file ? newFile : f));
      } catch (error) {
        newFile.status = 'error';
        newFile.error = error instanceof Error ? error.message : 'Unknown error';
        setUploadedFiles(prev => prev.map(f => f.file === file ? newFile : f));
      }
    }

    setIsProcessing(false);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: true,
  });

  const removeFile = (file: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== file));
  };

  const consolidateAndUpdate = () => {
    const processedFiles = uploadedFiles.filter(f => f.status === 'processed' && f.data);
    
    // Consolidate all processed files into a single dataset
    const consolidated: ParsedWhoopData = {
      recovery: [],
      sleep: [],
      workouts: [],
      daily: [],
      journal: [],
      stronglifts: []
    };

    console.log('Consolidating data from', processedFiles.length, 'files');
    console.log('Processed files:', processedFiles.map(f => ({ name: f.name, type: f.type, dataKeys: f.data ? Object.keys(f.data) : [] })));

    processedFiles.forEach(file => {
      if (file.data) {
        consolidated.recovery.push(...(file.data.recovery || []));
        consolidated.sleep.push(...(file.data.sleep || []));
        consolidated.workouts.push(...(file.data.workouts || []));
        consolidated.daily.push(...(file.data.daily || []));
        consolidated.journal.push(...(file.data.journal || []));
        consolidated.stronglifts.push(...(file.data.stronglifts || []));
      }
    });

    console.log('Final consolidated data:', {
      recovery: consolidated.recovery.length,
      sleep: consolidated.sleep.length,
      workouts: consolidated.workouts.length,
      daily: consolidated.daily.length,
      journal: consolidated.journal.length,
      stronglifts: consolidated.stronglifts.length
    });

    console.log('🚀 CSVUploader calling onDataUpdate with consolidated data:', consolidated);
    console.log('📊 Consolidated data details:', {
      recovery: `Array(${consolidated.recovery.length})`,
      recoveryFirst: consolidated.recovery[0],
      sleep: `Array(${consolidated.sleep.length})`,
      sleepFirst: consolidated.sleep[0],
      workouts: `Array(${consolidated.workouts.length})`,
      daily: `Array(${consolidated.daily.length})`
    });
    onDataUpdate(consolidated);
    
    toast({
      title: "Data updated",
      description: `Consolidated data from ${processedFiles.length} files`,
    });
  };

  const getTypeIcon = (status: string) => {
    switch (status) {
      case 'processed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'processing':
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'recovery': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sleep': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'workout': return 'bg-green-100 text-green-800 border-green-200';
      case 'daily': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'journal': return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'stronglifts': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const processedCount = uploadedFiles.filter(f => f.status === 'processed').length;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload Health Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-primary">Drop your CSV files here...</p>
          ) : (
            <div>
              <p className="font-medium">Drop CSV files here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports Whoop, StrongLifts, and other health device CSV files
              </p>
            </div>
          )}
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Processing files...</p>
            <Progress value={undefined} className="h-2" />
          </div>
        )}

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Uploaded Files</h4>
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {getTypeIcon(file.status)}
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getTypeBadgeColor(file.type)}`}
                      >
                        {file.type}
                      </Badge>
                      {file.rows > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {file.rows} rows
                        </span>
                      )}
                    </div>
                    {file.error && (
                      <p className="text-xs text-destructive mt-1">{file.error}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(file.file)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Update Button */}
        {processedCount > 0 && (
          <Button 
            onClick={consolidateAndUpdate}
            className="w-full"
          >
            Update Dashboard with Health Data ({processedCount} files)
          </Button>
        )}
      </CardContent>
    </Card>
  );
};