// Wangwana Real Estate Agency - High-Resolution Fullscreen Lightbox, 360° Virtual Tour & Photo Manager
import { getRoomPhotoInfo } from './main.js';
import { formatKsh } from './properties.js';

/**
 * High-demand property IDs that feature the Limited Availability urgency countdown
 */
export const HIGH_DEMAND_PROPERTIES = new Set(['whitehouse', 'delpiero', 'beach']);

/**
 * Global state for active 360 viewer instance
 */
let active360Viewer = null;

/**
 * Initializes synchronized Limited Availability countdown timers on high-demand listings
 */
export function initLimitedAvailabilityTimers() {
  function updateTimers() {
    // Synchronize to today's midnight cutoff
    const now = new Date();
    const tonight = new Date();
    tonight.setHours(23, 59, 59, 999);
    let diffMs = tonight.getTime() - now.getTime();
    if (diffMs < 0) diffMs = 0;

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    const formatted = `${hours}h ${minutes}m ${seconds}s`;

    document.querySelectorAll('.urgency-countdown-val').forEach(el => {
      el.textContent = formatted;
    });
  }

  updateTimers();
  setInterval(updateTimers, 1000);
}

/**
 * Renders the HTML markup for the Limited Availability countdown banner on property cards
 * @param {Object} property 
 * @returns {string}
 */
export function createUrgencyTimerHTML(property) {
  if (!HIGH_DEMAND_PROPERTIES.has(property.id) && Number(property.rating || 0) < 4.93) {
    return '';
  }

  const unitsLeft = property.id === 'whitehouse' ? 1 : (property.id === 'delpiero' ? 1 : 2);

  return `
    <div class="urgency-timer-banner" title="High guest search volume in Kisumu today">
      <div class="d-flex align-items-center justify-content-between gap-2">
        <div class="d-flex align-items-center gap-2">
          <span class="urgency-pulse-dot" aria-hidden="true"></span>
          <span class="urgency-text">
            <strong class="text-danger"><i class="bi bi-fire me-1"></i>Limited Availability:</strong> Only ${unitsLeft} unit left today
          </span>
        </div>
        <div class="urgency-countdown font-monospace">
          <i class="bi bi-stopwatch text-gold me-1"></i>
          <span class="urgency-countdown-val">04h 18m 22s</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Opens an immersive, full-screen lightbox for room photos with zoom and 360° mode
 * @param {Object} options
 * @param {Object} options.property - Property object
 * @param {number} [options.startIndex=0] - Starting photo index
 * @param {'photo'|'360'} [options.initialMode='photo'] - Initial mode
 */
export function openFullscreenLightbox({ property, startIndex = 0, initialMode = 'photo' }) {
  if (!property) return;

  const images = Array.isArray(property.images) && property.images.length > 0
    ? property.images
    : ['assets/images/whitehouse.jpg'];

  let currentIndex = Math.max(0, Math.min(startIndex, images.length - 1));
  let currentMode = initialMode; // 'photo' or '360'
  let zoomLevel = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let startX = 0;
  let startY = 0;

  // Clean up any existing lightbox modal
  let lightboxEl = document.getElementById('wangwanaFullscreenLightbox');
  if (lightboxEl) {
    lightboxEl.remove();
  }

  lightboxEl = document.createElement('div');
  lightboxEl.id = 'wangwanaFullscreenLightbox';
  lightboxEl.className = 'wangwana-lightbox-overlay';
  lightboxEl.setAttribute('role', 'dialog');
  lightboxEl.setAttribute('aria-modal', 'true');
  document.body.appendChild(lightboxEl);

  // Prevent background scrolling while open
  document.body.classList.add('lightbox-open');

  function renderLightboxUI() {
    const currentImgSrc = images[currentIndex];
    const photoInfo = getRoomPhotoInfo(currentImgSrc, currentIndex, property.name);

    lightboxEl.innerHTML = `
      <!-- Top Control Bar -->
      <header class="lightbox-header">
        <div class="lightbox-title-box">
          <span class="badge bg-gold-subtle text-gold text-uppercase fw-semibold px-2 py-1 me-2">${property.badge || 'Agency Exclusive'}</span>
          <h2 class="h5 mb-0 text-light text-truncate">${property.name}</h2>
          <span class="lightbox-divider">|</span>
          <div class="d-flex align-items-center gap-1 text-gold fw-semibold small" id="lightbox-room-tag">
            <i class="bi ${photoInfo.icon}"></i>
            <span>${photoInfo.label}</span>
          </div>
        </div>

        <div class="lightbox-actions-box">
          <!-- Mode Switcher: 360° Virtual Tour vs High-Res Photo -->
          <div class="btn-group btn-group-sm me-2" role="group" aria-label="Viewer Mode">
            <button type="button" class="btn ${currentMode === 'photo' ? 'btn-gold text-dark fw-bold' : 'btn-outline-light'}" id="btnLightboxModePhoto">
              <i class="bi bi-image me-1"></i> High-Res Photo
            </button>
            <button type="button" class="btn ${currentMode === '360' ? 'btn-gold text-dark fw-bold' : 'btn-outline-light'}" id="btnLightboxMode360" title="Interactive 360° panoramic room tour">
              <i class="bi bi-badge-3d-fill text-danger me-1"></i> 360° View
            </button>
          </div>

          <!-- Photo Zoom Controls (Visible in photo mode) -->
          <div class="btn-group btn-group-sm me-2 ${currentMode === '360' ? 'd-none' : ''}" id="lightboxZoomGroup">
            <button type="button" class="btn btn-dark border border-secondary text-light" id="btnLightboxZoomOut" title="Zoom Out (-)">
              <i class="bi bi-zoom-out"></i>
            </button>
            <button type="button" class="btn btn-dark border border-secondary text-gold font-monospace small px-2" id="btnLightboxZoomReset" title="Reset to 100%">
              <span id="lightboxZoomVal">100%</span>
            </button>
            <button type="button" class="btn btn-dark border border-secondary text-light" id="btnLightboxZoomIn" title="Zoom In (+)">
              <i class="bi bi-zoom-in"></i>
            </button>
          </div>

          <!-- Upload Photos Shortcut -->
          <button type="button" class="btn btn-sm btn-outline-gold me-2 d-none d-md-inline-flex align-items-center gap-1" id="btnLightboxUploadMore" title="Upload more photos to this property">
            <i class="bi bi-cloud-arrow-up"></i>
            <span>Add Photos</span>
          </button>

          <!-- Direct Reserve CTA -->
          <a href="book.html?id=${encodeURIComponent(property.id)}" class="btn btn-sm btn-primary me-2 d-none d-sm-inline-flex align-items-center gap-1">
            <i class="bi bi-calendar-check"></i>
            <span>Reserve Stay</span>
          </a>

          <!-- Close Button -->
          <button type="button" class="btn btn-sm btn-outline-light rounded-circle p-2" id="btnLightboxClose" title="Close Lightbox (Esc)" aria-label="Close">
            <i class="bi bi-x-lg fs-5"></i>
          </button>
        </div>
      </header>

      <!-- Center Viewport Area -->
      <main class="lightbox-stage" id="lightboxStage">
        ${currentMode === 'photo' ? `
          <!-- High-Res Inspection View -->
          <div class="lightbox-image-viewport" id="lightboxImageViewport">
            <img src="${currentImgSrc}" 
                 id="lightboxActiveImg" 
                 class="lightbox-main-img" 
                 alt="${property.name} - ${photoInfo.label}" 
                 draggable="false"
                 onerror="this.src='assets/images/whitehouse.jpg'">
          </div>
        ` : `
          <!-- 360 Panoramic Virtual View -->
          <div class="lightbox-360-viewport" id="lightbox360Viewport">
            <canvas id="canvas360" class="canvas-360"></canvas>
            <div class="overlay-360-hud">
              <div class="badge bg-dark bg-opacity-80 border border-gold text-gold px-3 py-1 mb-2 d-inline-flex align-items-center gap-2">
                <i class="bi bi-arrow-repeat spin-slow"></i>
                <span>360° Interactive Room Sphere • Drag to Look Around</span>
              </div>
              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-sm btn-dark border border-secondary text-light" id="btnToggleAutoRotate">
                  <i class="bi bi-play-circle me-1 text-gold"></i> <span id="autoRotateLabel">Pause Rotation</span>
                </button>
                <button type="button" class="btn btn-sm btn-dark border border-secondary text-light" id="btnResetOrientation">
                  <i class="bi bi-compass me-1"></i> Center View
                </button>
              </div>
            </div>
            <div class="compass-indicator" id="compassHeading">N 0°</div>
          </div>
        `}

        <!-- Previous & Next Navigation Arrows -->
        <button type="button" class="lightbox-nav-btn lightbox-nav-prev" id="btnLightboxPrev" aria-label="Previous room photo (Left Arrow)">
          <i class="bi bi-chevron-left fs-3"></i>
        </button>
        <button type="button" class="lightbox-nav-btn lightbox-nav-next" id="btnLightboxNext" aria-label="Next room photo (Right Arrow)">
          <i class="bi bi-chevron-right fs-3"></i>
        </button>

        <!-- Room Caption Floating Pill -->
        <div class="lightbox-floating-caption">
          <span class="font-monospace text-gold me-2">Photo ${currentIndex + 1} of ${images.length}</span>
          <span class="text-light fw-bold">${photoInfo.label}</span>
          <span class="text-muted ms-2 d-none d-md-inline">&bull; ${property.location}</span>
        </div>
      </main>

      <!-- Bottom Thumbnails Strip -->
      <footer class="lightbox-footer">
        <div class="lightbox-thumbs-container" id="lightboxThumbsContainer">
          ${images.map((src, idx) => {
            const info = getRoomPhotoInfo(src, idx, property.name);
            return `
              <button type="button" 
                      class="lightbox-thumb-btn ${idx === currentIndex ? 'active' : ''}" 
                      data-index="${idx}" 
                      title="${info.label}">
                <img src="${src}" alt="${info.label}" onerror="this.src='assets/images/whitehouse.jpg'">
                <span class="thumb-label"><i class="bi ${info.icon}"></i> ${info.shortLabel}</span>
              </button>
            `;
          }).join('')}
        </div>
      </footer>
    `;

    setupLightboxListeners();
  }

  function setupLightboxListeners() {
    // Mode toggles
    const btnPhoto = document.getElementById('btnLightboxModePhoto');
    const btn360 = document.getElementById('btnLightboxMode360');
    if (btnPhoto) {
      btnPhoto.addEventListener('click', () => {
        if (currentMode !== 'photo') {
          if (active360Viewer) active360Viewer.destroy();
          currentMode = 'photo';
          zoomLevel = 1;
          panX = 0;
          panY = 0;
          renderLightboxUI();
        }
      });
    }
    if (btn360) {
      btn360.addEventListener('click', () => {
        if (currentMode !== '360') {
          currentMode = '360';
          renderLightboxUI();
        }
      });
    }

    // Close button
    const closeBtn = document.getElementById('btnLightboxClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeLightbox);
    }

    // Prev / Next buttons
    const prevBtn = document.getElementById('btnLightboxPrev');
    const nextBtn = document.getElementById('btnLightboxNext');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => navigatePhoto(-1));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => navigatePhoto(1));
    }

    // Upload more photos
    const uploadMoreBtn = document.getElementById('btnLightboxUploadMore');
    if (uploadMoreBtn) {
      uploadMoreBtn.addEventListener('click', () => {
        openPhotoUploadManagerModal(property.id);
      });
    }

    // Thumbnail strip clicks
    const thumbBtns = lightboxEl.querySelectorAll('.lightbox-thumb-btn');
    thumbBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetIdx = parseInt(btn.getAttribute('data-index'), 10);
        if (!isNaN(targetIdx) && targetIdx !== currentIndex) {
          currentIndex = targetIdx;
          zoomLevel = 1;
          panX = 0;
          panY = 0;
          renderLightboxUI();
          scrollToActiveThumb();
        }
      });
    });

    // Zoom Controls in Photo Mode
    const zoomInBtn = document.getElementById('btnLightboxZoomIn');
    const zoomOutBtn = document.getElementById('btnLightboxZoomOut');
    const zoomResetBtn = document.getElementById('btnLightboxZoomReset');
    const activeImg = document.getElementById('lightboxActiveImg');
    const zoomValEl = document.getElementById('lightboxZoomVal');

    function applyZoomTransform() {
      if (!activeImg) return;
      activeImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
      if (zoomValEl) zoomValEl.textContent = `${Math.round(zoomLevel * 100)}%`;
      if (zoomLevel > 1) {
        activeImg.style.cursor = 'grab';
      } else {
        activeImg.style.cursor = 'zoom-in';
        panX = 0;
        panY = 0;
      }
    }

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        zoomLevel = Math.min(zoomLevel + 0.35, 3.5);
        applyZoomTransform();
      });
    }
    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        zoomLevel = Math.max(zoomLevel - 0.35, 1);
        if (zoomLevel === 1) {
          panX = 0;
          panY = 0;
        }
        applyZoomTransform();
      });
    }
    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', () => {
        zoomLevel = 1;
        panX = 0;
        panY = 0;
        applyZoomTransform();
      });
    }

    // Image click to toggle 1.8x zoom
    if (activeImg) {
      activeImg.addEventListener('click', (e) => {
        if (isPanning) return;
        if (zoomLevel === 1) {
          zoomLevel = 1.8;
        } else {
          zoomLevel = 1;
          panX = 0;
          panY = 0;
        }
        applyZoomTransform();
      });

      // Mouse drag to pan when zoomed
      activeImg.addEventListener('mousedown', (e) => {
        if (zoomLevel <= 1) return;
        isPanning = false;
        startX = e.clientX - panX;
        startY = e.clientY - panY;
        activeImg.style.cursor = 'grabbing';

        function onMouseMove(moveEvent) {
          isPanning = true;
          panX = moveEvent.clientX - startX;
          panY = moveEvent.clientY - startY;
          activeImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
        }

        function onMouseUp() {
          activeImg.style.cursor = 'grab';
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        }

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      });
    }

    // 360 Mode Initialization
    if (currentMode === '360') {
      const canvasEl = document.getElementById('canvas360');
      if (canvasEl) {
        if (active360Viewer) active360Viewer.destroy();
        active360Viewer = new Wangwana360Viewer(canvasEl, images[currentIndex]);
      }
    }
  }

  function navigatePhoto(delta) {
    currentIndex = (currentIndex + delta + images.length) % images.length;
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    renderLightboxUI();
    scrollToActiveThumb();
  }

  function scrollToActiveThumb() {
    const container = document.getElementById('lightboxThumbsContainer');
    const active = container?.querySelector('.lightbox-thumb-btn.active');
    if (container && active) {
      active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  // Keyboard navigation
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      navigatePhoto(1);
    } else if (e.key === 'ArrowLeft') {
      navigatePhoto(-1);
    } else if (e.key === '+' || e.key === '=') {
      zoomLevel = Math.min(zoomLevel + 0.3, 3.5);
      const activeImg = document.getElementById('lightboxActiveImg');
      if (activeImg) activeImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    } else if (e.key === '-') {
      zoomLevel = Math.max(zoomLevel - 0.3, 1);
      const activeImg = document.getElementById('lightboxActiveImg');
      if (activeImg) activeImg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    } else if (e.key === '0') {
      zoomLevel = 1;
      panX = 0;
      panY = 0;
      const activeImg = document.getElementById('lightboxActiveImg');
      if (activeImg) activeImg.style.transform = `scale(1)`;
    }
  }

  function closeLightbox() {
    if (active360Viewer) {
      active360Viewer.destroy();
      active360Viewer = null;
    }
    window.removeEventListener('keydown', onKeyDown);
    document.body.classList.remove('lightbox-open');
    if (lightboxEl) lightboxEl.remove();
  }

  window.addEventListener('keydown', onKeyDown);
  renderLightboxUI();
}

/**
 * High-Performance HTML5 Canvas 360° Spherical Panoramic Room Viewer
 */
export class Wangwana360Viewer {
  constructor(canvas, imageSrc) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.imageSrc = imageSrc;
    this.image = new Image();
    this.isLoaded = false;
    this.isDestroyed = false;

    // Spherical coordinates
    this.yaw = 0;           // Horizontal rotation (0 to 360 deg)
    this.pitch = 0;         // Vertical rotation (-55 to 55 deg)
    this.fov = 75;          // Field of view (degrees, 45 to 100)
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.targetFov = 75;

    // Interaction state
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.autoRotate = true;
    this.autoRotateSpeed = 0.12;

    this.init();
  }

  init() {
    this.resizeCanvas();
    this.bindEvents();

    this.image.crossOrigin = 'anonymous';
    this.image.onload = () => {
      this.isLoaded = true;
      this.render();
    };
    this.image.onerror = () => {
      this.image.src = 'assets/images/whitehouse.jpg';
    };
    this.image.src = this.imageSrc;

    this.loop();
  }

  resizeCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width || window.innerWidth;
    this.height = rect.height || window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  bindEvents() {
    this.onResize = () => this.resizeCanvas();
    window.addEventListener('resize', this.onResize);

    // Mouse Controls
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      this.canvas.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      const sensitivity = 0.22 * (this.fov / 75);
      this.targetYaw -= dx * sensitivity;
      this.targetPitch += dy * sensitivity;
      this.targetPitch = Math.max(-55, Math.min(55, this.targetPitch));
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.canvas.style.cursor = 'grab';
    });

    // Touch Controls
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchmove', (e) => {
      if (!this.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - this.lastMouseX;
      const dy = e.touches[0].clientY - this.lastMouseY;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;

      const sensitivity = 0.25 * (this.fov / 75);
      this.targetYaw -= dx * sensitivity;
      this.targetPitch += dy * sensitivity;
      this.targetPitch = Math.max(-55, Math.min(55, this.targetPitch));
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    // Scroll Wheel FOV Zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomDelta = Math.sign(e.deltaY) * 3;
      this.targetFov = Math.max(45, Math.min(100, this.targetFov + zoomDelta));
    }, { passive: false });

    // Auto rotate toggle button
    const autoRotateBtn = document.getElementById('btnToggleAutoRotate');
    const autoRotateLabel = document.getElementById('autoRotateLabel');
    if (autoRotateBtn) {
      autoRotateBtn.addEventListener('click', () => {
        this.autoRotate = !this.autoRotate;
        if (autoRotateLabel) {
          autoRotateLabel.textContent = this.autoRotate ? 'Pause Rotation' : 'Resume Rotation';
        }
      });
    }

    // Center view
    const centerBtn = document.getElementById('btnResetOrientation');
    if (centerBtn) {
      centerBtn.addEventListener('click', () => {
        this.targetYaw = 0;
        this.targetPitch = 0;
        this.targetFov = 75;
      });
    }
  }

  loop() {
    if (this.isDestroyed) return;

    // Smooth inertia interpolation
    if (this.autoRotate && !this.isDragging) {
      this.targetYaw += this.autoRotateSpeed;
    }

    this.yaw += (this.targetYaw - this.yaw) * 0.15;
    this.pitch += (this.targetPitch - this.pitch) * 0.15;
    this.fov += (this.targetFov - this.fov) * 0.15;

    // Keep yaw normalized between 0 and 360
    while (this.yaw < 0) {
      this.yaw += 360;
      this.targetYaw += 360;
    }
    while (this.yaw >= 360) {
      this.yaw -= 360;
      this.targetYaw -= 360;
    }

    this.render();
    this.updateCompass();

    requestAnimationFrame(() => this.loop());
  }

  render() {
    if (!this.isLoaded || !this.ctx) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const img = this.image;

    this.ctx.clearRect(0, 0, w, h);

    // Cylindrical / equirectangular panoramic rendering mapping
    // Calculate horizontal offset from yaw (0-360 deg maps to 0-img.width)
    const normalizedYaw = (this.yaw % 360) / 360;
    const centerSourceX = normalizedYaw * img.width;

    // Aspect ratio & FOV scaling
    const fovRad = (this.fov * Math.PI) / 180;
    const visibleWidthPercent = fovRad / (2 * Math.PI);
    const sourceW = img.width * visibleWidthPercent;

    // Vertical pitch displacement
    const pitchOffset = (this.pitch / 90) * (img.height * 0.45);
    const sourceH = Math.min(img.height, (sourceW * h) / w);
    const centerSourceY = img.height / 2 - pitchOffset;
    const sourceY = Math.max(0, Math.min(img.height - sourceH, centerSourceY - sourceH / 2));

    // Draw panoramic image with horizontal wraparound seam handling
    const startSourceX = centerSourceX - sourceW / 2;

    if (startSourceX < 0) {
      // Wraps around the left edge
      const splitRatio = -startSourceX / sourceW;
      const leftDestW = w * splitRatio;
      const rightDestW = w - leftDestW;

      // Draw right wrap
      this.ctx.drawImage(
        img,
        img.width + startSourceX, sourceY, -startSourceX, sourceH,
        0, 0, leftDestW, h
      );
      // Draw left body
      this.ctx.drawImage(
        img,
        0, sourceY, sourceW + startSourceX, sourceH,
        leftDestW, 0, rightDestW, h
      );
    } else if (startSourceX + sourceW > img.width) {
      // Wraps around the right edge
      const firstChunkW = img.width - startSourceX;
      const splitRatio = firstChunkW / sourceW;
      const firstDestW = w * splitRatio;
      const secondDestW = w - firstDestW;

      this.ctx.drawImage(
        img,
        startSourceX, sourceY, firstChunkW, sourceH,
        0, 0, firstDestW, h
      );
      this.ctx.drawImage(
        img,
        0, sourceY, sourceW - firstChunkW, sourceH,
        firstDestW, 0, secondDestW, h
      );
    } else {
      // Normal continuous slice
      this.ctx.drawImage(
        img,
        startSourceX, sourceY, sourceW, sourceH,
        0, 0, w, h
      );
    }

    // Luxury vignette & ambient depth lighting
    const vignette = this.ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.85);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(5,8,17,0.45)');
    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, w, h);
  }

  updateCompass() {
    const compassEl = document.getElementById('compassHeading');
    if (!compassEl) return;
    const deg = Math.round(this.yaw);
    let cardinal = 'N';
    if (deg >= 45 && deg < 135) cardinal = 'E';
    else if (deg >= 135 && deg < 225) cardinal = 'S';
    else if (deg >= 225 && deg < 315) cardinal = 'W';
    compassEl.textContent = `${cardinal} ${deg}° | Pitch ${Math.round(this.pitch)}°`;
  }

  destroy() {
    this.isDestroyed = true;
    window.removeEventListener('resize', this.onResize);
  }
}

/**
 * Opens an Interactive Photo Upload & Media Manager Modal
 * Allows hosts and agency managers to pick files from their local folder, categorize them, and save directly to the property!
 * @param {string} [presetPropertyId] 
 */
export function openPhotoUploadManagerModal(presetPropertyId = 'whitehouse') {
  let modalEl = document.getElementById('wangwanaPhotoUploadModal');
  if (modalEl) modalEl.remove();

  modalEl = document.createElement('div');
  modalEl.id = 'wangwanaPhotoUploadModal';
  modalEl.className = 'modal fade';
  modalEl.tabIndex = -1;
  modalEl.setAttribute('aria-hidden', 'true');
  document.body.appendChild(modalEl);

  modalEl.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content surface-card border-gold text-light shadow-lg">
        <div class="modal-header border-secondary py-3 px-4">
          <div class="d-flex align-items-center gap-2">
            <div class="p-2 rounded bg-gold-subtle text-gold">
              <i class="bi bi-cloud-arrow-up-fill fs-5"></i>
            </div>
            <div>
              <h5 class="modal-title mb-0">Upload & Manage Property Photos</h5>
              <small class="text-muted">Directly upload photos from your computer or phone folder into Wangwana Agency listings</small>
            </div>
          </div>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>

        <div class="modal-body p-4">
          <!-- Property Target Selector -->
          <div class="mb-3">
            <label for="uploadTargetProperty" class="form-label small text-gold fw-bold text-uppercase">
              <i class="bi bi-building me-1"></i> Target Residence / Villa:
            </label>
            <select class="form-select bg-dark border-secondary text-light" id="uploadTargetProperty">
              <option value="whitehouse" ${presetPropertyId === 'whitehouse' ? 'selected' : ''}>White House Serviced Residence (Milimani)</option>
              <option value="delpiero" ${presetPropertyId === 'delpiero' ? 'selected' : ''}>Delpiero Luxury Hilltop Villa (Riat Hills)</option>
              <option value="beach" ${presetPropertyId === 'beach' ? 'selected' : ''}>Dunga Beachfront Waterfront Villa (Dunga)</option>
              <option value="victoria" ${presetPropertyId === 'victoria' ? 'selected' : ''}>Victoria Executive Corporate Suite (Tom Mboya)</option>
            </select>
          </div>

          <!-- Drag and Drop Upload Area -->
          <div class="photo-upload-dropzone mb-3" id="photoDropzone">
            <input type="file" id="photoFileInput" accept="image/png, image/jpeg, image/jpg, image/webp" multiple class="d-none">
            <div class="text-center p-4">
              <div class="mb-3">
                <i class="bi bi-images text-gold display-5"></i>
              </div>
              <h5 class="h6 text-light mb-1">Drag and drop photos from your folder here</h5>
              <p class="text-muted small mb-3">Supports JPG, PNG, WEBP (Standard & 360° Equirectangular Panoramas)</p>
              <button type="button" class="btn btn-outline-gold px-4 py-2" id="btnBrowseFiles">
                <i class="bi bi-folder2-open me-2"></i> Browse Computer / Folder
              </button>
            </div>
          </div>

          <!-- Staged Photos Preview Queue -->
          <div id="stagedPhotosSection" class="d-none mb-3">
            <h6 class="small text-gold fw-bold text-uppercase mb-2">
              <i class="bi bi-list-check me-1"></i> Staged Photos Ready for Upload:
            </h6>
            <div class="row g-2" id="stagedPhotosGrid" style="max-height: 280px; overflow-y: auto;">
              <!-- Populated via JS -->
            </div>
          </div>

          <!-- Upload Progress Status -->
          <div id="uploadProgressBox" class="d-none mb-3">
            <div class="d-flex justify-content-between small text-muted mb-1">
              <span id="uploadProgressText">Uploading photo 1 of 1...</span>
              <span id="uploadPercentText" class="text-gold font-monospace">0%</span>
            </div>
            <div class="progress bg-dark border border-secondary" style="height: 8px;">
              <div class="progress-bar bg-gold" id="uploadProgressBar" role="progressbar" style="width: 0%"></div>
            </div>
          </div>

          <!-- Explanatory Folder Instructions Box -->
          <div class="p-3 bg-dark-elevated rounded border border-secondary small text-muted">
            <strong class="text-light d-block mb-1"><i class="bi bi-info-circle text-gold me-1"></i> How Photos Are Stored & Handled:</strong>
            1. <strong>In-App Upload (Recommended):</strong> Drag or browse photos above. They are instantly saved into the project's <code>assets/rooms/</code> directory and immediately appear in the room carousels, full-screen lightbox, and 360° tour.<br>
            2. <strong>Direct Folder Placement:</strong> You can also copy your image files directly into the <code>assets/rooms/</code> or <code>assets/images/</code> folder on the server, and they will be served instantly!
          </div>
        </div>

        <div class="modal-footer border-secondary py-3 px-4">
          <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
          <button type="button" class="btn btn-gold text-dark fw-bold px-4" id="btnConfirmUpload" disabled>
            <i class="bi bi-cloud-upload me-1"></i> Upload to Residence Gallery
          </button>
        </div>
      </div>
    </div>
  `;

  const dropzone = modalEl.querySelector('#photoDropzone');
  const fileInput = modalEl.querySelector('#photoFileInput');
  const browseBtn = modalEl.querySelector('#btnBrowseFiles');
  const stagedSection = modalEl.querySelector('#stagedPhotosSection');
  const stagedGrid = modalEl.querySelector('#stagedPhotosGrid');
  const confirmBtn = modalEl.querySelector('#btnConfirmUpload');
  const propertySelect = modalEl.querySelector('#uploadTargetProperty');
  const progressBox = modalEl.querySelector('#uploadProgressBox');
  const progressText = modalEl.querySelector('#uploadProgressText');
  const percentText = modalEl.querySelector('#uploadPercentText');
  const progressBar = modalEl.querySelector('#uploadProgressBar');

  let stagedFiles = [];

  browseBtn.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('click', (e) => {
    if (e.target !== browseBtn) fileInput.click();
  });

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleSelectedFiles(Array.from(e.dataTransfer.files));
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleSelectedFiles(Array.from(e.target.files));
    }
  });

  function handleSelectedFiles(files) {
    const validImageFiles = files.filter(f => f.type.startsWith('image/'));
    if (validImageFiles.length === 0) {
      alert('Please select valid image files (JPG, PNG, WEBP).');
      return;
    }

    validImageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        stagedFiles.push({
          file: file,
          name: file.name,
          dataUrl: event.target.result,
          roomTag: detectRoomTagFromFilename(file.name),
          is360: file.name.toLowerCase().includes('360') || file.name.toLowerCase().includes('pano')
        });
        renderStagedGrid();
      };
      reader.readAsDataURL(file);
    });
  }

  function detectRoomTagFromFilename(name) {
    const lower = name.toLowerCase();
    if (lower.includes('living')) return 'Living Room';
    if (lower.includes('bed')) return 'Master Bedroom';
    if (lower.includes('kitchen')) return 'Kitchen';
    if (lower.includes('bath')) return 'Bathroom';
    if (lower.includes('outside') || lower.includes('garden') || lower.includes('balcony')) return 'Balcony & Views';
    if (lower.includes('360') || lower.includes('pano')) return '360° Virtual Tour';
    return 'Residence Suite';
  }

  function renderStagedGrid() {
    if (stagedFiles.length === 0) {
      stagedSection.classList.add('d-none');
      confirmBtn.disabled = true;
      return;
    }

    stagedSection.classList.remove('d-none');
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = `<i class="bi bi-cloud-upload me-1"></i> Upload ${stagedFiles.length} Photo${stagedFiles.length > 1 ? 's' : ''}`;

    stagedGrid.innerHTML = stagedFiles.map((item, idx) => `
      <div class="col-6 col-md-4">
        <div class="p-2 surface-card border border-secondary rounded position-relative">
          <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 p-1 py-0 rounded-circle btn-remove-staged" data-index="${idx}">
            &times;
          </button>
          <img src="${item.dataUrl}" class="w-100 rounded mb-2" style="height: 100px; object-fit: cover;" alt="Staged photo">
          <div class="text-truncate small text-light fw-bold mb-1" title="${item.name}">${item.name}</div>
          <select class="form-select form-select-sm bg-dark border-secondary text-light mb-1 select-room-tag" data-index="${idx}">
            <option value="Living Room" ${item.roomTag === 'Living Room' ? 'selected' : ''}>Living Room</option>
            <option value="Master Bedroom" ${item.roomTag === 'Master Bedroom' ? 'selected' : ''}>Master Bedroom</option>
            <option value="Kitchen" ${item.roomTag === 'Kitchen' ? 'selected' : ''}>Kitchen</option>
            <option value="Bathroom" ${item.roomTag === 'Bathroom' ? 'selected' : ''}>Bathroom</option>
            <option value="Balcony & Views" ${item.roomTag === 'Balcony & Views' ? 'selected' : ''}>Balcony & Views</option>
            <option value="360° Virtual Tour" ${item.roomTag === '360° Virtual Tour' ? 'selected' : ''}>360° Virtual Tour</option>
          </select>
          <div class="form-check form-switch small">
            <input class="form-check-input chk-is-360" type="checkbox" id="chk360-${idx}" data-index="${idx}" ${item.is360 ? 'checked' : ''}>
            <label class="form-check-label text-gold" for="chk360-${idx}">360° Photo</label>
          </div>
        </div>
      </div>
    `).join('');

    stagedGrid.querySelectorAll('.btn-remove-staged').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.getAttribute('data-index'), 10);
        stagedFiles.splice(i, 1);
        renderStagedGrid();
      });
    });

    stagedGrid.querySelectorAll('.select-room-tag').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const i = parseInt(sel.getAttribute('data-index'), 10);
        if (stagedFiles[i]) stagedFiles[i].roomTag = e.target.value;
      });
    });

    stagedGrid.querySelectorAll('.chk-is-360').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const i = parseInt(chk.getAttribute('data-index'), 10);
        if (stagedFiles[i]) stagedFiles[i].is360 = e.target.checked;
      });
    });
  }

  confirmBtn.addEventListener('click', async () => {
    if (stagedFiles.length === 0) return;

    confirmBtn.disabled = true;
    progressBox.classList.remove('d-none');
    const targetPropId = propertySelect.value;
    let uploadedCount = 0;

    for (let i = 0; i < stagedFiles.length; i++) {
      const item = stagedFiles[i];
      progressText.textContent = `Uploading ${item.name} (${i + 1}/${stagedFiles.length})...`;
      const pct = Math.round(((i + 1) / stagedFiles.length) * 100);
      progressBar.style.width = `${pct}%`;
      percentText.textContent = `${pct}%`;

      try {
        const resp = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId: targetPropId,
            filename: item.name,
            dataUrl: item.dataUrl,
            roomTag: item.roomTag,
            is360: item.is360
          })
        });
        const resData = await resp.json();
        if (resData.success) {
          uploadedCount++;
        }
      } catch (err) {
        console.error('Upload error for item:', item.name, err);
      }
    }

    progressText.textContent = `Success! ${uploadedCount} photo(s) added to residence gallery.`;
    progressBar.classList.add('bg-success');

    setTimeout(() => {
      const bsModal = bootstrap.Modal.getInstance(modalEl);
      if (bsModal) bsModal.hide();
      // Reload or refresh active view so the new photos show immediately!
      window.location.reload();
    }, 1200);
  });

  const bsModal = new bootstrap.Modal(modalEl);
  bsModal.show();
}

// Expose on window for easy HTML integration
window.openWangwanaLightbox = openFullscreenLightbox;
window.openPhotoUploadManagerModal = openPhotoUploadManagerModal;
