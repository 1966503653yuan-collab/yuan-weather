# Windows 10 / 11

Windows 10 1809及以上 / Windows 11。提供x64和x86构建，通常选择x64。原生Windows Forms窗口 + Microsoft WebView2，共享现有天气与线路处理代码。

安装程序按当前用户安装，不要求管理员权限。内含.NET运行库；如果没有WebView2，安装程序会调用微软签名的安装器，需联网。便携ZIP解压后运行YuanWeather.exe，仍需WebView2。

数据保存在 `%LOCALAPPDATA%\YuanWeather\WebView2`，升级保留。卸载不主动删除天气记录，可先在软件内导出备份。Google密钥仍只在会话内，不写入配置。

Windows版保留中文/法语、线路导入与标注碎线筛选、施工颜色表展开、多模型预报、Google可选付费入口、文件导出和备份。关闭窗口会退出；仅应用运行时定时刷新，不推送。

## 构建

在Windows安装.NET8 SDK和Inno Setup6：

```powershell
dotnet publish windows/YuanWeather.csproj -c Release -r win-x64 --self-contained true -o windows/publish/x64
```

完整安装包通过 `.github/workflows/windows.yml` 构建。工作流执行共享逻辑测试并实际启动WebView2验证桌面界面，生成截图证据。工作流只读取仓库，不自动发布版本。

发行版尚未购买Windows代码签名证书。没有做Windows10/11各版本物理设备的完整验收；构建机测试不等同于全平台实机测试。

## Français

Windows10 (1809+) et Windows11 ; choisir x64 sur un système64bits. Installation par utilisateur, runtime.NET inclus. WebView2 requis ; téléchargé depuis Microsoft si absent (connexion nécessaire). Données dans `%LOCALAPPDATA%\YuanWeather\WebView2`. L’interface permet de choisir chinois/français. Fermer la fenêtre quitte l’application. Aucun certificat de signature Windows commercial ; validation physique exhaustive non réalisée.
