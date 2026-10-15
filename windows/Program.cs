using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace YuanWeather;
internal static class Program
{
    [STAThread]
    static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();
        bool smoke = args.Contains("--smoke-test");
        using var mutex = new Mutex(true, smoke ? "YuanWeatherSmoke" : "YuanWeatherDesktop", out bool first);
        if (!first) { MessageBox.Show("源的天气已打开。 / Météo de Yuan est déjà ouverte."); return; }
        Application.Run(new WeatherWindow(smoke));
    }
}
internal sealed class WeatherWindow : Form
{
    const string Origin = "https://yuan-weather.example";
    readonly WebView2 web = new() { Dock = DockStyle.Fill };
    readonly bool smoke;
    readonly string profile;
    FormBorderStyle previousBorder;
    Rectangle previousBounds;
    bool fullscreen;
    public WeatherWindow(bool smoke)
    {
        this.smoke = smoke;
        profile = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "YuanWeather", smoke ? "Smoke-" + Guid.NewGuid() : "WebView2");
        Text = "源的天气 · Météo de Yuan";
        Size = new Size(1440, 920); MinimumSize = new Size(980, 680);
        StartPosition = FormStartPosition.CenterScreen;
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath);
        Controls.Add(web); Shown += async (_, _) => await Initialize();
        FormClosed += (_, _) => web.Dispose();
    }
    static bool Local(string? url) => Uri.TryCreate(url, UriKind.Absolute, out var uri) && uri.GetLeftPart(UriPartial.Authority) == Origin;
    static void External(string url)
    {
        if (Uri.TryCreate(url, UriKind.Absolute, out var uri) && uri.Scheme == "https")
            Process.Start(new ProcessStartInfo(uri.AbsoluteUri) { UseShellExecute = true });
    }
    async Task Initialize()
    {
        try
        {
            var env = await CoreWebView2Environment.CreateAsync(null, profile);
            await web.EnsureCoreWebView2Async(env);
            var core = web.CoreWebView2;
            core.SetVirtualHostNameToFolderMapping("yuan-weather.example", Path.Combine(AppContext.BaseDirectory, "web"), CoreWebView2HostResourceAccessKind.DenyCors);
            core.Settings.AreHostObjectsAllowed = false;
            core.Settings.IsPasswordAutosaveEnabled = false;
            core.Settings.IsGeneralAutofillEnabled = false;
            core.PermissionRequested += (_, e) => e.State = CoreWebView2PermissionState.Deny;
            core.NavigationStarting += (_, e) => { if (!Local(e.Uri)) { e.Cancel = true; External(e.Uri); } };
            core.NewWindowRequested += (_, e) => { e.Handled = true; External(e.Uri); };
            core.WebMessageReceived += SaveMessage;
            await core.AddScriptToExecuteOnDocumentCreatedAsync("""
                if (location.origin === 'https://yuan-weather.example' && window === window.top) {
                  window.YuanWindows = true;
                  window.YuanMac = true; // Shared desktop styling and foreground scheduling.
                  window.webkit = {messageHandlers: {
                    save: {postMessage: data => chrome.webview.postMessage({kind:'save', ...data})},
                    fullscreen: {postMessage: () => chrome.webview.postMessage({kind:'fullscreen'})}
                  }};
                  document.addEventListener('DOMContentLoaded', () => {
                    const css = document.createElement('link'); css.rel='stylesheet'; css.href='desktop.css'; document.head.append(css);
                    const script = document.createElement('script'); script.type='module'; script.src='desktop.js'; document.body.append(script);
                  });
                }
                """);
            core.Navigate(Origin + "/index.html");
            if (smoke) await SmokeTest();
        }
        catch (Exception ex)
        {
            if (smoke) { File.WriteAllText(Path.Combine(AppContext.BaseDirectory, "smoke-error.txt"), ex.ToString()); Environment.ExitCode = 1; Close(); return; }
            var missing = ex is WebView2RuntimeNotFoundException;
            var text = missing ? "需要 Microsoft Edge WebView2 Runtime。是否打开微软官方下载页面？\nMicrosoft Edge WebView2 Runtime requis. Ouvrir le téléchargement officiel ?" : "启动失败 / Échec du démarrage :\n" + ex.Message;
            if (MessageBox.Show(text, Text, missing ? MessageBoxButtons.YesNo : MessageBoxButtons.OK, MessageBoxIcon.Information) == DialogResult.Yes)
                External("https://developer.microsoft.com/microsoft-edge/webview2/");
            Close();
        }
    }
    void SaveMessage(object? sender, CoreWebView2WebMessageReceivedEventArgs e)
    {
        if (!Local(e.Source)) return;
        try
        {
            using var json = JsonDocument.Parse(e.WebMessageAsJson);
            var data = json.RootElement;
            if (data.GetProperty("kind").GetString() == "fullscreen")
            {
                if (!fullscreen) { previousBorder = FormBorderStyle; previousBounds = Bounds; FormBorderStyle = FormBorderStyle.None; WindowState = FormWindowState.Normal; Bounds = Screen.FromControl(this).Bounds; }
                else { FormBorderStyle = previousBorder; Bounds = previousBounds; }
                fullscreen = !fullscreen; return;
            }
            if (data.GetProperty("kind").GetString() != "save") return;
            var name = Path.GetFileName(data.GetProperty("name").GetString() ?? "export.txt");
            var text = data.GetProperty("text").GetString();
            if (string.IsNullOrWhiteSpace(name) || text == null) return;
            using var dialog = new SaveFileDialog { FileName = name, OverwritePrompt = true, AddExtension = true, DefaultExt = Path.GetExtension(name).TrimStart('.') };
            if (dialog.ShowDialog(this) == DialogResult.OK) File.WriteAllText(dialog.FileName, text, new UTF8Encoding(true));
        }
        catch (Exception ex) { MessageBox.Show("导出失败 / Échec de l’export : " + ex.Message, Text); }
    }
    async Task SmokeTest()
    {
        var core = web.CoreWebView2;
        for (int i = 0; i < 120; i++)
        {
            if (await core.ExecuteScriptAsync("Boolean(document.querySelector('#expandSchedule') && document.querySelector('#googleEnabled'))") == "true") break;
            await Task.Delay(500);
            if (i == 119) throw new Exception("UI did not initialize");
        }
        async Task Check(string script, string label)
        {
            if (await core.ExecuteScriptAsync(script) != "true") throw new Exception("Smoke failed: " + label);
        }
        await Check("document.querySelector('#googleEnabled').checked === false", "paid default off");
        await core.ExecuteScriptAsync("document.querySelector('#expandSchedule').click()");
        await Check("document.querySelector('#scheduleWorkspace').hidden === false", "expanded schedule");
        await core.ExecuteScriptAsync("document.querySelector('#collapseSchedule').click(); document.querySelector('#language').click()");
        await Task.Delay(500);
        await Check("document.documentElement.lang === 'fr'", "French language");
        await core.ExecuteScriptAsync("document.querySelector('#language').click()");
        await Task.Delay(500);
        await Check("document.documentElement.lang === 'en'", "English language");
        await core.ExecuteScriptAsync("document.querySelectorAll('#nav button')[2].click()");
        await Task.Delay(300);
        await Check("document.querySelector('#zone').options.length > 300", "global time zones");
        await core.ExecuteScriptAsync("document.querySelectorAll('#nav button')[0].click()");
        await Check("Boolean(window.YuanWindows && window.webkit.messageHandlers.save && window.Worker)", "native bridge and worker");
        using (var image = File.Create(Path.Combine(AppContext.BaseDirectory, "windows-smoke.png")))
            await core.CapturePreviewAsync(CoreWebView2CapturePreviewImageFormat.Png, image);
        File.WriteAllText(Path.Combine(AppContext.BaseDirectory, "smoke-result.txt"), "PASS: WebView2 startup, local assets, paid-default-off, expanded schedule, Chinese/French, bridge, workers.");
        Close();
    }
}
