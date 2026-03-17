<?php
// DEBUG: Show all errors (remove after testing!)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display raw errors
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    throw new \ErrorException($errstr, 0, $errno, $errfile, $errline);
});

/**
 * Modulhaus-Konfigurator — Contact Form API Endpoint
 *
 * Receives form data + PDF attachment, sends two emails:
 * 1. Confirmation to customer (with PDF + config link)
 * 2. Notification to internal team (with PDF + contact details)
 *
 * Requires PHPMailer: place PHPMailer source in ./vendor/phpmailer/
 * or install via Composer.
 */

header('Content-Type: application/json; charset=utf-8');

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// ── Load config ──────────────────────────────────────────────────────
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server configuration missing']);
    exit;
}
$config = require $configFile;

// ── Load PHPMailer ───────────────────────────────────────────────────
// Try Composer autoload first, then manual include
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    require __DIR__ . '/vendor/autoload.php';
} elseif (file_exists(__DIR__ . '/vendor/phpmailer/PHPMailer.php')) {
    require __DIR__ . '/vendor/phpmailer/PHPMailer.php';
    require __DIR__ . '/vendor/phpmailer/SMTP.php';
    require __DIR__ . '/vendor/phpmailer/Exception.php';
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Mail library not found']);
    exit;
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// ── Honeypot check ───────────────────────────────────────────────────
if (!empty($_POST['_hp'])) {
    // Bot detected — silently return success
    echo json_encode(['success' => true]);
    exit;
}

// ── Rate limiting — TEMPORARILY DISABLED for debugging ───────────────
// Will be re-enabled after email sending is confirmed working.

// ── Input validation ─────────────────────────────────────────────────
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$message = trim($_POST['message'] ?? '');
$configUrl = trim($_POST['configUrl'] ?? '');

if (empty($name) || strlen($name) > 200) {
    echo json_encode(['success' => false, 'message' => 'Bitte geben Sie Ihren Namen an.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 200) {
    echo json_encode(['success' => false, 'message' => 'Bitte geben Sie eine gültige E-Mail-Adresse an.']);
    exit;
}

if (strlen($phone) > 50) {
    echo json_encode(['success' => false, 'message' => 'Telefonnummer zu lang.']);
    exit;
}

if (strlen($message) > 5000) {
    echo json_encode(['success' => false, 'message' => 'Nachricht zu lang (max. 5000 Zeichen).']);
    exit;
}

// ── PDF upload validation ────────────────────────────────────────────
$pdfPath = null;
if (isset($_FILES['pdf']) && $_FILES['pdf']['error'] === UPLOAD_ERR_OK) {
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($_FILES['pdf']['size'] > $maxSize) {
        echo json_encode(['success' => false, 'message' => 'PDF zu groß (max. 5 MB).']);
        exit;
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $_FILES['pdf']['tmp_name']);
    finfo_close($finfo);

    if ($mimeType !== 'application/pdf') {
        echo json_encode(['success' => false, 'message' => 'Ungültiges Dateiformat.']);
        exit;
    }

    $pdfPath = $_FILES['pdf']['tmp_name'];
}

// ── Sanitize for email body ──────────────────────────────────────────
$safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
$safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$safePhone = htmlspecialchars($phone, ENT_QUOTES, 'UTF-8');
$safeMessage = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
$safeConfigUrl = htmlspecialchars($configUrl, ENT_QUOTES, 'UTF-8');

// ── Send emails ──────────────────────────────────────────────────────
try {
    // ── Email 1: Confirmation to customer ────────────────────────────
    $customerMail = new PHPMailer(true);
    $customerMail->isSMTP();
    $customerMail->Host = $config['smtp_host'];
    $customerMail->Port = $config['smtp_port'];
    $customerMail->SMTPAuth = true;
    $customerMail->Username = $config['smtp_user'];
    $customerMail->Password = $config['smtp_pass'];
    $customerMail->SMTPSecure = $config['smtp_encryption'] ?? 'ssl';
    $customerMail->CharSet = 'UTF-8';

    $customerMail->setFrom($config['from_email'], $config['from_name']);
    $customerMail->addAddress($email, $name);
    $customerMail->Subject = 'Ihre Modulhaus-Konfiguration | Modul-Garten';
    $customerMail->isHTML(true);

    $customerBody = "
    <div style='font-family: Arial, Helvetica, sans-serif; max-width: 600px; margin: 0 auto; color: #333;'>
        <div style='background: #6e4720; padding: 20px; text-align: center;'>
            <h1 style='color: #fff; margin: 0; font-size: 22px;'>Modul-Garten</h1>
        </div>
        <div style='padding: 30px 20px;'>
            <p>Sehr geehrte(r) <strong>{$safeName}</strong>,</p>
            <p>vielen Dank für Ihre Anfrage über unseren Modulhaus-Konfigurator!</p>
            <p>Ihre Konfiguration können Sie jederzeit unter folgendem Link einsehen:</p>
            <p style='margin: 20px 0;'>
                <a href='{$safeConfigUrl}' style='display: inline-block; background: #6e4720; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;'>
                    Konfiguration ansehen
                </a>
            </p>
            <p>Im Anhang finden Sie Ihre Konfiguration zusätzlich als PDF.</p>
            <p>Wir werden uns schnellstmöglich bei Ihnen melden, um Ihre Anfrage zu besprechen.</p>
            <p style='margin-top: 30px;'>Mit freundlichen Grüßen,<br><strong>Ihr Modul-Garten Team</strong></p>
        </div>
        <div style='background: #f5f5f5; padding: 15px 20px; font-size: 12px; color: #888; text-align: center;'>
            Modul-Garten &middot; modul-garten.de
        </div>
    </div>";
    $customerMail->Body = $customerBody;
    $customerMail->AltBody = "Sehr geehrte(r) {$name},\n\nvielen Dank für Ihre Anfrage!\n\nIhre Konfiguration: {$configUrl}\n\nWir melden uns schnellstmöglich.\n\nMit freundlichen Grüßen,\nIhr Modul-Garten Team";

    if ($pdfPath) {
        $customerMail->addAttachment($pdfPath, 'Modulhaus-Konfiguration.pdf');
    }

    $customerMail->send();

    // ── Email 2: Internal notification ───────────────────────────────
    $internalMail = new PHPMailer(true);
    $internalMail->isSMTP();
    $internalMail->Host = $config['smtp_host'];
    $internalMail->Port = $config['smtp_port'];
    $internalMail->SMTPAuth = true;
    $internalMail->Username = $config['smtp_user'];
    $internalMail->Password = $config['smtp_pass'];
    $internalMail->SMTPSecure = $config['smtp_encryption'] ?? 'ssl';
    $internalMail->CharSet = 'UTF-8';

    $internalMail->setFrom($config['from_email'], 'Konfigurator');
    $internalMail->addAddress($config['internal_email']);
    $internalMail->addReplyTo($email, $name);
    $internalMail->Subject = "Neue Anfrage von {$name} | Modulhaus-Konfigurator";
    $internalMail->isHTML(true);

    $phoneRow = !empty($phone) ? "<tr><td style='padding:6px 12px;font-weight:bold;'>Telefon:</td><td style='padding:6px 12px;'>{$safePhone}</td></tr>" : '';
    $messageRow = !empty($message) ? "<tr><td style='padding:6px 12px;font-weight:bold;vertical-align:top;'>Nachricht:</td><td style='padding:6px 12px;'>" . nl2br($safeMessage) . "</td></tr>" : '';

    $internalBody = "
    <div style='font-family: Arial, Helvetica, sans-serif; max-width: 600px; color: #333;'>
        <h2 style='color: #6e4720; border-bottom: 2px solid #6e4720; padding-bottom: 10px;'>
            Neue Konfigurationsanfrage
        </h2>
        <table style='width:100%; border-collapse:collapse; margin: 20px 0;'>
            <tr style='background:#f9f9f9;'><td style='padding:6px 12px;font-weight:bold;'>Name:</td><td style='padding:6px 12px;'>{$safeName}</td></tr>
            <tr><td style='padding:6px 12px;font-weight:bold;'>E-Mail:</td><td style='padding:6px 12px;'><a href='mailto:{$safeEmail}'>{$safeEmail}</a></td></tr>
            {$phoneRow}
            {$messageRow}
        </table>
        <p style='margin: 20px 0;'>
            <a href='{$safeConfigUrl}' style='display: inline-block; background: #6e4720; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 6px;'>
                Konfiguration ansehen
            </a>
        </p>
        <p style='font-size: 12px; color: #888;'>PDF ist als Anhang beigefügt.</p>
    </div>";
    $internalMail->Body = $internalBody;
    $internalMail->AltBody = "Neue Anfrage\n\nName: {$name}\nE-Mail: {$email}\nTelefon: {$phone}\nNachricht: {$message}\n\nKonfiguration: {$configUrl}";

    if ($pdfPath) {
        $internalMail->addAttachment($pdfPath, 'Modulhaus-Konfiguration.pdf');
    }

    $internalMail->send();

    echo json_encode(['success' => true]);

} catch (\Throwable $e) {
    error_log("Modulhaus contact form error: " . $e->getMessage());
    http_response_code(500);
    // DEBUG: temporär detaillierte Fehlermeldung ausgeben
    echo json_encode([
        'success' => false,
        'message' => 'Fehler: ' . $e->getMessage(),
        'file' => basename($e->getFile()) . ':' . $e->getLine(),
        'trace' => array_slice(array_map(fn($t) => basename($t['file'] ?? '') . ':' . ($t['line'] ?? ''), $e->getTrace()), 0, 5)
    ]);
}
