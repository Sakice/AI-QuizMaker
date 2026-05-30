const optionLabels = ['A', 'B', 'C', 'D'];

export function fallbackQuizFromText(sourceText, options) {
  const sentences = splitSentences(sourceText);
  const selectedTypes = options.types.length ? options.types : ['multiple_choice', 'true_false'];
  const questions = Array.from({ length: options.questionCount }, (_, index) => {
    const type = selectedTypes[index % selectedTypes.length];
    const sentence = sentences[index % sentences.length] || sourceText.slice(0, 180);

    if (type === 'true_false') {
      return buildTrueFalseQuestion(index, sentence);
    }

    if (type === 'short_answer') {
      return buildShortAnswerQuestion(index, sentence);
    }

    return buildMultipleChoiceQuestion(index, sentence, sentences);
  });

  return {
    title: `${options.grade} ${capitalize(options.difficulty)} Quiz`,
    description: `Generated from your source material in ${options.language}.`,
    timerMinutes: options.timerMinutes,
    questions
  };
}

export function normalizeQuiz(quiz, options) {
  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];

  return {
    title: String(quiz?.title || `${options.grade} Quiz`),
    description: String(quiz?.description || 'Generated from your source material.'),
    timerMinutes: options.timerMinutes,
    questions: questions.slice(0, options.questionCount).map((question, index) => ({
      id: String(question.id || `q${index + 1}`),
      type: normalizeType(question.type),
      prompt: String(question.prompt || question.question || `Question ${index + 1}`),
      options: normalizeOptions(question.options),
      answer: String(question.answer || ''),
      explanation: String(question.explanation || 'Review the source material for context.')
    }))
  };
}

function buildMultipleChoiceQuestion(index, sentence, sentences) {
  const answer = optionLabels[index % optionLabels.length];
  const options = optionLabels.map((label, optionIndex) => ({
    id: label,
    text: optionIndex === index % optionLabels.length
      ? concise(sentence)
      : concise(sentences[(index + optionIndex + 1) % sentences.length] || sentence)
  }));

  return {
    id: `q${index + 1}`,
    type: 'multiple_choice',
    prompt: `Which statement best matches the source material?`,
    options,
    answer,
    explanation: `The source material supports: ${concise(sentence)}`
  };
}

function buildTrueFalseQuestion(index, sentence) {
  return {
    id: `q${index + 1}`,
    type: 'true_false',
    prompt: `True or false: ${concise(sentence)}`,
    answer: 'true',
    explanation: 'This statement is taken directly from the provided source material.'
  };
}

function buildShortAnswerQuestion(index, sentence) {
  return {
    id: `q${index + 1}`,
    type: 'short_answer',
    prompt: `Briefly explain this idea: ${concise(sentence)}`,
    answer: concise(sentence),
    explanation: 'A strong answer should include the key terms and relationship described in the source.'
  };
}

function splitSentences(text) {
  const sentences = text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?。！？])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 30);

  return sentences.length ? sentences : [text.trim()];
}

function normalizeType(type) {
  return ['multiple_choice', 'true_false', 'short_answer'].includes(type) ? type : 'short_answer';
}

function normalizeOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  return options.map((option, index) => ({
    id: String(option.id || optionLabels[index] || index + 1),
    text: String(option.text || option.label || option)
  }));
}

function concise(text) {
  return String(text).trim().slice(0, 180);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
