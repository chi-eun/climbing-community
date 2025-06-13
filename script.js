// 질문과 답변을 저장할 배열
let questions = [];

const questionForm = document.getElementById('question-form');
const questionInput = document.getElementById('question-input');
const questionNickname = document.getElementById('question-nickname');
const questionList = document.getElementById('question-list');

// 시간 포맷 함수
function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleString('ko-KR', { hour12: false });
}

// 질문 추가
questionForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const text = questionInput.value.trim();
  const nickname = questionNickname.value.trim() || '익명';
  if (text) {
    // 최신 질문이 위로 오도록 unshift
    questions.unshift({
      text,
      nickname,
      time: new Date().toISOString(),
      answers: []
    });
    questionInput.value = '';
    questionNickname.value = '';
    renderQuestions();
  }
});

// 답변 추가
function addAnswer(index, answerText, answerNickname) {
  if (answerText.trim()) {
    questions[index].answers.push({
      text: answerText.trim(),
      nickname: answerNickname.trim() || '익명',
      time: new Date().toISOString(),
      replies: [] // 대댓글 배열 추가
    });
    renderQuestions();
  }
}

// 대댓글 추가
function addReply(qIdx, aIdx, replyText, replyNickname) {
  if (replyText.trim()) {
    questions[qIdx].answers[aIdx].replies.push({
      text: replyText.trim(),
      nickname: replyNickname.trim() || '익명',
      time: new Date().toISOString()
    });
    renderQuestions();
  }
}

// 질문/답변/대댓글 렌더링
function renderQuestions() {
  questionList.innerHTML = '';
  questions.forEach((q, qIdx) => {
    const li = document.createElement('li');
    li.className = 'question-item';
    li.innerHTML = `
      <div class="question-header">
        <span class="question-nickname">${q.nickname}</span>
        <span class="question-time">${formatTime(q.time)}</span>
      </div>
      <div class="question-text">${q.text}</div>
      <ul class="answer-list">
        ${q.answers.map((a, aIdx) => `
          <li class="answer-item">
            <div class="answer-header">
              <span class="answer-nickname">${a.nickname}</span>
              <span class="answer-time">${formatTime(a.time)}</span>
            </div>
            <div>${a.text}</div>
            <ul class="reply-list">
              ${(a.replies||[]).map(r => `
                <li class="reply-item">
                  <span class="reply-nickname">${r.nickname}</span>
                  <span class="reply-time">${formatTime(r.time)}</span>
                  <span class="reply-text">${r.text}</span>
                </li>
              `).join('')}
            </ul>
            <form class="reply-form" data-qidx="${qIdx}" data-aidx="${aIdx}">
              <input type="text" class="reply-nickname-input" placeholder="닉네임(선택)" maxlength="12" />
              <input type="text" class="reply-input" placeholder="대댓글을 입력하세요" required />
              <button type="submit">대댓글</button>
            </form>
          </li>
        `).join('')}
      </ul>
      <form class="answer-form" data-idx="${qIdx}">
        <input type="text" class="answer-nickname-input" placeholder="닉네임(선택)" maxlength="12" />
        <input type="text" class="answer-input" placeholder="답변을 입력하세요" required />
        <button type="submit">답변</button>
      </form>
    `;
    questionList.appendChild(li);
  });
  // 각 답변 폼에 이벤트 리스너 연결
  document.querySelectorAll('.answer-form').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const idx = this.getAttribute('data-idx');
      const answerInput = this.querySelector('.answer-input');
      const answerNicknameInput = this.querySelector('.answer-nickname-input');
      addAnswer(idx, answerInput.value, answerNicknameInput.value);
      answerInput.value = '';
      answerNicknameInput.value = '';
    });
  });
  // 각 대댓글 폼에 이벤트 리스너 연결
  document.querySelectorAll('.reply-form').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const qIdx = this.getAttribute('data-qidx');
      const aIdx = this.getAttribute('data-aidx');
      const replyInput = this.querySelector('.reply-input');
      const replyNicknameInput = this.querySelector('.reply-nickname-input');
      addReply(qIdx, aIdx, replyInput.value, replyNicknameInput.value);
      replyInput.value = '';
      replyNicknameInput.value = '';
    });
  });
} 