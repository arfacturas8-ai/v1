import axios from 'axios';

export class SimpleSearchService {
  private baseUrl = 'http://localhost:9200';

  async search(query: string, indices: string[] = ['posts', 'users', 'communities']) {
    const results: any = {};
    
    for (const index of indices) {
      try {
        const response = await axios.get(`${this.baseUrl}/${index}/_search`, {
          params: {
            q: query,
            size: 10
          }
        });
        
        results[index] = {
          results: response.data.hits.hits.map((hit: any) => ({
            ...hit._source,
            _id: hit._id,
            _score: hit._score
          })),
          total: response.data.hits.total.value || response.data.hits.total,
          took: response.data.took
        };
      } catch (error) {
        results[index] = {
          results: [],
          total: 0,
          took: 0
        };
      }
    }
    
    return results;
  }

  async indexDocument(index: string, id: string, document: any) {
    try {
      await axios.post(`${this.baseUrl}/${index}/_doc/${id}`, document, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return true;
    } catch (error) {
      console.error(`Failed to index document in ${index}:`, error);
      return false;
    }
  }
}