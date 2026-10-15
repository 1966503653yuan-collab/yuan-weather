# 源的天气 · Météo de Yuan

面向道路施工排程的中文 / 法语天气应用。Windows版本 **1.7.1**，Mac/Android版本 **1.7.0**，另有可自行托管的网页前端。

## 功能

- 输入起终点GPS，沿道路每5 km取点，可补充桥涵、料场等监测点。
- 导入KML、KMZ、CSV；KMZ跳过图片、视频，流式解析线路；筛除疑似文字、桩号碎线，可查看并恢复隐藏线段。导入后应核实轴线。
- Open-Meteo：ECMWF AIFS、WeatherNext2、ECMWF IFS、DWD ICON，GFS辅助场。
- 未来72小时施工颜色表、未来7天预报、按CCTP调整阈值、报告导出、本机备份、实测降雨复盘。Mac可展开颜色表。
- Google Weather API可选付费入口，按单点手动查询1 / 72 / 168小时，最多1 / 3 / 7次请求。默认关闭、不定时调用、不自动重试。
- 应用打开时06:00 / 14:00刷新；关闭手机应用时不保证执行；不发送推送。

## 安装

在本仓库 **Releases** 下载：

- **Windows 10 / 11**：提供x64安装程序和便携ZIP；32位Windows10选择x86。最低Windows10 1809。内含.NET运行库，缺少WebView2时安装程序会联网安装微软运行库。应用支持中文/法语；详见 [Windows说明](windows/README.md)。
- Mac：macOS14+，Apple Silicon / Intel通用。DMG内应用拖入Applications。采用本地签名，尚未Apple公证。
- Android：Android8+ APK。相同发行签名可覆盖更新；尚未做安卓真机测试。
- 网页：可自行部署在HTTPS静态站点，通过Safari添加到iPhone主屏幕。此仓库不包含托管账户或自动部署配置。

## Google入口与费用

施工看板底部启用Google Weather API，输入自己的Google Maps Demo / Weather API密钥，选择监测点与时长，手动调用。取消后续请求不能撤销已发送的请求。

Google已宣布WeatherNext3接入Weather API；该接口返回综合预报，不支持选择或验证每条数据的底层模型版本，不提供原始集合成员。Google结果单独展示，不参与现有施工颜色表和WeatherNext集合统计。

生产访问需要启用Weather API和账单；Demo密钥受试用权限和配额限制，收费以Google账户为准。Open-Meteo免费端点也有用途及额度限制，商业施工使用应配置适当订阅。公开的软件不意味着数据可以免费用于所有商业场景。

## 隐私与适用范围

密钥和Google结果仅在当前会话内，不写入备份、历史或离线缓存。仓库不包含API密钥、发行签名私钥、个人路线或用户备份。

路线、Open-Meteo预报和复盘记录保存在设备本地。天气查询向对应服务商发送坐标，道路规划向OSRM发送输入坐标。软件不自建集中收集服务器。

5 km是取点间距，不是模型分辨率；部分小时数据由服务商插值。预报不能替代现场实测、安全管理和CCTP要求。

## 运行与测试

需要Python3、现代浏览器；JavaScript测试建议Node22+。

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory web/dist
# 浏览器打开 http://127.0.0.1:8000
node --test tests/*.test.mjs
python3 -m unittest discover -s tests -p 'test_*.py'
```

## 构建

Mac安装Xcode Command Line Tools和Python3，运行 `bash mac/build.sh`，输出 `dist/源的天气.app`。默认使用当前SDK，可设置 `SDKROOT`；发行包使用macOS26.5 SDK构建。默认本地签名，正式签名与公证需发行者自行配置。

Android安装JDK11+、Android SDK Platform35及Build Tools35.0.0，设置 `ANDROID_HOME`，运行 `bash android/build.sh`。可用 `ANDROID_BUILD_TOOLS` 指定已安装工具版本。默认生成未签名APK。

要生成可安装APK，另设置 `YUAN_KEYSTORE`、`YUAN_KEY_ALIAS`、`YUAN_STORE_PASSWORD`、`YUAN_KEY_PASSWORD`。密码通过环境变量传递，私钥应自行妥善保管。自行签名APK不能覆盖不同签名的发行包。

## 目录

- `web/dist/`：共享网页源码，无前端打包步骤。
- `mac/`：AppKit / WKWebView外壳及桌面扩展。
- `android/`：Java WebView、文件导入导出。
- `windows/`：Windows Forms / WebView2窗口、原生保存对话框和安装程序。
- `tools/`：独立路线清理工具。
- `tests/`：模型计算、Google分页、KMZ读取和路线筛选测试；示例路线为测试夹具。

## 验证状态

1.7.0：71项JavaScript测试通过。Mac界面、Mac签名及Android签名已检查。Google解析使用模拟响应测试，未执行真实计费查询；Android尚未真机验证。

## Français

Application météo pour les travaux routiers : chinois/français, points tous les5km, import KML/KMZ/CSV, tableau horaire72h, prévisions7jours, seuils selon le CCTP. Google Weather API est facultative et potentiellement payante, appelée manuellement pour un seul point. Clé et résultats restent en mémoire pendant la session. Les prévisions Google sont affichées séparément. Aucune notification. Vérifier les conditions réelles du chantier avant toute décision.

## Sources et licences

- [Open-Meteo et abonnements](https://open-meteo.com/en/pricing)
- [Google Weather API](https://developers.google.com/maps/documentation/weather/) · [Facturation](https://developers.google.com/maps/documentation/weather/usage-and-billing)
- [Annonce WeatherNext3](https://blog.google/innovation-and-ai/models-and-research/google-deepmind/introducing-weathernext-3/)
- [OpenStreetMap](https://www.openstreetmap.org/copyright) · [OSRM](https://project-osrm.org/)
- `fflate` et `sax` : licencesMIT conservées dans `web/dist/`.

源码公开供查阅，暂未授予通用开源再利用许可；第三方组件适用各自许可证。Publication pour consultation, sans licence générale de réutilisation à ce stade ; les licences des composants tiers restent applicables.
