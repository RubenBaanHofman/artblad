// Artblad: Printable A5 sheet, QR codes and links to a species.
// Part 5 of 22; all parts share one scope and load in order from index.html (see js/README.md).
'use strict';
/* ---------- printable A5 sheet ---------- */
const SHEET_CSS=`
.sheet{--col:#2f5d3a;box-sizing:border-box;width:210mm;height:148mm;padding:4mm 5mm 3.5mm;background:#fff;color:#1a1a1a;font:5.6pt/1.15 Helvetica,Arial,sans-serif;display:grid;grid-template-rows:5.4mm 15mm 40mm 21mm 1fr 9.5mm;gap:1.1mm;overflow:hidden;position:relative;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.sheet *{box-sizing:border-box}.sheet.herb{--col:#a85a0c}
.sheet .band{background:var(--col);color:#fff;display:flex;justify-content:space-between;align-items:center;padding:0 2mm;font-weight:700;font-size:7pt;border-radius:.6mm}
.sheet .band small{font-weight:400;font-size:5.4pt}
.sheet .idb{display:grid;grid-template-columns:1fr 25mm;gap:2mm;min-height:0}
.sheet .idl{display:flex;flex-direction:column;justify-content:space-between;min-width:0}
.sheet .row{display:flex;gap:2mm;align-items:baseline}
.sheet .fl{display:flex;gap:1mm;align-items:baseline;min-width:0;flex:var(--w,1)}
.sheet .fl u{text-decoration:none;color:#6b6b6b;font-size:4.8pt;white-space:nowrap}
.sheet u s,.sheet h4 s{text-decoration:none;margin-left:.8mm;opacity:.75;font-weight:400}
.sheet .fl b{flex:1;min-width:0;border-bottom:.25pt solid #b5b5b5;min-height:3.1mm;font-weight:600;font-size:6.2pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sheet .fl.latin b{font-style:italic;font-size:7.6pt}
.sheet .pic{border:.4pt solid var(--col);border-radius:.8mm;overflow:hidden;background:#f2f2f2;display:flex;align-items:center;justify-content:center;color:#9a9a9a;font-size:4.6pt;text-align:center}
.sheet .pic img{width:100%;height:100%;object-fit:cover;display:block}
.sheet .bx{border:.5pt solid var(--col);border-radius:1.2mm;padding:.9mm 1.6mm;overflow:hidden;display:flex;flex-direction:column;gap:.7mm;min-width:0}
.sheet .bx h4{margin:0;font-size:5.6pt;color:var(--col);font-weight:700;white-space:nowrap}
.sheet .bx h4 s{color:#6b6b6b}
.sheet .tri{display:grid;grid-template-columns:60fr 76fr 62fr;gap:1.4mm;min-height:0}
.sheet .cg{display:grid;grid-template-columns:repeat(var(--n,2),minmax(0,1fr));gap:.5mm 1.2mm;flex:1;min-width:0}
.sheet .c{display:flex;align-items:center;gap:.9mm;min-width:0;white-space:nowrap}
.sheet .c i{flex:none;width:2.4mm;height:2.4mm;border:.4pt solid #1a1a1a;border-radius:50%}
.sheet .c.on i{background:var(--col);border-color:var(--col);box-shadow:inset 0 0 0 .5mm #fff}
.sheet .c .t{overflow:hidden;text-overflow:ellipsis;min-width:0}
.sheet .c.on .t{font-weight:700}
.sheet .t s{text-decoration:none;color:#7a7a7a;font-weight:400;margin-left:.7mm;font-size:5pt}
.sheet .lr{display:flex;gap:1mm;align-items:flex-start;min-width:0}
.sheet .lr>u{text-decoration:none;color:#6b6b6b;font-size:4.8pt;flex:none;min-width:8mm;padding-top:.3mm}
.sheet .two{display:flex;gap:2mm}.sheet .two>*{flex:1;min-width:0}
.sheet .calbx{display:grid;grid-template-columns:100fr 98fr;gap:2mm}
.sheet .mt{display:grid;grid-template-columns:20mm repeat(12,1fr);gap:.4mm;align-items:center}
.sheet .mt u{text-decoration:none;font-size:5pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sheet .mh{text-align:center;font-weight:700;color:var(--col);font-size:5pt}
.sheet .mo{height:3.3mm;border:.3pt solid #b5b5b5}.sheet .mo.on{background:var(--col);border-color:var(--col)}
.sheet .ft{display:flex;flex-direction:column;justify-content:space-between}
.sheet .ft .r{display:flex;gap:3mm;align-items:center;min-width:0}
.sheet .dd{display:flex;gap:.9mm}.sheet .dd i{width:2.4mm;height:2.4mm;border:.4pt solid #1a1a1a;border-radius:50%}.sheet .dd i.on{background:var(--col);border-color:var(--col);box-shadow:inset 0 0 0 .5mm #fff}
.sheet .lgh,.sheet .lgr{display:grid;grid-template-columns:19mm 34mm 1fr 18mm;gap:0 1.5mm;align-items:center}
.sheet .lgh{font-weight:700;color:var(--col);border-bottom:.5pt solid var(--col);padding-bottom:.6mm}
.sheet .lgr{border-bottom:.25pt solid #c4c4c4;height:8.2mm;font-size:6.2pt;overflow:hidden}
.sheet .lgr .tx{overflow:hidden;max-height:7.6mm;line-height:1.2}
.sheet .lgr img{width:17mm;height:7mm;object-fit:cover;display:block}
.sheet.back{grid-template-rows:5.4mm 5mm 1fr}
.sheet .lg{display:flex;flex-direction:column;min-height:0;overflow:hidden}
.sheet.back.tblp{grid-template-rows:5.4mm 1fr}
.sheet .gwrap{min-height:0;overflow:hidden}
.sheet .gtab{width:100%;border-collapse:collapse;table-layout:auto;font-size:6pt}
.sheet .gtab th{text-align:left;color:var(--col);font-weight:700;font-size:5.6pt;border-bottom:.5pt solid var(--col);padding:.6mm 1.2mm .6mm 0;vertical-align:bottom}
.sheet .gtab td{border-bottom:.25pt solid #c4c4c4;padding:.7mm 1.2mm .7mm 0;vertical-align:top;line-height:1.25}
.sheet .gtab tr.me td{background:#f3f3f1}
.sheet .gtab td.own{font-weight:700}.sheet .gtab td.inh{color:#8a8a8a}
.sheet .gnote{margin:1.2mm 0 0;font-size:5pt;color:#6b6b6b}
.acs{--col:#1f3a2c;--soft:#eef1ec;box-sizing:border-box;width:210mm;height:148mm;padding:5mm 6mm 4mm;background:#fff;color:#1a1a1a;font:7pt/1.3 Helvetica,Arial,sans-serif;display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:auto auto auto auto 1fr auto;gap:2.4mm;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.acs *{box-sizing:border-box}.acs.herb{--col:#7a4508;--soft:#f5efe6}
.acs .band2{display:flex;justify-content:space-between;align-items:center;border-bottom:.7pt solid var(--col);padding-bottom:1mm;font-size:6.2pt;font-weight:700;color:var(--col);letter-spacing:.08em}
.acs .hd{display:grid;grid-template-columns:24mm minmax(0,1fr) 21mm;gap:4mm;align-items:center}
.acs .pic{width:24mm;height:24mm;border-radius:2mm;background:var(--soft);overflow:hidden;display:flex;align-items:center;justify-content:center;color:var(--col)}
.acs .pic img{width:100%;height:100%;object-fit:cover;display:block}.acs .pic svg{width:62%;height:62%}
.acs .nm1{font:700 17pt/1.05 Helvetica,Arial,sans-serif;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.acs .nm2{font-size:8pt;margin-top:.8mm;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.acs .nm2 i{font-size:9pt}
.acs .tags{display:flex;flex-wrap:wrap;gap:1.2mm;margin-top:1.6mm;align-items:center}
.acs .tag{border:.4pt solid var(--col);color:var(--col);border-radius:3mm;padding:.2mm 1.8mm;font-size:6.6pt;font-weight:700}
.acs .tag.soft{border-color:#c9cfc6;color:#333;font-weight:400}
.acs .dots{letter-spacing:.3mm;color:var(--col);font-size:8pt}
.acs .qrw{text-align:center;font-size:5pt;line-height:1.2;color:#666}.acs .qr{width:19mm;height:19mm;display:block;margin:0 auto .7mm}
.acs .kf{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:1.6mm}
.acs .k{background:var(--soft);border-radius:1.4mm;padding:1.3mm 1.8mm;min-width:0}
.acs .k u{display:block;text-decoration:none;font-size:5.4pt;color:#59625b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.5mm}
.acs .k b{font-size:7.6pt;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acs .k svg{width:3.4mm;height:3.4mm;vertical-align:-.8mm;margin-right:.3mm}
.acs .cal{display:grid;grid-template-columns:26mm repeat(12,minmax(0,1fr));gap:.6mm;align-items:center}
.acs .cal .mh{font-size:5.6pt;text-align:center;color:#59625b;font-weight:700}
.acs .cal u{text-decoration:none;font-size:6.4pt;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.acs .cal .mo{height:3.2mm;border-radius:.6mm;background:#ecefe9}.acs .cal .mo.on{background:var(--col)}
.acs .cols{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4mm;min-height:0;overflow:hidden}
.acs .cols>div{min-width:0;overflow:hidden}
.acs h5{margin:0 0 1.2mm;font-size:6.2pt;color:var(--col);text-transform:uppercase;letter-spacing:.07em}
.acs .chs{display:flex;flex-wrap:wrap;gap:.8mm}.acs .ch{background:var(--soft);border-radius:2mm;padding:.3mm 1.6mm;font-size:6.6pt}
.acs p{margin:1mm 0 0}.acs .lb{color:#59625b}
.acs .ft{display:flex;justify-content:space-between;gap:4mm;font-size:5.8pt;color:#59625b;border-top:.4pt solid #d4d8d2;padding-top:1.2mm}
.acs .ft span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.acs .none{color:#9a9f9b}
.acs.pc{--accent:var(--col);--line:#cdd3cb;--surface:#fff;--muted:#6b726c;--ink:#1a1a1a;grid-template-rows:auto auto minmax(0,1fr) auto}
.acs .pis{display:inline-flex;gap:.8mm;margin-right:1mm;color:var(--col)}.acs .pi{width:3.8mm;height:3.8mm;display:block}
.acs .bd{font-size:7pt;columns:3;column-gap:4.5mm;column-fill:balance;min-height:0;overflow:hidden}
.acs .bk{break-inside:avoid;margin:0 0 1.8mm;border-top:.6pt solid var(--col);padding-top:.7mm}
.acs .bk h4{margin:0 0 .6mm;font:700 1.12em/1.2 Georgia,'Times New Roman',serif;color:var(--col)}
.acs .pl{display:flex;flex-wrap:wrap;gap:.6mm;margin:.5mm 0}
.acs .pl span{display:inline-flex;align-items:center;gap:.5mm;border:.4pt solid #c3cac0;border-radius:3mm;padding:.05mm 1.4mm;font-size:.92em;white-space:nowrap}
.acs .pl svg{width:1.05em;height:1.05em;color:var(--col)}
.acs .pkv{display:grid;grid-template-columns:minmax(14mm,auto) 1fr;gap:0 1.4mm;margin:.4mm 0;align-items:baseline}
.acs .pkv u{text-decoration:none;color:#59625b;font-size:.88em;font-weight:400}.acs .pkv b{font-size:1em}.acs .pkv b{font-weight:400;min-width:0}
.acs .pdd{display:inline-flex;gap:.5mm;vertical-align:-.2mm}.acs .pdd i{width:.95em;height:.95em;border:.4pt solid var(--col);border-radius:50%}.acs .pdd i.on{background:var(--col)}
.acs .pwh{display:flex;gap:1.6mm;align-items:center;margin:.3mm 0 .8mm}.acs .pwh svg{width:24mm;height:24mm;flex:none}
.acs .pwl{display:flex;flex-direction:column;gap:.5mm;font-size:.9em}.acs .pwl i{display:inline-block;width:.9em;height:.9em;border-radius:.4mm;margin-right:.8mm;vertical-align:-.15em}
.acs .laydia{margin:.3mm 0 .5mm}.acs .laydia svg{width:100%;max-width:50mm;height:auto;display:block}
.acs.zl .bd{font-size:8pt}.acs.zl .pwh svg{width:28mm;height:28mm}.acs.zl .laydia svg{max-width:58mm}
.acs.zxl .bd{font-size:9.5pt}.acs.zxl .pwh svg{width:32mm;height:32mm}.acs.zxl .laydia svg{max-width:64mm}
.acs.z1 .bd{font-size:6.5pt}.acs.z2 .bd{font-size:6pt}.acs.z2 .pwh svg{width:20mm;height:20mm}.acs.z2 .laydia svg{max-width:42mm}
.acs.z3 .bd{font-size:5.5pt}.acs.z3 .pwh svg{width:17mm;height:17mm}.acs.z3 .laydia svg{max-width:34mm}
.acs.z4 .bd{font-size:5pt}.acs.z4 .pwh svg{width:15mm;height:15mm}.acs.z4 .laydia svg{max-width:30mm}
.sl{grid-template-rows:auto auto 1fr auto}
.sl .lst{column-count:3;column-gap:5mm;column-fill:auto;min-height:0;overflow:hidden;font-size:6.6pt}
.sl .lst h5{break-after:avoid;margin-top:1.4mm}.sl .lst h5:first-child{margin-top:0}
.sl .lst div{break-inside:avoid;margin:0 0 .7mm}.sl .lst div u{text-decoration:none;color:#59625b}
`;
/* ---------- QR code and links to a species ---------- */
const siteUrl=()=>String(cfg.SITE_URL||(location.origin+location.pathname)).replace(/#.*$/,'');
const speciesUrl=s=>siteUrl()+'#s-'+(s.ref||s.sid);
function qrSvg(text){
  if(typeof qrcode!=='function')return '';
  const q=qrcode(0,'M');q.addData(text);q.make();const n=q.getModuleCount();let d='';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(q.isDark(r,c))d+='M'+c+' '+r+'h1v1h-1z';
  return '<svg class="qr" viewBox="-2 -2 '+(n+4)+' '+(n+4)+'" shape-rendering="crispEdges" aria-hidden="true"><rect x="-2" y="-2" width="'+(n+4)+'" height="'+(n+4)+'" fill="#fff"/><path d="'+d+'" fill="#000"/></svg>';
}
