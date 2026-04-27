<?php

/**
 * Google Indexing API - Simple PHP Script (Library-free)
 */

$jsonKeyFile = 'service_account.json';
$urls = [
    'https://sigappa.poltekparmakassar.ac.id/',
    'https://sigappa.poltekparmakassar.ac.id/beranda',
    'https://sigappa.poltekparmakassar.ac.id/panduan',
    'https://sigappa.poltekparmakassar.ac.id/testimoni',
];

if (!file_exists($jsonKeyFile)) {
    die("❌ Error: $jsonKeyFile not found.\n");
}

$config = json_decode(file_get_contents($jsonKeyFile), true);
$privateKey = $config['private_key'];
$clientEmail = $config['client_email'];

echo "🚀 Generating Access Token...\n";

// 1. Generate JWT
$header = base64UrlEncode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
$now = time();
$payload = base64UrlEncode(json_encode([
    'iss' => $clientEmail,
    'scope' => 'https://www.googleapis.com/auth/indexing',
    'aud' => 'https://oauth2.googleapis.com/token',
    'exp' => $now + 3600,
    'iat' => $now
]));

$signatureInput = $header . "." . $payload;
openssl_sign($signatureInput, $signature, $privateKey, 'SHA256');
$jwt = $signatureInput . "." . base64UrlEncode($signature);

// 2. Exchange JWT for Access Token
$ch = curl_init('https://oauth2.googleapis.com/token');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    'assertion' => $jwt
]));

$response = curl_exec($ch);
$data = json_decode($response, true);

if (!isset($data['access_token'])) {
    die("❌ Failed to get access token: " . $response . "\n");
}

$accessToken = $data['access_token'];
echo "✅ Access Token obtained.\n\n";

// 3. Publish URLs
foreach ($urls as $url) {
    echo "📤 Indexing: $url\n";

    $ch = curl_init('https://indexing.googleapis.com/v3/urlNotifications:publish');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $accessToken
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'url' => $url,
        'type' => 'URL_UPDATED'
    ]));

    $result = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($status === 200) {
        echo "   ✅ Success!\n";
    } else {
        echo "   ❌ Failed ($status): " . $result . "\n";
    }
    curl_close($ch);
}

function base64UrlEncode($data)
{
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
}
