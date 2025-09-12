import { logger } from '../utils/logger';

interface FuzzySearchOptions {
  maxDistance: number;
  caseSensitive: boolean;
  phonetic: boolean;
  stemming: boolean;
  synonyms: boolean;
}

interface SearchResult {
  text: string;
  score: number;
  distance: number;
  matches: Array<{
    start: number;
    end: number;
    matched: string;
    original: string;
  }>;
}

interface PhoneticResult {
  original: string;
  phonetic: string;
  algorithm: 'soundex' | 'metaphone' | 'doubleMetaphone';
}

export class FuzzySearchEngine {
  private synonymMap = new Map<string, string[]>();
  private stemMap = new Map<string, string>();
  private phoneticCache = new Map<string, PhoneticResult>();

  constructor() {
    this.initializeSynonyms();
    this.initializeStems();
  }

  /**
   * Perform fuzzy search with typo tolerance and phonetic matching
   */
  search(
    query: string,
    texts: string[],
    options: Partial<FuzzySearchOptions> = {}
  ): SearchResult[] {
    const opts: FuzzySearchOptions = {
      maxDistance: 2,
      caseSensitive: false,
      phonetic: true,
      stemming: true,
      synonyms: true,
      ...options
    };

    try {
      const processedQuery = this.preprocessQuery(query, opts);
      const results: SearchResult[] = [];

      for (const text of texts) {
        const result = this.matchText(processedQuery, text, opts);
        if (result.score > 0) {
          results.push(result);
        }
      }

      // Sort by score (descending)
      return results.sort((a, b) => b.score - a.score);
    } catch (error) {
      logger.error('Fuzzy search failed:', error);
      return [];
    }
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= b.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        if (a[i - 1] === b[j - 1]) {
          matrix[j][i] = matrix[j - 1][i - 1];
        } else {
          matrix[j][i] = Math.min(
            matrix[j - 1][i] + 1,     // deletion
            matrix[j][i - 1] + 1,     // insertion
            matrix[j - 1][i - 1] + 1  // substitution
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Generate Soundex code for phonetic matching
   */
  soundex(str: string): string {
    if (!str) return '0000';

    const code = str.toUpperCase().replace(/[^A-Z]/g, '');
    if (!code) return '0000';

    let soundex = code[0];
    const mapping: { [key: string]: string } = {
      'BFPV': '1',
      'CGJKQSXZ': '2',
      'DT': '3',
      'L': '4',
      'MN': '5',
      'R': '6'
    };

    for (let i = 1; i < code.length; i++) {
      const char = code[i];
      let digit = '0';

      for (const [chars, value] of Object.entries(mapping)) {
        if (chars.includes(char)) {
          digit = value;
          break;
        }
      }

      if (digit !== '0' && digit !== soundex.slice(-1)) {
        soundex += digit;
      }
    }

    return (soundex + '0000').substring(0, 4);
  }

  /**
   * Generate Double Metaphone code for better phonetic matching
   */
  doubleMetaphone(str: string): [string, string] {
    // Simplified Double Metaphone implementation
    // In production, you'd use a full implementation library
    const s = str.toUpperCase().replace(/[^A-Z]/g, '');
    if (!s) return ['', ''];

    let primary = '';
    let secondary = '';
    let current = 0;
    const length = s.length;

    // Initial transformations
    if (s.startsWith('GN') || s.startsWith('KN') || s.startsWith('PN') || s.startsWith('WR') || s.startsWith('PS')) {
      current = 1;
    }

    if (s[0] === 'X') {
      primary = 'S';
      secondary = 'S';
      current = 1;
    }

    while (current < length) {
      const char = s[current];
      
      switch (char) {
        case 'A':
        case 'E':
        case 'I':
        case 'O':
        case 'U':
        case 'Y':
          if (current === 0) {
            primary += 'A';
            secondary += 'A';
          }
          current++;
          break;
        case 'B':
          primary += 'P';
          secondary += 'P';
          current += s[current + 1] === 'B' ? 2 : 1;
          break;
        case 'C':
          if (current > 1 && s[current - 1] !== 'A' && s.substr(current - 1, 3) === 'ACH' &&
              (s[current + 2] !== 'I' && (s[current + 2] !== 'E' || s.substr(current - 2, 6) === 'BACHER' || s.substr(current - 2, 6) === 'MACHER'))) {
            primary += 'K';
            secondary += 'K';
            current += 2;
          } else if (current === 0 && s.substr(0, 6) === 'CAESAR') {
            primary += 'S';
            secondary += 'S';
            current += 2;
          } else {
            primary += 'K';
            secondary += 'K';
            current++;
          }
          break;
        default:
          primary += char;
          secondary += char;
          current++;
      }
    }

    return [primary.substring(0, 4), secondary.substring(0, 4)];
  }

  /**
   * Apply stemming to reduce words to their root form
   */
  stem(word: string): string {
    const lower = word.toLowerCase();
    
    // Check cache
    if (this.stemMap.has(lower)) {
      return this.stemMap.get(lower)!;
    }

    // Simple stemming rules (Porter Stemmer simplified)
    let stemmed = lower;

    // Remove common suffixes
    const suffixes = [
      'ing', 'ly', 'ed', 'ies', 'ied', 'ies', 'ying', 's'
    ];

    for (const suffix of suffixes) {
      if (stemmed.endsWith(suffix) && stemmed.length > suffix.length + 2) {
        stemmed = stemmed.slice(0, -suffix.length);
        break;
      }
    }

    // Cache the result
    this.stemMap.set(lower, stemmed);
    return stemmed;
  }

  /**
   * Get synonyms for a word
   */
  getSynonyms(word: string): string[] {
    const lower = word.toLowerCase();
    return this.synonymMap.get(lower) || [];
  }

  /**
   * Preprocess query for better matching
   */
  private preprocessQuery(query: string, options: FuzzySearchOptions): string[] {
    let words = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);

    // Apply stemming
    if (options.stemming) {
      words = words.map(word => this.stem(word));
    }

    // Add synonyms
    if (options.synonyms) {
      const expandedWords = [...words];
      for (const word of words) {
        const synonyms = this.getSynonyms(word);
        expandedWords.push(...synonyms);
      }
      words = Array.from(new Set(expandedWords));
    }

    return words;
  }

  /**
   * Match query against text with scoring
   */
  private matchText(queryWords: string[], text: string, options: FuzzySearchOptions): SearchResult {
    const textWords = text.toLowerCase().split(/\s+/);
    let totalScore = 0;
    let totalDistance = 0;
    const matches: SearchResult['matches'] = [];

    for (const queryWord of queryWords) {
      let bestScore = 0;
      let bestDistance = Infinity;
      let bestMatch: SearchResult['matches'][0] | null = null;

      for (let i = 0; i < textWords.length; i++) {
        const textWord = textWords[i];
        
        // Exact match
        if (queryWord === textWord) {
          bestScore = 100;
          bestDistance = 0;
          bestMatch = {
            start: text.toLowerCase().indexOf(textWord),
            end: text.toLowerCase().indexOf(textWord) + textWord.length,
            matched: textWord,
            original: queryWord
          };
          break;
        }

        // Fuzzy match
        const distance = this.levenshteinDistance(queryWord, textWord);
        if (distance <= options.maxDistance) {
          const score = Math.max(0, 100 - (distance / Math.max(queryWord.length, textWord.length)) * 100);
          if (score > bestScore) {
            bestScore = score;
            bestDistance = distance;
            bestMatch = {
              start: text.toLowerCase().indexOf(textWord),
              end: text.toLowerCase().indexOf(textWord) + textWord.length,
              matched: textWord,
              original: queryWord
            };
          }
        }

        // Phonetic match
        if (options.phonetic && bestScore < 70) {
          const queryPhonetic = this.soundex(queryWord);
          const textPhonetic = this.soundex(textWord);
          
          if (queryPhonetic === textPhonetic && queryPhonetic !== '0000') {
            const phoneticScore = 60; // Lower than exact but higher than distant fuzzy
            if (phoneticScore > bestScore) {
              bestScore = phoneticScore;
              bestDistance = this.levenshteinDistance(queryWord, textWord);
              bestMatch = {
                start: text.toLowerCase().indexOf(textWord),
                end: text.toLowerCase().indexOf(textWord) + textWord.length,
                matched: textWord,
                original: queryWord
              };
            }
          }
        }

        // Stemmed match
        if (options.stemming && bestScore < 50) {
          const queryStem = this.stem(queryWord);
          const textStem = this.stem(textWord);
          
          if (queryStem === textStem && queryStem.length > 2) {
            const stemScore = 40; // Lower than phonetic
            if (stemScore > bestScore) {
              bestScore = stemScore;
              bestDistance = this.levenshteinDistance(queryWord, textWord);
              bestMatch = {
                start: text.toLowerCase().indexOf(textWord),
                end: text.toLowerCase().indexOf(textWord) + textWord.length,
                matched: textWord,
                original: queryWord
              };
            }
          }
        }
      }

      if (bestMatch) {
        totalScore += bestScore;
        totalDistance += bestDistance;
        matches.push(bestMatch);
      }
    }

    // Average the scores
    const finalScore = queryWords.length > 0 ? totalScore / queryWords.length : 0;
    const avgDistance = matches.length > 0 ? totalDistance / matches.length : 0;

    return {
      text,
      score: finalScore,
      distance: avgDistance,
      matches
    };
  }

  /**
   * Initialize common synonyms
   */
  private initializeSynonyms(): void {
    const synonymGroups = [
      ['hello', 'hi', 'hey', 'greetings'],
      ['help', 'assist', 'support'],
      ['error', 'bug', 'issue', 'problem'],
      ['good', 'great', 'excellent', 'awesome'],
      ['bad', 'terrible', 'awful', 'horrible'],
      ['fast', 'quick', 'rapid', 'speedy'],
      ['slow', 'sluggish', 'delayed'],
      ['big', 'large', 'huge', 'massive'],
      ['small', 'tiny', 'little', 'mini']
    ];

    for (const group of synonymGroups) {
      for (const word of group) {
        const synonyms = group.filter(w => w !== word);
        this.synonymMap.set(word, synonyms);
      }
    }
  }

  /**
   * Initialize stem mappings (this would be much larger in production)
   */
  private initializeStems(): void {
    // Pre-populate some common stems for performance
    const commonStems = [
      ['running', 'runs', 'run'],
      ['walking', 'walks', 'walk'],
      ['talking', 'talks', 'talk'],
      ['coding', 'codes', 'code'],
      ['testing', 'tests', 'test']
    ];

    for (const stemGroup of commonStems) {
      const root = stemGroup[stemGroup.length - 1];
      for (const word of stemGroup) {
        this.stemMap.set(word, root);
      }
    }
  }

  /**
   * Get phonetic variations of a word
   */
  getPhoneticVariations(word: string): PhoneticResult[] {
    const cacheKey = word.toLowerCase();
    
    if (this.phoneticCache.has(cacheKey)) {
      return [this.phoneticCache.get(cacheKey)!];
    }

    const results: PhoneticResult[] = [
      {
        original: word,
        phonetic: this.soundex(word),
        algorithm: 'soundex'
      }
    ];

    const [primary, secondary] = this.doubleMetaphone(word);
    if (primary) {
      results.push({
        original: word,
        phonetic: primary,
        algorithm: 'doubleMetaphone'
      });
    }

    // Cache the first result
    if (results.length > 0) {
      this.phoneticCache.set(cacheKey, results[0]);
    }

    return results;
  }

  /**
   * Suggest corrections for misspelled words
   */
  suggestCorrections(word: string, dictionary: string[], maxSuggestions: number = 5): string[] {
    const suggestions = dictionary
      .map(dictWord => ({
        word: dictWord,
        distance: this.levenshteinDistance(word.toLowerCase(), dictWord.toLowerCase())
      }))
      .filter(item => item.distance <= 3) // Only suggest words within distance of 3
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxSuggestions)
      .map(item => item.word);

    return suggestions;
  }

  /**
   * Clear caches to free memory
   */
  clearCaches(): void {
    this.phoneticCache.clear();
    // Don't clear stem map as it's useful to keep
    logger.info('Fuzzy search caches cleared');
  }
}