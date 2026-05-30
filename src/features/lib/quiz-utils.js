export function isCorrect(question, value) {
  if (!value || question.type === 'short_answer') {
    return false;
  }

  return String(value).trim().toLowerCase() === String(question.answer).trim().toLowerCase();
}

export function typeLabel(type) {
  return {
    multiple_choice: 'Multiple choice',
    true_false: 'True / false',
    short_answer: 'Short answer'
  }[type] || 'Question';
}

export function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

export function download(filename, content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function quizToText(quiz) {
  const lines = [quiz.title, quiz.description, ''];
  quiz.questions.forEach((question, index) => {
    lines.push(`${index + 1}. ${question.prompt}`);
    question.options?.forEach((option) => lines.push(`   ${option.id}. ${option.text}`));
    lines.push(`Answer: ${question.answer}`);
    lines.push(`Explanation: ${question.explanation}`);
    lines.push('');
  });
  return lines.join('\n');
}
