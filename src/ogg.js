/**
 * Класс для работы с голосовыми сообщениями
 */
import axios from 'axios';
import {createWriteStream} from 'fs';
import {dirname, resolve} from 'path';
import {fileURLToPath} from 'url';
import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';
import {removeFile} from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

class OggConverter {
  constructor() {
    ffmpeg.setFfmpegPath(installer.path);
  }

  toMP3(input, output) {
    try {
      const OUTPUT_PATH = resolve(dirname(input), `${output}.mp3`);
      return new Promise((resolve, reject) => {
        ffmpeg(input)
            .inputOption('-t 30')
            .output(OUTPUT_PATH)
            .on('end', () => {
              removeFile(input);
              resolve(OUTPUT_PATH);
            })
            .on('error', (err) => reject(err.message))
            .run();
      });
    } catch (err) {
      console.log('Error while trying to MP3. ', err.message);
    }
  }

  async create(url, filename) {
    try {
      const OGGPath = resolve(
          __dirname,
          '../voices_temp',
          `${filename}.ogg`,
      );
      const RESPONSE = await axios({
        method: 'get',
        url,
        responseType: 'stream',
      });
      return new Promise((resolve) => {
        const STREAM = createWriteStream(OGGPath);
        RESPONSE.data.pipe(STREAM);
        STREAM.on('finish', () => {
          resolve(OGGPath);
        });
      });
    } catch (err) {
      console.log('Error while creating OGG file. ', err.message);
    }
  }
};

export const OGG = new OggConverter();
