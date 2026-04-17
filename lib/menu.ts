import menuItems from "./menu.json";

const drinks = menuItems.filter((item) => item.category === "drink");
const food = menuItems.filter((item) => item.category === "food");

export const MODIFIERS = [
  "with an extra shot",
  "no whip",
  "extra hot",
  "iced",
  "with oat milk",
  "with almond milk",
  "with coconut milk",
  "light ice",
  "no sugar",
  "extra caramel drizzle",
  "with vanilla syrup",
  "with two pumps of hazelnut",
  "skinny",
  "with sugar-free vanilla",
  "decaf",
  "half sweet",
  "extra foam",
];

export function randomPickDrinkAndFood() {
  // random pick 2 from drink and food
  const drink1 = drinks[Math.floor(Math.random() * drinks.length)];
  const drink2 = drinks[Math.floor(Math.random() * drinks.length)];
  const food1 = food[Math.floor(Math.random() * food.length)];
  const food2 = food[Math.floor(Math.random() * food.length)];
  return { drink1, drink2, food1, food2 };
}
