// All of the google storage file interactions are done in this file.
// Local file interactions
import { Storage } from "@google-cloud/storage";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";

const storage = new Storage(); // Creating an instance of the storage class
const rawVideoBucketName = "zc-raw-videos";
const processedVideoBucketName = "zc-processed-videos";

const localRawVideoPath = "./raw-videos";
const localProcessedVideoPath = "./processed-videos";


export function setupDirectories(){
    ensureDirectoryExistence(localRawVideoPath);
    ensureDirectoryExistence(localProcessedVideoPath);
}

export function convertVideo(rawVideoName: string, processedVideoName: string) {
    return new Promise<void>((resolve, reject)  =>  {
    ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
        .videoFilters('scale=-1:360') // convert the video into 360p
        .on('end', () => {    
        console.log("Video processed successfully.");
        resolve();
        })
        .on('error', (err) => {
            console.log(`An error occurred: ${err.message}`);
            reject(err);
        })
        .save(`${localProcessedVideoPath}/${processedVideoName}`);
    });
    }

export async function downloadRawVideo(fileName: string) {
    await storage.bucket(rawVideoBucketName)
    .file(fileName)
    .download({
        destination: `${localRawVideoPath}/${fileName}`
    });

    console.log(
        `gs://${rawVideoBucketName}/${fileName} downloaded to
    ${localRawVideoPath}/${fileName}.`
    );
}

export async function uploadProcessedVideo(fileName: string) {
    const bucket = storage.bucket(processedVideoBucketName);

    // Upload video to the bucket

    await storage.bucket(processedVideoBucketName)
    .upload(`${localProcessedVideoPath}/${fileName}`, {
      destination: fileName,
    });

    // Set the video to be publicly accessible
    await bucket.file(fileName).makePublic();
}

export function deleteRawVideo(fileName: string){
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}

export function deleteProcessedVideo(fileName: string){
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

function deleteFile(filePath: string): Promise<void> {
    return new Promise<void>((resolve, reject)  =>  {
        if(fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err){
                    console.error(`Failed to delete file at path: ${filePath}`, err);
                    reject(err);
                }
                else{
                    console.log(`Successfully deleted file at path: ${filePath}`);
                    resolve();
                }
            });
        }else{
            console.log(`File not found at: ${filePath}, skipping delete.`);
            resolve();
        }
    });
}

function ensureDirectoryExistence(dirPath: string){
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Directory ${dirPath} created`);
    }
}