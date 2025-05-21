/**
 * QuizLib version 1.0.1
 * by Andy Palmer
 * https://alpsquid.github.io/quizlib
 */

/**
 * Utility namespace (hoisted)
 * Holds static helper methods used by Quiz and QuizResult.
 */
function Utils() {
  // intentionally empty
}

/**
 * Compare two values or arrays (strict, order-sensitive)
 * @param {*} obj1
 * @param {*} obj2
 * @returns {boolean}
 */
Utils.compare = function(obj1, obj2) {
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (obj1[i] !== obj2[i]) return false;
    }
    return true;
  }
  return obj1 === obj2;
};

/**
 * QuizResult constructor (hoisted)
 * Holds scoring data and computes percentages.
 */
function QuizResult() {
  this.results = [];
  this.totalQuestions = 0;
  this.score = 0;
  this.scorePercent = 0;
  this.scorePercentFormatted = 0;
}

/**
 * Populate results and calculate score / percentages
 * @param {boolean[]} questionResults
 */
QuizResult.prototype.setResults = function(questionResults) {
  this.results = questionResults;
  this.totalQuestions = questionResults.length;
  this.score = questionResults.filter(r => r).length;
  this.scorePercent = this.score / this.totalQuestions;
  this.scorePercentFormatted = Math.floor(this.scorePercent * 100);
};

/**
 * Quiz constructor
 * @param {string|HTMLElement} quizContainer – ID or element of the quiz
 * @param {Array} answers – array of correct answers (e.g. ['a', '7', ['a','b']])
 */
function Quiz(quizContainer, answers) {
  this.container = 
    typeof quizContainer === 'string'
      ? document.getElementById(quizContainer)
      : quizContainer;
  this.answers = answers;
  this.questions = Array.from(
    this.container.getElementsByClassName(Quiz.Classes.QUESTION)
  );
  this.unansweredQuestionText = 'Please answer this question!';
  this.result = new QuizResult();
  this.hideOnCorrect = false;
  this.showCorrect = false;
  this.showIncorrect = false;
  this.resetOnUnanswered = false;

  // Deprecated instance-level Classes; prefer Quiz.Classes
  this.Classes = Quiz.Classes;

  if (this.answers.length !== this.questions.length) {
    throw new Error(
      'Number of answers (' +
        this.answers.length +
        ') does not match number of questions (' +
        this.questions.length +
        ')!'
    );
  }
}

/**
 * Static enum of CSS classes used by QuizLib
 */
Quiz.Classes = Object.freeze({
  QUESTION: 'quizlib-question',
  QUESTION_TITLE: 'quizlib-question-title',
  QUESTION_ANSWERS: 'quizlib-question-answers',
  QUESTION_WARNING: 'quizlib-question-warning',
  CORRECT: 'quizlib-correct',
  INCORRECT: 'quizlib-incorrect',
  TEMP: 'quizlib-temp',
});

/**
 * Checks all answers, flags unanswered if requested.
 * @param {boolean} [flagUnanswered=true]
 * @returns {boolean} true if all answered, false otherwise
 */
Quiz.prototype.checkAnswers = function(flagUnanswered = true) {
  const unansweredQs = [];
  const questionResults = [];

  for (let i = 0; i < this.questions.length; i++) {
    const question = this.questions[i];
    const correctAnswer = this.answers[i];
    this.clearHighlights(question);

    const inputs = question
      .getElementsByClassName(Quiz.Classes.QUESTION_ANSWERS)[0]
      .getElementsByTagName('input');

    const userArr = [];
    for (let k = 0; k < inputs.length; k++) {
      const inp = inputs[k];
      if ((inp.type === 'checkbox' || inp.type === 'radio') && inp.checked) {
        userArr.push(inp.value);
      } else if (inp.value !== '') {
        userArr.push(inp.value);
      }
    }

    let userAnswer = userArr;
    if (userArr.length === 1 && !Array.isArray(correctAnswer)) {
      userAnswer = userArr[0];
    } else if (userArr.length === 0) {
      unansweredQs.push(question);
    }

    questionResults.push(Utils.compare(userAnswer, correctAnswer));
  }

  if (unansweredQs.length === 0 || !flagUnanswered) {
    this.result.setResults(questionResults);
    return true;
  }

  for (let j = 0; j < unansweredQs.length; j++) {
    const warn = document.createElement('span');
    warn.textContent = this.unansweredQuestionText;
    warn.className = Quiz.Classes.QUESTION_WARNING;
    unansweredQs[j]
      .getElementsByClassName(Quiz.Classes.QUESTION_TITLE)[0]
      .appendChild(warn);
  }
  return false;
};

/**
 * Removes all warnings, highlights, and temp elements from a question
 * @param {HTMLElement} question
 */
Quiz.prototype.clearHighlights = function(question) {
  // remove unanswered warnings
  const warns = question.getElementsByClassName(Quiz.Classes.QUESTION_WARNING);
  while (warns.length) warns[0].remove();

  // remove correct/incorrect highlights
  [Quiz.Classes.CORRECT, Quiz.Classes.INCORRECT].forEach(cls => {
    const elems = question.getElementsByClassName(cls);
    while (elems.length) elems[0].classList.remove(cls);
  });

  // remove any temp elements
  const temps = question.getElementsByClassName(Quiz.Classes.TEMP);
  while (temps.length) temps[0].remove();
};

/**
 * Highlights question titles as correct or incorrect
 * @param {function} [questionCallback] – called as (quiz, questionEl, idx, isCorrect)
 */
Quiz.prototype.highlightResults = function(questionCallback) {
  for (let i = 0; i < this.questions.length; i++) {
    const q = this.questions[i];
    const title = q.getElementsByClassName(Quiz.Classes.QUESTION_TITLE)[0];
    if (this.result.results[i]) {
      title.classList.add(Quiz.Classes.CORRECT);
    } else {
      title.classList.add(Quiz.Classes.INCORRECT);
    }
    if (typeof questionCallback === 'function') {
      questionCallback(this, q, i, this.result.results[i]);
    }
  }
};
