export const DEFAULT_SHOP_ID = "main-shop";

export const DEFAULT_STAFF = [
  { id: "stan", name: "stan" },
  { id: "akira", name: "akira" },
  { id: "manager", name: "manager" }
];

export const DEFAULT_CHECKLIST = [
  {
    id: "receiving-materials",
    category: "general",
    title: "Raw material receiving check",
    timing: "Before prep",
    method: "Confirm supplier, packaging condition, freshness, and date labels.",
    action: "Separate suspicious items, record details, and notify the manager."
  },
  {
    id: "fridge-temperature",
    category: "important",
    title: "Fridge temperature",
    timing: "Start of day",
    method: "Confirm the fridge is at or below 5 C.",
    defaultValue: "4 C",
    action: "Move food if needed, close the door, recheck after 30 minutes, and record the result."
  },
  {
    id: "freezer-temperature",
    category: "important",
    title: "Freezer temperature",
    timing: "Start of day",
    method: "Confirm the freezer is at or below -18 C.",
    defaultValue: "-18 C",
    action: "Move food if needed, check the door/seal, recheck, and record the result."
  },
  {
    id: "cross-contamination",
    category: "general",
    title: "Cross-contamination prevention",
    timing: "During prep",
    method: "Confirm raw and ready-to-eat foods use separated tools and surfaces.",
    action: "Stop prep, clean and disinfect surfaces/tools, and discard unsafe food if needed."
  },
  {
    id: "tools-cleaning",
    category: "general",
    title: "Tools washing and disinfection",
    timing: "Before use and after use",
    method: "Confirm cutting boards, knives, bowls, and utensils are washed and disinfected.",
    action: "Wash again with detergent, rinse, disinfect, and air dry."
  },
  {
    id: "toilet-cleaning",
    category: "general",
    title: "Toilet cleaning and disinfection",
    timing: "Start of day",
    method: "Confirm toilet, sink, handles, and shared touch points are clean.",
    action: "Clean and disinfect again, then record who handled it."
  },
  {
    id: "staff-health",
    category: "general",
    title: "Staff health management",
    timing: "Before shift",
    method: "Confirm staff have no fever, vomiting, diarrhea, or wounds that affect food handling.",
    action: "Move affected staff away from food handling and notify the manager."
  },
  {
    id: "handwashing",
    category: "general",
    title: "Handwashing",
    timing: "Before work and after contamination risk",
    method: "Confirm staff wash hands at required moments.",
    action: "Stop work and wash hands correctly before continuing."
  },
  {
    id: "non-heated-food",
    category: "important",
    title: "Non-heated food handling",
    timing: "During prep",
    method: "Confirm food is handled cold, cleanly, and within safe holding time.",
    action: "Discard unsafe food and record the cause."
  },
  {
    id: "heated-food",
    category: "important",
    title: "Heating food",
    timing: "During cooking",
    method: "Confirm heating reaches the required internal temperature.",
    action: "Continue heating, recheck, and record the corrected result."
  },
  {
    id: "hot-holding",
    category: "important",
    title: "Hot holding after heating",
    timing: "After cooking",
    method: "Confirm hot food remains hot enough until serving.",
    action: "Reheat if allowed, otherwise discard and record."
  },
  {
    id: "cooling-food",
    category: "important",
    title: "Cooling heated food",
    timing: "After cooking",
    method: "Confirm food is cooled quickly and stored safely.",
    action: "Change container, use an ice bath or blast chiller, and record timing."
  }
];
