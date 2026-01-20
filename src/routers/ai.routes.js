const { InferenceClient } = require('@huggingface/inference');
const express = require('express');
const router = express.Router();
const { encryptString, decryptString } = require('./files/key-decryption');
const NewsAPI = require('newsapi');

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

  let api_key = decryptString(process.env.HF_KEY);
  const hf = new InferenceClient(api_key);
  const response = await hf.summarization({
    model: 'facebook/bart-large-cnn', // Use a summarization model supported by Hugging Face
    inputs: prompt,
    parameters: {
      max_length: 100, // Limit the response length
    },
  });
  return response;
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
      const prompt = constructPromptForNewsSummary(news);
      //const response = await getAISummary(prompt);
      res.status(200).send(news);
    } else {
      res.status(500).send('No news articles found');
    }
  } catch (error) {
    console.error("Error fetching from NewsAPI:", error.message);
    res.status(500).send(`Error fetching from NewsAPI:, ${error.message}`);
  }
});

module.exports = router;