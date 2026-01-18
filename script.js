// تهيئة Firebase في مكان واحد
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

// ----------------------------------------------------------------------------------
// هذا الجزء خاص بمنطق التحكم في صلاحيات المدير وتسجيل الدخول والخروج
// ----------------------------------------------------------------------------------
const loginLink = document.querySelector('.login .log');
const logoutBtn = document.querySelector('.logout-btn');
const adminLink = document.getElementById('adminLink');

auth.onAuthStateChanged(user => {
    if (user) {
        // المستخدم مسجل الدخول
        if (loginLink) loginLink.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';

        // التحقق من صلاحيات المدير
        if (adminLink) {
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists && doc.data().role === 'admin') {
                    adminLink.style.display = 'block';
                } else {
                    adminLink.style.display = 'none';
                }
            }).catch(error => {
                console.error("Error getting user role:", error);
                adminLink.style.display = 'none';
            });
        }
    } else {
        // المستخدم غير مسجل الدخول
        if (loginLink) loginLink.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
});

// دالة تسجيل الخروج
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = "auth.html";
        } catch (error) {
            console.error("Logout error:", error);
        }
    });
}

// ----------------------------------------------------------------------------------
// هذا الجزء خاص بالوظائف العامة للصفحة الرئيسية (القوائم، السلايدر، إلخ)
// ----------------------------------------------------------------------------------

// القوائم المنسدلة
document.querySelectorAll('.dropdown-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // منع الانتقال للصفحة عند الضغط على الزر
        e.preventDefault(); 
        const menu = btn.nextElementSibling;
        if (menu && menu.classList.contains('dropdown-menu')) {
            menu.classList.toggle('show');
            document.querySelectorAll('.dropdown-menu').forEach(otherMenu => {
                if(otherMenu !== menu) otherMenu.classList.remove('show');
            });
        }
    });
});

// إغلاق القوائم عند الضغط خارجها
document.addEventListener('click', function(e){
    const isClickInside = e.target.closest('.dropdown');
    if(!isClickInside){
        document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('show'));
    }
});


// قائمة الهامبرجر
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
const mainContent = document.getElementById("main-content");
if (hamburger) {
    hamburger.addEventListener("click", () => {
        navLinks.classList.toggle("active");
        hamburger.classList.toggle("active");
        if (mainContent) {
            mainContent.classList.toggle("blur");
        }
    });
}

// السلايدر
const slides = document.querySelectorAll('.slide');
const nextBtn = document.querySelector('.next');
const prevBtn = document.querySelector('.prev');
const progress = document.querySelector('.progress');
const dotsContainer = document.querySelector('.dots-container');
let currentSlide = 0;
let slideInterval;
const slideDuration = 6000;

if (slides.length > 0) {
    // إنشاء النقاط
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
    });

    const dots = document.querySelectorAll('.dot');
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if(i === index) slide.classList.add('active');
        });
        dots.forEach((dot, i) => {
            dot.classList.remove('active');
            if(i === index) dot.classList.add('active');
        });
        progress.style.transition = 'none';
        progress.style.width = '0';
        setTimeout(()=> {
            progress.style.transition = `width ${slideDuration}ms linear`;
            progress.style.width = '100%';
        }, 50);
    }
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }
    function startSlideshow() {
        slideInterval = setInterval(nextSlide, slideDuration);
    }
    nextBtn.addEventListener('click', () => { nextSlide(); clearInterval(slideInterval); startSlideshow(); });
    prevBtn.addEventListener('click', () => { 
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(currentSlide);
        clearInterval(slideInterval); 
        startSlideshow(); 
    });
    
    document.querySelector('.slideshow-container').addEventListener('mouseenter', () => clearInterval(slideInterval));
    document.querySelector('.slideshow-container').addEventListener('mouseleave', () => startSlideshow());
    
    let touchStartX = 0;
    const swipeThreshold = 50;
    document.querySelector('.slideshow-container').addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].clientX;
        clearInterval(slideInterval);
    }, { passive: true });
    
    document.querySelector('.slideshow-container').addEventListener('touchend', e => {
        const touchEndX = e.changedTouches[0].clientX;
        if (touchStartX - touchEndX > swipeThreshold) {
            nextSlide();
        } else if (touchEndX - touchStartX > swipeThreshold) {
            currentSlide = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(currentSlide);
        }
        startSlideshow();
    }, { passive: true });

    showSlide(currentSlide);
    startSlideshow();
}

// نبذه عننا
const toggleBtn = document.getElementById('toggle-btn');
const aboutText = document.getElementById('about-text');
if (toggleBtn && aboutText) {
    toggleBtn.addEventListener('click', () => {
        aboutText.classList.toggle('expanded');
        if(aboutText.classList.contains('expanded')) {
            toggleBtn.textContent = 'أقل';
        } else {
            toggleBtn.textContent = 'المزيد';
        }
    });
}