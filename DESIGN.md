<!-- SEED — re-run /impeccable document once there's code to capture the actual tokens and components. -->

---
name: All-In Podcast 中文站
description: 将 All-In Podcast 精彩内容以中文呈现的内容展示站
---

# Design System: All-In Podcast 中文站

## 1. Overview

**Creative North Star: "The Warm Editorial Desk"**

一个像坐在老朋友书桌前阅读的感觉 — 既有编辑出版物的品质感，又不会让人觉得端着架子。内容是绝对的中心，视觉系统存在的唯一理由就是让文字更好读、观点更突出。

设计密度适中：信息架构扁平清晰，用户不需要思考就能找到想读的内容。排版为中文阅读深度优化，字重、行高、段距都以可读性为唯一核心指标。动效极度克制，仅在状态切换时提供必要的反馈，不做任何干扰阅读的入场编排。

这个系统明确拒绝：冷冰冰的新闻门户感、过度设计的炫技网站、简陋的纯文本博客。参考 Stripe Press 的排版品质感和 Substack 的内容优先哲学，但比前者更温暖、比后者更有编辑质感。

**Key Characteristics:**
- 衬线标题 + 无衬线正文，构建编辑出版物的阅读节奏
- 一个鲜明的主色承担 30-60% 视觉权重，其余交给中性色
- 中文优先：字体、排版、断行、标点都按中文习惯处理
- 零编排动效，hover/focus 状态切换干净直接
- 内容即主角，视觉设计不争夺注意力

## 2. Colors

Committed palette — 一个鲜明的主色承担视觉核心，中性色系构建阅读底色。

### Primary
- **[to be resolved during implementation]** — 主色承担 CTA、链接、高亮、标签等核心交互元素，约占单屏 30-60%。色调方向偏暖，呼应"有温度"的品牌个性。

### Neutral
- **[to be resolved during implementation]** — 阅读底色，从纯白到深灰构建层次。正文色与背景保持 ≥4.5:1 对比度。
- **[to be resolved during implementation]** — 边框、分割线、次要文字。

### Named Rules
**The One Voice Rule.** 主色在同一屏幕上占比不超过 60%，它的克制使用才是重点。大面积的色块留给中性底色，让内容呼吸。

## 3. Typography

**Display Font:** 衬线字体（to be chosen — 编辑感、中文友好）
**Body Font:** 无衬线字体（to be chosen — 中文正文可读性优先）

**Character:** 衬线标题带来编辑出版物的品质锚定，无衬线正文确保长文阅读的清晰度和屏幕舒适度。整体感觉像一本精心排版的杂志，而不是一份技术文档。

### Hierarchy
- **Display** (衬线, clamp(2rem, 5vw, 3.5rem), 1.2): 页面大标题、Hero 区标题。仅在首屏或文章页头部使用。
- **Headline** (衬线, 1.75rem, 1.3): 章节标题、文章标题。构建阅读节奏的主锚点。
- **Title** (无衬线, 1.25rem, 1.4): 卡片标题、小标题。保持信息密度但不喧宾夺主。
- **Body** (无衬线, 1rem/16px, 1.75): 正文。行高针对中文长文优化，最大行宽 65-75ch，避免阅读疲劳。
- **Label** (无衬线, 0.875rem, 1.2, 0.02em tracking): 标签、元信息、日期、分类。小字号但清晰可读。

### Named Rules
**The Line Measure Rule.** 正文最大行宽不超过 75ch。中文段落过长会导致回行追踪困难，这是排版上的硬性约束。

## 4. Elevation

Flat by default。这个系统不使用阴影来表达层次。深度通过色彩层次（中性色的明暗变化）和留白节奏来传达。动效是 restrained 的，shadow 也属于"动效"范畴 — 一个不会动的系统不需要浮起来的卡片。

### Named Rules
**The No Shadow Rule.** 没有阴影。层次来自色块对比和留白，而非 box-shadow。

## 5. Components

（暂无组件 — 将在实现后通过 /impeccable document 扫描模式补全）

## 6. Do's and Don'ts

### Do:
- **Do** 保持中文正文最小 16px，确保移动端可读性。
- **Do** 使用充足的段间距（≥1.5em）让中文段落呼吸。
- **Do** 让内容占据视觉中心，留白是设计的一部分。
- **Do** 使用主色在 ≤60% 的视觉面积内承担交互引导。
- **Do** 支持 prefers-reduced-motion，尊重用户的动效偏好。

### Don't:
- **Don't** 做成冷冰冰的新闻聚合站（如传统媒体门户）。
- **Don't** 使用过度设计的炫技效果（视差滚动、复杂动画干扰阅读）。
- **Don't** 像学术报告一样堆砌术语、缺乏解释。
- **Don't** 做成简陋的纯文本博客（要有基本的视觉层次和品牌感）。
- **Don't** 直接套用英文排版模板（中文需要独立的字体、行高、段距规则）。
- **Don't** 在正文区域使用衬线字体 — 中文屏幕长文阅读，无衬线清晰度更高。
- **Don't** 使用阴影或 elevation 来表达层次。
