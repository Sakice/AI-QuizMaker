'use client';

import { AlertCircle, FileText, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Textarea } from '@/shared/components/ui/textarea';
import { saveQuizSession } from '@/features/lib/quiz-session';

const questionTypes = [
  ['multiple_choice', 'Multiple choice'],
  ['true_false', 'True / false'],
  ['short_answer', 'Short answer']
];

export function HomePage() {
  const router = useRouter();
  const [health, setHealth] = useState(null);
  const [files, setFiles] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/health')
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setHealth({ ok: false }));
  }, []);

  async function generateQuiz(event) {
    event.preventDefault();
    setError('');
    setIsGenerating(true);

    try {
      const formData = new FormData(event.currentTarget);
      formData.delete('files');
      files.forEach((file) => formData.append('files', file));

      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Quiz generation failed');
      }

      saveQuizSession({
        quiz: result,
        answers: {},
        currentIndex: 0,
        secondsLeft: Number(result.timerMinutes || 0) * 60
      });
      router.push('/quiz');
    } catch (caughtError) {
      setError(caughtError.message || 'Quiz generation failed');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <QuizShell>
      <section className="space-y-5">
        <div>
          <p className="text-sm font-medium text-primary">Quiz builder</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
            Create a custom quiz from your own materials
          </h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Upload files, choose AI or local mode, then answer the generated questions in a focused quiz player.
          </p>
        </div>

        <Card>
          <CardContent className="flex items-start gap-3 pt-4">
            <FileText className="mt-0.5 size-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {health?.ok === false
                ? 'Service disconnected'
                : health?.aiEnabled
                  ? `AI available with ${health.model}. Local mode is also ready.`
                  : 'Local mode ready. AI mode needs OPENAI_API_KEY.'}
            </p>
          </CardContent>
        </Card>
      </section>

      <SetupForm
        aiEnabled={health?.aiEnabled}
        error={error}
        files={files}
        isGenerating={isGenerating}
        onFilesChange={setFiles}
        onSubmit={generateQuiz}
      />
    </QuizShell>
  );
}

export function QuizShell({ children }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <a className="flex items-center gap-3 font-semibold" href="/">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">Q</span>
            <span>AI Exam Maker</span>
          </a>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        {children}
      </div>
    </main>
  );
}

function SetupForm({ aiEnabled, error, files, isGenerating, onFilesChange, onSubmit }) {
  const [generationMode, setGenerationMode] = useState('ai');

  useEffect(() => {
    if (aiEnabled === false) {
      setGenerationMode('local');
    }
  }, [aiEnabled]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Source and settings</CardTitle>
        <CardDescription>Files and pasted text are combined before generating questions.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <label className="grid min-h-40 cursor-pointer place-items-center rounded-lg border border-dashed bg-muted/30 p-6 text-center transition hover:bg-muted/60">
            <input
              className="sr-only"
              multiple
              name="files"
              type="file"
              accept=".pdf,.docx,.txt,.md,.csv"
              onChange={(event) => onFilesChange(Array.from(event.target.files || []))}
            />
            <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground">
              <Plus className="size-5" />
            </span>
            <strong className="mt-3">Drop files here or click to upload</strong>
            <span className="mt-1 text-sm text-muted-foreground">PDF, Word, TXT, Markdown, and CSV. Up to 5 files.</span>
            <span className="mt-3 max-w-full text-sm font-medium text-primary">
              {files.length ? files.map((file) => file.name).join(' | ') : 'No files selected'}
            </span>
          </label>

          <div className="grid gap-2">
            <Label htmlFor="notes">Source text</Label>
            <Textarea id="notes" name="notes" placeholder="Paste lecture notes, class handouts, or exam scope..." rows={5} />
          </div>

          <div className="grid gap-2">
            <Label>Generation mode</Label>
            <input name="generationMode" type="hidden" value={generationMode} />
            <Tabs value={generationMode} onValueChange={setGenerationMode}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ai">AI mode</TabsTrigger>
                <TabsTrigger value="local">Local mode</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField name="grade" label="Level" defaultValue="College / adult learner" options={[
              'High school',
              'College / adult learner',
              'Professional training',
              'Teacher assessment'
            ]} />
            <div className="grid gap-2">
              <Label htmlFor="questionCount">Questions</Label>
              <Input id="questionCount" name="questionCount" type="number" min="3" max="30" defaultValue="10" />
            </div>
            <SelectField name="difficulty" label="Difficulty" defaultValue="medium" options={[
              ['easy', 'Easy'],
              ['medium', 'Medium'],
              ['hard', 'Hard']
            ]} />
            <SelectField name="language" label="Language" defaultValue="English" options={[
              'English',
              'Chinese',
              'Japanese',
              'Deutsch'
            ]} />
            <div className="grid gap-2">
              <Label htmlFor="timerMinutes">Timer</Label>
              <Input id="timerMinutes" name="timerMinutes" type="number" min="0" max="180" defaultValue="20" />
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <Label>Question types</Label>
            <div className="mt-3 flex flex-wrap gap-4">
              {questionTypes.map(([value, label], index) => (
                <label className="flex items-center gap-2 text-sm" key={value}>
                  <Checkbox name="types" value={value} defaultChecked={index < 2} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Generation failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button className="w-full" disabled={isGenerating} size="lg" type="submit">
            {isGenerating ? 'Creating quiz...' : 'Start Quiz'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SelectField({ defaultValue, label, name, options }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => {
            const value = Array.isArray(option) ? option[0] : option;
            const text = Array.isArray(option) ? option[1] : option;
            return <SelectItem key={value} value={value}>{text}</SelectItem>;
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
