/**
 * Блок подключения модулей
 */
const express = require('express');
const BODY_PARSER = require('body-parser');

/**
 * Боты
 */
require('./bots/myBot');
require('./bots/alya_english');
require('./bots/vk_mutabor');

/**
 * Блок определения констант
 */
const APP = express();
const PORT = 3001;

/**
 * Блок алгоритма работы приложения
 */
/**
 * Запуск сервера
 */
APP.listen(PORT)

/**
 * Настройки Express
 */
APP.use(BODY_PARSER.json());