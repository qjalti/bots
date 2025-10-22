/**
 * Класс для работы с голосовыми сообщениями
 */
import axios from "axios";
import { createWriteStream } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import ffmpeg from "fluent-ffmpeg";
import installer from "@ffmpeg-installer/ffmpeg";
import { removeFile } from "./utils.js";
import { ERROR_MESSAGE } from "./constants.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Класс для конвертации аудио файлов из формата OGG в MP3
 */
class OggConverter {
  /**
   * Инициализирует конвертер и устанавливает путь к FFMPEG
   */
  constructor() {
    ffmpeg.setFfmpegPath(installer.path);
  }

  /**
   * Конвертирует OGG файл в MP3
   * @param {string} input - Путь к входному файлу в формате OGG
   * @param {string} output - Имя выходного файла без расширения
   * @return {Promise<string>} - Возвращает путь к созданному MP3 файлу
   * @throws {Error} - Если произошла ошибка во время конвертации
   */
  toMP3(input, output) {
    try {
      const OUTPUT_PATH = resolve(dirname(input), `${output}.mp3`);
      return new Promise((resolve, reject) => {
        ffmpeg(input)
          .inputOption("-t 30")
          .output(OUTPUT_PATH)
          .on("end", () => {
            removeFile(input);
            resolve(OUTPUT_PATH);
          })
          .on("error", (err) => reject(err.message))
          .run();
      });
    } catch (err) {
      console.log("Error while trying to MP3. ", err.message, err);
      return {
        success: false,
        data: ERROR_MESSAGE,
      };
    }
  }

  /**
   * Создает временный OGG файл из указанного URL
   * @param {string} url - URL-адрес для скачивания аудио файла
   * @param {string} filename - Имя файла без расширения
   * @return {Promise<string>} - Возвращает путь к созданному OGG файлу
   * @throws {Error} - Если произошла ошибка при создании файла
   */
  async create(url, filename) {
    try {
      const OGGPath = resolve(__dirname, "../voices_temp", `${filename}.ogg`);
      const RESPONSE = await axios({
        method: "get",
        url,
        responseType: "stream",
      });
      return new Promise((resolve) => {
        const STREAM = createWriteStream(OGGPath);
        RESPONSE.data.pipe(STREAM);
        STREAM.on("finish", () => {
          resolve(OGGPath);
        });
      });
    } catch (err) {
      console.log("Error while creating OGG file. ", err.message, err);
      return {
        success: false,
        data: ERROR_MESSAGE,
      };
    }
  }
}

export const OGG = new OggConverter();
