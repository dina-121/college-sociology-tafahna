// التحقق من حالة تسجيل الدخول في كل صفحة
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        // إذا لم يكن المستخدم مسجلاً، توجيه إلى صفحة التسجيل
        window.location.href = 'auth.html';
    } else {
        // تحديث حالة الاتصال في Realtime Database
        const userStatusRef = firebase.database().ref('onlineStatus/' + user.uid);
        
        // تعيين المستخدم كمتصل
        userStatusRef.set({
            isOnline: true,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
        
        // عند إغلاق الصفحة، تعيين المستخدم كغير متصل
        window.addEventListener('beforeunload', function() {
            userStatusRef.set({
                isOnline: false,
                lastSeen: firebase.database.ServerValue.TIMESTAMP
            });
        });
    }
});

// auth-check.js
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من حالة تسجيل الدخول في كل صفحة
    auth.onAuthStateChanged((user) => {
        if (!user) {
            // إذا لم يكن المستخدم مسجلاً، توجيه إلى صفحة التسجيل
            window.location.href = 'auth.html';
        }
    });
});