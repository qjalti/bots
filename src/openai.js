import {Configuration, OpenAIApi} from 'openai';
import config from 'config';
import {createReadStream} from 'fs';

class OpenAI {
  constructor(apiKey) {
    const CONFIGURATION = new Configuration({
      apiKey,
    });
    this.OPEN_AI = new OpenAIApi(CONFIGURATION);
  }

  chat() {

  }

  async transcription(filepath) {
    try {
      const REPONSE = await this.OPEN_AI.createTranscription(
          createReadStream(filepath),
          'whisper-1',
      );
      return {
        success: true,
        data: REPONSE.data.text,
      };
    } catch (err) {
      console.log('Error! ', err.message);
      return {
        ok: false,
        data: err.message,
      };
    }
  }
}

export const OPEN_AI = new OpenAI(config.get('OPEN_AI_TOKEN'));
