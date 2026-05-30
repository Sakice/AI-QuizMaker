'use client';

import { Home, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { QuizShell } from '@/features/homepage';
import { clearQuizSession, getQuizSession, saveQuizSession } from '@/features/lib/quiz-session';
import { isCorrect, typeLabel } from '@/features/lib/quiz-utils';

export function SummaryPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);

  useEffect(() => {
    const storedSession = getQuizSession();
    if (!storedSession?.quiz) {
      router.replace('/');
      return;
    }
    setSession(storedSession);
  }, [router]);

  const quiz = session?.quiz;
  const answers = session?.answers || {};
  const objectiveQuestions = useMemo(
    () => quiz?.questions?.filter((question) => question.type !== 'short_answer') || [],
    [quiz]
  );
  const score = objectiveQuestions.filter((question) => isCorrect(question, answers[question.id])).length;

  if (!quiz) {
    return null;
  }

  function continueTest() {
    const nextSession = {
      ...session,
      answers: {},
      currentIndex: 0,
      secondsLeft: Number(quiz.timerMinutes || 0) * 60
    };
    saveQuizSession(nextSession);
    router.push('/quiz');
  }

  function backHome() {
    clearQuizSession();
    router.push('/');
  }

  const totalObjective = objectiveQuestions.length;
  const totalQuestions = quiz.questions.length;
  const percent = totalObjective ? Math.round((score / totalObjective) * 100) : 0;
  const wrongQuestions = objectiveQuestions.filter((question) => !isCorrect(question, answers[question.id]));
  const selfReviewQuestions = quiz.questions.filter((question) => question.type === 'short_answer');

  return (
    <QuizShell>
      <section className="space-y-5">
        <div>
          <p className="text-sm font-medium text-primary">Summary</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Test complete</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">
            Review your score, revisit missed questions, then continue testing or return home.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <Card>
          <CardHeader>
            <Badge className="w-fit" variant={percent >= 80 ? 'default' : 'secondary'}>Test complete</Badge>
            <CardTitle className="text-3xl">Score: {score} / {totalObjective}</CardTitle>
            <CardDescription>
              {totalObjective
                ? `You answered ${percent}% of the automatically graded questions correctly.`
                : `${totalQuestions} questions completed. Short-answer questions need self review.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Progress value={percent} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" onClick={continueTest}>
                <RotateCcw className="size-4" />
                Continue test
              </Button>
              <Button variant="outline" type="button" onClick={backHome}>
                <Home className="size-4" />
                Back home
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wrong answer review</CardTitle>
            <CardDescription>Review missed objective questions and compare your answer with the explanation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {wrongQuestions.length ? (
              wrongQuestions.map((question, index) => (
                <ReviewQuestion answer={answers[question.id]} index={index} key={question.id} question={question} />
              ))
            ) : (
              <Alert>
                <AlertTitle>No missed objective questions</AlertTitle>
                <AlertDescription>Nice work. Every automatically graded question was correct.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {selfReviewQuestions.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Short-answer self review</CardTitle>
              <CardDescription>These questions are not auto-scored. Use the reference answer and explanation to check your response.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {selfReviewQuestions.map((question, index) => (
                <ReviewQuestion answer={answers[question.id]} index={index} key={question.id} question={question} />
              ))}
            </CardContent>
          </Card>
        ) : null}
      </section>
    </QuizShell>
  );
}

function ReviewQuestion({ answer, index, question }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">#{index + 1}</Badge>
        <Badge variant="secondary">{typeLabel(question.type)}</Badge>
      </div>
      <h3 className="mt-3 font-semibold">{question.prompt}</h3>
      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
        <p><b className="text-foreground">Your answer:</b> {answer || 'No answer'}</p>
        <p><b className="text-foreground">Correct answer:</b> {question.answer}</p>
        <p><b className="text-foreground">Explanation:</b> {question.explanation}</p>
      </div>
    </div>
  );
}
