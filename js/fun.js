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


function resetDisplay(filteredData, onomatopoeiaInput, startDisplay, endDisplay, recordOnomatopoeia) {
  onomatopoeiaInput.value = "";
  startDisplay.textContent = "-.--";
  endDisplay.textContent = "-.--";

  let recordMessage = "";

  if (!filteredData.length) {
   	recordMessage = "None";
  } else {
    filteredData.forEach(elt => {
      const startTime = elt["startTime"];
      const endTime = elt["endTime"];
      const onomatopoeia = elt["onomatopoeia"];
      recordMessage += `Onomatopoeia: ${onomatopoeia}, from ${startTime} to ${endTime} <br>`;
    });
  }
  recordOnomatopoeia.innerHTML = recordMessage;
}

function saveOnomatopoeia(onomatopoeia, startTime, endTime, filteredData) {
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

  // store the data in the sheet online
  

  // update the local filteredData


  // Display a success message
  messageDisplay.textContent = "Onomatopoeia and start-end saved!";
  messageDisplay.style.color = "green";

  resetDisplay(filteredData); // Clear display after saving

}