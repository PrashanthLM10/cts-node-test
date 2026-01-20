
const express = require('express');
const router = express.Router();
const { encryptString, decryptString } = require('./files/key-decryption');
const NewsAPI = require('newsapi');
const { GoogleGenAI } = require("@google/genai"); 


router.get('/get-ai-summary', async (req, res) => {
  const prompt = req.prompt || 'Analyze all the charge data and give a good analysis of the offence history for Erling Haaland';

  if (!prompt) {
    res.status(500).send('Invalid prompt text');
  }

  try {
    const response = await getAISummary(prompt);
    res.status(200).send(response);
  } catch (e) {
    // handle error and send the specific error caught in response
    console.error("Error:", e.message);
    res.status(500).send(e.message);
  }
});

const getAISummary = async (prompt) => {
  // use GoogleGenAI to get the summary
  const genAI = new GoogleGenAI({
    apiKey: decryptString(process.env.GOOGLE_GENAI_API_KEY),
  });

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview', // The latest free-tier flash model
      contents: prompt
    });

    console.log("Response:", response.text);
    return response.text;
  } catch (error) {
    console.error("Error generating content:", error);
    return `Error generating content:${error}`;
  }
}

async function getCelebrityNews(celebrityName) {
  try {
    const NEWS_API_KEY = decryptString(process.env.NEWS_API_KEY);
    const newsapi = new NewsAPI(NEWS_API_KEY);
    //// trying to fetch news from the past needs a paid plan, so can't use 'from', 'to' keys
    const response = await newsapi.v2.everything({
      q: celebrityName,
      language: 'en',
      sortBy: 'relevancy',
      pageSize: 10
    });
    if (!response || response.status !== 'ok') {
      throw new Error('Failed to fetch news articles');
    } else {

      const newsList = response.articles.map(article => ({
        title: article.title,
        description: article.description,
        source: article.source.name,
        publishedAt: article.publishedAt
      }));
      return newsList;
    }
  } catch (error) {
    console.error("Error fetching from NewsAPI:", error.message);
  }
}

const constructPromptForNewsSummary = news => {
  /* const newsSample = [
    {
      title: 'Lina Esco reveals she and Ben Affleck were ‘giggling’ during sex scenes in ‘The Rip’',
      description: "The actress reflected on her and Affleck's romantic scenes.",
      source: 'New York Post',
      publishedAt: '2026-01-17T21:23:40Z'
    },
    {
      title: "21 queer sports films to watch after 'Heated Rivalry'",
      description: 'Find out where to stream these LGBTQ+ sports classics.',
      source: 'Out.com',
      publishedAt: '2026-01-17T11:00:02Z'
    }
  ]; */

  let prompt = `Summarize the following news articles about a celebrity into a concise summary:\n\n`;
  news.forEach((article, index) => {
    prompt += `Article ${index + 1}:\nTitle: ${article.title}\nDescription: ${article.description}\nSource: ${article.source}\nPublished At: ${article.publishedAt}\n\n`;
  });
  prompt += `Provide a brief summary of the key points from these articles.`;
  return prompt;
}

router.get('/summarize-news/:celebrity', async (req, res) => {
  const celebrity = req.params.celebrity || 'zendaya';
  try {
    const news = await getCelebrityNews(celebrity);
    if (news) {
      res.status(200).send(news);
    } else {
      res.status(500).send('No news articles found');
    }
  } catch (error) {
    console.error("Error fetching from NewsAPI:", error.message);
    res.status(500).send(`Error fetching from NewsAPI:, ${error.message}`);
  }
});

router.get('/get-ai-based-filters', async (req, res) => {
  try{
    const prompt = req.query.p || 'Show me the latest 10 serious records';
    
    const ai = new GoogleGenAI({
      apiKey: decryptString(process.env.GOOGLE_GENAI_API_KEY),
    });
    const today = new Date().toLocaleDateString('en-GB'); // e.g. "20/01/26"
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      config: {
        systemInstruction: `Today is ${today}. Convert user queries into JSON filters for fields: name, createdOn, dueDate, severity, location. Use DD/MM/YY for dates. Serious severity means {severity: "Serious"}. Return ONLY JSON.`, 
        responseMimeType: 'application/json'
      },
      contents: prompt
    });
    console.log(response);
    if(!response || !response.text) {
      throw new Error('Model failed to respond');
    }
    res.status(200).send(response.text);
  }catch(e) {
    const error = `Error fetching filters: ${e.message}`;
    console.error(error);
    res.status(500).send(error);
  }
})

module.exports = router;