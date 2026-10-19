# 地鼠花园

独立、无需构建的 HTML/CSS/JavaScript 小游戏。入口为 `index.html`，可直接由 GitHub Pages/Jekyll 复制发布。原博客首页由 `_sections/game.html` 提供入口。

## 本地预览

在仓库根目录执行 `python3 -m http.server 8765 --bind 127.0.0.1`，访问 `http://127.0.0.1:8765/games/whack-a-mole/`。测试后使用 Ctrl+C 关闭服务。预览整个博客需要另外安装该仓库原有的 Jekyll 环境。

## 玩法

60 秒一局，点击/轻触地鼠，或用 1–9 对应从左到右、从上到下的地洞。普通地鼠 +10，金色地鼠 +30，炸弹 −20（最低 0），每连续命中 5 次额外 +20。扑空、漏掉地鼠、碰炸弹会断连击。空格暂停/继续，Esc 暂停，页面切到后台自动暂停。每种难度分别记录本机最高分；无法使用 localStorage 时仍能正常游玩。

## 音效与素材

音效默认关闭，每次重新加载都重置为关闭。只有主动点击右上角音效按钮才创建 Web Audio 上下文；音效由正弦波合成，不依赖远程音频。三个 SVG 角色和 CSS 花园为本次原创绘制，没有第三方素材、字体、CDN 或跟踪请求。

换皮：替换 `assets/mole.svg`、`assets/golden.svg`、`assets/bomb.svg`（建议保持 180×190 的 viewBox），在 `style.css` 修改色彩与场景，在 `game.js` 的 `MODES` 修改难度、`DURATION` 修改时长。

## 发布

跟随原仓库 GitHub Pages 配置发布，不需要 npm 安装、Actions 构建或 `.nojekyll`，不改变原博客的 Jekyll 配置。部署后路径为 `/games/whack-a-mole/`。

## 验证

运行 `node --test _tests/whack-a-mole.test.cjs`（从仓库根目录）。测试使用模拟 DOM、时钟与音频，不打开桌面窗口、不播放声音。浏览器视觉验证另行进行。
