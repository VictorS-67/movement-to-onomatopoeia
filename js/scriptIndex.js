async function fetchLogData(){
  const apiKey = 'AIzaSyBu4GTqT3oi9yHk5V7uo2zkJRNBUnp6ANo';
  const spreadsheetId = '1wfTLMxPaXse6MRJp1q3ls5AX3oV2lc5ZDn8qNOYfdLA';
  const sheetName = 'Sheet1';
  
  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}?key=${apiKey}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let data = await response.json();

    return data.values;

  } catch (error) {
    console.error("Failed to fetch or parse log info:", error);
    return null;
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


// ----------------------

const testButton = document.getElementById("enterName");

testButton.addEventListener("click", () => {
  fetchLogData().then(data => {
  console.log(parseCSV(data));
});
                           
