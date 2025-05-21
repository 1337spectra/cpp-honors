/**
 * QuizLib version 1.0.1
 * by Andy Palmer
 * https://alpsquid.github.io/quizlib
 */

const Quiz = function(quizContainer, answers) {
    this.container = typeof quizContainer === 'string'
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

    // Deprecated—prefer static Quiz.Classes
    this.Classes = Object.freeze({
        QUESTION: 'quizlib-question',
        QUESTION_TITLE: 'quizlib-question-title',
        QUESTION_ANSWERS: 'quizlib-question-answers',
        QUESTION_WARNING: 'quizlib-question-warning',
        CORRECT: 'quizlib-correct',
        INCORRECT: 'quizlib-incorrect',
        TEMP: 'quizlib-temp',
    });
};

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
 * Checks quiz answers. If flagUnanswered is true, highlights unanswered questions
 * @param {boolean} [flagUnanswered=true]
 * @returns {boolean} true if all answered, false otherwise
 */
Quiz.prototype.checkAnswers = function(flagUnanswered = true) {
    const unansweredQs = [];
    const questionResults = [];

    for (let i = 0; i < this.questions.length; i++) {
        const question = this.questions[i];
        const answer = this.answers[i];
        this.clearHighlights(question);

        const answerInputs = question
            .getElementsByClassName(Quiz.Classes.QUESTION_ANSWERS)[0]
            .getElementsByTagName('input');

        // gather user answers
        const userAnswerArr = [];
        for (let k = 0; k < answerInputs.length; k++) {
            const input = answerInputs[k];
            if ((input.type === 'checkbox' || input.type === 'radio') && input.checked) {
                userAnswerArr.push(input.value);
            } else if (input.value !== '') {
                userAnswerArr.push(input.value);
            }
        }

        let userAnswer = userAnswerArr;
        if (userAnswerArr.length === 1 && !Array.isArray(answer)) {
            userAnswer = userAnswerArr[0];
        } else if (userAnswerArr.length === 0) {
            unansweredQs.push(question);
        }

        questionResults.push(Utils.compare(userAnswer, answer));
    }

    if (unansweredQs.length === 0 || !flagUnanswered) {
        this.result.setResults(questionResults);
        return true;
    }

    // highlight unanswered
    for (let i = 0; i < unansweredQs.length; i++) {
        const warning = document.createElement('span');
        warning.appendChild(document.createTextNode(this.unansweredQuestionText));
        warning.className = Quiz.Classes.QUESTION_WARNING;
        unansweredQs[i]
            .getElementsByClassName(Quiz.Classes.QUESTION_TITLE)[0]
            .appendChild(warning);
    }
    return false;
};

/**
 * Clears any correct/incorrect highlights or temp elements on a question
 * @param {HTMLElement} question
 */
Quiz.prototype.clearHighlights = function(question) {
    // remove warnings
    const questionWarnings = question.getElementsByClassName(Quiz.Classes.QUESTION_WARNING);
    while (questionWarnings.length > 0) {
        questionWarnings[0].parentNode.removeChild(questionWarnings[0]);
    }

    // remove correct/incorrect classes
    const highlightedGroups = [
        question.getElementsByClassName(Quiz.Classes.CORRECT),
        question.getElementsByClassName(Quiz.Classes.INCORRECT),
    ];
    for (let g = 0; g < highlightedGroups.length; g++) {
        while (highlightedGroups[g].length > 0) {
            const el = highlightedGroups[g][0];
            el.classList.remove(Quiz.Classes.CORRECT);
            el.classList.remove(Quiz.Classes.INCORRECT);
        }
    }

    // remove any temp elements
    const tempEls = question.getElementsByClassName(Quiz.Classes.TEMP);
    while (tempEls.length > 0) {
        tempEls[0].parentNode.removeChild(tempEls[0]);
    }
};

/**
 * Adds correct/incorrect CSS classes based on the last result
 * @param {function} [questionCallback] called as (quiz, questionEl, index, resultBool)
 */
Quiz.prototype.highlightResults = function(questionCallback) {
    for (let i = 0; i < this.questions.length; i++) {
        const question = this.questions[i];
        const titleEl = question.getElementsByClassName(Quiz.Classes.QUESTION_TITLE)[0];
        if (this.result.results[i]) {
            titleEl.classList.add(Quiz.Classes.CORRECT);
        } else {
            titleEl.classList.add(Quiz.Classes.INCORRECT);
        }
        if (typeof questionCallback === 'function') {
            questionCallback(this, question, i, this.result.results[i]);
        }
    }
};

/**
 * Holds quiz scoring data
 */
const QuizResult = function() {
    this.results = [];
    this.totalQuestions = 0;
    this.score = 0;
    this.scorePercent = 0;
    this.scorePercentFormatted = 0;
};

/**
 * Populate results and calculate score/stats
 * @param {boolean[]} questionResults
 */
QuizResult.prototype.setResults = function(questionResults) {
    this.results = questionResults;
    this.totalQuestions = questionResults.length;
    this.score = 0;
    for (let i = 0; i < questionResults.length; i++) {
        if (questionResults[i]) {
            this.score++;
        }
    }
    this.scorePercent = this.score / this.totalQuestions;
    this.scorePercentFormatted = Math.floor(this.scorePercent * 100);
};

/**
 * Utility namespace
 */
const Utils = function() {
    // intentionally empty: namespace for static methods
};

/**
 * Compare two values or arrays (no coercion)
 * @param {*} obj1
 * @param {*} obj2
 * @returns {boolean}
 */
Utils.compare = function(obj1, obj2) {
    if (obj1.length !== obj2.length) return false;
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
        for (let i = 0; i < obj1.length; i++) {
            if (obj1[i] !== obj2[i]) return false;
        }
        return true;
    }
    return obj1 === obj2;
};
