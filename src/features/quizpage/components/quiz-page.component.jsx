'use client';

import { RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { Separator } from '@/shared/components/ui/separator';
import { Textarea } from '@/shared/components/ui/textarea';
import { QuizShell } from '@/features/homepage';
import { clearQuizSession, getQuizSession, saveQuizSession } from '@/features/lib/quiz-session';
import { formatTime, isCorrect, typeLabel } from '@/features/lib/quiz-utils';

export function QuizPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    const storedSession = getQuizSession();
    if (!storedSession?.quiz) {
      router.replace('/');
      return;
    }
    setSession(storedSession);
  }, [router]);

  useEffect(() => {
    if (!session?.quiz || session.secondsLeft <= 0) {
      return;
    }
    const timer = window.setInterval(() => {
      setSession((current) => {
        if (!current) {
          return current;
        }
        const next = { ...current, secondsLeft: Math.max(0, current.secondsLeft - 1) };
        saveQuizSession(next);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [session?.quiz, session?.secondsLeft]);

  useEffect(() => {
    if (session?.quiz?.timerMinutes > 0 && session.secondsLeft === 0) {
      finishQuiz(session);
    }
  }, [session?.secondsLeft]);

  const quiz = session?.quiz;
  const currentIndex = session?.currentIndex || 0;
  const answers = session?.answers || {};
  const question = quiz?.questions?.[currentIndex];
  const objectiveQuestions = useMemo(
    () => quiz?.questions?.filter((item) => item.type !== 'short_answer') || [],
    [quiz]
  );
  const score = objectiveQuestions.filter((item) => isCorrect(item, answers[item.id])).length;

  if (!quiz || !question) {
    return null;
  }

  function updateSession(nextSession) {
    saveQuizSession(nextSession);
    setSession(nextSession);
  }

  function setAnswer(questionId, value) {
    updateSession({
      ...session,
      answers: {
        ...answers,
        [questionId]: value
      }
    });
  }

  function goToQuestion(index) {
    if (index >= quiz.questions.length) {
      finishQuiz(session);
      return;
    }
    updateSession({ ...session, currentIndex: Math.max(0, index) });
  }

  function revealCurrentAnswer() {
    setRevealed((current) => ({ ...current, [question.id]: !current[question.id] }));
  }

  function finishQuiz(nextSession) {
    saveQuizSession({
      ...nextSession,
      secondsLeft: 0
    });
    router.push('/summary');
  }

  function backHome() {
    clearQuizSession();
    router.push('/');
  }

  const total = quiz.questions.length;
  const progress = ((currentIndex + 1) / total) * 100;
  const isRevealed = Boolean(revealed[question.id]);

  return (
    <QuizShell>
      <section className="space-y-5">
        <div>
          <p className="text-sm font-medium text-primary">Testing</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">{quiz.title}</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">{quiz.description}</p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" type="button" onClick={backHome}>
            <RotateCcw className="size-4" />
            New quiz
          </Button>
          <div className="flex gap-2">
            <Badge variant="outline">{quiz.meta?.generationMode === 'ai' ? 'AI mode' : 'Local mode'}</Badge>
            <Badge variant="secondary">{session.secondsLeft ? formatTime(session.secondsLeft) : '--:--'}</Badge>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentIndex + 1} of {total}</span>
              <span>{score} / {objectiveQuestions.length}</span>
            </div>
            <Progress value={progress} />
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Badge variant="outline">{typeLabel(question.type)}</Badge>
              <CardTitle className="mt-3 text-2xl">{quiz.title}</CardTitle>
              <CardDescription className="mt-2">{quiz.description}</CardDescription>
            </div>
            <Separator />
            <h2 className="text-xl font-semibold">{question.prompt}</h2>
            <AnswerArea answers={answers} onAnswer={setAnswer} question={question} />
            {isRevealed ? (
              <Alert variant={isCorrect(question, answers[question.id]) ? 'default' : 'destructive'}>
                <AlertTitle>{isCorrect(question, answers[question.id]) ? 'Correct' : 'Review answer'}</AlertTitle>
                <AlertDescription>
                  <p><b>Answer:</b> {question.answer}</p>
                  <p><b>Explanation:</b> {question.explanation}</p>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-2 sm:grid-cols-3">
          <Button variant="outline" disabled={currentIndex === 0} type="button" onClick={() => goToQuestion(currentIndex - 1)}>
            Previous
          </Button>
          <Button variant="secondary" type="button" onClick={revealCurrentAnswer}>
            {isRevealed ? 'Hide answer' : 'Show answer'}
          </Button>
          <Button type="button" onClick={() => goToQuestion(currentIndex + 1)}>
            {currentIndex === total - 1 ? 'Finish' : 'Next'}
          </Button>
        </div>
      </section>
    </QuizShell>
  );
}

function AnswerArea({ answers, onAnswer, question }) {
  if (question.type === 'multiple_choice' && question.options?.length) {
    return (
      <div className="grid gap-2">
        {question.options.map((option) => (
          <Button
            className="h-auto justify-start gap-3 whitespace-normal py-3 text-left"
            key={option.id}
            type="button"
            variant={answers[question.id] === option.id ? 'secondary' : 'outline'}
            onClick={() => onAnswer(question.id, option.id)}
          >
            <Badge variant="secondary">{option.id}</Badge>
            <span>{option.text}</span>
          </Button>
        ))}
      </div>
    );
  }

  if (question.type === 'true_false') {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {['true', 'false'].map((value) => (
          <Button
            key={value}
            type="button"
            variant={answers[question.id] === value ? 'secondary' : 'outline'}
            onClick={() => onAnswer(question.id, value)}
          >
            {value === 'true' ? 'True' : 'False'}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <Textarea
      className="min-h-32"
      placeholder="Write your answer here..."
      value={answers[question.id] || ''}
      onChange={(event) => onAnswer(question.id, event.target.value)}
    />
  );
}
