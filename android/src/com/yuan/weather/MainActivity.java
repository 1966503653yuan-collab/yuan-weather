package com.yuan.weather;
import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.*;
import android.view.View;
import android.widget.Toast;
import java.io.*;
import java.nio.charset.StandardCharsets;
public class MainActivity extends Activity {
 private WebView web; private ValueCallback<Uri[]> chooser; private String pending;
 private static final String HOST="appassets.androidplatform.net";
 @Override public void onCreate(Bundle b){super.onCreate(b);web=new WebView(this);setContentView(web);web.setOnApplyWindowInsetsListener((v,insets)->{v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets;});
 WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setJavaScriptCanOpenWindowsAutomatically(false);s.setSupportMultipleWindows(false);web.addJavascriptInterface(new ExportBridge(),"YuanAndroid");
 web.setWebViewClient(new WebViewClient(){
 @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest request){Uri u=request.getUrl();if(!HOST.equals(u.getHost())||!"https".equals(u.getScheme()))return null;String path=u.getPath();if(path==null||path.equals("/"))path="/index.html";if(path.contains(".."))return new WebResourceResponse("text/plain","UTF-8",404,"Not found",null,new ByteArrayInputStream(new byte[0]));try{String ext=path.substring(path.lastIndexOf('.')+1),type=ext.equals("mjs")||ext.equals("js")?"text/javascript":ext.equals("css")?"text/css":ext.equals("png")?"image/png":ext.equals("webmanifest")?"application/manifest+json":"text/html";return new WebResourceResponse(type,"UTF-8",getAssets().open("web"+path));}catch(IOException e){return new WebResourceResponse("text/plain","UTF-8",404,"Not found",null,new ByteArrayInputStream(new byte[0]));}}
 @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){Uri u=r.getUrl();if("https".equals(u.getScheme())&&HOST.equals(u.getHost()))return false;if("https".equals(u.getScheme())){try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception e){}}return true;}
 });web.setWebChromeClient(new WebChromeClient(){
 @Override public boolean onJsConfirm(WebView v,String url,String message,JsResult result){new android.app.AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("确认 / Confirmer",(d,w)->result.confirm()).setNegativeButton("取消 / Annuler",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;}
 @Override public boolean onJsAlert(WebView v,String url,String message,JsResult result){new android.app.AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("OK",(d,w)->result.confirm()).setOnCancelListener(d->result.cancel()).show();return true;}

 @Override public boolean onShowFileChooser(WebView v,ValueCallback<Uri[]> cb,FileChooserParams p){if(chooser!=null)chooser.onReceiveValue(null);chooser=cb;Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("*/*");try{startActivityForResult(i,21);}catch(Exception e){chooser.onReceiveValue(null);chooser=null;return false;}return true;}
 });web.loadUrl("https://"+HOST+"/index.html");}
 public class ExportBridge {@JavascriptInterface public void save(String name,String content,String mime){if(content.length()>100*1024*1024)return;runOnUiThread(()->{if(pending!=null){Toast.makeText(MainActivity.this,"请先完成保存 / Terminer l’enregistrement",Toast.LENGTH_LONG).show();return;}pending=content;Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType(mime);i.putExtra(Intent.EXTRA_TITLE,name.replaceAll("[^a-zA-Z0-9._-]","_"));try{startActivityForResult(i,22);}catch(Exception e){pending=null;Toast.makeText(MainActivity.this,"无法保存 / Enregistrement impossible",Toast.LENGTH_LONG).show();}});}}
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);if(request==21&&chooser!=null){chooser.onReceiveValue(result==RESULT_OK&&data!=null?new Uri[]{data.getData()}:null);chooser=null;}if(request==22){String text=pending;pending=null;if(result==RESULT_OK&&data!=null&&text!=null){new Thread(()->{try(OutputStream out=getContentResolver().openOutputStream(data.getData())){out.write(text.getBytes(StandardCharsets.UTF_8));runOnUiThread(()->Toast.makeText(this,"已保存 / Enregistré",Toast.LENGTH_SHORT).show());}catch(Exception e){runOnUiThread(()->Toast.makeText(this,"保存失败 / Échec",Toast.LENGTH_LONG).show());}}).start();}}}
 @Override public void onBackPressed(){if(web.canGoBack())web.goBack();else super.onBackPressed();}
 @Override protected void onDestroy(){if(chooser!=null)chooser.onReceiveValue(null);web.destroy();super.onDestroy();}
}
