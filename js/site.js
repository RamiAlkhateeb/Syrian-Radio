document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const themeBtn = document.getElementById('theme-toggle');
    const themeIcon = themeBtn ? themeBtn.querySelector('i') : null;

    function updateThemeState(theme) {
        if (!body) return;
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            if (themeIcon) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
        } else {
            body.classList.remove('dark-mode');
            if (themeIcon) {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
        }
    }

    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark' || storedTheme === 'light') {
        updateThemeState(storedTheme);
    } else if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        updateThemeState('dark');
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const isDark = body.classList.toggle('dark-mode');
            updateThemeState(isDark ? 'dark' : 'light');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
});