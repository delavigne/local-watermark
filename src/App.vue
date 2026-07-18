<template>
  <div class="watermark-container">
    <header class="app-header">
      <h2>Local Watermark (Edition Entreprise Complète)</h2>
      <p>Sécurisation locale sans fuite de données — Autonome, conforme CSP et multi-threadé.</p>
    </header>

    <main class="app-content">
      <div class="loading-state" v-if="loadingFile">
        <p>Chargement et initialisation sécurisée du document...</p>
      </div>

      <div class="upload-section" v-else-if="!pdfFile">
        <label class="drop-zone">
          <input type="file" @change="handleFileUpload" accept="application/pdf" class="file-input" />
          <div class="drop-zone-text">
            <span class="icon-upload">📄</span>
            <p>Glissez-déposez un fichier PDF ici ou cliquez pour parcourir</p>
          </div>
        </label>
      </div>

      <!-- Main App Body -->
      <div class="workspace" v-else>
        <div class="settings-panel">
          <h3>Configuration Métrique</h3>
          
          <div class="form-group">
            <label>Texte à inscrire</label>
            <input type="text" v-model="settings.text" placeholder="EXEMPLE : COPIE CONFIDENTIELLE" />
          </div>

          <div class="form-group">
            <label>Opacité globale ({{ Math.round(settings.opacity * 100) }}%)</label>
            <input type="range" min="0.05" max="0.5" step="0.01" v-model.number="settings.opacity" />
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="settings.antiAIWaves" />
              Activer les vagues anti-IA géométriques
            </label>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="settings.addNoise" />
              Injecter un bruit de fond aléatoire (Anti-Détourage IA)
            </label>
          </div>

          <div class="form-group">
            <label>Qualité de compression JPEG ({{ Math.round(settings.quality * 100) }}%)</label>
            <input type="range" min="0.4" max="0.9" step="0.05" v-model.number="settings.quality" />
          </div>

          <!-- Progress indicators -->
          <div class="progress-bar-container" v-if="processing">
            <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
            <span class="progress-text">Progression : {{ currentStep }} / {{ totalSteps }} pages</span>
          </div>

          <div class="actions">
            <button class="btn btn-primary" @click="processPDF(false)" :disabled="processing">
              {{ processing ? 'Calcul en cours...' : 'Télécharger localement' }}
            </button>
            <button class="btn btn-success" @click="processPDF(true)" :disabled="processing || !nextcloudTargetDir">
              💾 Enregistrer directement dans Nextcloud
            </button>
            <button class="btn btn-secondary" @click="resetApp" :disabled="processing">Changer de fichier</button>
          </div>
        </div>

        <div class="preview-panel">
          <div class="preview-header">
            <h3>Aperçu en temps réel</h3>
            <div class="page-controls" v-if="totalPages > 1">
              <button @click="changePage(-1)" :disabled="currentPage === 1">◀</button>
              <span>Page {{ currentPage }} / {{ totalPages }}</span>
              <button @click="changePage(1)" :disabled="currentPage === totalPages">▶</button>
            </div>
          </div>
          <div class="canvas-wrapper">
            <canvas ref="previewCanvas"></canvas>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, onMounted } from 'vue';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Nextcloud global variable declaration
declare const OC: any;

// CRITICAL FIX: Load the PDFJS Worker strictly from Nextcloud local endpoint to satisfy CSP policies
pdfjsLib.GlobalWorkerOptions.workerSrc = OC.generateUrl('/apps/localwatermark/js/pdf.worker.js');

const pdfFile = ref<File | null>(null);
const loadingFile = ref(false);
const processing = ref(false);
const previewCanvas = ref<HTMLCanvasElement | null>(null);

const currentPage = ref(1);
const totalPages = ref(1);
const currentStep = ref(0);
const totalSteps = ref(0);
const progressPercentage = ref(0);
const nextcloudTargetDir = ref<string | null>(null);

let pdfDocInstance: any = null;
let fileArrayBuffer: ArrayBuffer | null = null;

const defaultSettings = {
  text: 'COPIE CONFIDENTIELLE',
  opacity: 0.15,
  antiAIWaves: true,
  addNoise: true,
  quality: 0.70
};

const savedSettings = localStorage.getItem('localwatermark_settings');
const settings = reactive(savedSettings ? JSON.parse(savedSettings) : defaultSettings);

watch(settings, (newVal) => {
  localStorage.setItem('localwatermark_settings', JSON.stringify(newVal));
  if (pdfFile.value) renderPreview();
});

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const fileUrl = urlParams.get('url');
  const fileName = urlParams.get('file');
  const directory = urlParams.get('dir');

  if (directory) {
    nextcloudTargetDir.value = directory;
  }

  if (fileUrl && fileName) {
    loadingFile.value = true;
    try {
      const response = await fetch(fileUrl);
      fileArrayBuffer = await response.arrayBuffer();
      pdfFile.value = new File([fileArrayBuffer], fileName, { type: 'application/pdf' });
      pdfDocInstance = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
      totalPages.value = pdfDocInstance.numPages;
      await nextTick();
      renderPreview();
    } catch (err) {
      console.error("Erreur d'initialisation à distance :", err);
    } finally {
      loadingFile.value = false;
    }
  }
});

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    pdfFile.value = target.files[0];
    fileArrayBuffer = await pdfFile.value.arrayBuffer();
    pdfDocInstance = await pdfjsLib.getDocument({ data: fileArrayBuffer }).promise;
    totalPages.value = pdfDocInstance.numPages;
    currentPage.value = 1;
    await nextTick();
    renderPreview();
  }
};

const drawWatermarkOnCanvas = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  if (settings.antiAIWaves) {
    ctx.save();
    ctx.strokeStyle = `rgba(120, 120, 120, ${settings.opacity * 0.35})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let y = -60; y < h + 60; y += 45) {
      ctx.moveTo(0, y);
      for (let x = 0; x < w; x += 25) {
        const wave = 18 * Math.sin(x * 0.015 + y * 0.008);
        ctx.lineTo(x, y + wave);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  if (settings.addNoise) {
    ctx.save();
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    const strength = settings.opacity * 25;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * strength;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
      data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);
    ctx.restore();
  }

  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${settings.opacity})`;
  ctx.font = `bold ${Math.max(18, w / 22)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.rotate(-Math.PI / 5);

  const stepX = w / 1.8;
  const stepY = h / 3.5;

  for (let x = -w; x < w * 2.5; x += stepX) {
    for (let y = -h; y < h * 2.5; y += stepY) {
      ctx.fillText(settings.text, x, y);
    }
  }
  ctx.restore();
};

const renderPreview = async () => {
  if (!pdfDocInstance || !previewCanvas.value) return;
  const page = await pdfDocInstance.getPage(currentPage.value);
  const viewport = page.getViewport({ scale: 1.3 });
  const canvas = previewCanvas.value;
  const ctx = canvas.getContext('2d');

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (ctx) {
    await page.render({ canvasContext: ctx, viewport }).promise;
    drawWatermarkOnCanvas(canvas);
  }
};

const changePage = (offset: number) => {
  const target = currentPage.value + offset;
  if (target >= 1 && target <= totalPages.value) {
    currentPage.value = target;
    renderPreview();
  }
};

const createProcessingWorker = () => {
  const workerCode = `
    self.onmessage = function(e) {
      const { imgData, settings, width, height } = e.data;
      const data = imgData.data;
      if (settings.addNoise) {
        const strength = settings.opacity * 25;
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * strength;
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise));
          data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise));
        }
      }
      self.postMessage({ imgData }, [imgData.data.buffer]);
    };
  `;
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

const processPDF = async (saveToCloud: boolean = false) => {
  if (!pdfDocInstance || !pdfFile.value || !fileArrayBuffer) return;
  processing.value = true;
  currentStep.value = 0;
  totalSteps.value = totalPages.value;
  progressPercentage.value = 0;

  const worker = createProcessingWorker();

  try {
    const outputPdf = await PDFDocument.create();

    for (let i = 1; i <= totalPages.value; i++) {
      currentStep.value = i;
      progressPercentage.value = Math.round((i / totalPages.value) * 100);

      const page = await pdfDocInstance.getPage(i);
      const viewport = page.getViewport({ scale: 2.2 });

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = viewport.width;
      offscreenCanvas.height = viewport.height;
      const ctx = offscreenCanvas.getContext('2d');

      if (ctx) {
        await page.render({ canvasContext: ctx, viewport }).promise;
        drawWatermarkOnCanvas(offscreenCanvas);

        if (settings.addNoise) {
          const imgData = ctx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
          const workerResult = await new Promise<ImageData>((resolve) => {
            worker.onmessage = (e) => resolve(e.data.imgData);
            worker.postMessage({
              imgData,
              settings: JSON.parse(JSON.stringify(settings)),
              width: offscreenCanvas.width,
              height: offscreenCanvas.height
            }, [imgData.data.buffer]);
          });
          ctx.putImageData(workerResult, 0, 0);
        }

        const imgDataUrl = offscreenCanvas.toDataURL('image/jpeg', settings.quality);
        const imgBytes = await fetch(imgDataUrl).then(res => res.arrayBuffer());
        
        const embeddedImg = await outputPdf.embedJpg(imgBytes);
        const newPage = outputPdf.addPage([viewport.width, viewport.height]);
        newPage.drawImage(embeddedImg, {
          x: 0, y: 0, width: viewport.width, height: viewport.height,
        });
      }
    }

    const finalPdfBytes = await outputPdf.save();
    const finalBlob = new Blob([finalPdfBytes], { type: 'application/pdf' });
    const finalFileName = pdfFile.value.name.replace('.pdf', '_secured.pdf');

    if (saveToCloud && nextcloudTargetDir.value) {
      const webdavUrl = OC.linkToRemote('webdav') + 
        nextcloudTargetDir.value.split('/').map(encodeURIComponent).join('/') + '/' + encodeURIComponent(finalFileName);
      
      const uploadResponse = await fetch(webdavUrl, {
        method: 'PUT',
        body: finalBlob,
        headers: {
          'Content-Type': 'application/pdf',
          'requesttoken': OC.requestToken
        }
      });

      if (uploadResponse.ok) {
        alert("Succès : Le fichier sécurisé a été enregistré directement dans vos documents Nextcloud !");
      } else {
        throw new Error("Échec du téléversement vers le serveur Nextcloud WebDAV.");
      }
    } else {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(finalBlob);
      link.download = finalFileName;
      link.click();
    }
  } catch (error) {
    console.error("Erreur globale :", error);
    alert("Une erreur est survenue lors de l'opération.");
  } finally {
    worker.terminate();
    processing.value = false;
  }
};

const resetApp = () => {
  pdfFile.value = null;
  pdfDocInstance = null;
  fileArrayBuffer = null;
  currentPage.value = 1;
  totalPages.value = 1;
  nextcloudTargetDir.value = null;
  window.history.replaceState({}, document.title, window.location.pathname);
};
</script>

<style scoped>
.watermark-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 25px;
  color: #1e293b;
}
.app-header { text-align: center; margin-bottom: 30px; }
.app-header h2 { font-size: 26px; color: #0077c2; margin-bottom: 6px; }
.loading-state { text-align: center; padding: 50px; color: #64748b; }
.upload-section { border: 3px dashed #cbd5e1; background: #f8fafc; border-radius: 12px; padding: 60px 20px; text-align: center; }
.drop-zone { cursor: pointer; }
.file-input { display: none; }
.icon-upload { font-size: 50px; display: block; margin-bottom: 10px; }
.workspace { display: flex; gap: 30px; }
.settings-panel { flex: 1; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); }
.preview-panel { flex: 1.3; background: #f1f5f9; border-radius: 12px; padding: 20px; }
.preview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.page-controls { display: flex; align-items: center; gap: 10px; }
.page-controls button { background: #ffffff; border: 1px solid #cbd5e1; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
.page-controls button:disabled { opacity: 0.5; cursor: not-allowed; }
.form-group { margin-bottom: 18px; }
.form-group label { display: block; font-weight: 600; margin-bottom: 6px; font-size: 13px; }
.form-group input[type="text"] { width: 100%; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 6px; }
.checkbox-group label { display: flex; align-items: center; gap: 8px; font-weight: 500; cursor: pointer; }
.progress-bar-container { background: #e2e8f0; border-radius: 6px; height: 20px; position: relative; margin-top: 15px; overflow: hidden; }
.progress-bar { background: #0077c2; height: 100%; transition: width 0.1s ease; }
.progress-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 11px; font-weight: bold; color: #0f172a; }
.actions { display: flex; flex-direction: column; gap: 10px; margin-top: 25px; }
.btn { padding: 11px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-primary { background: #0077c2; color: white; }
.btn-primary:hover { background: #005fa0; }
.btn-success { background: #10b981; color: white; }
.btn-success:hover { background: #059669; }
.btn-success:disabled { background: #cbd5e1; cursor: not-allowed; }
.btn-secondary { background: #cbd5e1; color: #334155; }
.canvas-wrapper { background: white; padding: 8px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: inline-block; max-width: 100%; }
canvas { max-width: 100%; height: auto; display: block; }
</style>
