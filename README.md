# 🌵 Cactus Digital Menu

منوی دیجیتال کافه کاکتوس — پروژه‌ای برای مقایسه عملی خروجی
مدل‌های مختلف زبانی روی یک بریف واحد UI/UX.

## ساختار

| مدل | مسیر | فایل اسکریپت |
|—|—|—|
| GPT | `gpt-0/` `gpt-1/` `gpt-2/` | `script.js` / `app.js` |
| Claude | `claude-0/` `claude-1/` `claude-2/` | `script.js` / `app.js` |
| Gemini | `gemini/` | `script.js` |
| Grok | `grok/` | `script.js` |
| DeepSeek | `deepseek/` | `script.js` |
| نسخه‌های اولیه | `pre-beta/` | — |

## استک

HTML5 · CSS3 · Vanilla JavaScript · JSON (منبع داده: `menu.json`)

## اجرا

هر پوشه مستقل است. `index.html` را باز کن یا:

    npx serve gpt-2
