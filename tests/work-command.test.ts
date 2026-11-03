import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workCommand} from '../lib/work-command.ts';
test('attachments and links can be submitted without a typed instruction',()=>{
 assert.match(workCommand('',1,0),/ตรวจเอกสาร/);
 assert.match(workCommand('  ',0,1),/ห้ามเดาข้อมูล/);
 assert.equal(workCommand(' ตรวจยอดค่าเช่า ',1,1),'ตรวจยอดค่าเช่า');
 assert.equal(workCommand(' ',0,0),'');
});
