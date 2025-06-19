// utils/avatarConfig.ts

export interface Companion {
  UUID: string;
  companion: string;
  avatar_url: string;
  companion_type: string;
  traits: string;
  speech_pattern: string;
  knowledge_domains: string;
}

export const avatarConfig = {
  // narrative avatars (for different pages)
  informationGatherer: {
    title: "Information Gatherer",
    description:
      "Collects and analyzes information about your church and community to provide meaningful insights.",
    imageUrl: "https://api.dicebear.com/9.x/big-ears-neutral/svg?seed=Katherine",
    accentColor: "#E9407A",
  },
  narrativeBuilder: {
    title: "Narrative Builder",
    description:
      "Your guide to understanding and defining your church's unique calling",
    imageUrl: "https://i.imgur.com/pAZvwn3.png",
    accentColor: "#D62839",
  },
  scenarioPlanner: {
    title: "Scenario Planner",
    description:
      "Assists in developing and evaluating possible future scenarios for your church's ministry.",
    imageUrl: "https://i.imgur.com/pAZvwn3.png",
    accentColor: "#3772FF",
  }
};
