import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Upload, FileText, Users, Flame, Loader2 } from 'lucide-react';
import { extractTextFromPdf } from '@/lib/pdf-ocr';
import { useSession } from '@/contexts/SessionContext';
import { audiencePanels, getPanelByKey } from '@/lib/personas';
import LoadingTicker from '@/components/common/LoadingTicker';
import MeetThePanel from '@/components/common/MeetThePanel';

const harshnessOptions = ['Constructive', 'Direct', 'Brutal'] as const;

export default function SetupPage() {
  const { session, setDocumentText, selectAudience, setHarshness, runFocusGroup, markMeetPanelShown } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [extractStatus, setExtractStatus] = useState('');
  const [localText, setLocalText] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (selectedFile.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }
    setFile(selectedFile);
    setIsExtracting(true);
    setExtractProgress(0);
    setExtractStatus('Initializing...');

    try {
      const result = await extractTextFromPdf(selectedFile, (p, msg) => {
        setExtractProgress(Math.round(p * 100));
        setExtractStatus(msg);
      });
      if (result.error) {
        toast.error(`Extraction failed: ${result.error}`);
      } else if (result.text) {
        setLocalText(result.text);
        setDocumentText(result.text);
        toast.success('Text extracted successfully');
      }
    } catch (err: any) {
      toast.error(`Failed to extract text from PDF: ${err?.message || String(err)}`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleTextChange = (text: string) => {
    setLocalText(text);
    setDocumentText(text);
  };

  const handleRunFocusGroup = async () => {
    if (!session.audienceCategory) {
      toast.error('Please select an audience category');
      return;
    }
    try {
      await runFocusGroup();
    } catch (err: any) {
      console.error('Focus group error:', err);
      const msg = err?.message || 'Failed to run focus group. Please try again.';
      toast.error(msg);
    }
  };

  const canRun = localText.length > 0 && session.audienceCategory && !session.isLoading;
  const isRunningFocusGroup = session.isLoading && session.allRoastOutputs.length === 0;
  const showMeetPanel = session.allRoastOutputs.length > 0 && !session.isLoading && !session.meetPanelShown;
  const panel = getPanelByKey(session.audienceCategory);

  if (isRunningFocusGroup) {
    const totalPersonas = panel?.personas.length || 0;
    const completed = session.simulationOutputs.length;
    return (
      <LoadingTicker
        message={session.loadingMessage || undefined}
        current={completed > 0 ? completed : undefined}
        total={totalPersonas > 0 ? totalPersonas : undefined}
      />
    );
  }

  if (showMeetPanel && panel) {
    return (
      <MeetThePanel
        panelLabel={`${panel.label.toUpperCase()} PANEL`}
        personas={panel.personas}
        onComplete={markMeetPanelShown}
      />
    );
  }

  return (
    <div className="container max-w-5xl py-12 space-y-10 animate-in fade-in duration-700">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-balance">{"Pitch Jury"}</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
          Upload your pitch deck, resume, or proposal and get honest feedback from a panel of professionals.
        </p>
      </div>
      {/* PDF Upload */}
      <Card className="border-dashed border-2 shadow-card bg-card">
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
                  disabled={isExtracting}
                />
              </label>
              <p className="text-sm text-muted-foreground">PDF files only</p>
            </div>
            {file && (
              <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-md">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
            )}
          </div>

          {isExtracting && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{extractStatus}</span>
                <span>{extractProgress}%</span>
              </div>
              <Progress value={extractProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
      {/* Document Text */}
      <div className="space-y-3 animate-in fade-in duration-500">
        <label className="text-sm font-medium text-muted-foreground">
          {localText ? 'Review extracted text — correct any errors before proceeding' : 'Paste your document text here, or upload a PDF above'}
        </label>
        <Textarea
          value={localText}
          onChange={(e) => handleTextChange(e.target.value)}
          className="min-h-[300px] font-mono text-sm resize-none"
          placeholder="Paste your pitch deck, resume, or proposal text here..."
        />
      </div>
      {/* Audience Selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Who is your audience?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {audiencePanels.map((panel) => (
            <Card
              key={panel.key}
              className={`cursor-pointer transition-all duration-200 hover:shadow-hover hover:border-primary/50 overflow-hidden ${
                session.audienceCategory === panel.key
                  ? 'border-primary ring-1 ring-primary bg-primary/5 shadow-card'
                  : 'border-border shadow-card'
              }`}
              onClick={() => selectAudience(panel.key)}
            >
              <div className="w-full overflow-hidden bg-muted/40">
                <img
                  src={panel.image}
                  alt={panel.label}
                  className="w-full h-32 object-contain"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold">{panel.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {panel.personas.length} professional personas
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {/* Harshness Dial */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Feedback intensity</h2>
        </div>
        <div className="flex gap-3">
          {harshnessOptions.map((level) => (
            <Button
              key={level}
              variant={session.harshnessLevel === level ? 'default' : 'outline'}
              onClick={() => setHarshness(level)}
              className="flex-1"
            >
              {level}
            </Button>
          ))}
        </div>
      </div>
      {/* Run Focus Group */}
      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={handleRunFocusGroup}
          disabled={!canRun}
          className="px-12 text-lg"
        >
          {session.isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {session.loadingMessage}
            </>
          ) : (
            'Run Focus Group'
          )}
        </Button>
      </div>
    </div>
  );
}
