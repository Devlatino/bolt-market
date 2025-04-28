// src/services/scrapers/scrapeSubito.ts
import type { ListingItem } from '../../types';
import axios, { AxiosError } from 'axios';
import { load } from 'cheerio';
import chromium from 'chrome-aws-lambda';
import puppeteer from 'puppeteer';

const ITEMS_PER_PAGE = 20;

export async function scrapeSubito(
  query: string,
  page: number = 1
): Promise<ListingItem[]> {
  console.log(`🚀 [scrapeSubito] start for query="${query}", page=${page}`);

  const offset = (page - 1) * ITEMS_PER_PAGE;
  // Endpoint corretto per ricerca globale (aprile 2025)
  const baseUrl = `https://www.subito.it/annunci-italia/vendita/`;
  const url = `${baseUrl}?q=${encodeURIComponent(query)}&o=${offset}`;

  console.log(`📡 [scrapeSubito] fetching URL: ${url}`);

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
      'AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/115.0.0.0 Safari/537.36',
    'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8',
  };

  let html: string;

  try {
    // Tentativo con axios
    const resp = await axios.get<string>(url, { headers, timeout: 60000 });
    html = resp.data;
  } catch (err) {
    const e = err as AxiosError;
    console.warn(
      `❌ [scrapeSubito] axios failed (status=${e.response?.status}), usando Puppeteer fallback`
    );

    const exePath = await chromium.executablePath;
    const launchOptions = {
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: exePath || undefined,
      headless: chromium.headless,
    };

    // Provo a lanciare con chrome-aws-lambda, altrimenti forzo puppeteer puro
    let browser;
    try {
      if (exePath) {
        browser = await chromium.puppeteer.launch(launchOptions);
      } else {
        browser = await puppeteer.launch({ headless: true });
      }
    } catch (launchError) {
      console.warn(
        "❌ [scrapeSubito] Puppeteer launch fallito, riprovo con puppeteer standard:",
        launchError
      );
      browser = await puppeteer.launch({ headless: true });
    }

    const pageCtx = await browser.newPage();
    await pageCtx.setUserAgent(headers['User-Agent']);
    await pageCtx.setExtraHTTPHeaders({ 'Accept-Language': headers['Accept-Language'] });
    await pageCtx.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    html = await pageCtx.content();
    await browser.close();
  }

  const $ = load(html);
  const items: ListingItem[] = [];

  $('article.js-ad-card').each((_, el) => {
    const anchor = $(el).find('a[href*="/annunci-italia"]');
    const title = anchor.find('h2').text().trim();
    if (!title) return;

    const priceText = $(el)
      .find('div[data-testid="ad-price"]')
      .text()
      .replace(/[^\d.,]/g, '')
      .replace(',', '.');
    const price = parseFloat(priceText) || 0;

    const link = anchor.attr('href') || '';
    const itemUrl = link.startsWith('http') ? link : `https://www.subito.it${link}`;

    const imgEl = $(el).find('img');
    const imageUrl = imgEl.attr('data-src') || imgEl.attr('src') || '';

    const location = $(el).find('div.ad-detail-location').text().trim();

    items.push({
      id: itemUrl,
      title,
      description: '',
      price,
      imageUrl,
      url: itemUrl,
      source: 'subito',
      location,
      date: Date.now(),
    });
  });

  console.log(`✅ [scrapeSubito] found ${items.length} items`);
  return items;
}
