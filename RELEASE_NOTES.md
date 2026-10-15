# 源的天气 1.8.0 · Yuan Weather · Météo de Yuan

适用于Mac、Android、Windows10/11，增加英语，支持中文/法语/英语循环切换。

- Google可全线查询：每点获取未来168小时预报及此前24小时天气，每次最多8次请求。界面显示全线及30天估算请求数；不自动重试，401/403/429停止后续Google请求。
- 三种施工判定来源：Open-Meteo、Google单独、综合。综合取更严格等级；缺失不补零，明确红色优先，数据不足或过期不能判绿色。
- Google降雨、概率、温度、风/阵风及雷暴天气参与颜色表；历史雨量不代表工地实测。雷暴概率≥30%为黄色核实提示，雷暴天气类型触发红色。合同CCTP及现场测量优先。
- 全球IANA时区，带国家名称和当前UTC偏移；自动处理夏令时，包含半小时/45分钟地区及UTC−12至UTC+14。
- 按所选项目时区06:00和14:00刷新，重新打开补刷。必须保持应用运行、联网并输入Google密钥；手机应用关闭或系统休眠后不保证准点执行。Google密钥及数据仍仅保存在本次会话，重启须重新输入，不写入备份。

下载：Mac通用DMG/ZIP；Android APK（保持既有签名，可覆盖更新）；Windows x64/x86安装包及便携包。Windows最低10 1809，内置.NET，缺少WebView2时安装器联网安装微软组件。

验证包括77项JavaScript测试、5项Python测试，以及Windows构建机启动、英语切换、全球时区菜单和安装后运行检查。Mac界面已检查。未进行用户Google密钥的实际计费查询；Android未真机验证，Windows未完成所有实体机系统版本验收。Mac未Apple公证，Windows无商业签名证书。

English: Route-wide Google forecasts and preceding rainfall, scheduled at 06:00/14:00 while running with a key. Google-only or combined construction risk. Worldwide IANA zones with DST, Chinese/French/English UI. Missing/stale data is not green. Keys and Google data remain session-only; re-enter after restart.

Français : Google sur toute la route, prévisions et pluie antérieure ; actualisation à06h/14h si l’application fonctionne avec la clé. Évaluation Google seule ou combinée. Fuseaux IANA mondiaux, heure d’été, interface chinois/français/anglais. Données manquantes ou périmées : pas de vert. Clé et données Google en mémoire pendant la session uniquement.
