import test from 'node:test';
import assert from 'node:assert/strict';
import {companionCard,companionLabels} from '../public/companions.js';
test('companion cards show daily activity without disclosing chapter names',()=>{
 const m={id:'x',username:'friend',display_name:'<script>bad</script>',total:1189,today_read:3,plan:{start_date:'2026-01-01',end_date:'2026-12-31'}};
 const html=companionCard(m,{lang:'en',following:true});
 assert.match(html,/<strong>3<\/strong> chapters recorded today/);assert.match(html,/aria-valuenow="100"/);assert.match(html,/Unfollow/);assert.doesNotMatch(html,/<script>|2026-01-01/);assert.match(html,/&lt;script/);
 const admin=companionCard(m,{lang:'en',admin:true});assert.match(admin,/2026-01-01/);assert.match(admin,/Plan and encouragement/);
 assert.doesNotMatch(companionCard(m,{self:true}),/data-follow=/);
 for(const lang of ['ar','en','fr','de'])assert.equal(companionLabels(lang).length,15);
});
