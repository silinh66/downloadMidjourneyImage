import fs from "fs";
import Axios from "axios";

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

const delayRequest = 120 * 1000;

const delayLoop = 300 * 1000;

const fileName = "dataHot90k_3.txt";
// const fileName = "dataHot90k_1.txt"

function readFilesName(folder) {
  return new Promise(function (resolve, reject) {
    fs.readdir(folder, function (err, filenames) {
      if (err) reject(err);
      else resolve(filenames);
    });
  });
}

async function downloadImage(url, filepath) {
  try {
    const response = await Axios({
      url,
      method: "GET",
      responseType: "stream",
    });
    return new Promise((resolve, reject) => {
      response.data
        .pipe(fs.createWriteStream(filepath))
        .on("error", reject)
        .once("close", () => resolve(filepath));
    });
  } catch (error) {
    console.log("error: ", error);
    await timer(delayLoop);
  }
}

async function run() {
  let oldData = await fs.readFileSync(fileName, "utf8");
  //   console.log("oldData: ", oldData);
  let joinData = oldData.split("\n").map((item) => {
    let row = item.split("|");
    return {
      id: row[0],
      image: row[1],
      full_command: row[2],
    };
  });

  for (let i = 9793; i < joinData.length; i++) {
    let row = joinData[i];
    let batchIndex = Math.floor(i / 5000);
    let filesDone = await readFilesName(`./batch${batchIndex + 19}`);
    let fileData = await fs.readFileSync("done.txt", "utf8");
    let doneFile = fileData.split("\n").map((item) => {
      let row = item.split("|");
      return row[0];
    });
    if (filesDone.includes(`${row.id}.png`)) continue;
    if (doneFile.includes(row.id)) continue;
    await downloadImage(row.image, `./batch${batchIndex + 19}/${row.id}.png`);
    let dataRow = `${row.id}|${row.image}|${row.full_command}\n`;
    fs.appendFileSync("done.txt", dataRow);
    if (i % 50 === 0 && i !== 0) {
      await timer(delayRequest);
    }
  }
}

run();
