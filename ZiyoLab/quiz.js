// =====================================================================
// quiz.js — the knowledge-check quiz shared by every lab page.
//
// Usage (in a page script):
//   buildQuiz(quizList, quizScore, quizData);
//
// quizData is an array of { q, options: [...], correct } objects.
//
// The quiz is free: every option stays clickable, an answer can be changed
// as often as the student likes, and the score simply follows the current
// choices. A wrong choice shows what the correct answer is — it never blocks
// anything.
// =====================================================================

// Build one question card. `onChoose(chosenOption)` is called on every click.
function createQuizQuestion(item, idx, onChoose) {
  const qDiv = document.createElement('div');
  qDiv.className = 'quiz-question';

  const qText = document.createElement('p');
  qText.className = 'quiz-question-text';
  qText.textContent = `${idx + 1}. ${item.q}`;
  qDiv.appendChild(qText);

  const optsDiv = document.createElement('div');
  optsDiv.className = 'quiz-options';

  const feedback = document.createElement('p');
  feedback.className = 'quiz-feedback hidden';
  feedback.setAttribute('aria-live', 'polite');

  item.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'quiz-option';
    btn.textContent = opt;

    btn.addEventListener('click', () => {
      optsDiv.querySelectorAll('.quiz-option').forEach((b) => b.classList.remove('correct', 'incorrect'));
      const isCorrect = opt === item.correct;

      if (isCorrect) {
        btn.classList.add('correct');
        feedback.textContent = 'To‘g‘ri javob!';
        feedback.classList.remove('wrong');
      } else {
        btn.classList.add('incorrect');
        feedback.textContent = `Bu javob to‘g‘ri emas. To‘g‘ri javob: ${item.correct}`;
        feedback.classList.add('wrong');
      }
      feedback.classList.remove('hidden');

      onChoose(opt);
    });

    optsDiv.appendChild(btn);
  });

  qDiv.appendChild(optsDiv);
  qDiv.appendChild(feedback);
  return qDiv;
}

// Show the score box (it follows the current choices).
function showQuizScore(quizScore, score, total, answered) {
  quizScore.textContent = `Natija: ${score} / ${total}`
    + (answered < total ? ` (${answered} ta savolga javob berildi)` : '');
  quizScore.classList.remove('hidden');
}

// Build (or rebuild) the whole quiz inside `quizList`.
function buildQuiz(quizList, quizScore, questions) {
  quizList.innerHTML = '';
  quizScore.classList.add('hidden');
  quizScore.textContent = '';

  const chosen = new Array(questions.length).fill(null);   // current choice per question

  questions.forEach((item, idx) => {
    quizList.appendChild(createQuizQuestion(item, idx, (opt) => {
      chosen[idx] = opt;
      const answered = chosen.filter((c) => c !== null).length;
      const score = chosen.filter((c, i) => c !== null && c === questions[i].correct).length;
      showQuizScore(quizScore, score, questions.length, answered);
    }));
  });
}
