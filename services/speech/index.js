// services/speech/index.js
const config = require('../../config/default');
const azureSpeech = require('./azure-speech');

module.exports = {
  async transcribeAudio(audioFilePath, options = {}) {
    // 현재는 Azure만 지원
    return azureSpeech.transcribeAudio(audioFilePath, options);
  }
};