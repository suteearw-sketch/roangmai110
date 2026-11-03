# โรงไม้110 · Command Center — 3 พฤศจิกายน 2026 (ไทย)

## สถานะส่งมอบ

แก้จากซอร์ส local ล่าสุดใน Roangmai110_3D_Source.zip ไม่สร้าง Site ใหม่ ผู้ใช้อนุญาตให้อัปเดตเว็บจริงแล้ว แต่ **ยังไม่ได้ deploy**: เซสชันไม่มีเครื่องมือ Sites/credentials สำหรับ project เดิม และการเข้าถึง https://roangmai110-hq.sutee-arw.chatgpt.site ผ่าน proxy ถูกปฏิเสธ 403 จึงยังตรวจเทียบ live source ไม่ได้ ไม่ใช่การรออนุมัติผู้ใช้ GitHub main/HEAD ที่ตรวจได้ยังเป็น 119920fe16037fb457bf3858c04c2b2308fbe685 ซึ่งมีเพียงฐาน repository เดิม

ต้องใช้ environment ที่เข้าถึง Sites project appgprj_6ad726b2a2d8819189952a9b09b17b6b ได้ จึงตรวจเทียบ revision ล่าสุดและเผยแพร่กลับ Site เดิมต่อ ห้ามนำ local database หรือข้อมูลทดสอบขึ้น production

## สิ่งที่แก้

- ออฟฟิศ Three.js สองชั้น พร้อมภาพรวม/ชั้น 1/ชั้น 2/สวน กล้องหมุน ซูม เลื่อน และซ่อนชั้นบนเมื่อใช้ชั้นล่าง
- ผนังห้องสีขาว กระจกกั้นห้องเต็มช่วงพื้นถึงเพดานพร้อมประตูเปิด ทางเดินและบันไดเชื่อมกัน จัดห้องและเฟอร์นิเจอร์ใหม่ เก้าอี้ประชุม 6 ตัวหันเข้าโต๊ะ โซฟาห้องเจ้าของหันหา TV
- เจ้าของแสดงชื่อ BOSS โดยยังใช้โมเดล `boos` เดิม ไม่เปลี่ยน proportions/สี/หน้ากาก/เกราะ/ผ้าคลุม ไม่เพิ่มเป็นพนักงาน AI
- Iron Man/director, Captain America/development, Thor/finance, Hulk/marketing, Spider-Man/secretary เป็นโมเดล chibi ใหม่และภาพโปรไฟล์ให้ตรงกัน โดยไม่แก้ department ID
- แอนิเมชันเดิน นั่ง พิมพ์ อ่าน พัก หลับและกิจกรรมพักผ่อน; เส้นทางที่กำหนดหลบเฟอร์นิเจอร์ ผนัง กระจก และบ่อปลา ไม่มีการสร้างผลลัพธ์งานจากแอนิเมชัน
- สวน บ่อปลา ปลาว่าย น้ำตกและผิวน้ำเคลื่อนไหว ต้นไม้ไหว คอกม้า/วัว/ไก่พร้อมสัตว์ น้องหมาเดิน/วิ่ง และหิ่งห้อยจำกัดจำนวนเฉพาะกลางคืน
- ท้องฟ้า gradient/cloud/sun/moon เปลี่ยนต่อเนื่องตามเวลาประเทศไทย ไม่ใช่ข้อมูลพยากรณ์อากาศจริง เวลาเริ่มงาน 05:00 และพัก 00:00–05:00 ภาพกิจกรรมไม่เปลี่ยนสถานะ backend
- ป้ายติดตามตำแหน่งเหนือหัวและจัดหลบกัน มีเส้นชี้กลับตัวละคร; เมื่อหลายคนอยู่ใกล้กันป้ายอาจเยื้องด้านข้าง คลิกโมเดลหรือการ์ดเปิดแชทแยกฝ่ายและยังเห็นฉาก
- Dark Command Center, รายชื่อพนักงาน/ฉาก/แชท, activity tab, ยุบแชท, มือถือใช้แท็บ, quality 3 ระดับและลดการเคลื่อนไหว
- แชท แนบไฟล์ revision ตารางแบรนด์ สรุปเลขา PDF ไทย และ backend/auth เดิมคงไว้ ไม่มี migration ใหม่ ไม่มีการเปิดอีเมลส่งซ้ำ

## โครงสร้างซอร์ส

- `lib/office-campus-building.ts`: ห้อง กระจก ประตู เฟอร์นิเจอร์ บันได
- `lib/office-campus-nature.ts`: สวน น้ำ สัตว์ ต้นไม้ หิ่งห้อย
- `lib/office-campus-nav.ts`: เส้นทางและสถานะการเคลื่อนไหว
- `lib/office-chibi.ts`, `app/chibi-portrait.tsx`: สัดส่วนพนักงานและภาพโปรไฟล์
- `lib/office-campus-sky.ts`: ท้องฟ้าตามเวลาไทย
- `app/office-scene-3d.ts`, `app/office-room.tsx`: render loop กล้อง raycast ป้ายและตัวควบคุม
- `app/live-office.tsx`, `app/command-center.css`, `lib/office-status.ts`: UI/สถานะจริง

## ผลทดสอบและข้อจำกัด

- Unit/integration 94 tests ผ่านทั้งหมด ครอบคลุมระบบงานเดิมและเส้นทาง บันได ประตูกระจก สัดส่วน owner/พนักงาน เวลาไทย และสถานะ
- TypeScript และ production build ผ่าน
- Browser บนแอพ local จริง: WebGL render/กล้อง/4 โซน, เคลื่อนไหวปลา น้ำตก ผิวน้ำ สัตว์ หมา พนักงาน, pause, raycast เลือกโมเดลครบ 5 ฝ่าย, ป้ายตามตัวละคร, เปิดเอกสาร BOSS, activity tab, ยุบ/เปิดแชท, quality, mobile ไม่มี horizontal overflow และ PDF endpoint ผ่าน ไม่มี page error
- Workflow บน D1/R2 local emulator: ส่งคำสั่งและคงอยู่หลัง reload, แยกประวัติฝ่าย, CSV upload, revision history, เพิ่มข้อมูลติดต่อแล้ว reload, อีเมลและส่งซ้ำยังปิด ผ่าน
- ใช้ Chromium SwiftShader (software GPU) และ mobile viewport/touch จำลอง ไม่ใช่ benchmark GPU หรือโทรศัพท์จริง
- เปลี่ยน browser clock จำลองกลางวัน/กลางคืน/00:00/04:59/05:00 เพื่อทดสอบท้องฟ้า หิ่งห้อยและช่วงพัก ภาพกลางคืนระบุ simulated ชัดเจน
- ทดสอบ provider/worker/email ระดับ unit ด้วย mock เท่านั้น ยังไม่ได้ยืนยัน model inference, autonomous worker, email delivery, live auth หรือ production data การบันทึกแชท local สำเร็จไม่ได้หมายความว่า AI production ตอบได้แล้ว
- เส้นทางเป็น waypoint ที่ตรวจตามผังปัจจุบัน ไม่ใช่ dynamic navmesh; หากย้ายเฟอร์นิเจอร์ต้องปรับเส้นทางและทดสอบใหม่ สถานะการประชุม/พักในภาพไม่สร้างบันทึกงานจริง
- source comparison กับ ZIP รอบก่อน: ไฟล์เดิมไม่หาย และ hosting/auth/API routes/schema/migrations/store/jobs/reports/PDF/owner model เดิม byte-identical รายละเอียดใน campus-source-comparison.json

## รันและตรวจซ้ำ

ใช้ขั้นตอนติดตั้ง/local database ใน README แล้วรัน:

```sh
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-office.mjs
pnpm build
python3 scripts/smoke-campus.py
python3 scripts/smoke-office.py
```

Browser scripts ต้องใช้ local server และ Python Playwright กับ Chromium สคริปต์ workflow สร้างข้อมูลทดสอบเฉพาะ local และลบ records ที่มี prefix เฉพาะการทดสอบรอบนั้นเมื่อจบสำเร็จ
