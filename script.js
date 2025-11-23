// -------------------------------------------------------------
// 설정 및 상수
// -------------------------------------------------------------
const API_URL = 'https://script.google.com/macros/s/AKfycbzhawNm5Wulg9AMFuw2x1BwYCoOOnRxmh-mqeXnrcTY8ERQNWm85dGZpDVsliAOZWWdAQ/exec'; 

document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ 자바스크립트 로드 완료");

  // DOM 요소
  const postsContainer = document.querySelector('.posts');
  const openWriteButton = document.getElementById('open-write');
  const closeWriteButtonX = document.getElementById('close-write-x');
  const closeWriteButtonUpload = document.getElementById('close-write-upload');
  const writeModal = document.getElementById('write-modal');
  const writeModalTitle = document.getElementById('write-modal-title');
  
  const detailView = document.getElementById('detail-view');
  const backToListButton = document.getElementById('back-to-list');
  const detailTitle = document.getElementById('detail-title');
  const detailStatusBadge = document.getElementById('detail-status-badge');
  const detailItem = document.getElementById('detail-item');
  const detailPrice = document.getElementById('detail-price');
  const detailLocation = document.getElementById('detail-location');
  const detailContent = document.getElementById('detail-content');
  
  const btnEdit = document.getElementById('btn-edit');
  const btnDelete = document.getElementById('btn-delete');
  const btnComplete = document.getElementById('btn-complete');

  const commentList = document.getElementById('comment-list');
  const commentInputAuthor = document.getElementById('comment-author');
  const commentInputText = document.getElementById('comment-text');
  const commentSubmitButton = document.getElementById('submit-comment');

  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('overlay');
  const openMenuBtn = document.getElementById('open-menu-btn');
  const openMenuBtnStats = document.getElementById('open-menu-btn-stats');
  
  const menuHome = document.getElementById('menu-home');
  const menuStats = document.getElementById('menu-stats');
  const menuCalculator = document.getElementById('menu-calculator'); // [NEW]
  const menuGuide = document.getElementById('menu-guide'); // [NEW]
  const menuReport = document.getElementById('menu-report'); // [NEW]

  const statsView = document.getElementById('stats-view');
  const statsContainer = document.getElementById('stats-container');
  const dashboardGrid = document.getElementById('dashboard-grid');
  const calculatorView = document.getElementById('calculator-view'); // [NEW]

  const filterBtns = document.querySelectorAll('.filter-btn');
  const searchInput = document.getElementById('search-input');
  const toggleSearchBtn = document.getElementById('toggle-search-btn'); 
  const searchArea = document.getElementById('search-area'); 

  // [NEW] 가이드 팝업
  const guideModalOverlay = document.getElementById('guide-modal-overlay');
  const closeGuideModalBtn = document.getElementById('close-guide-modal');

  // [NEW] 계산기
  const totalPriceInput = document.getElementById('total-price');
  const totalPeopleInput = document.getElementById('total-people');
  const calculateBtn = document.getElementById('calculate-btn');
  const nppangResult = document.getElementById('nppang-result');

  let allPosts = [];
  let allComments = [];
  let currentPostId = null; 
  let currentFilter = 'all';
  let isEditing = false;

  let messageBox = document.getElementById('message-box');
  if (!messageBox) {
    messageBox = document.createElement('div');
    messageBox.id = 'message-box';
    document.body.appendChild(messageBox);
  }

  function showMessage(text, isError = false, showLoader = false) {
    messageBox.innerHTML = `${showLoader ? '<span class="loading-indicator"></span>' : ''}<span>${text}</span>`;
    messageBox.style.backgroundColor = isError ? 'rgba(255, 60, 60, 0.9)' : 'rgba(0, 0, 0, 0.8)';
    messageBox.classList.add('show');
    if (!showLoader) setTimeout(() => messageBox.classList.remove('show'), 3000);
  }
  function timeSince(timestamp) {
    const now = new Date(); const past = new Date(timestamp); 
    if (isNaN(past.getTime())) return "방금 전";
    const seconds = Math.floor((now - past) / 1000);
    if (seconds < 60) return "방금 전";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
  }
  function formatPrice(price) { return Number(price).toLocaleString() + '원'; }
  function scrollToBottom() {
    const scrollArea = document.getElementById('detail-scroll-area');
    if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
  }

  // -------------------------------------------------------------
  // [NEW] 가이드 팝업 및 계산기 로직
  // -------------------------------------------------------------
  function checkFirstVisitAndShowGuide() {
      // 'nsharing_first_visit' 키가 없으면 첫 방문
      if (!localStorage.getItem('nsharing_first_visit')) {
          if(guideModalOverlay) guideModalOverlay.classList.add('is-visible');
          localStorage.setItem('nsharing_first_visit', 'true');
      }
  }
  
  if(closeGuideModalBtn) {
      closeGuideModalBtn.addEventListener('click', () => {
          if(guideModalOverlay) guideModalOverlay.classList.remove('is-visible');
      });
  }

  function calculateNppang() {
      const price = parseInt(totalPriceInput.value.replace(/[^0-9]/g, '')) || 0;
      const people = parseInt(totalPeopleInput.value) || 0;

      if (people > 0) {
          const result = Math.ceil(price / people); // 올림 처리
          nppangResult.textContent = formatPrice(result);
      } else {
          nppangResult.textContent = '0원';
      }
  }
  if(calculateBtn) calculateBtn.addEventListener('click', calculateNppang);
  // 입력 시 실시간 계산 (옵션)
  if(totalPriceInput) totalPriceInput.addEventListener('input', calculateNppang);
  if(totalPeopleInput) totalPeopleInput.addEventListener('input', calculateNppang);


  // -------------------------------------------------------------
  // 탭 전환 로직 (홈 / 통계 / 계산기)
  // -------------------------------------------------------------
  function switchTab(tabName) {
      if(sidebar) { sidebar.classList.remove('is-open'); overlay.classList.remove('is-open'); }
      
      if(statsView) statsView.classList.remove('is-active');
      if(calculatorView) calculatorView.classList.remove('is-active');

      if(menuHome) menuHome.classList.remove('active');
      if(menuStats) menuStats.classList.remove('active');
      if(menuCalculator) menuCalculator.classList.remove('active');
      
      if (tabName === 'home') {
          if(openWriteButton) openWriteButton.classList.remove('hidden'); 
          if(menuHome) menuHome.classList.add('active');
      } else if (tabName === 'stats') {
          if(statsView) statsView.classList.add('is-active');
          if(openWriteButton) openWriteButton.classList.add('hidden'); 
          if(menuStats) menuStats.classList.add('active');
          renderStats();
      } else if (tabName === 'calculator') {
          if(calculatorView) calculatorView.classList.add('is-active');
          if(openWriteButton) openWriteButton.classList.add('hidden');
          if(menuCalculator) menuCalculator.classList.add('active');
          calculateNppang(); // 계산기 화면으로 이동 시 초기 계산
      } else if (tabName === 'guide' || tabName === 'report') {
          // 가이드나 리포트는 외부/팝업으로 처리
          if(guideModalOverlay) guideModalOverlay.classList.add('is-visible');
          if (tabName === 'report') {
              alert('🚨 신고/문의: https://forms.gle/oRumRc4oCRiEMCqq6');
          }
      }
  }

  // 필터링 및 검색 (기존 유지)
  if(toggleSearchBtn) {
      toggleSearchBtn.addEventListener('click', () => {
          if(searchArea) {
            searchArea.classList.toggle('visible');
            if (searchArea.classList.contains('visible')) searchInput.focus();
          }
      });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.cat;
        renderPosts(); 
    });
  });

  if(searchInput) searchInput.addEventListener('input', () => { renderPosts(); });

  // [수정/삭제/완료 로직] (기존 유지)
  if(btnEdit) btnEdit.addEventListener('click', async () => {
      const post = allPosts.find(p => p.timestamp === currentPostId);
      if (!post) return;
      const password = prompt("수정하려면 비밀번호(4자리)를 입력하세요.");
      if (!password) return;
      showMessage('비밀번호 확인 중...', false, true);
      const payload = { action_type: 'verify_password', post_id: currentPostId, password: password };
      try {
          const response = await fetch(API_URL, { method: 'POST', body: new URLSearchParams({ payload: JSON.stringify(payload) }) });
          const data = await response.json();
          if (data.success) {
              showMessage('확인되었습니다.', false);
              isEditing = true;
              writeModalTitle.innerHTML = "게시글 <span>수정</span>";
              document.getElementById('close-write-upload').textContent = "수정하기";
              document.getElementById('post-title-field').value = post.item_name;
              document.getElementById('item-name-write').value = post.item_type;
              document.getElementById('price-write').value = post.price;
              let contentText = post.memo || '';
              let locationText = '';
              const locMatch = contentText.match(/^\[장소:\s*(.*?)\]\n?/);
              if (locMatch) { locationText = locMatch[1]; contentText = contentText.replace(locMatch[0], ''); }
              document.getElementById('location-write').value = locationText;
              document.getElementById('post-content-write').value = contentText;
              document.getElementById('password-write').value = password;
              openWriteModal();
          } else { showMessage(`❌ ${data.message}`, true); }
      } catch(e) { showMessage('오류 발생', true); }
  });

  if(btnDelete) btnDelete.addEventListener('click', async () => {
      const password = prompt("삭제하려면 게시글 비밀번호(4자리)를 입력하세요.");
      if (!password) return;
      if (!confirm("정말 삭제하시겠습니까?")) return;
      showMessage('삭제 중...', false, true);
      await sendStatusRequest({ action_type: 'delete_post', post_id: currentPostId, password: password }, "삭제되었습니다.");
  });

  if(btnComplete) btnComplete.addEventListener('click', async () => {
      const password = prompt("상태 변경을 위해 비밀번호를 입력하세요.");
      if (!password) return;
      await sendStatusRequest({ action_type: 'update_status', post_id: currentPostId, password: password }, "거래가 완료되었습니다!");
  });

  async function sendStatusRequest(payload, successMsg) {
      const formData = new URLSearchParams({ payload: JSON.stringify(payload) });
      try {
          const response = await fetch(API_URL, { method: 'POST', body: formData });
          const data = await response.json();
          if (data.success) {
              showMessage(`🎉 ${successMsg}`, false);
              closeDetailView();
              fetchData();
          } else { alert(data.message); showMessage(`❌ 실패: ${data.message}`, true); }
      } catch (e) { showMessage('오류 발생', true); }
  }

  async function fetchData() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json(); 
        allPosts = data.post || [];
        allComments = data.comment || [];
        renderPosts(); 
        if (detailView.classList.contains('is-open') && currentPostId) {
            const post = allPosts.find(p => p.timestamp === currentPostId);
            if (post) openDetailView(post);
            else closeDetailView();
        }
        if (statsView && statsView.classList.contains('is-active')) renderStats();
        if (calculatorView && calculatorView.classList.contains('is-active')) calculateNppang();
    } catch (error) { console.error("로딩 오류:", error); }
  }

  function renderPosts() {
    if(!postsContainer) return;
    postsContainer.innerHTML = ''; 
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let filtered = allPosts;
    if (currentFilter !== 'all') filtered = allPosts.filter(p => p.item_type === currentFilter);
    if (keyword) { filtered = filtered.filter(p => p.item_name.toLowerCase().includes(keyword) || (p.memo && p.memo.toLowerCase().includes(keyword))); }
    if (filtered.length === 0) { postsContainer.innerHTML = '<p style="text-align:center; color:var(--muted); padding-top:50px;">조건에 맞는 글이 없습니다.</p>'; return; }
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    filtered.forEach(post => {
        const title = post.item_name || '제목 없음';
        const itemType = post.item_type || '기타';
        const price = formatPrice(post.price);
        const relativeTime = timeSince(post.timestamp);
        const rawMemo = post.memo || '';
        const previewText = (rawMemo || '').substring(0, 40) + ((rawMemo || '').length > 40 ? '...' : '');
        const commentCount = allComments.filter(c => String(c.post_id) === String(post.timestamp)).length;
        const isCompleted = post.status === '거래완료';
        const postElement = document.createElement('article');
        postElement.className = `post ${isCompleted ? 'completed' : ''}`;
        postElement.addEventListener('click', () => openDetailView(post));
        postElement.innerHTML = `<div class="post-row"><div><h2 class="title">${title} ${isCompleted ? '<span style="font-size:10px;color:#999;">(완료)</span>' : ''}</h2><p class="preview" style="color:#555;">${itemType} · ${price}</p><p class="preview">${previewText}</p><p class="post-time">${relativeTime}</p></div><div class="comment-box"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF6436" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/></svg><span class="comment-count">${commentCount}</span></div></div>`;
        postsContainer.appendChild(postElement);
    });
  }

  function openDetailView(postData) {
    currentPostId = postData.timestamp; 
    let contentText = postData.memo || '';
    let locationText = '장소 미정';
    const locMatch = contentText.match(/^\[장소:\s*(.*?)\]\n?/);
    if (locMatch) { locationText = locMatch[1]; contentText = contentText.replace(locMatch[0], ''); }
    if(detailTitle) detailTitle.textContent = postData.item_name;
    if(detailItem) detailItem.textContent = postData.item_type;
    if(detailPrice) detailPrice.textContent = formatPrice(postData.price);
    if(detailLocation) detailLocation.textContent = locationText;
    if(detailContent) detailContent.textContent = contentText;
    
    if (postData.status === '거래완료') {
        if(detailStatusBadge) { detailStatusBadge.textContent = '거래완료'; detailStatusBadge.style.background = '#e2e8f0'; detailStatusBadge.style.color = '#94a3b8'; }
        if(btnComplete) btnComplete.style.display = 'none'; 
    } else {
        if(detailStatusBadge) { detailStatusBadge.textContent = '모집중'; detailStatusBadge.style.background = '#fff0eb'; detailStatusBadge.style.color = 'var(--accent)'; }
        if(btnComplete) btnComplete.style.display = 'block'; 
    }
    renderComments(currentPostId);
    if(detailView) detailView.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    setTimeout(scrollToBottom, 100);
  }

  function renderComments(postId) {
    if(!commentList) return;
    commentList.innerHTML = '';
    const filteredComments = allComments.filter(c => String(c.post_id) === String(postId));
    if (filteredComments.length === 0) {
        commentList.innerHTML = '<p style="text-align:center; color:#999; font-size:13px; padding:20px;">첫 댓글을 남겨보세요!</p>';
        return;
    }
    filteredComments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    filteredComments.forEach(comment => {
        const item = document.createElement('div');
        item.className = 'comment-item';
        item.innerHTML = `<div class="comment-item-header"><span class="comment-author">${comment.author}</span><span class="comment-time">${timeSince(comment.timestamp)}</span></div><p class="comment-text">${comment.content}</p>`;
        commentList.appendChild(item);
    });
    scrollToBottom();
  }

  async function handleCommentSubmit(e) {
    e.preventDefault();
    const author = commentInputAuthor.value.trim() || '익명';
    const content = commentInputText.value.trim();
    if (!content) { alert("내용을 입력하세요!"); return; }
    if (!currentPostId) return;
    if(commentSubmitButton) commentSubmitButton.disabled = true; 
    if(commentSubmitButton) commentSubmitButton.style.opacity = '0.5';
    const commentData = { action_type: 'new_comment', post_id: currentPostId, author: author, content: content };
    const formData = new URLSearchParams({ payload: JSON.stringify(commentData) });
    try {
        const response = await fetch(API_URL, { method: 'POST', body: formData });
        const data = await response.json();
        if (data.success) {
            if(commentInputText) commentInputText.value = ''; 
            const fakeComment = document.createElement('div');
            fakeComment.className = 'comment-item';
            fakeComment.style.border = "1px solid var(--accent)";
            fakeComment.innerHTML = `<div class="comment-item-header"><span class="comment-author">${author}</span><span class="comment-time">방금</span></div><p class="comment-text">${content}</p>`;
            if(commentList) commentList.appendChild(fakeComment);
            scrollToBottom();
            fetchData(); 
        } else { showMessage(`❌ 실패: ${data.message}`, true); }
    } catch (error) { showMessage('전송 오류', true); } 
    finally { if(commentSubmitButton) commentSubmitButton.disabled = false; if(commentSubmitButton) commentSubmitButton.style.opacity = '1'; }
  }

  async function savePost() {
    const titleInput = document.getElementById('post-title-field');
    const itemInput = document.getElementById('item-name-write');
    const priceInput = document.getElementById('price-write');
    const locationInput = document.getElementById('location-write');
    const contentInput = document.getElementById('post-content-write');
    const passwordInput = document.getElementById('password-write');

    if (!titleInput.value.trim() || !itemInput.value || !passwordInput.value.trim()) { alert("필수 입력 항목을 확인하세요."); return; }
    showMessage('저장 중...', false, true);
    if(closeWriteButtonUpload) closeWriteButtonUpload.disabled = true;
    const fullMemo = `[장소: ${locationInput.value.trim()}]\n${contentInput.value.trim()}`;
    const cleanPrice = priceInput.value.replace(/[^0-9]/g, '');
    const actionType = isEditing ? 'update_post' : 'new_post';
    const postData = { action_type: actionType, item_name: titleInput.value.trim(), item_type: itemInput.value, price: parseInt(cleanPrice) || 0, memo: fullMemo, comment_author_id: '익명User', password: passwordInput.value.trim(), post_id: isEditing ? currentPostId : null };
    const formData = new URLSearchParams({ payload: JSON.stringify(postData) });
    try {
        const response = await fetch(API_URL, { method: 'POST', body: formData });
        const data = await response.json();
        if(data.success) {
            showMessage(isEditing ? '✅ 수정되었습니다!' : '✅ 등록되었습니다!', false);
            titleInput.value = ''; itemInput.value = ''; priceInput.value = ''; locationInput.value = ''; contentInput.value = ''; passwordInput.value = '';
            closeWriteModal();
            fetchData();
        } else { alert(data.message); showMessage(`❌ 실패: ${data.message}`, true); }
    } catch(e) { showMessage('오류 발생', true); }
    if(closeWriteButtonUpload) closeWriteButtonUpload.disabled = false;
  }

  function closeDetailView() { 
      if(detailView) detailView.classList.remove('is-open'); 
      document.body.style.overflow = 'auto'; currentPostId = null; 
  }
  
  function openWriteModal() { 
      if (!isEditing) {
          if(writeModalTitle) writeModalTitle.innerHTML = "행사상품 <span>N빵</span> 해요";
          if(document.getElementById('close-write-upload')) document.getElementById('close-write-upload').textContent = "올리기";
          if(document.getElementById('post-title-field')) document.getElementById('post-title-field').value = '';
          if(document.getElementById('item-name-write')) document.getElementById('item-name-write').value = '';
          if(document.getElementById('price-write')) document.getElementById('price-write').value = '';
          if(document.getElementById('location-write')) document.getElementById('location-write').value = '';
          if(document.getElementById('post-content-write')) document.getElementById('post-content-write').value = '';
          if(document.getElementById('password-write')) document.getElementById('password-write').value = '';
          if(document.getElementById('password-write')) document.getElementById('password-write').placeholder = "거래완료 시 필요 (숫자 4자리)";
      }
      if(writeModal) writeModal.classList.add('is-open'); 
      document.body.style.overflow = 'hidden'; 
  }
  
  function closeWriteModal() { 
      if(writeModal) writeModal.classList.remove('is-open'); 
      document.body.style.overflow = 'auto'; 
      isEditing = false; 
  }
  
  function toggleSidebar(show) {
      if(sidebar) { sidebar.classList.toggle('is-open', show); overlay.classList.toggle('is-open', show); }
  }

  function renderStats() {
      if(!statsContainer) return;
      const totalPosts = allPosts.length;
      const totalComments = allComments.length;
      const todayStr = new Date().toISOString().split('T')[0];
      const todayPosts = allPosts.filter(p => new Date(p.timestamp).toISOString().split('T')[0] === todayStr).length;
      const completedPosts = allPosts.filter(p => p.status === '거래완료').length;
      if(dashboardGrid) dashboardGrid.innerHTML = `<div class="stat-card"><span class="stat-card-title">📢 누적 나눔</span><span class="stat-card-value">${totalPosts}</span></div><div class="stat-card"><span class="stat-card-title">🎉 나눔 완료</span><span class="stat-card-value">${completedPosts}</span></div><div class="stat-card highlight"><span class="stat-card-title">💬 참여 댓글</span><span class="stat-card-value">${totalComments}</span></div><div class="stat-card highlight"><span class="stat-card-title">🔥 오늘의 열기</span><span class="stat-card-value">${todayPosts}</span></div>`;
      statsContainer.innerHTML = '';
      const counts = {}; let totalItemCount = 0;
      allPosts.forEach(post => { const type = post.item_type || '기타'; counts[type] = (counts[type] || 0) + 1; totalItemCount++; });
      const sortedTypes = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
      const maxCount = sortedTypes.length > 0 ? counts[sortedTypes[0]] : 1;
      if (sortedTypes.length === 0) { statsContainer.innerHTML = '<p style="text-align:center;color:#999;margin-top:50px;">데이터가 없습니다.</p>'; return; }
      sortedTypes.forEach((type, index) => {
          const count = counts[type]; const barPercentage = (count / maxCount) * 100; const realPercentage = Math.round((count / totalItemCount) * 100); const rank = index + 1;
          const item = document.createElement('div'); item.className = 'stat-item';
          item.innerHTML = `<div class="stat-header"><div class="stat-info"><span class="stat-rank">${rank}</span><span class="stat-label">${type}</span></div><div class="stat-count-text"><span>${count}개</span> (${realPercentage}%)</div></div><div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${barPercentage}%"></div></div>`;
          statsContainer.appendChild(item);
      });
  }

  // 초기화 및 이벤트 연결
  fetchData(); 
  checkFirstVisitAndShowGuide(); // [NEW] 첫 방문 시 가이드 팝업
  setInterval(fetchData, 30000); 

  if(openWriteButton) openWriteButton.addEventListener('click', () => { isEditing = false; openWriteModal(); });
  if(closeWriteButtonX) closeWriteButtonX.addEventListener('click', closeWriteModal);
  if(closeWriteButtonUpload) closeWriteButtonUpload.addEventListener('click', savePost);
  if(backToListButton) backToListButton.addEventListener('click', closeDetailView);
  if(commentSubmitButton) commentSubmitButton.onclick = handleCommentSubmit;
  
  if(openMenuBtn) openMenuBtn.addEventListener('click', () => toggleSidebar(true));
  if(openMenuBtnStats) openMenuBtnStats.addEventListener('click', () => toggleSidebar(true));
  if(overlay) overlay.addEventListener('click', () => toggleSidebar(false));
  
  if(menuHome) menuHome.addEventListener('click', () => switchTab('home'));
  if(menuStats) menuStats.addEventListener('click', () => switchTab('stats'));
  if(menuCalculator) menuCalculator.addEventListener('click', () => switchTab('calculator')); // [NEW]
  if(menuGuide) menuGuide.addEventListener('click', () => switchTab('guide')); // [NEW]
  if(menuReport) menuReport.addEventListener('click', () => switchTab('report')); // [NEW] 신고/문의

  if(document.getElementById('open-menu-btn-calc')) document.getElementById('open-menu-btn-calc').addEventListener('click', () => toggleSidebar(true));
});