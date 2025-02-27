// config/default.js
module.exports = {
  speech: {
    provider: 'azure',
    azure: {
      region: process.env.AZURE_SPEECH_REGION || 'koreacentral',
      key: process.env.AZURE_SPEECH_KEY || '',
      language: 'ko-KR'
    }
  }
};