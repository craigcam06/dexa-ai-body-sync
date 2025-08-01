import { useState, useEffect } from 'react';
import { Search, Scan, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BarcodeScanner } from './BarcodeScanner';

interface FoodItem {
  id?: string;
  external_id: string;
  api_source: 'usda' | 'fatsecret';
  name: string;
  brand?: string;
  barcode?: string;
  calories_per_100g: number;
  protein_per_100g: number;
  carbs_per_100g: number;
  fats_per_100g: number;
  fiber_per_100g?: number;
  sugar_per_100g?: number;
  sodium_per_100g?: number;
  serving_size_g: number;
  serving_description?: string;
  search_terms?: string[];
}

interface FoodSearchProps {
  onSelectFood: (food: FoodItem) => void;
  onAddCustom: () => void;
}

export const FoodSearch = ({ onSelectFood, onAddCustom }: FoodSearchProps) => {
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { toast } = useToast();

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent_food_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const saveRecentSearch = (searchTerm: string) => {
    const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent_food_searches', JSON.stringify(updated));
  };

  const testSecrets = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('test-secrets');
      if (error) throw error;
      console.log('Secrets test result:', data);
      toast({
        title: "Secrets Test",
        description: `Client ID: ${data.secrets.FATSECRET_CLIENT_ID ? 'Available' : 'Missing'}, Client Secret: ${data.secrets.FATSECRET_CLIENT_SECRET ? 'Available' : 'Missing'}`,
      });
    } catch (error) {
      console.error('Secrets test error:', error);
      toast({
        title: "Error",
        description: "Failed to test secrets",
        variant: "destructive",
      });
    }
  };

  const debugFatSecret = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('debug-fatsecret');
      if (error) throw error;
      console.log('FatSecret debug result:', data);
      toast({
        title: "FatSecret Debug",
        description: `Success: ${data.success}, Results: ${data.resultsCount || 0}`,
      });
    } catch (error) {
      console.error('FatSecret debug error:', error);
      toast({
        title: "Error",
        description: "Failed to debug FatSecret API",
        variant: "destructive",
      });
    }
  };

  const searchFoods = async (searchQuery: string, isBarcode = false) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('food-search', {
        body: isBarcode ? { barcode: searchQuery } : { query: searchQuery }
      });

      if (error) {
        console.error('Food search error:', error);
        toast({
          title: "Search Error",
          description: "Failed to search for foods. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setFoods(data.foods || []);
      
      if (!isBarcode) {
        saveRecentSearch(searchQuery);
      }

      if (data.cached) {
        toast({
          title: "Results from cache",
          description: `Found ${data.foods?.length || 0} cached results`,
        });
      } else {
        toast({
          title: "Search complete",
          description: `Found ${data.foods?.length || 0} foods from ${Object.entries(data.sources || {}).map(([source, count]) => `${count} ${source}`).join(', ')}`,
        });
      }

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search for foods. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchFoods(query);
  };

  const handleBarcodeDetected = (barcode: string) => {
    setShowScanner(false);
    setQuery(barcode);
    searchFoods(barcode, true);
  };

  const formatNutrition = (food: FoodItem) => {
    return `${Math.round(food.calories_per_100g)}cal • ${Math.round(food.protein_per_100g)}p • ${Math.round(food.carbs_per_100g)}c • ${Math.round(food.fats_per_100g)}f`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Foods
          </CardTitle>
          <CardDescription>
            Search for foods or scan barcodes to add to your meal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Search for foods..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={loading || !query.trim()}>
                <Search className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowScanner(!showScanner)}
              >
                <Scan className="h-4 w-4" />
              </Button>
            </div>
            
            {recentSearches.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Recent searches
                </div>
                <div className="flex flex-wrap gap-1">
                  {recentSearches.map((search, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuery(search);
                        searchFoods(search);
                      }}
                      className="h-7 text-xs"
                    >
                      {search}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {showScanner && (
            <BarcodeScanner
              onBarcodeDetected={handleBarcodeDetected}
              onClose={() => setShowScanner(false)}
            />
          )}

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {loading ? 'Searching...' : `${foods.length} results`}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={testSecrets}>
                Test Secrets
              </Button>
              <Button variant="outline" size="sm" onClick={debugFatSecret}>
                Debug API
              </Button>
              <Button variant="outline" size="sm" onClick={onAddCustom}>
                <Plus className="h-4 w-4 mr-1" />
                Add Custom Food
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {foods.length > 0 && (
        <div className="space-y-2">
          {foods.map((food, index) => (
            <Card 
              key={`${food.api_source}-${food.external_id}-${index}`}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => onSelectFood(food)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{food.name}</h3>
                      <Badge variant={food.api_source === 'usda' ? 'default' : 'secondary'}>
                        {food.api_source.toUpperCase()}
                      </Badge>
                    </div>
                    {food.brand && (
                      <p className="text-sm text-muted-foreground mb-1">{food.brand}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {formatNutrition(food)} per 100g
                    </p>
                    {food.serving_description && (
                      <p className="text-xs text-muted-foreground">
                        Serving: {food.serving_description} ({food.serving_size_g}g)
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};