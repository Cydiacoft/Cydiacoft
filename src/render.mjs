export const xml = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function validateConfig(c) {
 if(!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(c.username)) throw new Error('Invalid username');
 for(const key of ['title','subtitle','signature']) if(typeof c[key]!=='string'||c[key].length>100) throw new Error('Invalid '+key);
 if(!Array.isArray(c.exploring)||c.exploring.length>5||c.exploring.some(s=>typeof s!=='string'||s.length>60)) throw new Error('Invalid exploring');
 if(!Array.isArray(c.projects)||c.projects.length>6) throw new Error('Invalid projects');
 for(const p of c.projects) if(!/^[a-z\d-]+\/[a-z\d_.-]+$/i.test(p.repo)||typeof p.label!=='string'||typeof p.description!=='string') throw new Error('Invalid project');
 return c;
}
export function hero(config,data,theme='light') {
 const dark=theme==='dark', bg=dark?'#0d1117':'#fbfcfe',ink=dark?'#edf3fc':'#172b43',muted=dark?'#a3b3c9':'#586b82',blue=dark?'#79afff':'#2c65b3',line=dark?'#263951':'#dae4f1';
 const points=data.contributions.map((d,i)=>[48+i*744/29,314-d.count/Math.max(1,...data.contributions.map(d=>d.count))*74]);
 const path=points.map(([x,y],i)=>(i?'L':'M')+x.toFixed(2)+' '+y.toFixed(2)).join(' ');
 const total=data.contributions.reduce((a,d)=>a+d.count,0);
 return `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="400" viewBox="0 0 840 400" role="img" aria-labelledby="title desc">
<title id="title">${xml(config.title)} · Digital Journal</title>
<desc id="desc">${xml(config.subtitle)} ${total} public GitHub contributions over 30 UTC days, ${data.contributions[0].date} to ${data.asOf}. ${data.contributions.map(d=>d.date+': '+d.count).join('; ')}.</desc>
<style>
text{font-family:Segoe UI,Arial,sans-serif;fill:${ink}}
.meta{font-size:11px;letter-spacing:2.5px;fill:${muted}}
.note{font-size:13px;fill:${muted}}
.curve{stroke-dasharray:1200;stroke-dashoffset:0;animation:draw 2.4s ease-out 1}
@keyframes draw{from{stroke-dashoffset:1200}to{stroke-dashoffset:0}}
@media(prefers-reduced-motion:reduce){.curve{animation:none}}
</style>
<rect width="840" height="400" rx="12" fill="${bg}"/>
<path d="M48 42H792 M48 350H792" stroke="${line}" stroke-width="1"/>
<circle cx="53" cy="70" r="3" fill="${blue}"/>
<text x="68" y="74" class="meta">DIGITAL JOURNAL / ${xml(config.username.toUpperCase())}</text>
<text x="46" y="153" style="font-family:Georgia,serif;font-size:66px;letter-spacing:-2px">${xml(config.title)}<tspan fill="${blue}">.</tspan></text>
<text x="49" y="187" style="font-size:17px;fill:${muted}">${xml(config.subtitle)}</text>
<g fill="none" stroke="${line}" stroke-width="1"><path d="M48 239H792 M48 277H792 M48 315H792"/></g>
<path class="curve" d="${path}" fill="none" stroke="${blue}" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="792" cy="${points.at(-1)[1]}" r="3" fill="${blue}"/>
<text x="48" y="335" class="note">${data.contributions[0].date}</text>
<text x="792" y="335" text-anchor="end" class="note">${data.asOf} · UTC</text>
<text x="48" y="377" class="meta">SMALL STEPS, QUIETLY COMPOUNDING.</text>
<text x="792" y="377" text-anchor="end" class="note">${total} public contributions / 30 days</text>
</svg>\n`;
}
const md = value => String(value).replace(/[\\`*_[\]<>]/g,'\\$&').replace(/[\r\n]+/g,' ');
export function readme(config,data) {
 return `<!-- vernal:start -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/hero-light.svg">
  <img src="assets/hero-light.svg" alt="${xml(config.title)} — ${data.contributions.reduce((a,d)=>a+d.count,0)} public GitHub contributions in 30 UTC days ending ${data.asOf}." width="840">
</picture>

**Selected work**

${data.projects.map(p=>`[${md(p.label)}](${p.url}) — ${md(p.description)}`).join('  \n')}

<sub>Currently exploring · ${config.exploring.map(xml).join(' · ')}</sub>

---

*${md(config.signature)}*  
<sub>Vernal / Digital Journal · ${md(config.username)}</sub>

<!-- vernal:end -->
`;
}
export function mergeReadme(existing,block) {
 if(!existing.trim()) return block;
 const start='<!-- vernal:start -->',end='<!-- vernal:end -->';
 if(!existing.includes(start)&&!existing.includes(end)) return existing.trimEnd()+'\n\n'+block;
 if(existing.split(start).length!==2||existing.split(end).length!==2||existing.indexOf(end)<existing.indexOf(start)) throw new Error('Ambiguous README markers');
 return existing.slice(0,existing.indexOf(start))+block.trimEnd()+existing.slice(existing.indexOf(end)+end.length);
}
