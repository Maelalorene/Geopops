ddocument.getElementById('forgotPasswordForm').addEventListener('submit', function(event) {
    const email = document.getElementById('email').value;
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = '';

    if (!email) {
        errorDiv.textContent = 'Veuillez entrer un email.';
        event.preventDefault();
    }
});