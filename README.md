# Expense & Budget Visualizer

A mobile-friendly web app to track daily spending, visualize categories, and manage a monthly budget — all without a backend.

## Features

| Feature | Details |
|---|---|
| **Balance Overview** | Live income, expense, and net balance cards |
| **Add / Edit / Delete Transactions** | Description, amount, type, category, date, note |
| **Spending Chart** | Doughnut, Pie, or Bar chart via Chart.js — switches live |
| **Custom Categories** | Add with name + color picker; delete if unused |
| **Sort Transactions** | By newest, oldest, amount ↑↓, or category |
| **Filter by Category** | Tap a chip to filter the list |
| **Monthly Spending Limit** | Progress bar turns yellow at 75%, red at 100% |
| **Over-Limit Highlights** | Individual transactions ≥ 20% of limit are flagged |
| **Dark / Light Mode** | Toggle persisted to LocalStorage |
| **100% Client-Side** | All data stored in browser LocalStorage, no server needed |

## Tech Stack

- **HTML5** — semantic structure, ARIA attributes, accessible modals
- **CSS3** — one file (`css/styles.css`), CSS custom properties, mobile-first, dark/light themes
- **Vanilla JavaScript** — one file (`js/app.js`), no frameworks
- **Chart.js 4.4** — loaded from CDN for charts
- **LocalStorage** — all persistence is client-side

## Project Structure

```
index.html          ← App shell, modals, canvas
css/
  styles.css        ← All styles (only 1 file)
js/
  app.js            ← All logic (only 1 file)
```

## Getting Started

Just open `index.html` in any modern browser — no install or build step required.

```bash
# Or serve locally to avoid any CORS edge cases
npx serve .
```

## Browser Support

Chrome · Firefox · Edge · Safari (modern versions)

---

**Author:** Muhamad Farhan Awaludin — CodingCamp Bootcamp SE Capstone
