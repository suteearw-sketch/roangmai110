> เอกสารรอบก่อน: ข้อกำหนดชื่อเจ้าของ/ฉาก/การ deploy ถูกแทนที่แล้ว โปรดอ่าน [ส่งมอบล่าสุด](COMMAND_CENTER_HANDOFF_TH.md)

# ส่งมอบออฟฟิศ 3D · 2 พฤศจิกายน 2026

ต่อจากซอร์ส local ที่ส่งมอบรอบก่อน (`outputs/Roangmai110_Updated_Source.zip`) ตามคำสั่งล่าสุดที่ยกเลิกข้อกำหนดภาพ 2D ไม่ได้ดึงหรืออ้างว่าได้ตรวจ source production ล่าสุด และยังไม่ deploy

## สิ่งที่เปลี่ยน

- ฉากหลักเป็น Three.js 0.180.0 / WebGL จริงบน canvas; โหลดเฉพาะ client หลัง mount จึงไม่เรียก WebGL ใน Cloudflare server สร้างห้อง โต๊ะ เก้าอี้ จอ เอกสาร โซฟา ต้นไม้ หมาหรือโมเดลพนักงานใหม่จาก geometry ไม่ใช้ภาพเรนเดอร์พื้นหลังหรือ assets จากวิดีโอ
- Perspective camera มุมสูงเฉียง, OrbitControls ลากหมุน/ลากขวาเลื่อน/ล้อซูม, นิ้วเดียวหมุน/สองนิ้วเลื่อนและซูม, ปุ่มซูม/คืนมุมกล้อง/พักภาพเคลื่อนไหว
- โมเดลมีข้อต่อแขนขา ท่าเดิน นั่งพิมพ์ อ่านเอกสาร พักและหลับ มีเงาและแสงเปลี่ยนตามเวลาไทย หมาสลับความเร็วเดิน/วิ่งและพักกลางคืน
- เส้นทางตรงตามทางเดินเดิมที่หลบโต๊ะและโซฟา; เมื่อสถานะเปลี่ยนระหว่างเดิน ตัวละครเดินตามทางกลับที่นั่งก่อนเปลี่ยนท่า ไม่มีการกระโดดข้ามเฟอร์นิเจอร์ เก้าอี้เป็นตำแหน่งปลายทางสำหรับนั่ง ไม่ใช่ทางผ่าน
- ป้าย HTML ฉายจากตำแหน่ง 3D ของตัวละคร อ่านได้เมื่อกล้องหมุนและหลบป้าย/ตัวละครอื่น คลิกป้ายหรือ raycast ตัวโมเดลเลือก department เดิม แชทอยู่ข้างฉากบน desktop
- 05:00–24:00 ใช้บรรยากาศช่วงทำงาน; 00:00–05:00 แสดงหลับ (คนที่กำลังเดินกลับโต๊ะก่อน) สถานะงานบนป้ายยังมาจาก `agentStatus` จริง แม้ backend มีงานเดิมที่กำลังรับผลในช่วงพักก็ไม่เปลี่ยนสถานะ backend ตามภาพ
- ท่าอ่าน/เดิน/พักเป็นภาพประกอบ ไม่สร้าง records หรือผลลัพธ์งาน ท่าพิมพ์ต้องมี active จาก backend เดิมเท่านั้น เคารพ prefers-reduced-motion และหยุดเวลาภาพเมื่อ tab ซ่อน
- กำหนด visual cast โดยไม่เปลี่ยน department ID: director = Iron Man, development = Captain America, finance = Thor, marketing = Hulk, secretary = Spider-Man อัปเดต profile, แชท, หน้ารายละเอียดงานและผลงานพร้อมกัน; metadata avatar เก่าไม่ลบ แต่ไม่สามารถ override cast ใหม่ได้
- Boos คงชื่อและแบบเดิม: หน้ากากโลหะมีช่องบริเวณปาก เกราะโลหะ ฮู้ดและผ้าคลุมเขียวเข้ม ใช้สีจาก HeroArt เดิม สร้างรูปทรง 3D เพื่อแสดงในฉาก; vector Boos เดิมไม่เปลี่ยนดีไซน์
- หาก WebGL ไม่พร้อม จะแจ้งข้อผิดพลาดและยังเลือกฝ่าย/ใช้แชทจากปุ่มด้านล่างได้ ไม่มีภาพนิ่งปลอมแทนฉาก 3D

## ไฟล์สำคัญ

- `app/office-room.tsx`: lifecycle ฝั่ง client, toolbar, projected labels, error fallback
- `app/office-scene-3d.ts`: ห้อง เฟอร์นิเจอร์ แสง กล้อง render loop raycast และ disposal
- `lib/office-3d-models.ts`: original procedural rigs และท่าทาง
- `lib/office-3d-motion.ts`: การเคลื่อนที่ต่อเนื่อง/เปลี่ยนท่าตาม clock และ backend active
- `lib/office.ts`, `app/api/office/preferences/route.ts`: visual cast ที่กำหนดใหม่
- `app/live-office.tsx`, `app/department-chat.tsx`, `app/hero-art.tsx`, `app/workspace.tsx`, `app/ai-output.tsx`, `app/globals.css`: ชื่อ รูป และการแสดงผลที่สอดคล้องกัน
- `package.json`, `pnpm-lock.yaml`: Three.js และ TypeScript definitions
- `tests/office-3d.test.ts`, `tests/office.test.ts`, `scripts/smoke-office-3d.py`, `scripts/smoke-office.py`: validation

## ผลทดสอบและขอบเขต

1. **แอพ local ที่รันจริง**: Chromium เปิด WebGL canvas ด้วย SwiftShader (software GPU ของ cloud ไม่ใช่การทดสอบ GPU มือถือจริง) ตรวจ render หลาย frame ตำแหน่งพนักงานและหมาเปลี่ยน หยุดภาพได้ คลิกตัว mesh ผ่าน raycaster ถูกทั้ง 5 department แล้วแชทแสดงชื่อตรงกัน หมุน/ซูม/เลื่อนกล้องเปลี่ยน projection จริง
2. **HTTP + local storage จริงใน emulator**: ส่งคำสั่งในหน้าเว็บ เก็บลง local D1 แล้ว reload ยังอยู่ แยกประวัติแผนก อัปโหลด CSV ลง local R2 แก้ revision และเปิดประวัติ เพิ่มแบรนด์แล้วโหลดกลับ ตรวจ defaults รายงาน และ GET PDF ได้ `%PDF` จาก endpoint เดิม ไม่ใช่ mock response ในกลุ่มนี้
3. **มือถือจำลอง**: Chromium viewport 390×844 + touch + reduced motion ไม่มี page overflow ภาพไม่เดินเมื่อ reduce motion ไม่ใช่การรับรองประสิทธิภาพบนอุปกรณ์จริง
4. **จำลองอย่างชัดเจน**: browser clock เวลา 01:00 Bangkok เพื่อตรวจหลับทั้ง 5 คน; intercepted `/api/state` ที่เติม progress การเงินเพื่อตรวจเฉพาะ Thor พิมพ์และป้ายกำลังทำ ไม่ถือว่าโมเดลหรือ worker ทำงานจริง
5. **Unit/integration จำลอง**: `node scripts/test-office.mjs` 84 tests ผ่านทั้งหมด รวมของเดิมและใหม่ ตรวจ cast, rig joints, เส้นทางและระยะห่างเฟอร์นิเจอร์, transition กลับโต๊ะต่อเนื่อง, เวลา, revision/queue, review gate, PDF, email idempotency และ rollback ใช้ SQLite/mock provider/mock email ตาม test harness เดิม
6. `tsc --noEmit` และ `pnpm build` ผ่าน

ภาพ day/mobile มาจากแอพ local ที่รันจริง; ไฟล์ `office-3d-night-simulated.png` ใช้ clock จำลองตามชื่อ รายงานเครื่องอ่านอยู่ใน `outputs/office-3d-browser-results.json` และ `outputs/office-3d-test-results.txt` สคริปต์ browser workflow สร้างข้อมูลทดสอบ local ชื่อ `smoke-…`; รอบนี้ลบเฉพาะ 3 records ทดสอบที่เพิ่งสร้างหลังตรวจเสร็จแล้ว

## สิ่งที่คงเดิม / ยังไม่ยืนยัน

ไม่มี migration ใหม่ในรอบ 3D ไม่มีการแก้ business records จริง, department ID, history, revision backend, queue/worker, ตารางแบรนด์, executive gate, PDF/email logic, Site identity, auth, D1/R2 bindings หรือ audience config เดิม

**ยังไม่ได้ deploy และไม่ได้ตรวจยืนยัน production/model/worker/email** ไม่มีการเรียกโมเดลจริงหรือส่งเมลจริงในรอบนี้ readiness ที่เห็นจาก local เป็นของ local เท่านั้น ต้องตรวจและ merge live Site source ล่าสุดก่อน deployment ภายหลัง ไม่ใช้ local emulator แทนหลักฐานการเชื่อม production

## รันและย้อนกลับ

ใช้คำสั่ง setup ใน README เดิม; frozen lockfile ติดตั้ง Three.js เพิ่มให้โดยอัตโนมัติ ไม่มี env ใหม่ ไม่มี DB migration เพิ่ม ทดสอบ browser ต้องมี Python Playwright และ Chromium พร้อม WebGL; ใน cloud ใช้ `--enable-unsafe-swiftshader` เฉพาะ browser test (ไม่ใช่ flag ที่ตั้งให้ผู้ใช้)

หากย้อน UI รอบนี้ ให้ใช้ source ZIP รอบก่อน โดยเก็บข้อมูล D1/R2 เดิม ไม่มีการ rollback database สำหรับการเปลี่ยน 3D นี้ diff รอบนี้เทียบ ZIP รอบก่อนอยู่ใน `outputs/office-3d-changes.patch` และ source พร้อมใช้อยู่ใน `outputs/Roangmai110_3D_Source.zip`
