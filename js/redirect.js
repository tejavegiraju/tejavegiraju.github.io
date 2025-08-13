function redirectTo(page) {
    // Store the current page in session storage
    window.sessionStorage.setItem('redirectedFrom', page);
    // Redirect to index.html
    window.location.href = 'index.html';
}