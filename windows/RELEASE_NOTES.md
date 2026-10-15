# 源的天气 Windows 1.7.1 · Windows 10 / 11

新增Windows版本，保留现有核心功能：中法双语、GPS路线与每5 km取点、KML/KMZ/CSV导入、媒体跳过及文字桩号碎线筛选、72小时施工颜色表展开、多模型预报、Google可选付费API、报告导出和备份。

## 下载

- **Windows-x64-Setup.exe**：大多数Windows10/11电脑选择此安装程序。
- **Windows-x86-Setup.exe**：32位Windows10使用。
- **Portable.zip**：对应架构的便携包，解压运行YuanWeather.exe。
- **SHA256SUMS**：校验文件。

最低Windows10 1809。应用内含.NET运行库；WebView2缺失时安装程序会联网调用微软签名的安装器。便携版需自行安装WebView2。按用户安装，无需管理员权限。

本机数据放在 `%LOCALAPPDATA%\YuanWeather\WebView2`，升级保留。关闭窗口退出应用，只有运行时执行计划刷新。Google付费入口默认关闭、手动调用；密钥不保存。

Windows应用与安装程序尚无商业代码签名证书。x64和x86均通过71项JavaScript测试、5项Python测试、WebView2界面启动、中法切换、颜色表展开、安装程序执行及安装后启动测试。[构建记录](https://github.com/1966503653yuan-collab/yuan-weather/actions/runs/38706639647)。未完成Windows10/11各版本真实设备的全面验收。

Mac和安卓用户继续使用[v1.7.0](https://github.com/1966503653yuan-collab/yuan-weather/releases/tag/v1.7.0)。

## Français

Nouvelle version Windows10 (1809+) / Windows11. Choisir x64 dans la plupart des cas ; x86 pour Windows10 32bits. Interface chinois/français, fonctions chantier et import de tracés conservés. Runtime.NET inclus ; WebView2 requis, installé depuis Microsoft si nécessaire. Données locales conservées lors des mises à jour. Aucun certificat de signature Windows commercial ; validation exhaustive sur appareils physiques non réalisée.
