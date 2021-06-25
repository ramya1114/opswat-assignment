var axios = require("axios");
const FormData = require('form-data');
const crypto = require('crypto');
const fs = require('fs');

const pollSleepTimeMs = 5000;

const BASE_URL = "https://api.metadefender.com/v4/";
const HASH_ENDPOINT = BASE_URL + "/hash/";
const FILE_ENDPOINT = BASE_URL + "/file/";

const computeHash = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}


/*
  Returns the body of a get request given the URL input
 */
const fetchScanResult = async (url) => {
  const headers = {
    "apikey": apiKey
  }
  try{
    const response = await axios.get(url, {headers});
    return await response.data;

  } catch(error) {
    return {error};
  }
}

/*
  Returns the response of a get request fetching scan result by data id 
 */
const fetchByDataID = async (dataID) => {
  console.log("Fetching by data ID");
  return await fetchScanResult(`${FILE_ENDPOINT}${dataID}`);
}

/*
  Returns the response of a get request fetching scan result by hash
 */
const fetchByHash = async (hash) => {
  console.log("Fetching by hash");
  return await fetchScanResult(`${HASH_ENDPOINT}${hash}`);
}

/*
  Util function to sleep
 */
const sleep = (timeMillis) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMillis);
  });
}   

/*
  Returns the response of a POST request uploading a file to the scanner API
 */
const uploadFile = async (filePath, fileName) => {
  console.log("Uploading file");
  const formData = new FormData();
  formData.append(fileName, fs.createReadStream(filePath));
  var headers = formData.getHeaders();
  headers["apikey"] = apiKey;
  const response =  await axios.post(FILE_ENDPOINT, formData, {
      headers: headers,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
  });
  return await response.data;
}

const displayOutput = async (response) => {
  response = await response;
  console.log(`filename : ${response.file_info.display_name}`);
  console.log(`overall_status : ${response.scan_results.scan_all_result_a}`)
  console.log(`scan_result: ${response.scan_results.scan_all_result_a}`);
  console.log(`def_time: ${response.scan_results.start_time}`);
}

/*
  Polls every 5 seconds till scanning has been completed
*/
const poll = async (fetchStrategy) => {
  while(true){
    const response = await fetchStrategy();
    if(response.process_info && response.process_info.result == 'Allowed' ||
        response.scan_results.scan_all_result_a && response.scan_results.scan_all_result_a != 'In queue'
                                                && response.scan_results.scan_all_result_a != 'In Progress') {
      return response;
    } else {
      console.log("File is being processed...sleeping");
      await sleep(pollSleepTimeMs);
    }
  }
}

/*
    Tries to fetch by hash, 
    if file is not present in the opswat API's cache, 
    uploads file and uses data id to fetch scan result
*/
const main = async () => {

  const fileName = filePath.slice(filePath.lastIndexOf('/') + 1);
  const hash = computeHash(filePath);
  const hashCheckResponse = fetchByHash(hash);
  if(await notUploadedResponse(hashCheckResponse)) {
    console.log("Hash is not present..uploading");
    const dataID = (await uploadFile(filePath, fileName)).data_id;
    fetchStrategy = () => fetchByDataID(dataID);
  } else {
    fetchStrategy = () => fetchByHash(hash);
  }
  const response = await poll(fetchStrategy);
  displayOutput(response);
}

const notUploadedResponse = async (response) => {
  var body = await response;
  return body.error && body.error.response && body.error.response.status == 404;
}

var inputs = process.argv.slice(2);
const apiKey = inputs[0];
const filePath = inputs[1];

main();