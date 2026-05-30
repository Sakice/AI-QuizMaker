# AI Exam Maker

A small local app for turning PDF, Word, TXT, Markdown, CSV, or pasted learning materials into quiz questions.

## Features

- Upload up to 5 PDF, DOCX, TXT, Markdown, or CSV files
- Paste extra source material directly into the page
- Choose AI mode or local mode before generating
- Configure level, question count, difficulty, output language, timer, and question types
- Answer questions in the browser, reveal answers, and export JSON or plain text

## Run

```bash
npm install
copy .env.example .env
npm run dev
```

Open:

```text
http://localhost:3000
```

To use AI mode, set `OPENAI_API_KEY` in `.env` and restart the server. Local mode works without an API key and creates draft questions from the provided source text.

## Project Structure

```text
src/
  app/
    api/
      generate-quiz/      Quiz generation API route
      health/             Service status API route
    globals.css           shadcn-style design tokens and component classes
    layout.jsx            App shell metadata
    page.jsx              Home page
    quiz/page.jsx         Test-taking page
    summary/page.jsx      Score and wrong-answer review page
  const/
    config/               Environment values
    index.js              Constants barrel exports
  features/
    homepage/             Source upload and quiz setup screen
    quizpage/             Test-taking screen
    summarypage/          Score and wrong-answer review screen
    lib/                  Shared client-side quiz session and UI helpers
    quiz-generation/
      server/
        schemas/          Request validation
        services/         File extraction and quiz generation logic
  lib/
    server/               Shared server infrastructure
    utils.js              shadcn utility helpers
  shared/
    components/
      ui/                 shadcn/ui components
uploads/
  .gitkeep                Temporary upload workspace
```

## API

`POST /api/generate-quiz`

Form fields:

- `files`: PDF / DOCX / TXT / MD / CSV, up to 5 files
- `notes`: extra source text
- `generationMode`: `ai` or `local`
- `grade`: learning level or use case
- `questionCount`: 3 to 30
- `difficulty`: `easy`, `medium`, or `hard`
- `language`: output language
- `timerMinutes`: timer minutes, with 0 meaning no timer
- `types`: `multiple_choice`, `true_false`, `short_answer`

## Note

This project recreates the general source-material-to-quiz workflow. It does not include private implementation or assets.
