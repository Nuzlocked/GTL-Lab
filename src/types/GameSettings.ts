export interface GameSettings {
  shinyFrequency: number; // Percentage chance (1-25%)
  pingSimulation: number; // Refresh flash duration in milliseconds (50-500ms)
  gtlActivity: number; // Max Pokemon per refresh (1-5)
  snipeWindow: number; // How long shinies stay available in milliseconds (800-2000ms)
}

export interface GamePreset {
  name: string;
  description: string;
  settings: GameSettings;
}

export const GAME_PRESETS: GamePreset[] = [
  {
    name: "Normal Day",
    description: "Standard GTL activity with balanced difficulty",
    settings: {
      shinyFrequency: 5,
      pingSimulation: 100,
      gtlActivity: 3,
      snipeWindow: 1200
    }
  },
  {
    name: "Busy",
    description: "High activity GTL with more distractions",
    settings: {
      shinyFrequency: 5,
      pingSimulation: 150,
      gtlActivity: 5,
      snipeWindow: 1500
    }
  },
  {
    name: "Dump",
    description: "Mass shiny release with quick reactions needed",
    settings: {
      shinyFrequency: 25,
      pingSimulation: 500,
      gtlActivity: 2,
      snipeWindow: 900
    }
  }
];

export const DEFAULT_SETTINGS: GameSettings = {
  shinyFrequency: 5, // 5% default
  pingSimulation: 150, // 150ms default
  gtlActivity: 3, // Max 3 Pokemon per refresh default
  snipeWindow: 1000 // 1 second default
}; 