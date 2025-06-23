import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const QUOTE_CATEGORY_KEY = 'quoteCategory';
const SHOW_PRODUCTIVITY_STATS_KEY = 'showProductivityStats';
const CUSTOM_QUOTES_KEY = 'customQuotes';
const QUOTE_SOURCE_KEY = 'quoteSource'; // 'default', 'custom', or 'both'

// Default quotes by category
const DEFAULT_QUOTES = {
  Motivation: [
    "The only way to do great work is to love what you do.",
    "Don't watch the clock; do what it does. Keep going.",
    "Believe you can and you're halfway there.",
    "It always seems impossible until it's done.",
    "Your time is limited, don't waste it living someone else's life."
  ],
  Focus: [
    "Concentrate all your thoughts upon the work in hand.",
    "The successful warrior is the average man, with laser-like focus.",
    "Where focus goes, energy flows.",
    "Focus on the solution, not the problem.",
    "Lack of direction, not lack of time, is the problem. We all have 24-hour days."
  ],
  Productivity: [
    "Productivity is never an accident. It is always the result of a commitment to excellence.",
    "The key is not to prioritize what's on your schedule, but to schedule your priorities.",
    "Until we can manage time, we can manage nothing else.",
    "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
    "The way to get started is to quit talking and begin doing."
  ],
  Mindfulness: [
    "The present moment is the only moment available to us, and it is the door to all moments.",
    "Mindfulness isn't difficult, we just need to remember to do it.",
    "Be where you are, otherwise you will miss your life.",
    "The best way to capture moments is to pay attention.",
    "Mindfulness means being awake. It means knowing what you are doing."
  ]
};

export interface Quote {
  id: string;
  text: string;
  category: string;
  isCustom: boolean;
  author?: string;
}

export type QuoteSource = 'default' | 'custom' | 'both';

export interface MotivationSettings {
  quoteCategory: string;
  showProductivityStats: boolean;
  customQuotes: Quote[];
  quoteSource: QuoteSource;
}

class MotivationService {
  private static instance: MotivationService;
  
  private constructor() {}
  
  public static getInstance(): MotivationService {
    if (!MotivationService.instance) {
      MotivationService.instance = new MotivationService();
    }
    return MotivationService.instance;
  }
  
  // Get a random quote based on the selected category and source preference
  public async getRandomQuote(): Promise<Quote> {
    try {
      // Get the user's preferred category and source
      const category = await this.getQuoteCategory();
      const quoteSource = await this.getQuoteSource();
      
      // Get quotes based on source preference
      let availableQuotes: Quote[] = [];
      
      // Get default quotes if needed
      if (quoteSource === 'default' || quoteSource === 'both') {
        availableQuotes = [
          ...availableQuotes,
          ...DEFAULT_QUOTES[category as keyof typeof DEFAULT_QUOTES].map((text, index) => ({
            id: `default-${category}-${index}`,
            text,
            category,
            isCustom: false
          }))
        ];
      }
      
      // Get custom quotes if needed
      if (quoteSource === 'custom' || quoteSource === 'both') {
        const customQuotes = await this.getCustomQuotes();
        const categoryCustomQuotes = customQuotes.filter(q => q.category === category);
        
        if (categoryCustomQuotes.length > 0) {
          availableQuotes = [...availableQuotes, ...categoryCustomQuotes];
        }
      }
      
      // If no quotes are available (e.g., no custom quotes when source is 'custom'),
      // fall back to default quotes
      if (availableQuotes.length === 0) {
        availableQuotes = DEFAULT_QUOTES[category as keyof typeof DEFAULT_QUOTES].map((text, index) => ({
          id: `default-${category}-${index}`,
          text,
          category,
          isCustom: false
        }));
        
        console.log('No quotes available for selected source. Falling back to defaults.');
      }
      
      // Return a random quote
      const randomIndex = Math.floor(Math.random() * availableQuotes.length);
      return availableQuotes[randomIndex];
    } catch (error) {
      console.error('Error getting random quote:', error);
      // Return a default quote if there's an error
      return {
        id: 'default-fallback',
        text: 'Focus on what matters most.',
        category: 'Focus',
        isCustom: false
      };
    }
  }
  
  // Get the user's preferred quote category
  public async getQuoteCategory(): Promise<string> {
    try {
      const category = await AsyncStorage.getItem(QUOTE_CATEGORY_KEY);
      return category || 'Motivation'; // Default to Motivation if not set
    } catch (error) {
      console.error('Error getting quote category:', error);
      return 'Motivation';
    }
  }
  
  // Set the user's preferred quote category
  public async setQuoteCategory(category: string): Promise<void> {
    try {
      await AsyncStorage.setItem(QUOTE_CATEGORY_KEY, category);
    } catch (error) {
      console.error('Error setting quote category:', error);
    }
  }
  
  // Get the user's preference for showing productivity stats
  public async getShowProductivityStats(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(SHOW_PRODUCTIVITY_STATS_KEY);
      return value === null ? true : value === 'true'; // Default to true if not set
    } catch (error) {
      console.error('Error getting show productivity stats preference:', error);
      return true;
    }
  }
  
  // Set the user's preference for showing productivity stats
  public async setShowProductivityStats(show: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(SHOW_PRODUCTIVITY_STATS_KEY, show.toString());
    } catch (error) {
      console.error('Error setting show productivity stats preference:', error);
    }
  }
  
  // Get the user's custom quotes
  public async getCustomQuotes(): Promise<Quote[]> {
    try {
      const quotesJson = await AsyncStorage.getItem(CUSTOM_QUOTES_KEY);
      return quotesJson ? JSON.parse(quotesJson) : [];
    } catch (error) {
      console.error('Error getting custom quotes:', error);
      return [];
    }
  }
  
  // Add a custom quote
  public async addCustomQuote(quote: Omit<Quote, 'id' | 'isCustom'>): Promise<Quote> {
    try {
      const quotes = await this.getCustomQuotes();
      const newQuote: Quote = {
        ...quote,
        id: `custom-${Date.now()}`,
        isCustom: true
      };
      
      quotes.push(newQuote);
      await AsyncStorage.setItem(CUSTOM_QUOTES_KEY, JSON.stringify(quotes));
      
      return newQuote;
    } catch (error) {
      console.error('Error adding custom quote:', error);
      throw error;
    }
  }
  
  // Delete a custom quote
  public async deleteCustomQuote(id: string): Promise<void> {
    try {
      const quotes = await this.getCustomQuotes();
      const updatedQuotes = quotes.filter(q => q.id !== id);
      await AsyncStorage.setItem(CUSTOM_QUOTES_KEY, JSON.stringify(updatedQuotes));
    } catch (error) {
      console.error('Error deleting custom quote:', error);
      throw error;
    }
  }
  
  // Get the user's preferred quote source
  public async getQuoteSource(): Promise<QuoteSource> {
    try {
      const source = await AsyncStorage.getItem(QUOTE_SOURCE_KEY);
      return (source as QuoteSource) || 'both'; // Default to 'both' if not set
    } catch (error) {
      console.error('Error getting quote source preference:', error);
      return 'both';
    }
  }
  
  // Set the user's preferred quote source
  public async setQuoteSource(source: QuoteSource): Promise<void> {
    try {
      await AsyncStorage.setItem(QUOTE_SOURCE_KEY, source);
    } catch (error) {
      console.error('Error setting quote source preference:', error);
    }
  }
  
  // Get all settings
  public async getSettings(): Promise<MotivationSettings> {
    const [quoteCategory, showProductivityStats, customQuotes, quoteSource] = await Promise.all([
      this.getQuoteCategory(),
      this.getShowProductivityStats(),
      this.getCustomQuotes(),
      this.getQuoteSource()
    ]);
    
    return {
      quoteCategory,
      showProductivityStats,
      customQuotes,
      quoteSource
    };
  }
}

export default MotivationService;
