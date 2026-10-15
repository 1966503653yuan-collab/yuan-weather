import Cocoa
import WebKit
import Network
import UniformTypeIdentifiers

final class LocalServer {
 let queue=DispatchQueue(label:"YuanWeather.local"); var listener:NWListener?
 let root=Bundle.main.resourceURL!.appendingPathComponent("web")
 func start(_ ready:@escaping (Error?)->Void) {
  do {let p=NWParameters.tcp;p.requiredLocalEndpoint = .hostPort(host:"127.0.0.1",port:50371)
   let l=try NWListener(using:p);listener=l
   l.stateUpdateHandler={state in switch state {case .ready: DispatchQueue.main.async{ready(nil)};case .failed(let e):DispatchQueue.main.async{ready(e)};default:break}}
   l.newConnectionHandler={[weak self] c in c.start(queue:self!.queue);self?.receive(c,Data())};l.start(queue:queue)
  }catch{ready(error)}
 }
 func receive(_ c:NWConnection,_ previous:Data){c.receive(minimumIncompleteLength:1,maximumLength:16384){[weak self] data,_,done,error in guard let self else{return};var bytes=previous;bytes.append(data ?? Data());guard bytes.count<=32768 else{c.cancel();return};if let req=String(data:bytes,encoding:.utf8),req.contains("\r\n\r\n") {let parts=req.components(separatedBy:"\r\n")[0].split(separator:" ");guard parts.count>=2,parts[0]=="GET" else{c.cancel();return};var path=String(parts[1]).components(separatedBy:"?")[0].removingPercentEncoding ?? "";if path=="/"{path="/index.html"};let url=self.root.appendingPathComponent(String(path.dropFirst())).standardizedFileURL;let allowed=url.path.hasPrefix(self.root.path+"/") && !path.contains("..");let payload=allowed ? try? Data(contentsOf:url):nil;let types=["html":"text/html","mjs":"text/javascript","js":"text/javascript","css":"text/css","png":"image/png","webmanifest":"application/manifest+json"];let body=payload ?? Data("Not found".utf8);let code=payload == nil ? "404 Not Found":"200 OK";let header="HTTP/1.1 \(code)\r\nContent-Type: \(types[url.pathExtension] ?? "application/octet-stream")\r\nContent-Length: \(body.count)\r\nCache-Control: no-cache\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n";var response=Data(header.utf8);response.append(body);c.send(content:response,completion:.contentProcessed{_ in c.cancel()})}else if done || error != nil{c.cancel()}else{self.receive(c,bytes)}}}
}
final class AppDelegate:NSObject,NSApplicationDelegate,WKUIDelegate,WKNavigationDelegate,WKScriptMessageHandler,NSWindowDelegate {
 var window:NSWindow!;var web:WKWebView!;let server=LocalServer();var status:NSStatusItem!
 func applicationDidFinishLaunching(_ n:Notification){
  NSApp.setActivationPolicy(.regular)
  let menu=NSMenu();let appMenu=NSMenuItem();menu.addItem(appMenu);let sub=NSMenu();appMenu.submenu=sub
  sub.addItem(withTitle:"源的天气 / Météo de Yuan",action:#selector(show),keyEquivalent:"0").target=self
  sub.addItem(withTitle:"退出 / Quitter",action:#selector(NSApplication.terminate(_:)),keyEquivalent:"q")
  let edit=NSMenuItem();edit.title="编辑 / Édition";menu.addItem(edit);let em=NSMenu();edit.submenu=em
  for (title,action,key) in [("剪切 / Couper","cut:","x"),("复制 / Copier","copy:","c"),("粘贴 / Coller","paste:","v"),("全选 / Tout sélectionner","selectAll:","a")] {em.addItem(withTitle:title,action:Selector(action),keyEquivalent:key)}
  NSApp.mainMenu=menu
  let config=WKWebViewConfiguration();config.userContentController.add(self,name:"save");config.userContentController.add(self,name:"fullscreen")
  config.userContentController.addUserScript(WKUserScript(source:"window.YuanMac=true;",injectionTime:.atDocumentStart,forMainFrameOnly:true))
  web=WKWebView(frame:.zero,configuration:config);web.uiDelegate=self;web.navigationDelegate=self
  window=NSWindow(contentRect:NSRect(x:0,y:0,width:1440,height:920),styleMask:[.titled,.closable,.miniaturizable,.resizable],backing:.buffered,defer:false);window.title="源的天气 · Météo de Yuan";window.collectionBehavior.insert(.fullScreenPrimary);window.setFrameAutosaveName("YuanWeatherDesktop");window.minSize=NSSize(width:980,height:680);window.contentView=web;window.delegate=self;window.center();window.makeKeyAndOrderFront(nil)
  status=NSStatusBar.system.statusItem(withLength:NSStatusItem.variableLength);status.button?.title="☀ 源";let sm=NSMenu();sm.addItem(withTitle:"打开 / Ouvrir",action:#selector(show),keyEquivalent:"").target=self;sm.addItem(withTitle:"退出 / Quitter",action:#selector(NSApplication.terminate(_:)),keyEquivalent:"");status.menu=sm
  server.start{[weak self] error in if let error{let a=NSAlert();a.messageText="无法启动 / Démarrage impossible";a.informativeText="本地端口50371可能已被占用，请关闭另一份源的天气后重试。 / Fermer une autre instance et réessayer.\n"+error.localizedDescription;a.runModal()}else{self?.web.load(URLRequest(url:URL(string:"http://127.0.0.1:50371/")!))}}
  NSApp.activate(ignoringOtherApps:true)
 }
 @objc func show(){window.makeKeyAndOrderFront(nil);NSApp.activate(ignoringOtherApps:true)}
 func applicationShouldHandleReopen(_ sender:NSApplication,hasVisibleWindows flag:Bool)->Bool{show();return true}
 func windowShouldClose(_ sender:NSWindow)->Bool{sender.orderOut(nil);return false}
 func userContentController(_ controller:WKUserContentController,didReceive message:WKScriptMessage){guard message.frameInfo.isMainFrame,message.frameInfo.securityOrigin.host=="127.0.0.1" else{return};if message.name=="fullscreen"{window.toggleFullScreen(nil);return};guard let data=message.body as? [String:String],let name=data["name"],let text=data["text"] else{return};let panel=NSSavePanel();panel.nameFieldStringValue=URL(fileURLWithPath:name).lastPathComponent;panel.beginSheetModal(for:window){response in guard response == .OK,let url=panel.url else{return};do{try text.write(to:url,atomically:true,encoding:.utf8)}catch{let alert=NSAlert(error:error);alert.runModal()}}}
 func webView(_ webView:WKWebView,runOpenPanelWith parameters:WKOpenPanelParameters,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping ([URL]?)->Void){let panel=NSOpenPanel();panel.allowsMultipleSelection=false;panel.canChooseDirectories=false;panel.beginSheetModal(for:window){completionHandler($0 == .OK ? panel.urls:nil)}}
 func webView(_ webView:WKWebView,runJavaScriptConfirmPanelWithMessage message:String,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping(Bool)->Void){let a=NSAlert();a.messageText=message;a.addButton(withTitle:"确认 / Confirmer");a.addButton(withTitle:"取消 / Annuler");a.beginSheetModal(for:window){completionHandler($0 == .alertFirstButtonReturn)}}
 func webView(_ webView:WKWebView,runJavaScriptAlertPanelWithMessage message:String,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping()->Void){let a=NSAlert();a.messageText=message;a.beginSheetModal(for:window){_ in completionHandler()}}
 func webView(_ webView:WKWebView,decidePolicyFor navigationAction:WKNavigationAction,decisionHandler:@escaping(WKNavigationActionPolicy)->Void){guard let u=navigationAction.request.url else{decisionHandler(.cancel);return};if u.host=="127.0.0.1" && u.port==50371{decisionHandler(.allow)}else{if u.scheme=="https"{NSWorkspace.shared.open(u)};decisionHandler(.cancel)}}
 func webView(_ webView:WKWebView,createWebViewWith configuration:WKWebViewConfiguration,for navigationAction:WKNavigationAction,windowFeatures:WKWindowFeatures)->WKWebView?{if let u=navigationAction.request.url,u.scheme=="https"{NSWorkspace.shared.open(u)};return nil}
}
let app=NSApplication.shared;let delegate=AppDelegate();app.delegate=delegate;app.run()
