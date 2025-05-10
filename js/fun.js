// function to fetch the list of video files
async function fetchFilesInFolder() {
  try {
    const response = await fetch('/.netlify/functions/fetch-files');
    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error:", error.message);
    return [];
  }
}


function parseCSV(data) {
  const headers = data[0];
  return data.slice(1).map(line => {
    return headers.reduce((obj, header, index) => {
      obj[header] = line[index];
      return obj;
    }, {});
  });
}