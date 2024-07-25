import axios from 'axios';
import fsModule from 'fs';
const fs = fsModule.promises;
import path from 'path';
import * as utilsService from './utils.service';
import LoggerService from './logger.service';
const logger = new LoggerService(module.filename);

export async function uploadImage(imageLocalPath) {
    try {
        logger.info(uploadImage.name, `start`);
        const imageBuffer = await fs.readFile(imageLocalPath, { encoding: 'base64' });
        const data = {
            image: imageBuffer,
            type: 'base64',
            title: 'Simple upload',
            description: 'This is a simple image upload in Imgur',
        };

        const config = {
            method: 'post',
            url: 'https://api.imgur.com/3/image',
            headers: {
                'Authorization': `Client-ID ${process.env.IMGUR_CLIENT_ID}`,
                'Content-Type': 'application/json'
            },
            data: data,
        };

        const result = await axios(config);
        logger.info(uploadImage.name, `end`);
        return result.data.data.link;
    } catch (err) {
        logger.error(uploadImage.name, `err - ${utilsService.getErrorMessage(err)}`);
        throw err;
    }
}
