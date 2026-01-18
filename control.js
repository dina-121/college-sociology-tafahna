// === إعدادات Firebase ===
const firebaseConfig = {
    // ضع هنا إعدادات مشروع Firebase الخاص بك
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

let allSchedules = [];
let allBooks = [];

document.addEventListener('DOMContentLoaded', function() {
    fetchAndDisplayNews();
    fetchAndDisplayAllSchedules();
    fetchAndDisplayAllBooks();
    setupFilters();
});

// === جلب وعرض الأخبار ===
async function fetchAndDisplayNews() {
    try {
        const newsSnapshot = await db.collection('newsAndAds').orderBy('publishedAt', 'desc').get();
        const newsListContainer = document.getElementById('news-list');
        newsListContainer.innerHTML = '';
        
        if (newsSnapshot.empty) {
            newsListContainer.innerHTML = '<div class="empty-state"><i class="fas fa-newspaper"></i><p>لا توجد أخبار حاليًا.</p></div>';
            return;
        }

        newsSnapshot.forEach(doc => {
            const news = doc.data();
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item';
            
            const imagesHtml = news.images && news.images.length > 0
                ? `<div class="news-images">${news.images.map(img => `<img src="${img}" alt="صورة الخبر">`).join('')}</div>`
                : '';

            newsItem.innerHTML = `
                <h3>${news.title}</h3>
                <p>${news.content}</p>
                ${imagesHtml}
                <small>تاريخ النشر: ${news.publishedAt ? new Date(news.publishedAt.toDate()).toLocaleString('ar-EG') : 'غير محدد'}</small>
            `;
            newsListContainer.appendChild(newsItem);
        });
    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

// === جلب وعرض الجداول ===
async function fetchAndDisplayAllSchedules() {
    try {
        const schedulesSnapshot = await db.collection('schedules').orderBy('department').get();
        allSchedules = schedulesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displaySchedules(allSchedules);
    } catch (error) {
        console.error("Error fetching schedules:", error);
    }
}

function displaySchedules(schedulesToShow) {
    const schedulesListContainer = document.getElementById('schedules-list');
    schedulesListContainer.innerHTML = '';

    if (schedulesToShow.length === 0) {
        schedulesListContainer.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-alt"></i><p>لا توجد جداول متاحة حاليًا.</p></div>';
        return;
    }

    schedulesToShow.forEach(schedule => {
        const scheduleItem = document.createElement('div');
        scheduleItem.className = 'file-item';
        scheduleItem.innerHTML = `
            <h4>جدول فرقة ${schedule.department}</h4>
            <a href="${schedule.url}" target="_blank" class="download-link">
                <i class="fas fa-download"></i> ${schedule.name}
            </a>
        `;
        schedulesListContainer.appendChild(scheduleItem);
    });
}

// === جلب وعرض الكتب ===
async function fetchAndDisplayAllBooks() {
    try {
        const booksSnapshot = await db.collection('books').orderBy('department').get();
        allBooks = booksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        displayBooks(allBooks);
    } catch (error) {
        console.error("Error fetching books:", error);
    }
}

function displayBooks(booksToShow) {
    const booksListContainer = document.getElementById('books-list');
    booksListContainer.innerHTML = '';

    if (booksToShow.length === 0) {
        booksListContainer.innerHTML = '<div class="empty-state"><i class="fas fa-book"></i><p>لا توجد كتب متاحة حاليًا.</p></div>';
        return;
    }

    booksToShow.forEach(book => {
        const bookItem = document.createElement('div');
        bookItem.className = 'file-item';
        bookItem.innerHTML = `
            <h4>كتاب فرقة ${book.department}</h4>
            <a href="${book.url}" target="_blank" class="download-link">
                <i class="fas fa-download"></i> ${book.name}
            </a>
        `;
        booksListContainer.appendChild(bookItem);
    });
}

// === وظيفة الفلترة بناءً على القسم ===
function setupFilters() {
    document.querySelectorAll('#schedules-section .filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            const department = button.dataset.department;
            document.querySelectorAll('#schedules-section .filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            const filteredSchedules = department === 'all' 
                ? allSchedules 
                : allSchedules.filter(s => s.department === department);
            displaySchedules(filteredSchedules);
        });
    });

    document.querySelectorAll('#books-section .filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            const department = button.dataset.department;
            document.querySelectorAll('#books-section .filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filteredBooks = department === 'all' 
                ? allBooks 
                : allBooks.filter(b => b.department === department);
            displayBooks(filteredBooks);
        });
    });
}