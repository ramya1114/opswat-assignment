
The repository is built for the purpose of a hiring assignment for OPSWAT, 
and holds the script built as per instructions provided.

The script can be used to used to scan a file using the opswat metadefender API.

# Usage instructions:-

1. Using npm
    1. `npm install`
    2. `npm run <YOUR_API_KEY> <YOUR_FILE_PATH>`

2. Without npm
    1. `node install axios form-data crypto fs`
    2. `node upload_file.js <YOUR_API_KEY> <YOUR_FILE_PATH>`

The program fetches scan results using file hashes if present. 
If not, it uploads the file and polls till the scan is completed.