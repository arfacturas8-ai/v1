export class CDNService {
  private fallbackToLocal: boolean;

  constructor(options: { fallbackToLocal?: boolean } = {}) {
    this.fallbackToLocal = options.fallbackToLocal || false;
  }

  async getUrl(path: string): Promise<string> {
    if (this.fallbackToLocal) {
      return `/cdn/${path}`;
    }
    return `https://cdn.cryb.ai/${path}`;
  }

  async purgeCache(path: string): Promise<void> {
    // Implement CDN cache purging
    console.log(`Purging CDN cache for: ${path}`);
  }
}