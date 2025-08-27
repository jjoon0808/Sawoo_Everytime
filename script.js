// 게시판 애플리케이션
class AnonymousBoard {
    constructor() {
        this.posts = JSON.parse(localStorage.getItem('anonymousPosts')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.renderPosts();
        this.loadSamplePosts();
    }

    // 이벤트 바인딩
    bindEvents() {
        // 게시글 작성 폼
        const postForm = document.getElementById('postForm');
        postForm.addEventListener('submit', (e) => this.handlePostSubmit(e));

        // 카테고리 필터
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilterClick(e));
        });

        // 모달 닫기
        const modal = document.getElementById('postModal');
        const closeBtn = document.querySelector('.close');
        closeBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
    }

    // 게시글 제출 처리
    handlePostSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const title = formData.get('title').trim();
        const content = formData.get('content').trim();
        const category = formData.get('category');

        if (!title || !content) {
            this.showNotification('제목과 내용을 모두 입력해주세요.', 'error');
            return;
        }

        const post = {
            id: Date.now(),
            title,
            content,
            category,
            author: '익명',
            date: new Date().toLocaleDateString('ko-KR'),
            timestamp: Date.now(),
            likes: 0,
            comments: []
        };

        this.posts.unshift(post);
        this.savePosts();
        this.renderPosts();
        
        // 폼 초기화
        e.target.reset();
        this.showNotification('게시글이 성공적으로 작성되었습니다!', 'success');
    }

    // 카테고리 필터 처리
    handleFilterClick(e) {
        const category = e.target.dataset.category;
        
        // 활성 버튼 업데이트
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        this.currentFilter = category;
        this.renderPosts();
    }

    // 게시글 렌더링
    renderPosts() {
        const postsList = document.getElementById('postsList');
        const filteredPosts = this.getFilteredPosts();
        
        if (filteredPosts.length === 0) {
            postsList.innerHTML = `
                <div class="no-posts">
                    <i class="fas fa-inbox" style="font-size: 3rem; color: #cbd5e0; margin-bottom: 20px;"></i>
                    <p style="color: #718096; text-align: center;">아직 게시글이 없습니다. 첫 번째 게시글을 작성해보세요!</p>
                </div>
            `;
            return;
        }

        postsList.innerHTML = filteredPosts.map(post => this.createPostHTML(post)).join('');
        
        // 게시글 클릭 이벤트 추가
        postsList.querySelectorAll('.post-card').forEach((card, index) => {
            card.addEventListener('click', () => this.openPostModal(filteredPosts[index]));
        });
    }

    // 필터링된 게시글 가져오기
    getFilteredPosts() {
        if (this.currentFilter === 'all') {
            return this.posts;
        }
        return this.posts.filter(post => post.category === this.currentFilter);
    }

    // 게시글 HTML 생성
    createPostHTML(post) {
        return `
            <div class="post-card" data-post-id="${post.id}">
                <div class="post-header">
                    <div class="post-meta">
                        <span class="post-category">${post.category}</span>
                        <span class="post-date">${post.date}</span>
                    </div>
                </div>
                <h3 class="post-title">${this.escapeHtml(post.title)}</h3>
                <p class="post-content">${this.escapeHtml(post.content)}</p>
                <div class="post-footer">
                    <span class="post-author">${post.author}</span>
                    <div class="post-actions">
                        <button class="action-btn like-btn" onclick="event.stopPropagation(); board.toggleLike(${post.id})">
                            <i class="fas fa-heart ${post.liked ? 'liked' : ''}"></i>
                            <span>${post.likes}</span>
                        </button>
                        <button class="action-btn comment-btn" onclick="event.stopPropagation(); board.openPostModal(${post})">
                            <i class="fas fa-comment"></i>
                            <span>${post.comments.length}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // 게시글 상세 모달 열기
    openPostModal(post) {
        const modal = document.getElementById('postModal');
        const modalContent = document.getElementById('modalContent');
        
        modalContent.innerHTML = `
            <div class="post-detail">
                <div class="post-detail-header">
                    <h2>${this.escapeHtml(post.title)}</h2>
                    <div class="post-detail-meta">
                        <span class="post-category">${post.category}</span>
                        <span class="post-date">${post.date}</span>
                        <span class="post-author">${post.author}</span>
                    </div>
                </div>
                <div class="post-detail-content">
                    <p>${this.escapeHtml(post.content).replace(/\n/g, '<br>')}</p>
                </div>
                <div class="post-detail-actions">
                    <button class="action-btn like-btn" onclick="board.toggleLike(${post.id})">
                        <i class="fas fa-heart ${post.liked ? 'liked' : ''}"></i>
                        <span>${post.likes}</span>
                    </button>
                </div>
                
                <div class="comments-section">
                    <h3>댓글 (${post.comments.length})</h3>
                    <div class="comment-form">
                        <textarea id="commentText" placeholder="댓글을 입력하세요..." rows="3"></textarea>
                        <button onclick="board.addComment(${post.id})">댓글 작성</button>
                    </div>
                    <div class="comments-list">
                        ${post.comments.map(comment => `
                            <div class="comment">
                                <div class="comment-header">
                                    <span class="comment-author">${comment.author}</span>
                                    <span class="comment-date">${comment.date}</span>
                                </div>
                                <p class="comment-content">${this.escapeHtml(comment.content)}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    // 모달 닫기
    closeModal() {
        const modal = document.getElementById('postModal');
        modal.style.display = 'none';
    }

    // 좋아요 토글
    toggleLike(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            if (post.liked) {
                post.likes--;
                post.liked = false;
            } else {
                post.likes++;
                post.liked = true;
            }
            this.savePosts();
            this.renderPosts();
        }
    }

    // 댓글 추가
    addComment(postId) {
        const commentText = document.getElementById('commentText').value.trim();
        if (!commentText) {
            this.showNotification('댓글 내용을 입력해주세요.', 'error');
            return;
        }

        const post = this.posts.find(p => p.id === postId);
        if (post) {
            const comment = {
                id: Date.now(),
                content: commentText,
                author: '익명',
                date: new Date().toLocaleDateString('ko-KR'),
                timestamp: Date.now()
            };
            
            post.comments.push(comment);
            this.savePosts();
            this.renderPosts();
            
            // 댓글 입력창 초기화
            document.getElementById('commentText').value = '';
            this.showNotification('댓글이 추가되었습니다!', 'success');
            
            // 모달 내용 업데이트
            this.openPostModal(post);
        }
    }

    // 게시글 저장
    savePosts() {
        localStorage.setItem('anonymousPosts', JSON.stringify(this.posts));
    }

    // HTML 이스케이프
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 알림 표시
    showNotification(message, type = 'info') {
        // 기존 알림 제거
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // 스타일 추가
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // 애니메이션
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 자동 제거
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // 샘플 게시글 로드
    loadSamplePosts() {
        if (this.posts.length === 0) {
            const samplePosts = [
                {
                    id: 1,
                    title: '안녕하세요! 익명 게시판에 오신 것을 환영합니다!',
                    content: '이곳은 우리 학교 학생들이 자유롭게 의견을 나누고 소통할 수 있는 공간입니다. 익명으로 작성되므로 부담 없이 글을 써보세요!',
                    category: '일반',
                    author: '익명',
                    date: new Date().toLocaleDateString('ko-KR'),
                    timestamp: Date.now() - 86400000,
                    likes: 5,
                    comments: [],
                    liked: false
                },
                {
                    id: 2,
                    title: '학교생활에 대한 의견',
                    content: '학교생활을 하면서 느낀 점이나 개선하고 싶은 부분이 있다면 자유롭게 이야기해보세요. 함께 더 좋은 학교를 만들어가요!',
                    category: '학교생활',
                    author: '익명',
                    date: new Date().toLocaleDateString('ko-KR'),
                    timestamp: Date.now() - 172800000,
                    likes: 3,
                    comments: [],
                    liked: false
                }
            ];
            
            this.posts = samplePosts;
            this.savePosts();
            this.renderPosts();
        }
    }
}

// CSS 스타일 추가
const additionalStyles = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .notification-content i {
        font-size: 1.2rem;
    }
    
    .post-detail {
        max-width: 100%;
    }
    
    .post-detail-header {
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e2e8f0;
    }
    
    .post-detail-header h2 {
        color: #2d3748;
        margin-bottom: 15px;
        font-size: 2rem;
    }
    
    .post-detail-meta {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
    }
    
    .post-detail-content {
        margin-bottom: 30px;
        line-height: 1.8;
        font-size: 1.1rem;
        color: #4a5568;
    }
    
    .post-detail-actions {
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e2e8f0;
    }
    
    .comments-section h3 {
        color: #2d3748;
        margin-bottom: 20px;
        font-size: 1.5rem;
    }
    
    .comment-form {
        margin-bottom: 25px;
    }
    
    .comment-form textarea {
        width: 100%;
        padding: 15px;
        border: 2px solid #e2e8f0;
        border-radius: 12px;
        font-family: inherit;
        font-size: 1rem;
        resize: vertical;
        margin-bottom: 15px;
    }
    
    .comment-form textarea:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .comment-form button {
        background: #667eea;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s ease;
    }
    
    .comment-form button:hover {
        background: #5a67d8;
        transform: translateY(-1px);
    }
    
    .comments-list {
        display: grid;
        gap: 15px;
    }
    
    .comment {
        background: #f7fafc;
        padding: 15px;
        border-radius: 10px;
        border-left: 4px solid #667eea;
    }
    
    .comment-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        font-size: 0.9rem;
    }
    
    .comment-author {
        color: #4a5568;
        font-weight: 500;
    }
    
    .comment-date {
        color: #a0aec0;
    }
    
    .comment-content {
        color: #2d3748;
        line-height: 1.6;
    }
    
    .like-btn.liked i {
        color: #e53e3e;
    }
    
    .no-posts {
        text-align: center;
        padding: 60px 20px;
    }
    
    .no-posts i {
        display: block;
        margin: 0 auto 20px;
    }
`;

// 스타일 추가
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// 게시판 인스턴스 생성
const board = new AnonymousBoard();

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('익명 게시판이 로드되었습니다!');
});
