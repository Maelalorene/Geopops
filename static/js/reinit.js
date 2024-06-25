document.getElementById('resetPasswordForm').addEventListener('submit', function(event) {
    const newPassword = document.getElementById('new_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    if (!newPassword || !confirmPassword) {
        alert('Veuillez entrer et confirmer votre nouveau mot de passe.');
        event.preventDefault();
    } else if (newPassword !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas.');
        event.preventDefault();
    }
});