import axios from 'axios';
import * as cheerio from 'cheerio';
import * as xml2js from 'xml2js';

export interface NewsHeadline {
  title: string;
  url: string;
  source: string;
  timestamp?: Date;
}

export interface NewsSource {
  name: string;
  url: string;
  selectors: {
    headline: string;
    link: string;
    container?: string;
  };
  maxHeadlines?: number;
  useRSS?: boolean;
}

export class NewsScraper {
  private sources: NewsSource[] = [
    {
      name: 'Zero Hedge',
      url: 'https://www.zerohedge.com',
      selectors: {
        headline: 'h2 a, h3 a, .title a',
        link: 'a',
        container: 'article, .post'
      },
      maxHeadlines: 5
    },
    {
      name: 'VT Foreign Policy',
      url: 'https://www.vtforeignpolicy.com',
      selectors: {
        headline: 'h2 a, h3 a, .entry-title a',
        link: 'a',
        container: 'article, .post'
      },
      maxHeadlines: 5
    },
    {
      name: 'Korea Times',
      url: 'https://feed.koreatimes.co.kr/k/allnews.xml',
      selectors: {
        headline: 'title',
        link: 'link',
        container: 'item'
      },
      maxHeadlines: 5,
      useRSS: true
    }
  ];

  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        timeout: 15000,
        maxRedirects: 5
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  private async parseRSSFeed(xmlContent: string): Promise<NewsHeadline[]> {
    try {
      const parser = new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: true,
        trim: true,
        normalize: true,
        normalizeTags: true,
        explicitRoot: false
      });
      
      const result = await parser.parseStringPromise(xmlContent);
      
      const headlines: NewsHeadline[] = [];
      const items = result?.channel?.item || [];
      
      // Handle single item case
      const itemArray = Array.isArray(items) ? items : [items];
      
      for (const item of itemArray.slice(0, 5)) { // Limit to 5 items
        const title = item.title;
        const link = item.link;
        const pubDate = item.pubDate;
        
        if (title && link) {
          headlines.push({
            title: title.trim(),
            url: link.trim(),
            source: 'Korea Times',
            timestamp: pubDate ? new Date(pubDate) : new Date()
          });
        }
      }
      
      console.log(`✅ Parsed ${headlines.length} headlines from RSS feed`);
      if (headlines.length === 0) {
        console.log('🔍 Debug: RSS content preview:', xmlContent.substring(0, 500));
        console.log('🔍 Debug: RSS structure:', JSON.stringify(result, null, 2).substring(0, 500));
      }
      return headlines;
    } catch (error) {
      console.error('Error parsing RSS feed:', error);
      console.log('RSS content preview:', xmlContent.substring(0, 200));
      return [];
    }
  }

  private extractHeadlinesFromSource(source: NewsSource): (html: string) => NewsHeadline[] {
    return (html: string): NewsHeadline[] => {
      const $ = cheerio.load(html);
      const headlines: NewsHeadline[] = [];
      
      try {
        // Try to find headlines using the container selector first
        let elements = $(source.selectors.container || 'body');
        
        // If no container selector works, use the headline selector directly
        if (elements.length === 0 || elements.length === 1) {
          elements = $(source.selectors.headline);
        } else {
          // Find headlines within containers
          elements = elements.find(source.selectors.headline);
        }

        elements.each((index, element) => {
          if (headlines.length >= (source.maxHeadlines || 5)) {
            return false; // Stop processing
          }

          const $element = $(element);
          const title = $element.text().trim();
          let url = $element.attr('href');

          // Handle relative URLs
          if (url && !url.startsWith('http')) {
            if (url.startsWith('/')) {
              url = new URL(url, source.url).href;
            } else {
              url = new URL(url, source.url).href;
            }
          }

          // Skip if no title or URL
          if (!title || !url) {
            return true; // Continue processing
          }

          // For Korea Times, filter out navigation and non-article links
          if (source.name === 'Korea Times') {
            if (url.includes('/mytimes') || url.includes('/latest') || url.includes('/?edition') || 
                url.includes('#') || url.includes('javascript:') || title.length < 10) {
              return true; // Skip these links
            }
          }

          headlines.push({
            title,
            url,
            source: source.name,
            timestamp: new Date()
          });
          
          return true; // Continue processing
        });

        console.log(`✅ Scraped ${headlines.length} headlines from ${source.name}`);
        if (headlines.length === 0) {
          console.log(`🔍 Debug: Found ${elements.length} elements matching selector "${source.selectors.headline}"`);
          // Try to find any links on the page
          const allLinks = $('a').length;
          console.log(`🔍 Debug: Total links found on page: ${allLinks}`);
          if (allLinks > 0) {
            const sampleLinks = $('a').slice(0, 3).map((i, el) => $(el).attr('href')).get();
            console.log(`🔍 Debug: Sample links: ${sampleLinks.join(', ')}`);
          }
        }
        return headlines;
      } catch (error) {
        console.error(`Error parsing ${source.name}:`, error);
        return [];
      }
    };
  }

  public async scrapeAllSources(): Promise<NewsHeadline[]> {
    console.log('🔍 Starting news scraping...');
    const allHeadlines: NewsHeadline[] = [];

    for (const source of this.sources) {
      try {
        console.log(`📰 Scraping ${source.name}...`);
        const content = await this.fetchPage(source.url);
        
        let headlines: NewsHeadline[];
        if (source.useRSS) {
          headlines = await this.parseRSSFeed(content);
        } else {
          headlines = this.extractHeadlinesFromSource(source)(content);
        }
        
        allHeadlines.push(...headlines);
        
        // Add a small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to scrape ${source.name}:`, error);
        // Continue with other sources even if one fails
      }
    }

    console.log(`✅ Total headlines scraped: ${allHeadlines.length}`);
    return allHeadlines;
  }

  public async scrapeSource(sourceName: string): Promise<NewsHeadline[]> {
    const source = this.sources.find(s => s.name.toLowerCase() === sourceName.toLowerCase());
    if (!source) {
      throw new Error(`Source "${sourceName}" not found`);
    }

    console.log(`📰 Scraping ${source.name}...`);
    const content = await this.fetchPage(source.url);
    
    if (source.useRSS) {
      return await this.parseRSSFeed(content);
    } else {
      return this.extractHeadlinesFromSource(source)(content);
    }
  }

  public getAvailableSources(): string[] {
    return this.sources.map(source => source.name);
  }

  public addSource(source: NewsSource): void {
    this.sources.push(source);
  }

  public removeSource(sourceName: string): boolean {
    const index = this.sources.findIndex(s => s.name.toLowerCase() === sourceName.toLowerCase());
    if (index !== -1) {
      this.sources.splice(index, 1);
      return true;
    }
    return false;
  }
}
