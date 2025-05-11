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


function resetDisplay(videoData, docElts) {
  
  // docElts contain onomatopoeiaInput, startDisplay,
  // endDisplay, recordOnomatopoeia, buttonVisibility, 
  // inputVisibility
  docElts["onomatopoeiaInput"].value = "";
  docElts["startDisplay"].textContent = "-.--";
  docElts["endDisplay"].textContent = "-.--";

  docElts["buttonVisibility"].style.display = "block";
  docElts["inputVisibility"].style.display = "none";

  let recordMessage = "";

  if (!videoData.length) {
   	recordMessage = "None";
  } else {
    videoData.forEach(elt => {
      const startTime = elt["startTime"];
      const endTime = elt["endTime"];
      const onomatopoeia = elt["onomatopoeia"];
      recordMessage += `-"${onomatopoeia}" from ${startTime} to ${endTime};<br>`;
    });
  }
  docElts["recordOnomatopoeia"].innerHTML = recordMessage;
}

async function saveOnomatopoeia(filteredData, infoDict, spreadsheetId, sheetName, messageDisplay) {
  const name = infoDict["name"];
  const video = infoDict["video"];
  const onomatopoeia = infoDict["onomatopoeia"];
  const startTime = infoDict["startTime"];
  const endTime = infoDict["endTime"];
  const answeredTimestamp = infoDict["answeredTimestamp"];
  
  if (onomatopoeia === "") {
    messageDisplay.textContent = "Please enter your onomatopoeia.";
    messageDisplay.style.color = "red";
    return;
  }
  if (startTime === "-.--") {
    messageDisplay.textContent = "Please record the start of the onomatopoeia.";
    messageDisplay.style.color = "red";
    return;
  }
  if (endTime === "-.--") {
    messageDisplay.textContent = "Please record the end of the onomatopoeia.";
    messageDisplay.style.color = "red";
    return;
  }
  if (!name || !video || !answeredTimestamp) {
    messageDisplay.textContent = "Something went wrong when saving the data";
    messageDisplay.style.color = "red";
    return;
  }

  // store the data in the sheet online
  const newData = [name, video, onomatopoeia, startTime, endTime, answeredTimestamp];
  const appendResult = await appendSheetData(spreadsheetId, sheetName, newData);
  if (!appendResult) {
    messageDisplay.textContent = "Failed to save data to the sheet.";
    messageDisplay.style.color = "red";
    return;
  }
  // Log the result of the append operation
  // console.log('Append Result:', appendResult);

  // update the local filteredData
  filteredData.push(infoDict);

  // Display a success message
  messageDisplay.textContent = "Onomatopoeia and start-end saved!";
  messageDisplay.style.color = "green";
}

function obtainDate(){
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const hours = String(today.getHours()).padStart(2, '0');
  const minutes = String(today.getMinutes()).padStart(2, '0');
  const seconds = String(today.getSeconds()).padStart(2, '0');
  return `${year}:${month}:${day}:${hours}:${minutes}:${seconds}`;
}

function padStart(number, length) {
  return String(number).padStart(length, '0');
}