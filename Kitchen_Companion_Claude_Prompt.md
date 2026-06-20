# Claude Prompt --- Kitchen Companion PWA

## Role

You are an expert full-stack developer specialising in Progressive Web
Apps (PWA), JavaScript, IndexedDB databases, and mobile-first
applications.

I want you to help me build a personal-use kitchen management app called
Kitchen Companion.

This is not a generic recipe app. It is a personal household food
management system that understands my cooking habits, inventory, budget,
freezer system, meal preferences, and reduces food waste.

Initial technology: - HTML - CSS - Vanilla JavaScript - Progressive Web
App (PWA) - GitHub repository - Mobile-first design - Offline capable -
IndexedDB for local storage

Do not use a backend initially.

## Main Goal

Create an app that helps me: - Track everything I own in my kitchen -
Know what food I have and quantities - Plan meals around existing
ingredients - Reduce food waste - Track grocery spending - Maintain
freezer inventory - Suggest high-protein meals - Support Indian,
Anglo-Indian, Australian and Western cooking styles - Generate weekly
meal plans - Eventually integrate AI meal creation

## User Preferences

The user: - Loves Indian food - Eats rice regularly - Enjoys curry-based
meals - Cooks Anglo-Indian food - Lives with an Australian partner -
Cooks a wide variety of meals

Common meals: - Rice and curry - Chicken dishes - Fish - Beef - Pork -
Spaghetti - Roasts - Soups - Vegetables - Pasta meals

Meals should be satisfying while supporting: - High protein - Lower fat
choices where possible - Approximate calories only

## Main Screens

Bottom navigation: - Home - Meal Planner - Recipes - Kitchen -
Shopping - Settings

## Weekly Meal Planner

Generate: - Breakfast - Lunch - Dinner

Priority: - Lunch for user - Dinner for user and partner

Consider: - Existing inventory - Expiry dates - Frozen foods -
Leftovers - Protein requirements - Budget - Busy days

Allow: - Generate weekly plan - Swap meals - Approve meals

## Recipes

Store: - Personal recipes - Small curated built-in recipe database

Initial database: Around 100 recipes.

Categories: Indian: - Chicken curry - Dal - Sambar - Rasam - Biryani -
Butter chicken - Vindaloo

Anglo-Indian: - Mulligatawny soup - Railway curry - Devil curry -
Kedgeree

Australian/Western: - Roast meals - Pasta - Soups - Casseroles - Stir
fries

Recipe fields: - Name - Cuisine - Meal type - Ingredients and
quantities - Servings - Approx calories - Protein level - Fat level -
Cooking time - Difficulty - Freezer friendly - Leftover friendly - User
rating - Partner rating

## Kitchen Inventory

Locations: - Pantry - Fridge - Freezer - Cooked leftovers

Every item: - Name - Category - Quantity - Unit - Location - Purchase
date - Expiry date optional - Cost optional - Notes

Use metric: - grams - kilograms - millilitres - litres

Allow custom ingredients that are not in the database, such as kokum.

## Freezer System

Support:

1.  Raw frozen ingredients Example: Chicken breast 1000g frozen

2.  Prepared freezer components Example: Individual vegetables:

-   Bok choy
-   Chinese broccoli
-   Mushrooms
-   Spring onion
-   Coriander

Do not combine them into generic "Asian vegetables".

3.  Homemade frozen meals Example: Chicken curry frozen portions.

4.  Purchased frozen meals Example:

-   Lasagne
-   Bolognese
-   Stroganoff
-   Frozen curries

Track: - Quantity - Servings - Cost - Protein rating - Cooking time

## Freezer Movement

Example:

Freezer: Chicken breast 1000g frozen

Move to fridge: 1000g

Result: Chicken breast 1000g defrosting

Cook meal: Uses 600g

Remaining: 400g chicken in fridge needing priority use.

## Batch Cooking

Support: "I Batch Cooked"

Example: Chicken curry: - Made 8 portions - Remove ingredients used -
Create freezer portions - Add future meal options

Support freezer vegetable preparation: - Ingredient - Number of
portions - Portion size

## Freezer Suitability

Ingredients need freezer ratings: - Excellent - Good - Acceptable -
Poor - Avoid

Suggest whether ingredients freeze well.

## Meal Matching

Rank meals by: 1. Uses existing food 2. Uses expiring food 3. Uses
defrosted food 4. High protein 5. Lower fat 6. User preferences 7.
Budget

Show ingredient match percentage.

Example: Chicken curry 95% match. Need coriander only.

## Pantry First Mode

Feature: "Use What I Own"

Prioritise: - Pantry - Fridge - Freezer

Goal: Avoid unnecessary shopping.

## Busy Day Mode

Feature: "I don't want to cook"

Suggest: - Frozen meals - Leftovers - Quick meals under 20 minutes

## Protein Rules

Prioritise: 1. Chicken 2. Fish 3. Lean beef 4. Pork 5. Eggs 6. Legumes

## Cost Tracking

Support flexible costing.

Costs can be optional.

Support purchase events.

Example: Farmers market: Total spent \$50

Items: - Bok choy - Chinese broccoli - Mushrooms - Coriander

Individual prices can be added later.

Track: - Weekly spending - Monthly spending - Food categories -
Estimated meal costs

## Receipt Scanning Future Feature

Design database so future receipt scanning can add: - Item - Quantity -
Weight - Cost

Only ask user: - Storage location - Expiry date if needed

## Snacks and Treats

Categories: Snacks: - Nuts - Chips - Crackers

Treats: - Chocolate - Biscuits - Desserts

Track normally.

## Development Approach

Build in phases.

Phase 1: - PWA structure - Mobile UI - IndexedDB - Navigation -
Inventory

Phase 2: - Recipes - Ingredient matching - Meal planner

Phase 3: - Budget tracking - Batch cooking - Freezer intelligence

Phase 4: - Receipt scanning - AI meal generation - Learning preferences

## First Task

Before writing code: 1. Create app architecture 2. Create database
schema 3. Create file structure 4. Create development roadmap

Then implement Phase 1 only.

Do not build everything at once.
