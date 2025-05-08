const userName = localStorage.getItem("userName");
const filteredData = JSON.parse(localStorage.getItem("filteredData"));

/*
const filteredData = [
{
  "name": "test",
  "video": "1.mp4",
  "onomatopoeia": "oy",
  "startTime": "0.23",
  "endTime": "3.45",
  "answeredTimestamp": "12345"
},// [object Object] 
{
  "name": "test",
  "video": "3.mp4",
  "onomatopoeia": "dasf",
  "startTime": "0.45",
  "endTime": "4.356",
  "answeredTimestamp": "35634574"
}]
const userName = "test"
*/

if(!userName){
  alert("Warning, no user name");
  window.location.href = "index.html";
}
const nameDisplay = document.getElementById("nameDisplay");
nameDisplay.textContent = "Your name: " + userName;


const videoTitle = document.getElementById("videoTitle");
const videoPlayer = document.getElementById("myVideo");
const videoSelect = document.getElementById('videoSelect');
const getStart = document.getElementById("getStart");
const startDisplay = document.getElementById("startDisplay");
const getEnd = document.getElementById("getEnd");
const endDisplay = document.getElementById("endDisplay");
const onomatopoeiaInput = document.getElementById("onomatopoeiaInput");
const saveOnomatopoeiaButton = document.getElementById("saveOnomatopoeia");
const messageDisplay = document.getElementById("message");
const recordOnomatopoeia = document.getElementById("recordOnomatopoeia");

let record = []; // Array to store recorded Onomatopoeia

function resetDisplay(record) {
  onomatopoeiaInput.value = "";
  startDisplay.textContent = "-.--";
  endDisplay.textContent = "-.--";

  if (record == []) {
   	recordMessage = "None";
  } else {
    recordMessage = "";
    record.forEach(elt => {
      recordMessage += "\n" + elt ;
    });
  }
  recordOnomatopoeia.textContent = recordMessage;
}

/*
const csvUrl = './data.csv';

// get the csv data and transform it into a list of dictionnaries (one dict per row)
fetchCSV(csvUrl)
  .then(data => {
  if (data) {
    console.log('CSV Data:', data);
  }
});
*/

// 




// Populate the dropdown dynamically
fetchFilesInFolder().then(videos => {
  videos.forEach(video => {
    const option = document.createElement("option");
    option.value = `videos/${video}`;
    option.textContent = video; // Display the video filename
    videoSelect.appendChild(option);
  });
}).catch(error => {
  console.error("Error populating dropdown:", error);
});

// Update video source when dropdown changes
videoSelect.addEventListener("change", () => {
  videoPlayer.src = videoSelect.value;
  videoPlayer.load();
  videoTitle.textContent = `Video: ${videoSelect.value}`;
  resetDisplay(record)
});


// Function to get and display the current timestamp
getStart.addEventListener("click", () => {
  const currentTime = videoPlayer.currentTime;
  startDisplay.textContent = `${currentTime.toFixed(2)}`;
});

getEnd.addEventListener("click", () => {
  const currentTime = videoPlayer.currentTime;
  endDisplay.textContent = `${currentTime.toFixed(2)}`;
});



// when save button is clicked
saveOnomatopoeiaButton.addEventListener("click", () => {
  const onomatopoeia = onomatopoeiaInput.value.trim();
  const startTime = startDisplay.textContent;
  const endTime = endDisplay.textContent;

  if (onomatopoeia === "") {
    messageDisplay.textContent = "Please enter your onomatopoeia.";
    messageDisplay.style.color = "red";
    return;
  }

  if (name === "") {
    messageDisplay.textContent = "Please enter your name.";
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

  // Create an object to store the timestamp and opinion
  const opinionData = {
    startTime: startTime,
    endTime: endTime,
    onomatopoeia: onomatopoeia,
  };

  // Display a success message
  messageDisplay.textContent = "Onomatopoeia and start-end saved!";
  messageDisplay.style.color = "green";

  record.push(onomatopoeia + " from " + startTime + " to " +  endTime);

  resetDisplay(record); // Clear display after saving
  
});
