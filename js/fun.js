// function to fetch the list of video files
async function fetchFilesInFolder() {
  const owner = "VictorS-67"; // GitHub username
  const repo = "movement-to-onomatopoeia"; // Repository name
  const folder = "videos"; // Folder path

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${folder}`;        

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${response.statusText}`);
    }

    const files = await response.json();

    // Filter and return the files as an array of filenames
    const fileList = files
    .filter(file => file.type === "file")
    .map(file => file.name); // Extract only the file names

    return fileList; // Return the list of files
  } catch (error) {
    console.error("Error:", error.message);
    return []; // Return an empty array in case of error
  }
};

async function fetchCSV(url) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    //console.log(response)
    //const csvbuffer = response.arrayBuffer();
    const csvText = await response.text();
    console.log(csvText)
    //let decoder = new TextDecoder("iso-8859-1");
    //let csvText = decoder.decode(csvbuffer);

    return parseCSV(csvText);
  } catch (error) {
    console.error("Failed to fetch or parse CSV:", error);
    return null;
  }
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index];
      return obj;
    }, {});
  });
}
