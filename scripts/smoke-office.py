from playwright.sync_api import sync_playwright,expect
import json,uuid
# Run only against local emulated D1: this creates synthetic test records.
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
(ROOT/'outputs').mkdir(exist_ok=True)
BASE='http://127.0.0.1:5173'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 context=browser.new_context(viewport={'width':1920,'height':1280})
 context.add_cookies([{'name':'__sites_local_auth','value':'1','url':BASE}]);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE,wait_until='domcontentloaded');page.wait_for_selector('.office-3d-stage[data-ready=true]');page.get_by_role('button',name='หยุดภาพเคลื่อนไหว',exact=True).click();expect(page.locator('.command-agent-card')).to_have_count(5)
 page.locator('.command-agent-card').nth(1).click();expect(page.locator('.hq-inspector h3')).to_have_text('การตลาด')
 token='smoke-'+str(uuid.uuid4())[:8]
 page.locator('#chat-marketing').fill(token+' วิเคราะห์พื้นที่จากทะเบียนล่าสุด');page.locator('.office-chat').get_by_role('button',name='ส่งข้อความ / บันทึกงาน',exact=True).click()
 expect(page.locator('.office-message').filter(has_text=token)).to_have_count(1)
 page.reload(wait_until='domcontentloaded');page.wait_for_selector('.office-3d-stage[data-ready=true]');page.get_by_role('button',name='หยุดภาพเคลื่อนไหว',exact=True).click();page.locator('.command-agent-card').nth(1).click();expect(page.locator('.office-message').filter(has_text=token)).to_have_count(1)
 page.locator('.command-agent-card').nth(3).click();expect(page.locator('.office-message').filter(has_text=token)).to_have_count(0)
 page.locator('.office-chat').get_by_text('แนบ PDF / Excel / ภาพ / ลิงก์',exact=True).click()
 page.locator('.office-chat input[type=file]').set_input_files({'name':'ทดสอบ.csv','mimeType':'text/csv','buffer':'เดือน,รายรับ\n11,10000'.encode()})
 expect(page.locator('.office-chat .attachment-list a').first).to_contain_text('ทดสอบ.csv')
 page.locator('#chat-finance').fill(token+' อ่านไฟล์การเงิน');page.locator('.office-chat').get_by_role('button',name='ส่งข้อความ / บันทึกงาน',exact=True).click();expect(page.locator('.office-message').filter(has_text=token)).to_have_count(1)
 message=page.locator('.office-message').filter(has_text=token);message.get_by_role('button',name='แก้โจทย์งานเดิม').click();page.locator('#chat-finance').fill(token+' แก้สมมติฐานใหม่');page.get_by_role('button',name='ส่ง revision ใหม่',exact=True).click();expect(page.locator('.office-message').filter(has_text=token)).to_have_count(1)
 message.get_by_role('button',name='ประวัติ revision').click();expect(page.get_by_text('v1',exact=True)).to_be_visible()
 page.goto(BASE+'/#leads',wait_until='domcontentloaded');page.get_by_role('button',name='เพิ่มแบรนด์',exact=True).click();editor=page.locator('.contact-editor');editor.get_by_label('ชื่อแบรนด์',exact=True).fill(token);editor.get_by_label('เบอร์โทร',exact=True).fill('');editor.get_by_role('button',name='บันทึก',exact=True).click();expect(editor).to_have_count(0)
 page.locator('.directory-search input').fill(token);expect(page.locator('.directory-table tbody tr')).to_have_count(1)
 page.reload(wait_until='domcontentloaded');page.locator('.directory-search input').fill(token);expect(page.locator('.directory-table tbody tr')).to_have_count(1)
 page.goto(BASE+'/#settings',wait_until='domcontentloaded');expect(page.get_by_role('heading',name='ความพร้อมและรายงาน PDF')).to_be_visible();expect(page.locator('.report-settings select')).to_have_value('');expect(page.locator('.report-settings input[type=checkbox]')).not_to_be_checked()
 page.goto(BASE,wait_until='domcontentloaded');page.wait_for_selector('.office-3d-stage[data-ready=true]');page.get_by_role('button',name='หยุดภาพเคลื่อนไหว',exact=True).click();page.locator('.office-display').screenshot(path=str(ROOT/'outputs/campus-workflow-ui.png'))
 mobile=browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,reduced_motion='reduce');mobile.add_cookies([{'name':'__sites_local_auth','value':'1','url':BASE}]);m=mobile.new_page();m.on('pageerror',lambda e:errors.append(str(e)));m.goto(BASE,wait_until='domcontentloaded');m.wait_for_selector('.office-3d-stage[data-ready=true]');expect(m.locator('.command-agent-card')).to_have_count(5)
 assert m.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'page-level horizontal overflow'
 m.locator('.office-display').screenshot(path=str(ROOT/'outputs/campus-workflow-mobile.png'))
 # Remove only this run's synthetic records after validation.
 state=context.request.get(BASE+'/api/state').json()
 for item in [i for i in state['items'] if i['title'].startswith(token)]:
  r=context.request.post(BASE+'/api/records',headers={'Origin':BASE},data={'action':'delete','kind':item['kind'],'id':item['id'],'version':item['version']});assert r.status==200
 print(json.dumps({'passed':['5 agents','character opens department chat','command persisted after reload','department isolation','CSV upload','revision history','contact create and reload','email disabled and no repeat by default','desktop preview','mobile reduced motion and no page overflow'],'pageErrors':errors},ensure_ascii=False));assert not errors
 browser.close()
