import { supabase } from "@/integrations/supabase/client";

export interface DexaScanResult {
  id: string;
  date: string;
  body_fat_percentage: number;
  lean_mass_kg: number;
  total_weight_kg: number;
  visceral_fat_rating?: number;
  bone_density?: number;
  muscle_mass_kg: number;
  regional_data?: {
    arms?: { fat_percentage: number; lean_mass_kg: number };
    legs?: { fat_percentage: number; lean_mass_kg: number };
    trunk?: { fat_percentage: number; lean_mass_kg: number };
  };
}

export interface BodyspecData {
  results: DexaScanResult[];
  latest_scan?: DexaScanResult;
  progress_metrics?: {
    body_fat_change: number;
    lean_mass_change: number;
    total_weight_change: number;
    scan_count: number;
  };
}

class BodyspecService {
  async connectWithMCP(): Promise<BodyspecData | null> {
    try {
      console.log('Attempting to connect to BodySpec via MCP...');
      
      // Call our edge function that will handle MCP communication
      const { data, error } = await supabase.functions.invoke('bodyspec-mcp-connector', {
        body: { action: 'fetch_scan_data' }
      });

      if (error) {
        console.error('Error connecting to BodySpec MCP:', error);
        return null;
      }

      console.log('BodySpec MCP data received:', data);
      return data;
    } catch (error) {
      console.error('Failed to connect to BodySpec MCP:', error);
      return null;
    }
  }

  async getLatestScan(): Promise<DexaScanResult | null> {
    const bodyspecData = await this.connectWithMCP();
    return bodyspecData?.latest_scan || null;
  }

  async getAllScans(): Promise<DexaScanResult[]> {
    const bodyspecData = await this.connectWithMCP();
    return bodyspecData?.results || [];
  }

  calculateProgress(scans: DexaScanResult[]): BodyspecData['progress_metrics'] | null {
    if (scans.length < 2) return null;

    const latest = scans[scans.length - 1];
    const previous = scans[scans.length - 2];

    return {
      body_fat_change: latest.body_fat_percentage - previous.body_fat_percentage,
      lean_mass_change: latest.lean_mass_kg - previous.lean_mass_kg,
      total_weight_change: latest.total_weight_kg - previous.total_weight_kg,
      scan_count: scans.length
    };
  }

  formatForAICoach(bodyspecData: BodyspecData | null): string {
    if (!bodyspecData || !bodyspecData.latest_scan) {
      return "No BodySpec DEXA scan data available.";
    }

    const { latest_scan, progress_metrics } = bodyspecData;
    
    let analysis = `BODYSPEC DEXA SCAN ANALYSIS:
- Latest scan date: ${new Date(latest_scan.date).toLocaleDateString()}
- Body fat: ${latest_scan.body_fat_percentage.toFixed(1)}%
- Lean mass: ${latest_scan.lean_mass_kg.toFixed(1)}kg
- Total weight: ${latest_scan.total_weight_kg.toFixed(1)}kg
- Muscle mass: ${latest_scan.muscle_mass_kg.toFixed(1)}kg`;

    if (latest_scan.visceral_fat_rating) {
      analysis += `\n- Visceral fat rating: ${latest_scan.visceral_fat_rating}/10`;
    }

    if (latest_scan.bone_density) {
      analysis += `\n- Bone density: ${latest_scan.bone_density.toFixed(2)} g/cm²`;
    }

    if (progress_metrics) {
      analysis += `\n\nPROGRESS SINCE LAST SCAN:
- Body fat change: ${progress_metrics.body_fat_change > 0 ? '+' : ''}${progress_metrics.body_fat_change.toFixed(1)}%
- Lean mass change: ${progress_metrics.lean_mass_change > 0 ? '+' : ''}${progress_metrics.lean_mass_change.toFixed(1)}kg
- Weight change: ${progress_metrics.total_weight_change > 0 ? '+' : ''}${progress_metrics.total_weight_change.toFixed(1)}kg
- Total scans: ${progress_metrics.scan_count}`;
    }

    if (latest_scan.regional_data) {
      analysis += `\n\nREGIONAL ANALYSIS:`;
      if (latest_scan.regional_data.arms) {
        analysis += `\n- Arms: ${latest_scan.regional_data.arms.fat_percentage.toFixed(1)}% fat, ${latest_scan.regional_data.arms.lean_mass_kg.toFixed(1)}kg lean`;
      }
      if (latest_scan.regional_data.legs) {
        analysis += `\n- Legs: ${latest_scan.regional_data.legs.fat_percentage.toFixed(1)}% fat, ${latest_scan.regional_data.legs.lean_mass_kg.toFixed(1)}kg lean`;
      }
      if (latest_scan.regional_data.trunk) {
        analysis += `\n- Trunk: ${latest_scan.regional_data.trunk.fat_percentage.toFixed(1)}% fat, ${latest_scan.regional_data.trunk.lean_mass_kg.toFixed(1)}kg lean`;
      }
    }

    return analysis + "\n\n";
  }
}

export const bodyspecService = new BodyspecService();