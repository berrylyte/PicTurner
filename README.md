# PicTurner - Online Sketch Training Tool | 速写定时图片翻页轻量级在线工具
PicTurner is a simple and lightweight web tool designed for **sketch training**. It enables users to set a timer to automatically switch through images, making it ideal for practicing quick sketches and improving efficiency.
PicTurner 是一个轻量级的在线工具，专为速写训练设计。通过定时切换图片，帮助用户高效完成速写练习。

## Live Demo 在线演示  
PicTurner is now live on **GitHub Pages**! 🎉 No installation or setup is required—just open the link in your browser and start your sketch training!  
PicTurner 已上线 **GitHub Pages**！🎉 无需安装或设置，打开浏览器即可开始您的速写训练！  
👉 [Click & Try 点击体验](https://berrylyte.github.io/PicTurner/)

## Features 功能特点
- **Custom Timer 自定义定时器**: Set specific durations for displaying each image. 用户可以设置每张图片的展示时间，满足不同练习需求。
- **Folder Support 文件夹支持**: Load images directly from a local folder for playback. 直接加载本地文件夹中的图片，实现连续播放。
- **Progress Tracking 进度记录**: Automatically remembers the last displayed image, allowing you to resume from where you left off. 自动记录练习进度，下次可从上次停留处继续。
- **User-Friendly Interface 简洁界面**: Minimalist design focused on ease of use. 简洁直观的界面设计，专注于用户体验。

## Interface 界面介绍
The website consists of the following main modules: 网站包括以下主要模块：
1. **Timer Module 定时器模块**: Allows users to set the time interval for image display, tailored for sketch training. 用户可以设置图片展示的时间间隔，适应速写训练需求。
2. **Image Display Module 图片展示模块**: Displays the currently loaded image for sketching. 展示当前加载的速写参考图片。
3. **Countdown Module 倒计时模块**: Shows the remaining time before switching to the next image. 显示切换到下一张图片前的倒计时时间。
4. **Image Switch Module 图片切换模块**: 
   - Automatically changes images based on the set timer. 根据设定的定时器自动切换图片。
   - Supports manual controls including **Pause/Start**, **Previous Image**, and **Next Image**. 支持手动控制，包括**暂停/启动**、**上一张**和**下一张**的按钮操作。

### Screenshots 截图展示
Below are a few screenshots of the application interface: 以下是应用界面的部分截图：

<table>
  <tr>
    <td><img src="assets/screenshots/screenshot1.png" alt="PicTurner Main Interface 主界面" width="400"></td>
    <td><img src="assets/screenshots/screenshot2.png" alt="Folder Settings 选择文件夹" width="400"></td>
  </tr>
  <tr>
    <td><img src="assets/screenshots/screenshot3.png" alt="Image Display 显示图片" width="400"></td>
    <td><img src="assets/screenshots/screenshot4.png" alt="Countdown Timer 倒计时启动！" width="400"></td>
  </tr>
</table>

## How to Use Locally 下载到本地的使用方法

### Requirements 使用环境
- No installation required. 无需安装。
- Any modern web browser that supports HTML, CSS, and JavaScript. 任何支持 HTML、CSS 和 JavaScript 的现代浏览器。

### Steps 使用步骤
1. Open the live demo link in your browser. 在浏览器中打开在线演示链接。
2. Load a folder containing your sketch reference images. 加载包含速写参考图片的文件夹。
3. Set a custom timer for each image. 设置每张图片的定时器时间。
4. Start practicing! 开始练习！

### Installation and Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/berrylyte/PicTurner.git

2. Navigate to the project directory:
   ```bash
   cd PicTurner

3. Open the `index.html` file in your web browser:
   ```bash
   open index.html   

### Suggestions 建议
1. **30 seconds**: Practice dynamic lines to capture motion.  
   **30秒**：练习动态线，捕捉动作。

2. **2 minutes**: Add basic structure (head, torso, hips) to dynamic lines.  
   **2分钟**：在动态线条基础上增加头部、躯干和胯部的基本结构。

3. **5 minutes**: Include details while refining structure and dynamic lines.  
   **5分钟**：在动态线条和结构基础上增加细节。

Use these timed practices to improve speed, proportions, and sketching efficiency.  
通过这些计时练习提升速度、比例感和速写效率。

## Update Record

### To Do
Here are the planned features for future development:

- [ ] Implement a download button to prevent errors caused by needing to log in to the GitHub page. 实现一个下载按钮，帮助用户快速布置到本地。

### Update (10 Aug 2025)
- Add a default timer selection(30s, 1min, 2min, 5min) to make the settings more convenient. 根据常见练习安排添加默认的计时器(30s, 1min, 2min, 5min)选项，使设置更方便。

- Create a Session Log that shows how many pictures have been practiced and for what duratio. 创建一个练习总结，用于显示本次已练习的图片数量和时长。

- Restyle settings panel for better aesthetics. 重新整理设置区排版，使其更美观清晰。

### Update (9 Aug 2025)
- Corrected the pause/play bug. 修复了暂停与播放功能的程序错误。

- Added an extra timer reset button. 添加了额外的计时器重置按钮。

- Added a 3-second countdown voice alert. 添加了3秒倒计时的声音提示。

## Keywords 关键词
PicTurner, sketch training, image switching tool, online timer, 图片切换, 速写训练, 在线工具, 速写练习, 自动图片切换, 图片定时切换, 速写辅助工具

## License
This project is licensed under the **MIT** License. See the `LICENSE file` for details.
