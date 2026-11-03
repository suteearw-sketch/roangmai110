"""Local browser WebGL integration. No model/email calls. Night clock is explicitly simulated."""
from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1];BASE='http://127.0.0.1:5173'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':1920,'height':1280})
 context.add_cookies([{'name':'__sites_local_auth','value':'1','url':BASE}]);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE,wait_until='domcontentloaded');stage=page.locator('.office-3d-stage');expect(stage).to_have_attribute('data-ready','true',timeout=60000)
 canvas=stage.locator('canvas');expect(canvas).to_have_count(1)
 before=page.locator('[data-agent=development]').get_attribute('data-world');dog=stage.get_attribute('data-dog');frame=stage.get_attribute('data-frames');page.wait_for_timeout(1700)
 assert before!=page.locator('[data-agent=development]').get_attribute('data-world'),'actor must move'
 assert dog!=stage.get_attribute('data-dog'),'dog must move'
 assert int(stage.get_attribute('data-frames'))>int(frame),'WebGL renders consecutive frames'
 page.get_by_role('button',name='หยุดภาพเคลื่อนไหว',exact=True).click();before=page.locator('[data-agent=development]').get_attribute('data-world');page.wait_for_timeout(700);assert before==page.locator('[data-agent=development]').get_attribute('data-world')
 canvas.scroll_into_view_if_needed();rect=canvas.bounding_box();selection=[]
 for dept,name in [('director','Iron Man'),('development','Captain America'),('finance','Thor'),('marketing','Hulk'),('secretary','Spider-Man')]:
  # Actual canvas raycast, not a label click or direct React state mutation.
  label=page.locator('[data-agent='+dept+']');coords=label.get_attribute('data-pick').split(',');page.mouse.click(rect['x']+float(coords[0]),rect['y']+float(coords[1]));expect(label).to_have_attribute('aria-pressed','true');expect(page.locator('.office-chat-identity')).to_contain_text(name);expect(page.locator('#chat-'+dept)).to_have_count(1);selection.append(dept)
 before=page.locator('[data-agent=development]').get_attribute('data-pick');page.mouse.move(rect['x']+rect['width']*.8,rect['y']+rect['height']*.8);page.mouse.down();page.mouse.move(rect['x']+rect['width']*.8+100,rect['y']+rect['height']*.8-30,steps=12);page.mouse.up();page.wait_for_timeout(500);assert before!=page.locator('[data-agent=development]').get_attribute('data-pick'),'orbit changes projected position'
 before=page.locator('[data-agent=development]').get_attribute('data-pick');page.get_by_role('button',name='ซูมเข้า',exact=True).click();page.wait_for_timeout(500);assert before!=page.locator('[data-agent=development]').get_attribute('data-pick'),'zoom changes projection'
 before=page.locator('[data-agent=development]').get_attribute('data-pick');page.mouse.move(rect['x']+400,rect['y']+400);page.mouse.down(button='right');page.mouse.move(rect['x']+460,rect['y']+440,steps=10);page.mouse.up(button='right');page.wait_for_timeout(500);assert before!=page.locator('[data-agent=development]').get_attribute('data-pick'),'pan changes projection'
 page.get_by_role('button',name='คืนมุมกล้อง',exact=True).click();page.wait_for_timeout(500);page.locator('.office-3d').screenshot(path=str(ROOT/'outputs/office-3d-preview.png'))
 # Real PDF endpoint, local emulated storage/server.
 pdf=context.request.get(BASE+'/api/reports?format=pdf');assert pdf.status==200 and pdf.body().startswith(b'%PDF');(ROOT/'outputs/office-3d-report.pdf').write_bytes(pdf.body())
 mobile=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce');mobile.add_cookies([{'name':'__sites_local_auth','value':'1','url':BASE}]);m=mobile.new_page();m.on('pageerror',lambda e:errors.append(str(e)));m.goto(BASE,wait_until='domcontentloaded');expect(m.locator('.office-3d-stage')).to_have_attribute('data-ready','true',timeout=60000);pos=m.locator('[data-agent=development]').get_attribute('data-world');m.wait_for_timeout(700);assert pos==m.locator('[data-agent=development]').get_attribute('data-world');assert m.evaluate('document.documentElement.scrollWidth<=innerWidth');m.locator('.office-3d').screenshot(path=str(ROOT/'outputs/office-3d-mobile.png'));mobile.close()
 # Simulated browser wall clock only; no production clock or backend status modified.
 night=browser.new_context(viewport={'width':1920,'height':1280},reduced_motion='reduce');night.add_cookies([{'name':'__sites_local_auth','value':'1','url':BASE}]);n=night.new_page();n.on('pageerror',lambda e:errors.append(str(e)));n.goto(BASE,wait_until='domcontentloaded');expect(n.locator('.office-3d-stage')).to_have_attribute('data-ready','true',timeout=60000);n.clock.set_fixed_time('2026-11-02T18:00:00Z');expect(n.locator('.office-3d-stage')).to_have_attribute('data-period','sleep');expect(n.locator('.office-3d-toolbar')).to_contain_text('กลางคืน');n.wait_for_timeout(5500);assert n.locator('[data-pose=sleeping]').count()==5;n.locator('.office-3d').screenshot(path=str(ROOT/'outputs/office-3d-night-simulated.png'));night.close()
 # Explicitly simulated backend progress to exercise the active-work visual branch.
 active_context=browser.new_context(viewport={'width':1600,'height':1000},reduced_motion='reduce');active_context.add_cookies([{'name':'__sites_local_auth','value':'1','url':BASE}]);a=active_context.new_page();a.on('pageerror',lambda e:errors.append(str(e)))
 def active_fixture(route):
  response=route.fetch();data=response.json();task=next(i for i in data['items'] if i['kind']=='tasks' and i['department']=='finance');task['status']='doing';task['progress']={'updatedAt':datetime.now(timezone.utc).isoformat(),'message':'SIMULATED backend progress for visual test'};route.fulfill(response=response,json=data)
 a.route('**/api/state',active_fixture);a.goto(BASE,wait_until='domcontentloaded');expect(a.locator('.office-3d-stage')).to_have_attribute('data-ready','true',timeout=60000);expect(a.locator('[data-agent=finance]')).to_have_attribute('data-pose','typing');expect(a.locator('[data-agent=finance]')).to_contain_text('กำลังทำ');assert a.locator('[data-pose=typing]').count()==1;active_context.close()
 assert not errors,errors
 result={'real_local_app':['WebGL frames','actor movement','dog movement','pause','canvas raycast all 5 departments','chat identity all 5','orbit','zoom','pan','PDF endpoint','mobile reduced-motion and no overflow'],'simulated':['Bangkok 01:00 browser clock: 5 sleeping poses','intercepted finance progress: only finance typing'],'renderer':'Chromium WebGL via SwiftShader software GPU','selected':selection,'pageErrors':errors,'productionVerified':False}
 (ROOT/'outputs/office-3d-browser-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False));browser.close()
