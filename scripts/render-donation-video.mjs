// Renders the public donor journey explainer as a silent, captioned MP4.
// Usage: FFMPEG=/path/to/ffmpeg node scripts/render-donation-video.mjs
import sharp from "sharp";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const W = 1280;
const H = 720;
const FPS = 18;
const INTRO = 2.5;
const SCENE = 3.5;
const OUTRO = 2.5;
const scenes = [
  { title: "Je me prépare", lines: ["Je choisis un lieu de don,", "je m’hydrate et je viens en forme."], label: "AVANT LE DON", art: "prepare" },
  { title: "Je suis accueilli", lines: ["L’équipe m’accueille et", "enregistre mon arrivée."], label: "01 · ACCUEIL", art: "welcome" },
  { title: "Je passe un entretien", lines: ["Un entretien confidentiel vérifie", "que je peux donner aujourd’hui."], label: "02 · ENTRETIEN", art: "interview" },
  { title: "Je donne mon sang", lines: ["Un professionnel réalise le", "prélèvement avec du matériel stérile."], label: "03 · PRÉLÈVEMENT", art: "donation" },
  { title: "Je prends une pause", lines: ["Je me repose, je bois et", "je prends une collation."], label: "04 · APRÈS LE DON", art: "rest" },
  { title: "Le don est contrôlé", lines: ["La poche est analysée avant", "d’être mise à disposition."], label: "05 · LABORATOIRE", art: "lab" },
  { title: "Il aide un patient", lines: ["Le sang qualifié rejoint les", "établissements de santé."], label: "06 · SOINS", art: "hospital" },
];
const DURATION = INTRO + scenes.length * SCENE + OUTRO;
const TOTAL = Math.round(DURATION * FPS);
const outDir = join(process.cwd(), "portal/public/videos");
const outFile = join(outDir, "parcours-don-sang.mp4");
const posterFile = join(outDir, "parcours-don-sang-poster.webp");
const ffmpeg = process.env.FFMPEG || "ffmpeg";

const esc = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const clamp = (n) => Math.max(0, Math.min(1, n));
const ease = (n) => 1 - Math.pow(1 - clamp(n), 3);
const drop = `<path d="M0 -95 C-30 -42 -73 -5 -73 44 A73 73 0 0 0 73 44 C73 -5 30 -42 0 -95Z" fill="#bc3a43"/><path d="M-31 20 C-45 45 -31 72 -9 79" fill="none" stroke="#f7c9c4" stroke-width="12" stroke-linecap="round" opacity=".8"/>`;

function person(x, y, shirt = "#a9343d", scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cx="0" cy="152" rx="69" ry="15" fill="#e9d6d1"/>
    <rect x="-43" y="55" width="86" height="99" rx="38" fill="${shirt}"/>
    <rect x="-29" y="140" width="21" height="80" rx="10" fill="#563c43"/>
    <rect x="8" y="140" width="21" height="80" rx="10" fill="#563c43"/>
    <circle cx="0" cy="15" r="39" fill="#a96b50"/>
    <path d="M-37 7 Q-37 -41 3 -39 Q46 -35 39 8 Q16 -3 -5 -22 Q-15 -1 -37 7" fill="#33292a"/>
    <circle cx="-13" cy="17" r="2.5" fill="#33292a"/><circle cx="13" cy="17" r="2.5" fill="#33292a"/>
    <path d="M-10 34 Q0 41 10 34" fill="none" stroke="#743f3a" stroke-width="3" stroke-linecap="round"/>
  </g>`;
}

function icon(kind, p) {
  const bob = Math.sin(p * Math.PI * 2) * 5;
  const pulse = 1 + Math.sin(p * Math.PI * 2) * .025;
  const tick = `<path d="M-23 2 L-4 22 L31 -18" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
  let art = "";
  if (kind === "prepare") art = `<rect x="-146" y="-115" width="292" height="239" rx="25" fill="#fff" stroke="#ebd8d4" stroke-width="5"/><rect x="-146" y="-115" width="292" height="55" rx="25" fill="#a9343d"/><rect x="-146" y="-82" width="292" height="22" fill="#a9343d"/><path d="M-85 -135v40 M85 -135v40" stroke="#6b343c" stroke-width="14" stroke-linecap="round"/><path d="M-92 -22h184 M-92 22h122 M-92 66h78" stroke="#eadbd8" stroke-width="15" stroke-linecap="round"/><circle cx="72" cy="50" r="50" fill="#bc3a43"/>${tick.replace('M-23 2', 'M49 52').replace('L-4 22', 'L68 72').replace('L31 -18', 'L100 32')}`;
  if (kind === "welcome") art = `${person(-85,-108,"#b8424b",.72)}<rect x="-180" y="68" width="367" height="92" rx="20" fill="#69313c"/><rect x="-180" y="68" width="367" height="19" rx="10" fill="#a9343d"/><rect x="-5" y="-90" width="150" height="122" rx="13" fill="#fff" stroke="#e7cfca" stroke-width="5"/><path d="M28 -60h84 M28 -31h66 M28 -2h80" stroke="#dfc7c4" stroke-width="10" stroke-linecap="round"/><circle cx="98" cy="-104" r="20" fill="#bc3a43"/>`;
  if (kind === "interview") art = `<rect x="-163" y="60" width="330" height="17" rx="8" fill="#70434b"/><rect x="-130" y="77" width="13" height="76" rx="6" fill="#70434b"/><rect x="120" y="77" width="13" height="76" rx="6" fill="#70434b"/>${person(-87,-88,"#b8424b",.6)}${person(89,-88,"#f7f7f3",.6)}<rect x="-4" y="-43" width="77" height="94" rx="9" fill="#fff" stroke="#a9343d" stroke-width="4"/><path d="M12 -14h43 M12 5h32" stroke="#d6b8b5" stroke-width="7" stroke-linecap="round"/><path d="M13 30l10 9 21 -22" fill="none" stroke="#78a889" stroke-width="7" stroke-linecap="round"/>`;
  if (kind === "donation") {
    const fillTop = 187 - ease(p / .8) * 43;
    art = `<rect x="-188" y="75" width="338" height="49" rx="25" fill="#69464c"/><rect x="-158" y="21" width="270" height="76" rx="35" fill="#f4e1d9"/><circle cx="-143" cy="40" r="29" fill="#a96b50"/><path d="M-164 16q20 -31 45 -4" fill="#33292a"/><path d="M-90 60h174" stroke="#a96b50" stroke-width="31" stroke-linecap="round"/><path d="M70 60 C150 47 120 125 163 121" fill="none" stroke="#b8424b" stroke-width="5"/><rect x="119" y="100" width="83" height="90" rx="18" fill="#fff" stroke="#b8424b" stroke-width="6"/><clipPath id="bag-fill"><path d="M129 141h63v31q-31 27 -63 0z"/></clipPath><rect x="129" y="${fillTop}" width="63" height="50" fill="#b8424b" clip-path="url(#bag-fill)"/><path d="M160 100v-20" stroke="#b8424b" stroke-width="6"/>`;
  }
  if (kind === "rest") art = `<rect x="-188" y="53" width="285" height="91" rx="30" fill="#b8424b"/><rect x="-175" y="32" width="111" height="52" rx="24" fill="#cc6b69"/><rect x="-183" y="125" width="17" height="49" rx="6" fill="#70434b"/><rect x="75" y="125" width="17" height="49" rx="6" fill="#70434b"/><path d="M111 138h92" stroke="#70434b" stroke-width="11" stroke-linecap="round"/><path d="M121 136v-95 h62v95" fill="#fff" stroke="#e7cfca" stroke-width="6"/><path d="M133 73h39" stroke="#b8424b" stroke-width="8" stroke-linecap="round"/><path d="M149 25 C141 10 152 2 157 -10 C168 3 175 14 167 27" fill="#b9d4da"/>${person(-55,-133,"#f3bf91",.58)}`;
  if (kind === "lab") art = `<rect x="-170" y="-123" width="340" height="287" rx="30" fill="#fff" stroke="#ead6d2" stroke-width="5"/><path d="M-112 -77h224 M-112 -26h224 M-112 85h224" stroke="#e9d9d5" stroke-width="9" stroke-linecap="round"/><path d="M-62 -69v119q0 45 -30 45t-30 -45V-69" fill="#f6f4f0" stroke="#a9343d" stroke-width="7"/><path d="M-117 31h51v19q0 28 -26 28t-25 -28z" fill="#bb3d47"/><path d="M58 -69v119q0 45 -30 45t-30 -45V-69" fill="#f6f4f0" stroke="#a9343d" stroke-width="7"/><path d="M3 31h51v19q0 28 -26 28T3 50z" fill="#e0bd77"/><circle cx="104" cy="71" r="46" fill="#77aa86"/>${tick.replace('M-23 2', 'M81 73').replace('L-4 22', 'L100 93').replace('L31 -18', 'L135 53')}`;
  if (kind === "hospital") art = `<rect x="-157" y="-102" width="314" height="267" rx="18" fill="#fff" stroke="#ead6d2" stroke-width="5"/><rect x="-104" y="-149" width="208" height="67" rx="17" fill="#a9343d"/><rect x="-13" y="-138" width="26" height="47" rx="4" fill="#fff"/><rect x="-23" y="-127" width="46" height="25" rx="4" fill="#fff"/>${[-105,-35,35,105].map(x=>`<rect x="${x-20}" y="-44" width="42" height="48" rx="8" fill="#e8d9d5"/><rect x="${x-20}" y="29" width="42" height="48" rx="8" fill="#e8d9d5"/>`).join("")}<rect x="-38" y="96" width="76" height="69" rx="10" fill="#b8424b"/><path d="M-180 164h360" stroke="#70434b" stroke-width="8" stroke-linecap="round"/>`;
  return `<g transform="translate(922 ${367 + bob}) scale(${pulse})">${art}</g>`;
}

function frame(t) {
  const background = `<rect width="1280" height="720" fill="#faf5f1"/><circle cx="1115" cy="180" r="255" fill="#f3e4df"/><circle cx="170" cy="655" r="210" fill="#f7e9e3"/><path d="M0 630 C280 540 520 670 810 610 S1120 560 1280 620" fill="none" stroke="#edddd8" stroke-width="2"/>`;
  const brand = `<circle cx="70" cy="69" r="23" fill="#ad3540"/><path d="M70 54c-7 12-13 19-13 27a13 13 0 0 0 26 0c0-8-6-15-13-27z" fill="#fff"/><text x="108" y="65" font-family="DejaVu Sans" font-size="23" font-weight="700" fill="#53323a">CNTS</text><text x="109" y="86" font-family="DejaVu Sans" font-size="13" fill="#9c7377" letter-spacing="2">SÉNÉGAL</text>`;
  let content = "";
  if (t < INTRO) {
    content = `<g><text x="90" y="215" font-family="DejaVu Sans" font-size="24" font-weight="700" letter-spacing="4" fill="#a9343d">UN GESTE QUI COMPTE</text><text x="85" y="318" font-family="DejaVu Sans" font-size="66" font-weight="700" fill="#53323a">Le parcours</text><text x="85" y="402" font-family="DejaVu Sans" font-size="66" font-weight="700" fill="#53323a">du don de sang</text><text x="90" y="462" font-family="DejaVu Sans" font-size="27" fill="#7c6666">De votre arrivée jusqu’aux soins</text><g transform="translate(947 350) scale(1.8)">${drop}</g></g>`;
  } else if (t < INTRO + scenes.length * SCENE) {
    const index = Math.floor((t - INTRO) / SCENE);
    const local = (t - INTRO) % SCENE;
    const s = scenes[index];
    const slide = (1 - ease(local / .65)) * 27;
    content = `<g><g transform="translate(${slide} 0)"><rect x="90" y="165" width="230" height="40" rx="20" fill="#f3e0dc"/><text x="108" y="192" font-family="DejaVu Sans" font-size="17" font-weight="700" letter-spacing="2" fill="#a9343d">${esc(s.label)}</text><text x="85" y="307" font-family="DejaVu Sans" font-size="51" font-weight="700" fill="#53323a">${esc(s.title)}</text><text x="90" y="382" font-family="DejaVu Sans" font-size="27" fill="#6e5e5e">${esc(s.lines[0])}</text><text x="90" y="423" font-family="DejaVu Sans" font-size="27" fill="#6e5e5e">${esc(s.lines[1])}</text></g>${icon(s.art,local/SCENE)}</g>`;
  } else {
    content = `<g><circle cx="640" cy="260" r="89" fill="#a9343d"/><path d="M640 205 C607 252 580 284 600 316 C621 350 659 352 681 316 C701 283 674 252 640 205Z" fill="#fff"/><text x="640" y="427" text-anchor="middle" font-family="DejaVu Sans" font-size="59" font-weight="700" fill="#53323a">Merci pour votre don.</text><text x="640" y="482" text-anchor="middle" font-family="DejaVu Sans" font-size="26" fill="#77656a">Ensemble, faisons circuler la vie.</text></g>`;
  }
  const progress = `<rect x="0" y="708" width="1280" height="12" fill="#eadbd6"/><rect x="0" y="708" width="${Math.round(1280 * t / DURATION)}" height="12" fill="#ae3540"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${background}${brand}${content}${progress}</svg>`;
}

await mkdir(outDir, { recursive: true });
await writeFile(posterFile, await sharp(Buffer.from(frame(0.9))).webp({ quality: 85 }).toBuffer());
const proc = spawn(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-vcodec", "png", "-i", "pipe:0", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart", outFile], { stdio: ["pipe", "inherit", "inherit"] });
let encodeError;
proc.on("error", error => { encodeError = error; });
for (let i = 0; i < TOTAL; i++) {
  const png = await sharp(Buffer.from(frame(i / FPS))).png().toBuffer();
  if (!proc.stdin.write(png)) await new Promise(resolve => proc.stdin.once("drain", resolve));
  if (i % (FPS * 5) === 0) process.stdout.write(`Rendered ${i}/${TOTAL} frames\n`);
}
proc.stdin.end();
const code = await new Promise(resolve => proc.on("close", resolve));
if (encodeError || code !== 0) throw encodeError || new Error(`ffmpeg exited with ${code}`);
process.stdout.write(`Wrote ${outFile}\n`);
