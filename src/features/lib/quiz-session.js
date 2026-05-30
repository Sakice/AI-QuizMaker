const sessionKey = 'ai-exam-maker.quiz-session';

export function getQuizSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return JSON.parse(window.sessionStorage.getItem(sessionKey) || 'null');
  } catch {
    return null;
  }
}

export function saveQuizSession(session) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(sessionKey, JSON.stringify(session));
}

export function clearQuizSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.removeItem(sessionKey);
}
