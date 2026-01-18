// === إعدادات Firebase الخاصة بك ===
const firebaseConfig = {
    apiKey: "AIzaSyDINU4yQT2bCwtIqZLHQo9bFgOiECp8byQ",
    authDomain: "sociolog-project.firebaseapp.com",
    databaseURL: "https://sociolog-project-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "sociolog-project",
    storageBucket: "sociolog-project.firebasestorage.app",
    messagingSenderId: "232355212530",
    appId: "1:232355212530:web:27d447ff8dd6e02c12f46b",
    measurementId: "G-0QNFKW4YPJ"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();
const storage = firebase.storage();

let allUsers = [];
let allNews = [];
let currentDepartment = 'all';
let filesToUpload = [];

/* === الدوال الأساسية للوحة التحكم === */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName + '-tab').classList.remove('hidden');
    document.querySelector(`button[onclick="showTab('${tabName}')"]`).classList.add('active');
    
    if (tabName === 'admins') {
        fetchAndDisplayAdmins();
    }
    if (tabName === 'schedules') {
        fetchAndDisplaySchedules();
    }
    if (tabName === 'books') {
        fetchAndDisplayBooks();
    }
    if (tabName === 'news') {
        fetchAndDisplayNews();
    }

    if (window.innerWidth <= 1200) {
        toggleSidebar();
    }
}

// === وظائف إدارة النوافذ المنبثقة ===
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function openAddModal() {
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> إضافة خبر / إعلان';
    document.getElementById('newsId').value = '';
    document.getElementById('newsTitle').value = '';
    document.getElementById('newsContent').value = '';
    document.getElementById('newsPublishedAt').value = '';
    document.getElementById('newsExpiresAt').value = '';
    document.getElementById('newsImages').value = '';
    document.getElementById('images-preview').innerHTML = '';
    filesToUpload = [];
    openModal('newsModal');
}

function openAddScheduleModal() {
    document.getElementById('scheduleForm').reset();
    openModal('scheduleModal');
}

function openAddBooksModal() {
    document.getElementById('booksForm').reset();
    openModal('booksModal');
}

async function logout() {
    try {
        await auth.signOut();
        window.location.href = "auth.html";
    } catch (error) {
        console.error("Logout error:", error);
        alert("فشل تسجيل الخروج.");
    }
}

/* === إدارة المستخدمين والأخبار (الحالية في الكود الخاص بك) === */
async function deleteUserSoft(userId, userEmail) {
    if (confirm(`هل أنت متأكد من حذف ${userEmail} حذفًا مبدئيًا؟`)) {
        try {
            await db.collection('users').doc(userId).delete();
            alert("تم حذف المستخدم من قاعدة البيانات بنجاح.");
            fetchDashboardData();
            fetchAndDisplayUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
            alert("فشل حذف المستخدم.");
        }
    }
}

async function deleteUserHard(userEmail) {
    if (confirm(`هل أنت متأكد من حذف ${userEmail} حذفًا نهائيًا؟ هذا الإجراء لا يمكن التراجع عنه!`)) {
        try {
            await db.collection('blockedEmails').doc(userEmail).set({ permanentlyBlocked: true });
            alert("تم حظر المستخدم نهائيًا من التسجيل. يجب حذفه يدويًا من Firebase Authentication.");
            fetchDashboardData();
            fetchAndDisplayUsers();
        } catch (error) {
            console.error("Error permanently blocking user:", error);
            alert("فشل الحظر النهائي للمستخدم.");
        }
    }
}

async function fetchAndDisplayUsers() {
    try {
        const usersSnapshot = await db.collection('users').get();
        allUsers = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            const lastLoginDate = userData.lastLogin ? userData.lastLogin.toDate().toLocaleString('ar-EG') : 'غير متوفر';
            allUsers.push({ id: doc.id, ...userData, lastLogin: lastLoginDate });
        });
        applyFilters();
    } catch (error) {
        console.error("Error fetching users:", error);
        alert("حدث خطأ أثناء جلب بيانات المستخدمين.");
    }
}

function displayUsers(usersToShow) {
    const usersTableBodyDesktop = document.getElementById('users-table-body-desktop');
    const usersTableBodyMobile = document.getElementById('users-table-body-mobile');
    usersTableBodyDesktop.innerHTML = '';
    usersTableBodyMobile.innerHTML = '';

    if (usersToShow.length === 0) {
        const emptyStateHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <p>لا يوجد مستخدمون لعرضهم</p>
                </td>
            </tr>
        `;
        usersTableBodyDesktop.innerHTML = emptyStateHTML;
        usersTableBodyMobile.innerHTML = `<div class="empty-state"><i class="fas fa-users-slash"></i><p>لا يوجد مستخدمون لعرضهم</p></div>`;
        return;
    }

    usersToShow.forEach(user => {
        const tableRow = document.createElement('tr');
        tableRow.innerHTML = `
            <td>${user.name || 'غير محدد'}</td>
            <td>${user.email || 'غير محدد'}</td>
            <td>${user.phone || 'غير محدد'}</td>
            <td>${user.studentYear || 'غير محدد'}</td>
            <td>${user.department || 'غير محدد'}</td>
            <td>${user.lastLogin}</td>
            <td class="actions-cell">
                <button class="delete-soft" onclick="deleteUserSoft('${user.id}', '${user.email}')"><i class="fas fa-trash-alt"></i> حذف مبدئي</button>
                <button class="delete-hard" onclick="deleteUserHard('${user.email}')"><i class="fas fa-ban"></i> حذف نهائي</button>
            </td>
        `;
        usersTableBodyDesktop.appendChild(tableRow);
        
        const mobileCard = document.createElement('div');
        mobileCard.className = 'mobile-card';
        mobileCard.innerHTML = `
            <div class="mobile-card-item"><div class="mobile-card-label">الاسم:</div><div class="mobile-card-value">${user.name || 'غير محدد'}</div></div>
            <div class="mobile-card-item"><div class="mobile-card-label">البريد الإلكتروني:</div><div class="mobile-card-value">${user.email || 'غير محدد'}</div></div>
            <div class="mobile-card-item"><div class="mobile-card-label">رقم الهاتف:</div><div class="mobile-card-value">${user.phone || 'غير محدد'}</div></div>
            <div class="mobile-card-item"><div class="mobile-card-label">الفرقة الدراسية:</div><div class="mobile-card-value">${user.studentYear || 'غير محدد'}</div></div>
            <div class="mobile-card-item"><div class="mobile-card-label">القسم:</div><div class="mobile-card-value">${user.department || 'غير محدد'}</div></div>
            <div class="mobile-card-item"><div class="mobile-card-label">آخر دخول:</div><div class="mobile-card-value">${user.lastLogin}</div></div>
            <div class="actions-cell">
                <button class="delete-soft" onclick="deleteUserSoft('${user.id}', '${user.email}')"><i class="fas fa-trash-alt"></i> حذف مبدئي</button>
                <button class="delete-hard" onclick="deleteUserHard('${user.email}')"><i class="fas fa-ban"></i> حذف نهائي</button>
            </div>
        `;
        usersTableBodyMobile.appendChild(mobileCard);
    });
}

function applyFilters() {
    let filteredList = allUsers;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (currentDepartment !== 'all') {
        filteredList = filteredList.filter(user => user.department === currentDepartment);
    }

    if (searchTerm) {
        filteredList = filteredList.filter(user => 
            (user.name && user.name.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm)) ||
            (user.phone && user.phone.includes(searchTerm))
        );
    }
    displayUsers(filteredList);
}

async function fetchAndDisplayNews() {
    try {
        const newsSnapshot = await db.collection('newsAndAds').orderBy('publishedAt', 'desc').get();
        allNews = [];
        newsSnapshot.forEach(doc => {
            const newsData = doc.data();
            const publishedAt = newsData.publishedAt ? newsData.publishedAt.toDate().toLocaleString('ar-EG') : 'غير محدد';
            const expiresAt = newsData.expiresAt ? newsData.expiresAt.toDate() : null;
            
            let status = 'نشط';
            if (expiresAt) {
                const now = new Date();
                const diffHours = (expiresAt - now) / (1000 * 60 * 60);
                if (expiresAt < now) {
                    status = 'منتهٍ';
                } else if (diffHours <= 1) {
                    status = 'قريبًا ينتهي';
                }
            } else {
                status = 'مستمر';
            }

            allNews.push({
                id: doc.id,
                ...newsData,
                publishedAt: publishedAt,
                expiresAt: newsData.expiresAt ? newsData.expiresAt.toDate().toLocaleString('ar-EG') : 'مستمر',
                status: status
            });
        });
        displayNews(allNews);
    } catch (error) {
        console.error("Error fetching news:", error);
    }
}

function displayNews(newsToShow) {
    const newsTableBodyDesktop = document.getElementById('news-table-body-desktop');
    const newsTableBodyMobile = document.getElementById('news-table-body-mobile');
    newsTableBodyDesktop.innerHTML = '';
    newsTableBodyMobile.innerHTML = '';

    if (newsToShow.length === 0) {
        const emptyStateHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-newspaper"></i>
                    <p>لا يوجد أخبار أو إعلانات لعرضها</p>
                </td>
            </tr>
        `;
        newsTableBodyDesktop.innerHTML = emptyStateHTML;
        newsTableBodyMobile.innerHTML = `<div class="empty-state"><i class="fas fa-newspaper"></i><p>لا يوجد أخبار أو إعلانات لعرضها</p></div>`;
        return;
    }

    newsToShow.forEach(news => {
        const tableRow = document.createElement('tr');
        tableRow.innerHTML = `
            <td>${news.title || 'بدون عنوان'}</td>
            <td>${news.status}</td>
            <td>${news.publishedAt}</td>
            <td>${news.expiresAt}</td>
            <td>${news.views || 0}</td>
            <td class="actions-cell">
                <button class="edit-btn" onclick="openEditModal('${news.id}')"><i class="fas fa-edit"></i> تعديل</button>
                <button class="viewers-btn" onclick="viewNewsViewers('${news.id}')"><i class="fas fa-eye"></i> المشاهدون</button>
                <button class="delete-hard" onclick="deleteNews('${news.id}')"><i class="fas fa-trash"></i> حذف</button>
            </td>
        `;
        newsTableBodyDesktop.appendChild(tableRow);
        
        const mobileCard = document.createElement('div');
        mobileCard.className = 'mobile-card';
        mobileCard.innerHTML = `
            <div class="mobile-card-item"><div class="mobile-card-label">العنوان:</div><div class="mobile-card-value">${news.title || 'بدون عنوان'}</div></div>
            <div class="mobile-card-item"><div class="mobile-card-label">الحالة:</div><div class="mobile-card-value">${news.status}</div></div>
            <div class="mobile-card-item"><div class="mobile-card-label">تاريخ النشر:</div><div class="mobile-card-value">${news.publishedAt}</div></div>
            <div class="mobile-card-item"><div class="mobile-card-label">تاريخ الانتهاء:</div><div class="mobile-card-value">${news.expiresAt}</div></div>
            <div class="mobile-card-item"><div class="mobile-card-label">المشاهدات:</div><div class="mobile-card-value">${news.views || 0}</div></div>
            <div class="actions-cell">
                <button class="edit-btn" onclick="openEditModal('${news.id}')"><i class="fas fa-edit"></i> تعديل</button>
                <button class="viewers-btn" onclick="viewNewsViewers('${news.id}')"><i class="fas fa-eye"></i> المشاهدون</button>
                <button class="delete-hard" onclick="deleteNews('${news.id}')"><i class="fas fa-trash"></i> حذف</button>
            </div>
        `;
        newsTableBodyMobile.appendChild(mobileCard);
    });
}

async function openEditModal(id) {
    const doc = await db.collection('newsAndAds').doc(id).get();
    if (doc.exists) {
        const newsData = doc.data();
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> تعديل خبر / إعلان';
        document.getElementById('newsId').value = doc.id;
        document.getElementById('newsTitle').value = newsData.title;
        document.getElementById('newsContent').value = newsData.content;
        
        const imagesPreviewContainer = document.getElementById('images-preview');
        imagesPreviewContainer.innerHTML = '';
        filesToUpload = [];
        if (newsData.images && newsData.images.length > 0) {
            newsData.images.forEach(imageUrl => {
                const previewItem = document.createElement('div');
                previewItem.className = 'image-preview-item';
                previewItem.innerHTML = `<img src="${imageUrl}"><button type="button" class="remove-image-btn" data-url="${imageUrl}">&times;</button>`;
                imagesPreviewContainer.appendChild(previewItem);
            });
        }
        
        if (newsData.publishedAt) {
            const date = newsData.publishedAt.toDate();
            document.getElementById('newsPublishedAt').value = date.toISOString().slice(0, 16);
        } else {
            document.getElementById('newsPublishedAt').value = '';
        }

        if (newsData.expiresAt) {
            const date = newsData.expiresAt.toDate();
            document.getElementById('newsExpiresAt').value = date.toISOString().slice(0, 16);
        } else {
            document.getElementById('newsExpiresAt').value = '';
        }

        openModal('newsModal');
    }
}

async function deleteNews(id) {
    if (confirm("هل أنت متأكد من حذف هذا الخبر نهائيًا؟")) {
        try {
            const doc = await db.collection('newsAndAds').doc(id).get();
            const newsData = doc.data();
            
            if (newsData.images && newsData.images.length > 0) {
                for (const imageUrl of newsData.images) {
                    const imageRef = storage.refFromURL(imageUrl);
                    await imageRef.delete().catch(e => console.error("Error deleting image:", e));
                }
            }
            await db.collection('newsAndAds').doc(id).delete();
            alert("تم حذف الخبر بنجاح.");
            fetchAndDisplayNews();
        } catch (error) {
            console.error("Error deleting news:", error);
            alert("فشل حذف الخبر.");
        }
    }
}

async function viewNewsViewers(newsId) {
    try {
        const viewersSnapshot = await db.collection('newsAndAds').doc(newsId).collection('viewers').get();
        let viewerList = 'قائمة المشاهدين:\n';
        let count = 0;

        for (const doc of viewersSnapshot.docs) {
            const viewerData = doc.data();
            const userId = viewerData.userId;
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                viewerList += `${count + 1}. الاسم: ${userData.name || 'غير محدد'} | الإيميل: ${userData.email}\n`;
                count++;
            }
        }

        if (count > 0) {
            alert(viewerList);
        } else {
            alert("لا توجد مشاهدات لهذا الخبر بعد.");
        }
    } catch (error) {
        console.error("Error fetching viewers:", error);
        alert("فشل جلب قائمة المشاهدين.");
    }
}

/* === إدارة المشرفين === */
async function fetchAndDisplayAdmins() {
    try {
        const adminsSnapshot = await db.collection('users').where('role', '==', 'admin').get();
        const adminsList = document.getElementById('admins-list');
        adminsList.innerHTML = '';
        
        if (adminsSnapshot.empty) {
            adminsList.innerHTML = `<p class="empty-state"><i class="fas fa-user-shield"></i> لا يوجد مشرفون حاليًا.</p>`;
            return;
        }

        adminsSnapshot.forEach(doc => {
            const adminData = doc.data();
            const adminCard = document.createElement('div');
            adminCard.className = 'admin-card';
            adminCard.innerHTML = `
                <div class="admin-info">
                    <span class="admin-name">${adminData.name || 'غير محدد'}</span>
                    <span class="admin-email">${adminData.email}</span>
                </div>
                <div class="admin-actions">
                    <button class="delete-btn" onclick="deleteAdmin('${doc.id}', '${adminData.email}')"><i class="fas fa-trash"></i> حذف</button>
                </div>
            `;
            adminsList.appendChild(adminCard);
        });
    } catch (error) {
        console.error("Error fetching admins:", error);
        alert("فشل جلب قائمة المشرفين.");
    }
}

async function addAdmin(event) {
    event.preventDefault();
    const email = document.getElementById('adminEmail').value;
    
    if (!email) {
        alert("الرجاء إدخال البريد الإلكتروني للمشرف.");
        return;
    }

    try {
        const usersRef = db.collection('users');
        const userQuery = await usersRef.where('email', '==', email).get();

        if (userQuery.empty) {
            alert("المستخدم غير موجود. تأكد من أن المستخدم قام بالتسجيل أولاً.");
            return;
        }

        const userId = userQuery.docs[0].id;
        const userData = userQuery.docs[0].data();

        await db.collection('users').doc(userId).update({
            role: 'admin'
        });

        alert(`تمت ترقية المستخدم ${userData.name || email} إلى مشرف بنجاح.`);
        document.getElementById('adminEmail').value = '';
        fetchAndDisplayAdmins();
    } catch (error) {
        console.error("Error adding admin:", error);
        alert("فشل إضافة المشرف: " + error.message);
    }
}

async function deleteAdmin(adminId, adminEmail) {
    if (confirm(`هل أنت متأكد من إزالة صلاحيات المشرف من ${adminEmail}؟`)) {
        try {
            await db.collection('users').doc(adminId).update({
                role: 'user'
            });
            alert("تم إزالة صلاحيات المشرف بنجاح.");
            fetchAndDisplayAdmins();
        } catch (error) {
            console.error("Error deleting admin:", error);
            alert("فشل إزالة صلاحيات المشرف.");
        }
    }
}

/* === إدارة الجداول الدراسية/الامتحانات === */
async function addSchedule(event) {
    event.preventDefault();
    const department = document.getElementById('scheduleDepartment').value;
    const file = document.getElementById('scheduleFile').files[0];
    const textContent = document.getElementById('scheduleText').value;

    if (!department && !file && !textContent) {
        alert("الرجاء إدخال نص أو اختيار قسم وملف واحد على الأقل.");
        return;
    }
    
    try {
        let fileUrl = '';
        let fileName = '';
        if (file) {
            const storageRef = storage.ref(`schedules/${department || 'عام'}/${file.name}`);
            const uploadTask = await storageRef.put(file);
            fileUrl = await uploadTask.ref.getDownloadURL();
            fileName = file.name;
        }
// في دالة حفظ الكتاب
await db.collection('books').add({
    name: fileName || 'محتوى نصي',
    department: document.getElementById('bookDepartment').value || '',
    url: fileUrl,
    textContent: textContent || '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
        await db.collection('schedules').add({
            name: fileName || 'محتوى نصي',
            department: department || 'عام',
            url: fileUrl,
            textContent: textContent || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("تم رفع الجدول/المحتوى بنجاح!");
        closeModal('scheduleModal');
        fetchAndDisplaySchedules();
    } catch (error) {
        console.error("Error uploading schedule/content:", error);
        alert("فشل رفع الجدول/المحتوى: " + error.message);
    }
    await db.collection('schedules').add({
    name: fileName || 'محتوى نصي',
    department: document.getElementById('scheduleDepartment').value || '',
    url: fileUrl,
    textContent: textContent || '',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
}

async function fetchAndDisplaySchedules() {
    try {
        const schedulesSnapshot = await db.collection('schedules').orderBy('department').get();
        const schedulesContainer = document.getElementById('schedules-list');
        schedulesContainer.innerHTML = '';
        
        if (schedulesSnapshot.empty) {
            schedulesContainer.innerHTML = '<p class="empty-state">لا توجد جداول حاليًا.</p>';
            return;
        }

        schedulesSnapshot.forEach(doc => {
            const schedule = doc.data();
            const scheduleCard = document.createElement('div');
            scheduleCard.className = 'file-item';
            
            let contentHTML = `<span>${schedule.name} - ${schedule.department}</span>`;
            if (schedule.textContent) {
                contentHTML += `<p class="file-content-text">${schedule.textContent}</p>`;
            }
            if (schedule.url) {
                contentHTML += `<div class="actions-cell">
                                <a href="${schedule.url}" target="_blank" class="viewers-btn"><i class="fas fa-eye"></i> عرض الملف</a>
                                <button class="delete-hard" onclick="deleteFile('schedules', '${doc.id}', '${schedule.url}')"><i class="fas fa-trash"></i> حذف</button>
                                </div>`;
            } else {
                 contentHTML += `<div class="actions-cell">
                                <button class="delete-hard" onclick="deleteFile('schedules', '${doc.id}', '')"><i class="fas fa-trash"></i> حذف</button>
                                </div>`;
            }

            scheduleCard.innerHTML = contentHTML;
            schedulesContainer.appendChild(scheduleCard);
        });
    } catch (error) {
        console.error("Error fetching schedules:", error);
    }
}

/* === إدارة الكتب والمراجع === */
async function addBook(event) {
    event.preventDefault();
    const department = document.getElementById('bookDepartment').value;
    const file = document.getElementById('bookFile').files[0];
    const textContent = document.getElementById('bookText').value;

    if (!department && !file && !textContent) {
        alert("الرجاء إدخال نص أو اختيار قسم وملف واحد على الأقل.");
        return;
    }

    try {
        let fileUrl = '';
        let fileName = '';
        if (file) {
            const storageRef = storage.ref(`books/${department || 'عام'}/${file.name}`);
            const uploadTask = await storageRef.put(file);
            fileUrl = await uploadTask.ref.getDownloadURL();
            fileName = file.name;
        }

        await db.collection('books').add({
            name: fileName || 'محتوى نصي',
            department: department || 'عام',
            url: fileUrl,
            textContent: textContent || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("تم رفع الكتاب/المحتوى بنجاح!");
        closeModal('booksModal');
        fetchAndDisplayBooks();
    } catch (error) {
        console.error("Error uploading book/content:", error);
        alert("فشل رفع الكتاب/المحتوى: " + error.message);
    }
}

async function fetchAndDisplayBooks() {
    try {
        const booksSnapshot = await db.collection('books').orderBy('department').get();
        const booksContainer = document.getElementById('books-list');
        booksContainer.innerHTML = '';
        
        if (booksSnapshot.empty) {
            booksContainer.innerHTML = '<p class="empty-state">لا توجد كتب حاليًا.</p>';
            return;
        }

        booksSnapshot.forEach(doc => {
            const book = doc.data();
            const bookCard = document.createElement('div');
            bookCard.className = 'file-item';
            
            let contentHTML = `<span>${book.name} - ${book.department}</span>`;
            if (book.textContent) {
                contentHTML += `<p class="file-content-text">${book.textContent}</p>`;
            }
            if (book.url) {
                contentHTML += `<div class="actions-cell">
                                <a href="${book.url}" target="_blank" class="viewers-btn"><i class="fas fa-eye"></i> عرض الملف</a>
                                <button class="delete-hard" onclick="deleteFile('books', '${doc.id}', '${book.url}')"><i class="fas fa-trash"></i> حذف</button>
                                </div>`;
            } else {
                 contentHTML += `<div class="actions-cell">
                                <button class="delete-hard" onclick="deleteFile('books', '${doc.id}', '')"><i class="fas fa-trash"></i> حذف</button>
                                </div>`;
            }
            bookCard.innerHTML = contentHTML;
            booksContainer.appendChild(bookCard);
        });
    } catch (error) {
        console.error("Error fetching books:", error);
    }
}

// وظيفة حذف عامة للملفات (كتب وجداول)
async function deleteFile(collectionName, docId, fileUrl) {
    if (confirm("هل أنت متأكد من حذف هذا المحتوى؟")) {
        try {
            if (fileUrl) {
                await storage.refFromURL(fileUrl).delete();
            }
            await db.collection(collectionName).doc(docId).delete();
            alert(`تم حذف المحتوى بنجاح من ${collectionName}.`);
            if (collectionName === 'schedules') fetchAndDisplaySchedules();
            if (collectionName === 'books') fetchAndDisplayBooks();
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('فشل حذف المحتوى.');
        }
    }
}

/* === معالجات الأحداث (Event Listeners) === */
document.getElementById('addAdminForm').addEventListener('submit', addAdmin);
document.getElementById('searchInput').addEventListener('input', applyFilters);

document.querySelectorAll('.filter-button').forEach(button => {
    button.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-button').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        currentDepartment = e.target.dataset.department;
        applyFilters();
    });

});


document.getElementById('newsSearchInput').addEventListener('input', () => {
    const searchTerm = document.getElementById('newsSearchInput').value.toLowerCase();
    const filteredNews = allNews.filter(news => 
        (news.title && news.title.toLowerCase().includes(searchTerm)) ||
        (news.content && news.content.toLowerCase().includes(searchTerm))
    );
    displayNews(filteredNews);
});

document.getElementById('newsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('newsId').value;
    const title = document.getElementById('newsTitle').value;
    const content = document.getElementById('newsContent').value;
    const publishedAt = document.getElementById('newsPublishedAt').value;
    const expiresAt = document.getElementById('newsExpiresAt').value;
    
    if (!title && !content && filesToUpload.length === 0) {
        alert("الرجاء إدخال عنوان أو محتوى أو رفع صورة واحدة على الأقل.");
        return;
    }
    
    let imageUrls = [];
    if (filesToUpload.length > 0) {
        for (const file of filesToUpload) {
            const storageRef = storage.ref(`news-images/${Date.now()}-${file.name}`);
            const uploadTask = await storageRef.put(file);
            const url = await uploadTask.ref.getDownloadURL();
            imageUrls.push(url);
        }
    }

    if (id) {
        const doc = await db.collection('newsAndAds').doc(id).get();
        const existingImages = doc.data().images || [];
        const imagesToKeep = [];
        document.querySelectorAll('#images-preview img').forEach(img => {
            const url = img.dataset.url;
            if (url) {
                imagesToKeep.push(url);
            }
        });
        imageUrls = [...imagesToKeep, ...imageUrls];
    }
    
    const newsData = {
        title: title || '',
        content: content || '',
        publishedAt: publishedAt ? new Date(publishedAt) : firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        images: imageUrls,
        views: 0
    };

    try {
        if (id) {
            await db.collection('newsAndAds').doc(id).update(newsData);
            alert("تم تعديل الخبر بنجاح.");
        } else {
            await db.collection('newsAndAds').add(newsData);
            alert("تم إضافة الخبر بنجاح.");
        }
        closeModal('newsModal');
        fetchAndDisplayNews();
    } catch (error) {
        console.error("Error saving news:", error);
        alert("فشل حفظ الخبر: " + error.message);
    }
});

document.getElementById('newsImages').addEventListener('change', (event) => {
    const imagesPreviewContainer = document.getElementById('images-preview');
    imagesPreviewContainer.innerHTML = '';
    filesToUpload = Array.from(event.target.files);
    filesToUpload.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewItem = document.createElement('div');
            previewItem.className = 'image-preview-item';
            previewItem.innerHTML = `<img src="${e.target.result}" data-url="${e.target.result}"><button type="button" class="remove-image-btn">&times;</button>`;
            imagesPreviewContainer.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
});

document.getElementById('images-preview').addEventListener('click', (event) => {
    if (event.target.classList.contains('remove-image-btn')) {
        const previewItem = event.target.closest('.image-preview-item');
        const imageSrc = previewItem.querySelector('img').src;
        
        if (imageSrc.startsWith('blob:')) {
            const fileIndex = filesToUpload.findIndex(file => URL.createObjectURL(file) === imageSrc);
            if (fileIndex > -1) {
                filesToUpload.splice(fileIndex, 1);
            }
        }
        previewItem.remove();
    }
});

document.getElementById('scheduleForm').addEventListener('submit', addSchedule);
document.getElementById('booksForm').addEventListener('submit', addBook);

/* === وظائف المراقبة والتهيئة عند التحميل === */
async function fetchDashboardData() {
    try {
        const totalUsersSnapshot = await db.collection('users').get();
        document.getElementById('totalUsersCount').textContent = totalUsersSnapshot.size;

        rtdb.ref('onlineStatus').on('value', (snapshot) => {
            let onlineCount = 0;
            snapshot.forEach(childSnapshot => {
                if (childSnapshot.val().isOnline) {
                    onlineCount++;
                }
            });
            document.getElementById('onlineUsersCount').textContent = onlineCount;
        });

        const blockedUsersSnapshot = await db.collection('blockedEmails').get();
        document.getElementById('blockedUsersCount').textContent = blockedUsersSnapshot.size;
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
    }
}

function animateOnScroll() {
    const cards = document.querySelectorAll('.stats-card, .mobile-card');
    cards.forEach(card => {
        const cardPosition = card.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;
        if (cardPosition < screenPosition) {
            card.style.opacity = 1;
            card.style.transform = 'translateY(0)';
        }
    });
}

window.addEventListener('scroll', animateOnScroll);
setTimeout(animateOnScroll, 100);

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('admin-content').classList.remove('hidden');
});

auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
            document.getElementById('admin-content').classList.remove('hidden');
            fetchDashboardData();
            fetchAndDisplayUsers();
            fetchAndDisplayNews();
        } else {
            alert("غير مصرح لك بالوصول إلى هذه الصفحة.");
            window.location.href = "main.html";
        }
    } else {
        window.location.href = "auth.html";
    }
});