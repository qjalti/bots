/**
 * Блок подключения модулей
 */
import express from 'express';
import bodyParser from 'body-parser';
import * as dotenv from 'dotenv';

/**
 * Боты
 */
import './bots/myBot.js';
import './bots/alya_english.js';
import './bots/vk_mutabor.js';
import './bots/chatgpt.js';
import './bots/tonessiBot.js';

/**
 * Блок определения констант
 */
dotenv.config();
const APP = express();
const PORT = 3001;

/**
 * Блок алгоритма работы приложения
 */
/**
 * Запуск сервера
 */
APP.listen(PORT);

/**
 * Настройки Express
 */
APP.use(bodyParser.json());
