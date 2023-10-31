import express from "express";
import {convertVideo, 
        downloadRawVideo,
        deleteRawVideo,
        deleteProcessedVideo,
        setupDirectories, 
        uploadProcessedVideo } 
        from "./storage";

setupDirectories();

const app = express();
app.use(express.json());

app.post('/process-video',async (req, res) => {
    let data;
    try{
        const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
        data = JSON.parse(message);
        if (!data.name){
            throw new Error('Iinvalid message payload received.');
        }
    } catch (error){
        console.error(error);
        return res.status(400).send('Bad Request: missing filename.');
    }

    const inputFileName = data.name
    const outputFileName = `processed-${inputFileName}`;

    // Download the raw video from cloud storage
    await downloadRawVideo(inputFileName)

    // Convert the video into 360p
    try{
        await convertVideo(inputFileName, outputFileName);
    } catch (error){
        await Promise.all([
            deleteRawVideo(inputFileName),
            deleteProcessedVideo(outputFileName)
        ]);
        console.error(error);
        return res.status(500).send('Internal Server Error: video processing failed');
    }
    // Upload the video to the cloud storage
    await uploadProcessedVideo(outputFileName);

    await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
    ]);

    return res.status(200).send('Processing finished successfully');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(
        `Video processing service listening at http://localhost:${port}`);
});