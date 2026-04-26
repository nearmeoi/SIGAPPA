import google.auth
from google.oauth2 import service_account
from googleapiclient.discovery import build
import json

# ==========================================================
# KONFIGURASI
# 1. Pastikan Anda punya file 'service_account.json' dari Google Cloud
# 2. Masukkan URL yang ingin di-index ke dalam list 'urls'
# ==========================================================

JSON_KEY_FILE = 'service_account.json'
URLS_TO_INDEX = [
    'https://sigappa.poltekparmakassar.ac.id/',
    'https://sigappa.poltekparmakassar.ac.id/beranda',
    'https://sigappa.poltekparmakassar.ac.id/panduan',
    'https://sigappa.poltekparmakassar.ac.id/testimoni',
    'https://sigappa.poltekparmakassar.ac.id/developer-crew'
]

def fast_index():
    try:
        # Load credentials
        scoped_credentials = service_account.Credentials.from_service_account_file(
            JSON_KEY_FILE,
            scopes=['https://www.googleapis.com/auth/indexing']
        )

        # Build the service
        indexing_service = build('indexing', 'v3', credentials=scoped_credentials)

        for url in URLS_TO_INDEX:
            body = {
                'url': url,
                'type': 'URL_UPDATED'
            }
            
            # Execute request
            response = indexing_service.urlNotifications().publish(body=body).execute()
            print(f"✅ Success indexing: {url}")
            print(f"Response: {response}\n")

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        print("\nPASTIKAN:")
        print("1. File 'service_account.json' sudah ada di folder ini.")
        print("2. Email service account sudah didaftarkan sebagai OWNER di Google Search Console.")

if __name__ == "__main__":
    fast_index()
