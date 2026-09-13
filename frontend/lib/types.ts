export type WasteCategory =
  | "plastic"
  | "paper"
  | "cardboard"
  | "glass"
  | "metal"
  | "biological"
  | "battery"
  | "shoes"
  | "clothes"
  | "trash";

export interface DetectedItem {
  name: string;
  category: WasteCategory;
  quantity: number;
  confidence: number;
  recyclable: boolean;
  disposal_method: string;
}

export interface WasteAnalysisResult {
  items: DetectedItem[];
  total_items: number;
  summary: string;
}

export interface AnalyzeApiResponse {
  success: boolean;
  data: WasteAnalysisResult;
  message?: string;
}

export interface CategoryMeta {
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  iconName: string;
  description: string;
}

export const CATEGORY_DETAILS: Record<WasteCategory, CategoryMeta> = {
  plastic: {
    label: "Plastic",
    badgeBg: "bg-blue-100 dark:bg-blue-950/60",
    badgeText: "text-blue-700 dark:text-blue-300",
    borderColor: "border-blue-500/30",
    iconName: "Milk",
    description: "Bottles, jugs, rigid containers (PETE 1, HDPE 2, PP 5)",
  },
  paper: {
    label: "Paper",
    badgeBg: "bg-amber-100 dark:bg-amber-950/60",
    badgeText: "text-amber-700 dark:text-amber-300",
    borderColor: "border-amber-500/30",
    iconName: "FileText",
    description: "Office paper, newspapers, magazines, clean paper products",
  },
  cardboard: {
    label: "Cardboard",
    badgeBg: "bg-orange-100 dark:bg-orange-950/60",
    badgeText: "text-orange-700 dark:text-orange-300",
    borderColor: "border-orange-500/30",
    iconName: "Package",
    description: "Corrugated boxes, cereal boxes, cartons flattened for disposal",
  },
  glass: {
    label: "Glass",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/60",
    badgeText: "text-emerald-700 dark:text-emerald-300",
    borderColor: "border-emerald-500/30",
    iconName: "Wine",
    description: "Glass bottles, jars, beverage containers (empty and rinsed)",
  },
  metal: {
    label: "Metal",
    badgeBg: "bg-zinc-200 dark:bg-zinc-800",
    badgeText: "text-zinc-800 dark:text-zinc-200",
    borderColor: "border-zinc-500/30",
    iconName: "ShieldAlert",
    description: "Aluminum cans, tin cans, foil, scrap metal",
  },
  biological: {
    label: "Biological / Compost",
    badgeBg: "bg-lime-100 dark:bg-lime-950/60",
    badgeText: "text-lime-700 dark:text-lime-300",
    borderColor: "border-lime-500/30",
    iconName: "Apple",
    description: "Food scraps, fruit peels, leaves, biodegradable organic waste",
  },
  battery: {
    label: "Hazardous / Battery",
    badgeBg: "bg-red-100 dark:bg-red-950/60",
    badgeText: "text-red-700 dark:text-red-300",
    borderColor: "border-red-500/30",
    iconName: "Zap",
    description: "Rechargeable, alkaline, lithium-ion — special drop-off only",
  },
  shoes: {
    label: "Shoes",
    badgeBg: "bg-purple-100 dark:bg-purple-950/60",
    badgeText: "text-purple-700 dark:text-purple-300",
    borderColor: "border-purple-500/30",
    iconName: "Footprints",
    description: "Sneakers, boots, sandals — donate or textile recycling",
  },
  clothes: {
    label: "Clothes",
    badgeBg: "bg-pink-100 dark:bg-pink-950/60",
    badgeText: "text-pink-700 dark:text-pink-300",
    borderColor: "border-pink-500/30",
    iconName: "Shirt",
    description: "Garments, textiles, fabric scraps — donate or textile drop-off",
  },
  trash: {
    label: "Landfill / Trash",
    badgeBg: "bg-gray-200 dark:bg-gray-800",
    badgeText: "text-gray-700 dark:text-gray-300",
    borderColor: "border-gray-500/30",
    iconName: "Trash2",
    description: "Non-recyclable mixed materials, wrappers, broken ceramics",
  },
};
