import io,sys,unittest,zipfile,tempfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
from prepare_route import read_lines,merge,prepare
K=b'<kml><Placemark><name>A</name><MultiGeometry><LineString><coordinates>2,7 3,7</coordinates></LineString><LineString><coordinates>4,7 3,7</coordinates></LineString></MultiGeometry></Placemark></kml>'
class Tests(unittest.TestCase):
 def test_join(self):
  r=merge(read_lines(io.BytesIO(K),'doc'));self.assertEqual(len(r),1);self.assertEqual(r[0]['segments'],2);self.assertEqual(len(r[0]['path']),3)
 def test_entity(self):
  with self.assertRaises(ValueError):read_lines(io.BytesIO(b'<!DOCTYPE kml><kml/>'),'doc')
 def test_zip64(self):
  with tempfile.TemporaryDirectory() as d:
   p=Path(d)/'test.kmz'
   with zipfile.ZipFile(p,'w') as z:
    with z.open('nested/doc.kml','w',force_zip64=True) as f:f.write(K)
    z.writestr('media.jpg',b'ignored')
   report=prepare(p,Path(d)/'out');self.assertEqual(report['input_segments'],2)
   r=read_lines((Path(d)/'out'/'全部线路.kml').open('rb'),'out');self.assertEqual(len(r),1)
 def test_branches(self):
  def line(a,b,g=0):return dict(group=g,name='x',path=[a,b])
  r=merge([line((0,0),(0,1)),line((0,1),(0,2)),line((0,1),(1,1))]);self.assertEqual(len(r),3)
 def test_groups(self):
  r=merge([dict(group=i,name='x',path=[(0,0),(0,1)]) for i in range(2)]);self.assertEqual(len(r),2)
if __name__=='__main__':unittest.main()
