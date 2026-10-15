#ifndef Arch
#define Arch "x64"
#endif
[Setup]
AppId={{A73D8539-E608-488D-9103-8D1A00220F16}
AppName=源的天气 / Météo de Yuan
AppVersion=1.8.0
AppPublisher=1966503653yuan-collab
AppPublisherURL=https://github.com/1966503653yuan-collab/yuan-weather
DefaultDirName={localappdata}\Programs\YuanWeather
DefaultGroupName=源的天气
PrivilegesRequired=lowest
OutputDir=..\dist
OutputBaseFilename=YuanWeather-1.8.0-Windows-{#Arch}-Setup
SetupIconFile=App.ico
UninstallDisplayIcon={app}\YuanWeather.exe
Compression=lzma2
SolidCompression=yes
MinVersion=10.0.17763
#if Arch == "x64"
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
#endif
CloseApplications=yes
[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "french"; MessagesFile: "compiler:Languages\French.isl"
[Files]
Source: "publish\{#Arch}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "MicrosoftEdgeWebview2Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall
[Tasks]
Name: "desktopicon"; Description: "桌面快捷方式 / Raccourci sur le bureau"; Flags: unchecked
[Icons]
Name: "{group}\源的天气"; Filename: "{app}\YuanWeather.exe"
Name: "{autodesktop}\源的天气"; Filename: "{app}\YuanWeather.exe"; Tasks: desktopicon
[Run]
Filename: "{app}\YuanWeather.exe"; Description: "打开源的天气 / Ouvrir Météo de Yuan"; Flags: nowait postinstall skipifsilent
[Code]
function HasWebView2: Boolean;
var V: String;
begin
 Result := (RegQueryStringValue(HKCU, 'Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', V) and (V <> '') and (V <> '0.0.0.0'));
 if not Result then Result := (RegQueryStringValue(HKLM32, 'Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', V) and (V <> '') and (V <> '0.0.0.0'));
end;
function PrepareToInstall(var NeedsRestart: Boolean): String;
var Code: Integer;
begin
 Result := '';
 if not HasWebView2 then begin
  ExtractTemporaryFile('MicrosoftEdgeWebview2Setup.exe');
  if not Exec(ExpandConstant('{tmp}\MicrosoftEdgeWebview2Setup.exe'), '/silent /install', '', SW_HIDE, ewWaitUntilTerminated, Code) then
   Result := 'WebView2安装失败 / Installation WebView2 impossible. https://developer.microsoft.com/microsoft-edge/webview2/'
  else if not HasWebView2 then
   Result := '请联网安装WebView2后重试 / Installer WebView2 avec une connexion Internet puis réessayer. https://developer.microsoft.com/microsoft-edge/webview2/';
 end;
end;
