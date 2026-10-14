import { defaults, outputSize, filterFor, centeredCrop } from './editor-core.js';
const $ = id => document.getElementById(id);
const canvas = $('canvas');
const ctx = canvas.getContext('2d');
let source = null, original = null, state = defaults(), name = 'photo', busy = false;
let toastTimer;
function toast(message) { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 4500); }
function setBusy(value) { busy = value; $('loading').hidden = !value; sync(); }
function sync() {
  document.querySelectorAll('.tools button, .tools input, .tools select, #download, #export-top, #compare').forEach(el => el.disabled = !source || busy);
  for (const key of ['brightness', 'contrast', 'saturation']) { $(key).value = state[key]; $(key + '-value').value = state[key] + '%'; }
  document.querySelectorAll('[data-preset]').forEach(el => { const selected = el.dataset.preset === state.preset; el.classList.toggle('selected', selected); el.setAttribute('aria-pressed', String(selected)); });
  $('flip-x').setAttribute('aria-pressed', String(state.flipX)); $('flip-y').setAttribute('aria-pressed', String(state.flipY));
}
function draw(target, image, currentState) {
  const size = outputSize(image.width, image.height, currentState.rotation);
  target.width = size.width; target.height = size.height;
  const context = target.getContext('2d');
  context.save(); context.translate(size.width / 2, size.height / 2); context.rotate(currentState.rotation * Math.PI / 180);
  context.scale(currentState.flipX ? -1 : 1, currentState.flipY ? -1 : 1);
  context.filter = filterFor(currentState); context.drawImage(image, -image.width / 2, -image.height / 2); context.restore();
}
function render() {
  if (!source) return;
  draw(canvas, $('compare').checked ? original : source, $('compare').checked ? defaults() : state);
  $('dimensions').textContent = `${canvas.width.toLocaleString('vi-VN')} × ${canvas.height.toLocaleString('vi-VN')} px`;
  sync();
}
function loadSource(image, filename) {
  source = image; original = image; state = defaults(); name = filename.replace(/\.[^.]+$/, '');
  $('filename').textContent = filename; $('empty').hidden = true; canvas.hidden = false; $('compare').checked = false; render();
}
async function loadFile(file) {
  if (!file || busy) return;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) return toast('Vui lòng chọn ảnh JPG, PNG hoặc WebP.');
  if (file.size > 20 * 1024 * 1024) return toast('Ảnh vượt quá 20 MB. Hãy chọn ảnh nhỏ hơn.');
  setBusy(true);
  const url = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = url; await image.decode();
    if (image.naturalWidth * image.naturalHeight > 24_000_000) throw new Error('Ảnh vượt quá 24 megapixel. Hãy giảm kích thước trước khi mở.');
    loadSource(image, file.name); toast('Ảnh đã sẵn sàng. Bắt đầu sáng tạo nhé!');
  } catch (error) { toast(error.message.includes('megapixel') ? error.message : 'Không đọc được ảnh. Hãy thử một file khác.'); }
  finally { URL.revokeObjectURL(url); setBusy(false); }
}
for (const id of ['upload','replace']) $(id).addEventListener('click', () => { if (!busy) $('file').click(); });
$('file').addEventListener('change', event => { loadFile(event.target.files[0]); event.target.value = ''; });
for (const eventName of ['dragenter','dragover']) $('drop-zone').addEventListener(eventName, event => { event.preventDefault(); $('drop-zone').classList.add('dragover'); });
for (const eventName of ['dragleave','drop']) $('drop-zone').addEventListener(eventName, event => { event.preventDefault(); $('drop-zone').classList.remove('dragover'); });
$('drop-zone').addEventListener('drop', event => loadFile(event.dataTransfer.files[0]));
for (const key of ['brightness','contrast','saturation']) $(key).addEventListener('input', event => { state[key] = Number(event.target.value); render(); });
$('rotate').addEventListener('click', () => { state.rotation = (state.rotation + 90) % 360; render(); });
$('flip-x').addEventListener('click', () => { state.flipX = !state.flipX; render(); });
$('flip-y').addEventListener('click', () => { state.flipY = !state.flipY; render(); });
$('presets').addEventListener('click', event => { const button = event.target.closest('[data-preset]'); if (!button || button.disabled) return; state.preset = button.dataset.preset; render(); });
$('compare').addEventListener('change', render);
$('reset').addEventListener('click', () => { source = original; state = defaults(); $('compare').checked = false; render(); toast('Đã khôi phục ảnh gốc.'); });
$('apply-crop').addEventListener('click', () => {
  if (!source || busy) return;
  const transformed = document.createElement('canvas'); draw(transformed, source, state);
  const crop = centeredCrop(transformed.width, transformed.height, Number($('crop').value));
  const result = document.createElement('canvas'); result.width = Math.max(1, Math.round(crop.width)); result.height = Math.max(1, Math.round(crop.height));
  result.getContext('2d').drawImage(transformed, crop.x, crop.y, crop.width, crop.height, 0, 0, result.width, result.height);
  source = result; state = defaults(); $('compare').checked = false; render(); toast('Đã cắt ảnh theo tỉ lệ. Bạn có thể khôi phục ảnh gốc bất cứ lúc nào.');
});
$('quality').addEventListener('input', () => $('quality-value').value = $('quality').value + '%');
function updateFormat() { const png = $('format').value === 'image/png'; $('quality').disabled = png; $('quality-value').value = png ? 'Lossless' : $('quality').value + '%'; }
$('format').addEventListener('change', updateFormat); updateFormat();
async function download() {
  if (!source || busy) return;
  setBusy(true);
  try {
    const result = document.createElement('canvas'); draw(result, source, state);
    const mime = $('format').value;
    if (mime === 'image/jpeg') { const context = result.getContext('2d'); context.save(); context.globalCompositeOperation = 'destination-over'; context.fillStyle = '#ffffff'; context.fillRect(0,0,result.width,result.height); context.restore(); }
    const blob = await new Promise(resolve => result.toBlob(resolve, mime, Number($('quality').value) / 100));
    if (!blob) throw new Error('Export failed');
    const extension = { 'image/png':'png','image/jpeg':'jpg','image/webp':'webp' }[blob.type] || 'png';
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${name}-edited.${extension}`; document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000); toast('Ảnh đã được xuất thành công!');
  } catch { toast('Không xuất được ảnh. Thử ảnh nhỏ hơn hoặc chọn định dạng PNG.'); }
  finally { setBusy(false); }
}
$('download').addEventListener('click', download); $('export-top').addEventListener('click', download);
$('demo').addEventListener('click', () => {
  if (busy) return;
  const demo = document.createElement('canvas'); demo.width = 1600; demo.height = 1100; const c = demo.getContext('2d');
  const sky = c.createLinearGradient(0,0,0,1100); sky.addColorStop(0,'#d9dfd0'); sky.addColorStop(.65,'#f4e5ca'); sky.addColorStop(1,'#a2aa82'); c.fillStyle = sky; c.fillRect(0,0,1600,1100);
  c.fillStyle = '#f9eed2'; c.beginPath(); c.arc(1160,270,92,0,Math.PI*2); c.fill();
  const ridge = (color, points) => { c.fillStyle=color; c.beginPath(); c.moveTo(0,1100); for(const [x,y] of points)c.lineTo(x,y); c.lineTo(1600,1100); c.closePath(); c.fill(); };
  ridge('#aeb49a',[[0,680],[270,390],[460,650],[800,340],[1110,655],[1420,390],[1600,600]]);
  ridge('#788b72',[[0,800],[300,580],[640,760],[980,540],[1300,790],[1600,640]]);
  ridge('#496951',[[0,970],[300,780],[600,920],[970,800],[1250,1010],[1600,820]]);
  ridge('#2d4b3a',[[0,1010],[330,975],[590,1100],[1050,1050],[1600,980]]);
  loadSource(demo, 'quiet-mountains.png'); toast('Ảnh mẫu đã sẵn sàng để chỉnh sửa.');
});
sync();
