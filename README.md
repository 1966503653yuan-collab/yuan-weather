# 源的天气 · Météo de Yuan

面向道路施工排程的中文 / 法语 / 英语天气应用。当前版本 **1.8.0**，另有可自行托管的网页前端。

## 1.8.0功能

- 中文、法语、英语；全球IANA国家/城市时区，自动处理夏令时。
- 起终点GPS沿路每5km取点；KML/KMZ/CSV导入、媒体跳过、标注碎线筛除和人工恢复。
- Open-Meteo多模型、Google全线168小时预报+24小时历史天气，支持单独或综合施工判定；72小时颜色表可展开。
- Google每点每次最多8次请求，界面提示估算调用量。付费开关默认关闭；启用后按项目时区06:00/14:00刷新。
- 自动刷新要求应用运行、联网和已输入密钥；重开补刷。密钥及Google数据仅会话内，重启后需重新输入。手机关闭应用不能保证执行。
- 缺失和过期不会判绿。雨量、温度、风/阵风及雷暴参与判定；按CCTP和现场实测核实。

## 安装

在本仓库 **Releases** 下载：

- **Windows 10 / 11**：提供x64安装程序和便携ZIP；32位Windows10选择x86。最低Windows10 1809。内含.NET运行库，缺少WebView2时安装程序会联网安装微软运行库。应用支持中文/法语；详见 [Windows说明](windows/README.md)。
- Mac：macOS14+，Apple Silicon / Intel通用。DMG内应用拖入Applications。采用本地签名，尚未Apple公证。
- Android：Android8+ APK。相同发行签名可覆盖更新；尚未做安卓真机测试。
- 网页：可自行部署在HTTPS静态站点，通过Safari添加到iPhone主屏幕。此仓库不包含托管账户或自动部署配置。

## Google入口与费用

施工看板底部启用Google全线接口，选择Google或综合判定，输入密钥；点击全线刷新或保持应用运行等待06:00/14:00。
每点一次最多8次请求（7页预报+1页历史），取消不能撤销已发出的请求。Google提供综合天气，不能指定底层WeatherNext版本，概率不等同于集合成员统计。所有Google衍生结果带归属标注。

Google生产访问需启用Weather API和账单；Demo密钥受试用限制。Open-Meteo商业用途需合适订阅，集合数据需要Professional或以上。

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

Windows1.7.1的x64和x86构建均通过共享测试、WebView2界面检查、安装程序执行及安装后启动检查。[Windows构建记录](https://github.com/1966503653yuan-collab/yuan-weather/actions/runs/38706639647)。测试环境为Windows Server2022构建机，未完成Windows10/11各版本物理设备验收。

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
