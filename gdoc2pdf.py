# Standard library imports
import argparse
import io
import json
import os
import pickle
from pathlib import Path
import tempfile
from multiprocessing import Pool, cpu_count
from typing import Tuple

# Third-party imports
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

# If modifying these scopes, delete the file token.pickle.
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

# Add after SCOPES definition
GCP_CREDENTIALS_FILE = os.getenv('GCP_CREDENTIALS') # needed if gdoc2pdf_token.pickle doesn't exist

def get_credentials():
    creds = None
    # Store token.pickle in the system's temp directory
    token_path = os.path.join(tempfile.gettempdir(), 'gdoc2pdf_token.pickle')

    # The file token.pickle stores the user's access and refresh tokens
    if os.path.exists(token_path):
        with open(token_path, 'rb') as token:
            creds = pickle.load(token)

    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                GCP_CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open(token_path, 'wb') as token:
            pickle.dump(creds, token)

    return creds

def process_file(file_tuple: Tuple[Path, Path]) -> bool:
    """Process a single .gdoc file and convert it to PDF.
    
    Args:
        file_tuple: Tuple of (input_path, output_path) where both are Path objects
    
    Returns:
        bool: True if conversion was successful, False otherwise
    """
    input_path, output_path = file_tuple
    
    try:
        # Get Google Drive API credentials
        creds = get_credentials()
        service = build('drive', 'v3', credentials=creds)
        
        # Read the .gdoc file to get the Google Drive file ID
        with open(input_path, 'r') as f:
            gdoc_data = json.load(f)
            file_id = gdoc_data.get('doc_id')
        
        if not file_id:
            print(f"Error: No doc_id found in {input_path}")
            return False
            
        # Create PDF export request
        request = service.files().export_media(
            fileId=file_id,
            mimeType='application/pdf'
        )

        # Download the PDF
        pdf_file = io.BytesIO()
        downloader = MediaIoBaseDownload(pdf_file, request)
        done = False

        while not done:
            status, done = downloader.next_chunk()
            print(f"Download {int(status.progress() * 100)}% for {input_path}")

        # Save the PDF
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, 'wb') as f:
            f.write(pdf_file.getvalue())

        print(f"Converted {input_path} to PDF successfully")
        return True

    except Exception as e:
        print(f"Error converting {input_path}: {str(e)}")
        return False

# Update convert_gdoc_to_pdf to use process_file
def convert_gdoc_to_pdf(input_path: Path, output_path: Path):
    if input_path.is_dir():
        # Process directory
        if not output_path.exists():
            output_path.mkdir(parents=True)

        # Collect all files to process
        files_to_process = []
        for input_file in input_path.rglob('*.gdoc'):
            output_file = output_path / input_file.with_suffix('.pdf').name
            files_to_process.append((input_file, output_file))

        # Use multiprocessing
        with Pool(processes=cpu_count()) as pool:
            results = pool.map(process_file, files_to_process)

            # Check results
            if not all(results):
                print("Some files failed to convert")
    else:
        # Process single file
        if not input_path.suffix.lower() == '.gdoc':
            raise ValueError("Input file must be .gdoc")
        return process_file((input_path, output_path))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Convert Google Drive .gdoc files to PDF')
    parser.add_argument('input', help='Input .gdoc file or directory')
    parser.add_argument('output', help='Output PDF file or directory')
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    token_path = os.path.join(tempfile.gettempdir(), 'gdoc2pdf_token.pickle')
    if not os.path.exists(token_path) and not GCP_CREDENTIALS_FILE:
        raise ValueError(f"{token_path} does not exist and GCP_CREDENTIALS environment variable is not set")

    if input_path.is_dir():
        # Process directory
        if not output_path.exists():
            output_path.mkdir(parents=True)

        # Collect all files to process
        files_to_process = []
        for input_file in input_path.rglob('*.gdoc'):
            output_file = output_path / input_file.with_suffix('.pdf').name
            files_to_process.append((input_file, output_file))

        # Use multiprocessing
        with Pool(processes=cpu_count()) as pool:
            results = pool.map(process_file, files_to_process)

            # Check results
            if not all(results):
                print("Some files failed to convert")
    else:
        # Process single file
        if input_path.suffix.lower() != '.gdoc':
            raise ValueError("Input file must be .gdoc")
        process_file((input_path, output_path))
