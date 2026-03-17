<?php
/**
 * SMTP Configuration for Modulhaus-Konfigurator Contact Form
 *
 * Copy this file to config.php and fill in your SMTP credentials.
 * IMPORTANT: config.php must NOT be committed to version control!
 */
return [
    'smtp_host' => 'w0148876.kasserver.com',
    'smtp_port' => 465,
    'smtp_user' => 'info@modul-garten.de',
    'smtp_pass' => 'YOUR_EMAIL_PASSWORD_HERE',
    'smtp_encryption' => 'ssl',
    'from_email' => 'info@modul-garten.de',
    'from_name' => 'Modul-Garten',
    'internal_email' => 'info@modul-garten.de',
];
