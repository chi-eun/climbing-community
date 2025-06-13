// Firestore 연동 Q&A 피드
let questions = [];

const questionForm = document.getElementById('question-form');
const questionInput = document.getElementById('question-input');
const questionNickname = document.getElementById('question-nickname');
const questionList = document.getElementById('question-list');
const loadingSpinner = document.getElementById('loading-spinner');
const firestoreInfo = document.getElementById('firestore-info');

// 시간 포맷 함수
function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleString('ko-KR', { hour12: false });
}

// Firestore에서 질문, 답변, 대댓글 실시간 동기화
function listenQuestions() {
  loadingSpinner.style.display = 'block';
  firestoreInfo.textContent = '질문 데이터를 불러오는 중입니다...';
  db.collection('questions').orderBy('time', 'desc')
    .onSnapshot(async snapshot => {
      questions = [];
      const promises = snapshot.docs.map(async doc => {
        const q = doc.data();
        q.id = doc.id;
        // 답변 서브컬렉션 불러오기
        const answersSnap = await db.collection('questions').doc(q.id).collection('answers').orderBy('time').get();
        q.answers = await Promise.all(answersSnap.docs.map(async ansDoc => {
          const a = ansDoc.data();
          a.id = ansDoc.id;
          // 대댓글 서브컬렉션 불러오기
          const repliesSnap = await db.collection('questions').doc(q.id).collection('answers').doc(a.id).collection('replies').orderBy('time').get();
          a.replies = repliesSnap.docs.map(repDoc => repDoc.data());
          return a;
        }));
        return q;
      });
      questions = await Promise.all(promises);
      loadingSpinner.style.display = 'none';
      firestoreInfo.textContent = '';
      renderQuestions();
    }, (error) => {
      loadingSpinner.style.display = 'none';
      firestoreInfo.textContent = '데이터를 불러오지 못했습니다.';
    });
}

listenQuestions();

// 질문 추가
questionForm.addEventListener('submit', function(e) {
  e.preventDefault();
  const text = questionInput.value.trim();
  const nickname = questionNickname.value.trim() || '익명';
  if (text) {
    db.collection('questions').add({
      text,
      nickname,
      time: new Date().toISOString()
    });
    questionInput.value = '';
    questionNickname.value = '';
  }
});

// 답변 추가
function addAnswer(qId, answerText, answerNickname) {
  if (answerText.trim()) {
    db.collection('questions').doc(qId).collection('answers').add({
      text: answerText.trim(),
      nickname: answerNickname.trim() || '익명',
      time: new Date().toISOString()
    });
  }
}

// 대댓글 추가
function addReply(qId, aId, replyText, replyNickname) {
  if (replyText.trim()) {
    db.collection('questions').doc(qId).collection('answers').doc(aId).collection('replies').add({
      text: replyText.trim(),
      nickname: replyNickname.trim() || '익명',
      time: new Date().toISOString()
    });
  }
}

// 질문/답변/대댓글 렌더링
function renderQuestions() {
  questionList.innerHTML = '';
  questions.forEach((q) => {
    const li = document.createElement('li');
    li.className = 'question-item';
    li.innerHTML = `
      <div class="question-header">
        <span class="question-nickname">${q.nickname}</span>
        <span class="question-time">${formatTime(q.time)}</span>
      </div>
      <div class="question-text">${q.text}</div>
      <ul class="answer-list">
        ${(q.answers||[]).map(a => `
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
            <form class="reply-form" data-qid="${q.id}" data-aid="${a.id}">
              <input type="text" class="reply-nickname-input" placeholder="닉네임(선택)" maxlength="12" />
              <input type="text" class="reply-input" placeholder="대댓글을 입력하세요" required />
              <button type="submit">대댓글</button>
            </form>
          </li>
        `).join('')}
      </ul>
      <form class="answer-form" data-qid="${q.id}">
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
      const qId = this.getAttribute('data-qid');
      const answerInput = this.querySelector('.answer-input');
      const answerNicknameInput = this.querySelector('.answer-nickname-input');
      addAnswer(qId, answerInput.value, answerNicknameInput.value);
      answerInput.value = '';
      answerNicknameInput.value = '';
    });
  });
  // 각 대댓글 폼에 이벤트 리스너 연결
  document.querySelectorAll('.reply-form').forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const qId = this.getAttribute('data-qid');
      const aId = this.getAttribute('data-aid');
      const replyInput = this.querySelector('.reply-input');
      const replyNicknameInput = this.querySelector('.reply-nickname-input');
      addReply(qId, aId, replyInput.value, replyNicknameInput.value);
      replyInput.value = '';
      replyNicknameInput.value = '';
    });
  });
} 
