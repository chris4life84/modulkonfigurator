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

// ── Parse configuration data ────────────────────────────────────────
$configData = null;
if (!empty($_POST['configData'])) {
    $configData = json_decode($_POST['configData'], true);
}

// ── Build configuration HTML for emails ─────────────────────────────
function buildConfigHtml($configData, $includePrice = true) {
    if (!$configData) return '';

    $html = "
    <table style='width:100%; border-collapse:collapse; margin:15px 0;'>
        <tr style='background:#6e4720;'>
            <th style='padding:10px 12px; text-align:left; color:#fff; font-size:13px;'>Modul</th>
            <th style='padding:10px 12px; text-align:left; color:#fff; font-size:13px;'>Maße</th>
            <th style='padding:10px 12px; text-align:left; color:#fff; font-size:13px;'>Ausstattung</th>";
    if ($includePrice) {
        $html .= "<th style='padding:10px 12px; text-align:right; color:#fff; font-size:13px;'>Preis</th>";
    }
    $html .= "</tr>";

    $rowIdx = 0;
    foreach ($configData['modules'] as $module) {
        $bgColor = $rowIdx % 2 === 0 ? '#ffffff' : '#f9f7f4';
        $moduleName = htmlspecialchars($module['name'], ENT_QUOTES, 'UTF-8');
        $moduleDims = htmlspecialchars($module['dimensions'], ENT_QUOTES, 'UTF-8');
        $modulePrice = htmlspecialchars($module['price'], ENT_QUOTES, 'UTF-8');
        $optionsText = !empty($module['options'])
            ? htmlspecialchars(implode(', ', $module['options']), ENT_QUOTES, 'UTF-8')
            : '<span style="color:#999;">Standard</span>';

        $html .= "
        <tr style='background:{$bgColor};'>
            <td style='padding:8px 12px; font-size:13px; font-weight:600; color:#333; border-bottom:1px solid #eee;'>{$moduleName}</td>
            <td style='padding:8px 12px; font-size:13px; color:#666; border-bottom:1px solid #eee;'>{$moduleDims}</td>
            <td style='padding:8px 12px; font-size:12px; color:#666; border-bottom:1px solid #eee;'>{$optionsText}</td>";
        if ($includePrice) {
            $html .= "<td style='padding:8px 12px; font-size:13px; font-weight:600; color:#333; text-align:right; border-bottom:1px solid #eee;'>{$modulePrice}</td>";
        }
        $html .= "</tr>";
        $rowIdx++;
    }

    // Total row
    if ($includePrice && !empty($configData['totalPrice'])) {
        $totalPrice = htmlspecialchars($configData['totalPrice'], ENT_QUOTES, 'UTF-8');
        $colSpan = 3;
        $html .= "
        <tr style='background:#f5f0eb;'>
            <td colspan='{$colSpan}' style='padding:12px; font-size:14px; font-weight:700; color:#6e4720; text-align:right; border-top:2px solid #6e4720;'>Gesamtpreis:</td>
            <td style='padding:12px; font-size:16px; font-weight:700; color:#6e4720; text-align:right; border-top:2px solid #6e4720;'>{$totalPrice}</td>
        </tr>";
    }

    $html .= "</table>";

    return $html;
}

function buildConfigSummaryBox($configData) {
    if (!$configData) return '';

    $dims = htmlspecialchars($configData['totalDimensions'] ?? '', ENT_QUOTES, 'UTF-8');
    $count = intval($configData['moduleCount'] ?? 0);
    $template = !empty($configData['templateName']) ? htmlspecialchars($configData['templateName'], ENT_QUOTES, 'UTF-8') : null;

    $html = "
    <table style='width:100%; border-collapse:collapse; margin:15px 0; background:#f9f7f4; border:1px solid #e8e0d8; border-radius:8px;'>
        <tr>
            <td style='padding:12px 16px;'>
                <table style='width:100%; border-collapse:collapse;'>";

    if ($template) {
        $html .= "
                    <tr>
                        <td style='padding:3px 0; font-size:12px; color:#888; width:120px;'>Vorlage:</td>
                        <td style='padding:3px 0; font-size:13px; color:#333; font-weight:600;'>{$template}</td>
                    </tr>";
    }

    $html .= "
                    <tr>
                        <td style='padding:3px 0; font-size:12px; color:#888; width:120px;'>Gesamtmaße:</td>
                        <td style='padding:3px 0; font-size:13px; color:#333; font-weight:600;'>{$dims}</td>
                    </tr>
                    <tr>
                        <td style='padding:3px 0; font-size:12px; color:#888;'>Anzahl Module:</td>
                        <td style='padding:3px 0; font-size:13px; color:#333; font-weight:600;'>{$count}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>";

    return $html;
}

// ── Send emails ──────────────────────────────────────────────────────
try {
    $configSummaryBox = buildConfigSummaryBox($configData);
    $configTable = buildConfigHtml($configData, true);
    $configTableNoPrice = buildConfigHtml($configData, false);

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
    <div style='font-family: Arial, Helvetica, sans-serif; max-width: 640px; margin: 0 auto; color: #333; background:#fff;'>
        <div style='background: #6e4720; padding: 24px 20px; text-align: center;'>
            <h1 style='color: #fff; margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 1px;'>MODUL-GARTEN</h1>
            <p style='color: #d4b896; margin: 6px 0 0; font-size: 12px; letter-spacing: 2px;'>MODULHAUS-KONFIGURATOR</p>
        </div>

        <div style='padding: 30px 24px;'>
            <p style='font-size:15px; margin:0 0 20px;'>Sehr geehrte(r) <strong>{$safeName}</strong>,</p>

            <p style='font-size:14px; line-height:1.6; color:#555;'>
                vielen Dank für Ihre Anfrage über unseren Modulhaus-Konfigurator!
                Nachfolgend finden Sie eine Übersicht Ihrer individuellen Konfiguration.
            </p>

            <h2 style='font-size:16px; color:#6e4720; margin:25px 0 5px; padding-bottom:8px; border-bottom:2px solid #e8e0d8;'>
                Ihre Konfiguration im Überblick
            </h2>

            {$configSummaryBox}
            {$configTable}

            <p style='margin: 25px 0 10px; text-align:center;'>
                <a href='{$safeConfigUrl}' style='display: inline-block; background: #6e4720; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size:14px; letter-spacing:0.5px;'>
                    &#x1f3e0; Konfiguration online ansehen
                </a>
            </p>
            <p style='text-align:center; font-size:11px; color:#999; margin:5px 0 25px;'>
                Über diesen Link können Sie Ihre Konfiguration jederzeit aufrufen.
            </p>

            <div style='background:#f0f7f0; border-left:4px solid #4caf50; padding:14px 16px; margin:20px 0; border-radius:0 6px 6px 0;'>
                <p style='margin:0; font-size:13px; color:#333;'>
                    <strong>Wie geht es weiter?</strong><br>
                    <span style='color:#555;'>Unser Team wird sich innerhalb von 1–2 Werktagen bei Ihnen melden, um Ihre Anfrage zu besprechen und offene Fragen zu klären.</span>
                </p>
            </div>

            <p style='font-size:13px; color:#555; margin:5px 0 0;'>Im Anhang finden Sie Ihre Konfiguration zusätzlich als PDF-Dokument.</p>

            <p style='margin-top: 30px; font-size:14px;'>Mit freundlichen Grüßen,<br><strong style='color:#6e4720;'>Ihr Modul-Garten Team</strong></p>
        </div>

        <div style='background: #f5f5f5; padding: 16px 24px; text-align: center; border-top:1px solid #e5e5e5;'>
            <p style='margin:0; font-size: 11px; color: #999;'>
                Modul-Garten &middot; <a href='https://modul-garten.de' style='color:#6e4720; text-decoration:none;'>modul-garten.de</a>
            </p>
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

    $phoneRow = !empty($phone)
        ? "<tr><td style='padding:8px 12px;font-weight:600;color:#555;width:100px;'>Telefon:</td><td style='padding:8px 12px;'>{$safePhone}</td></tr>"
        : '';
    $messageBlock = !empty($message)
        ? "<div style='margin:15px 0; padding:12px 16px; background:#fffef5; border:1px solid #f0e8d0; border-radius:6px;'>
               <p style='margin:0 0 4px; font-size:11px; color:#999; text-transform:uppercase; letter-spacing:1px;'>Nachricht des Kunden</p>
               <p style='margin:0; font-size:13px; color:#333; line-height:1.5;'>" . nl2br($safeMessage) . "</p>
           </div>"
        : '';

    $totalPriceDisplay = !empty($configData['totalPrice']) ? htmlspecialchars($configData['totalPrice'], ENT_QUOTES, 'UTF-8') : '–';

    $internalBody = "
    <div style='font-family: Arial, Helvetica, sans-serif; max-width: 640px; color: #333;'>
        <div style='background:#6e4720; padding:16px 20px;'>
            <h1 style='margin:0; color:#fff; font-size:18px; font-weight:400;'>Neue Konfigurationsanfrage</h1>
            <p style='margin:4px 0 0; color:#d4b896; font-size:12px;'>" . date('d.m.Y H:i') . " Uhr</p>
        </div>

        <div style='padding:20px 24px;'>
            <h2 style='font-size:14px; color:#6e4720; margin:0 0 10px; text-transform:uppercase; letter-spacing:1px;'>Kontaktdaten</h2>
            <table style='width:100%; border-collapse:collapse; margin-bottom:15px; background:#f9f9f9; border-radius:6px;'>
                <tr><td style='padding:8px 12px;font-weight:600;color:#555;width:100px;'>Name:</td><td style='padding:8px 12px;font-weight:700;'>{$safeName}</td></tr>
                <tr style='background:#fff;'><td style='padding:8px 12px;font-weight:600;color:#555;'>E-Mail:</td><td style='padding:8px 12px;'><a href='mailto:{$safeEmail}' style='color:#6e4720;'>{$safeEmail}</a></td></tr>
                {$phoneRow}
            </table>

            {$messageBlock}

            <h2 style='font-size:14px; color:#6e4720; margin:25px 0 10px; text-transform:uppercase; letter-spacing:1px;'>Konfiguration</h2>

            {$configSummaryBox}
            {$configTable}

            <p style='margin: 20px 0; text-align:center;'>
                <a href='{$safeConfigUrl}' style='display: inline-block; background: #6e4720; color: #fff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size:13px;'>
                    Konfiguration online ansehen
                </a>
            </p>
        </div>

        <div style='background: #f5f5f5; padding: 12px 24px; font-size: 11px; color: #999; text-align: center; border-top:1px solid #e5e5e5;'>
            Automatisch generiert vom Modulhaus-Konfigurator &middot; PDF im Anhang
        </div>
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
