#!/usr/bin/env python3
"""Offline KML/KMZ route preparation; Python 3 standard library only."""
import argparse, csv, json, math, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape
from collections import defaultdict

def distance(a,b):
    p,q=map(math.radians,(a[0],b[0]));d=math.radians(b[1]-a[1]);h=math.sin((q-p)/2)**2+math.cos(p)*math.cos(q)*math.sin(d/2)**2
    return 6371000*2*math.asin(min(1,math.sqrt(h)))

class XMLStream:
    """Reject DTD/entities even across read boundaries, including UTF-16 input."""
    def __init__(self,stream):self.stream=stream;self.tail=b''
    def read(self,size=-1):
        data=self.stream.read(size);probe=(self.tail+data).replace(b'\x00',b'').upper()
        if b'<!DOCTYPE' in probe or b'<!ENTITY' in probe:raise ValueError('不支持 DTD / ENTITY 声明')
        self.tail=(self.tail+data)[-64:];return data

def read_lines(stream,source):
    stack=[];groups=[];serial=0;routes=[];root=None
    for event,e in ET.iterparse(XMLStream(stream),events=('start','end')):
        tag=e.tag.rsplit('}',1)[-1]
        if event=='start':
            if root is None:
                root=e
                if tag!='kml':raise ValueError('文件根元素不是 KML')
            stack.append(e)
            if tag=='Placemark':serial+=1;groups.append({'id':serial,'name':''})
            continue
        if tag=='name' and len(stack)>1 and stack[-2].tag.rsplit('}',1)[-1]=='Placemark' and groups:groups[-1]['name']=e.text or ''
        if tag in ('LineString','Track'):
            values=[]
            if tag=='LineString':
                c=next((c for c in e if c.tag.rsplit('}',1)[-1]=='coordinates'),None)
                if c is None:raise ValueError('线路缺少 coordinates')
                tokens=(c.text or '').split()
                for token in tokens:
                    a=token.split(',')
                    if len(a)<2 or not a[0].strip() or not a[1].strip():raise ValueError('坐标格式无效')
                    values.append((float(a[1]),float(a[0])))
            else:
                for c in e:
                    if c.tag.rsplit('}',1)[-1]=='coord':
                        a=(c.text or '').split();values.append((float(a[1]),float(a[0])))
            path=[]
            for p in values:
                if not all(math.isfinite(v) for v in p) or not (-90<=p[0]<=90 and -180<=p[1]<=180):raise ValueError('坐标超出 WGS84 范围')
                if not path or path[-1]!=p:path.append(p)
            if len(path)>=2:
                group=groups[-1] if groups else {'id':0,'name':''}
                routes.append(dict(group=(source,group['id']),name=group['name'] or source,path=path,segments=1))
        if tag=='Placemark':groups.pop()
        # Keep only geometry children until their parent is processed.
        if not any(n.tag.rsplit('}',1)[-1] in ('LineString','Track') for n in stack[:-1]):
            if len(stack)>1:stack[-2].remove(e)
            e.clear()
        stack.pop()
    return routes

def merge(routes):
    nodes=defaultdict(list);used=set();result=[]
    def key(r,p):return (r['group'],p)
    for i,r in enumerate(routes):
        for p in (r['path'][0],r['path'][-1]):nodes[key(r,p)].append(i)
    def walk(i,reverse):
        first=routes[i];path=[];count=0
        while i not in used:
            r=routes[i];used.add(i);points=list(reversed(r['path'])) if reverse else r['path'];path.extend(points[1:] if path else points);count+=1
            links=nodes[key(r,points[-1])]
            if len(links)!=2:break
            nxt=next((j for j in links if j not in used),None)
            if nxt is None:break
            reverse=routes[nxt]['path'][0]!=points[-1];i=nxt
        result.append(dict(name=first['name'],path=path,segments=count,length=sum(distance(a,b) for a,b in zip(path,path[1:]))))
    for i,r in enumerate(routes):
        a=len(nodes[key(r,r['path'][0])]);b=len(nodes[key(r,r['path'][-1])])
        if i not in used and (a!=2 or b!=2):walk(i,a==2)
    for i in range(len(routes)):
        if i not in used:walk(i,False)
    return sorted(result,key=lambda r:r['length'],reverse=True)

def write_kml(path,routes):
    with path.open('w',encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2"><Document>')
        for i,r in enumerate(routes,1):
            f.write('<Placemark><name>'+escape(f"{i:05d} · {r['name']} · {r['length']/1000:.3f} km")+'</name><LineString><coordinates>')
            for lat,lon in r['path']:f.write(f'{lon},{lat} ')
            f.write('</coordinates></LineString></Placemark>')
        f.write('</Document></kml>')

def prepare(path,out,top=10):
    routes=[]
    if path.suffix.lower()=='.kmz':
        with zipfile.ZipFile(path) as z:
            for entry in z.infolist():
                if entry.filename.lower().endswith('.kml'):
                    with z.open(entry) as stream:routes.extend(read_lines(stream,entry.filename))
    elif path.suffix.lower()=='.kml':
        with path.open('rb') as stream:routes=read_lines(stream,path.name)
    else:raise ValueError('请选择 .kml 或 .kmz 文件')
    if not routes:raise ValueError('没有可用的 LineString / Track 线路')
    result=merge(routes);out.mkdir(parents=True,exist_ok=False)
    write_kml(out/'全部线路.kml',result)
    for i,r in enumerate(result[:top],1):write_kml(out/f'候选线路-{i:02d}-{r["length"]/1000:.3f}km.kml',[r])
    with (out/'线路清单.csv').open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.writer(f);w.writerow(['序号','原名称','长度km','顶点数','合并段数','起点纬度','起点经度','终点纬度','终点经度'])
        for i,r in enumerate(result,1):
            name=r['name'];name="'"+name if name.startswith(('=','+','-','@')) else name
            w.writerow([i,name,round(r['length']/1000,6),len(r['path']),r['segments'],*r['path'][0],*r['path'][-1]])
    summary=dict(input=str(path),input_segments=len(routes),output_routes=len(result),merged_segments=sum(r['segments'] for r in result),candidates=min(top,len(result)),longest_km=result[0]['length']/1000)
    (out/'处理报告.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
    (out/'使用说明.txt').write_text('请核对候选线路的起终点、方向和施工主线，再导入天气软件。最长不一定是主线。\n仅合并同一地标组内端点完全相同且无分叉的线段；不跨断点，不改变坐标，不简化几何。所有可用线段均保存在全部线路.kml。\n候选文件只包含名称与线路坐标，不含媒体、样式或描述。处理全程离线，原文件不变。\n',encoding='utf-8')
    return summary

if __name__=='__main__':
    ap=argparse.ArgumentParser(description='离线整理 CAD 导出的 KML/KMZ，跳过媒体并连接明确连续的碎线。')
    ap.add_argument('file',type=Path);ap.add_argument('--output',type=Path);ap.add_argument('--top',type=int,default=10,help='单独输出的候选线路数量，默认10；全部线路始终保留')
    args=ap.parse_args()
    if args.top<1:ap.error('--top 必须大于0')
    try:print(json.dumps(prepare(args.file,args.output or args.file.with_name(args.file.stem+'-整理结果'),args.top),ensure_ascii=False,indent=2))
    except Exception as e:ap.exit(1,f'处理失败：{e}\n请检查文件；如输出目录已存在，请换一个 --output 目录。\n')
