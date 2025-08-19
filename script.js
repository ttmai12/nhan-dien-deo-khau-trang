// ...existing code from script.js...

async function loadModels() {
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
}

let maskModel;
async function loadMaskModel() {
    maskModel = await tf.loadLayersModel('/static/models/model.json');
}

async function analyzeFaceForMask(faceBox, video) {
    const canvas = document.createElement('canvas');
    canvas.width = faceBox.width;
    canvas.height = faceBox.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, faceBox.x, faceBox.y, faceBox.width, faceBox.height, 0, 0, faceBox.width, faceBox.height);
    let imgData = tf.browser.fromPixels(canvas).resizeNearestNeighbor([128,128]).toFloat().expandDims();
    let prediction = await maskModel.predict(imgData).data();
    // Giả sử prediction trả về [mask, no_mask, incorrect_mask]
    let maxIdx = prediction.indexOf(Math.max(...prediction));
    let result = ['Đeo khẩu trang đúng', 'Không đeo khẩu trang', 'Đeo khẩu trang sai'][maxIdx];
    showAlert('Phát hiện: ' + result);
    saveHistory('Video', result);
    // Có thể cập nhật thống kê tại đây
}

async function detectFaces() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    canvas.style.display = 'block';
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);
    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        for (const det of resizedDetections) {
            await analyzeFaceForMask(det.box, video);
        }
    }, 700);
}

// Hỗ trợ chọn camera
async function getCameras() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === 'videoinput');
    const select = document.getElementById('cameraSelect');
    select.innerHTML = '';
    cameras.forEach(cam => {
        const option = document.createElement('option');
        option.value = cam.deviceId;
        option.text = cam.label || `Camera ${select.length+1}`;
        select.appendChild(option);
    });
}

function startCamera() {
    const video = document.getElementById('cameraVideo');
    const placeholder = document.getElementById('cameraPlaceholder');
    const cameraId = document.getElementById('cameraSelect').value;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { deviceId: cameraId ? { exact: cameraId } : undefined } })
            .then(function(stream) {
                video.srcObject = stream;
                video.play();
                video.style.display = 'block';
                placeholder.style.display = 'none';
                document.getElementById('statusIndicator').classList.remove('status-inactive');
                document.getElementById('statusIndicator').classList.add('status-active');
                document.getElementById('monitorBtn').style.display = 'inline-block';
                Promise.all([loadModels(), loadMaskModel()]).then(detectFaces);
            })
            .catch(function(err) {
                alert('Không thể truy cập camera: ' + err);
            });
    } else {
        alert('Trình duyệt không hỗ trợ camera!');
    }
}

function startMonitoring() {
    document.getElementById('monitorBtn').style.display = 'none';
    document.getElementById('cameraVideo').style.border = '3px solid #42a5f5';
    document.getElementById('captureBtn').style.display = 'none';
    // Bắt đầu phân tích video realtime
    analyzeVideoRealtime();
}

function stopMonitoring() {
    document.getElementById('monitorBtn').style.display = 'inline-block';
    document.getElementById('cameraVideo').style.border = 'none';
    document.getElementById('captureBtn').style.display = 'inline-block';
    // Dừng phân tích video
    stopAnalyzeVideo();
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL('image/png');
    document.getElementById('uploadPreview').src = dataURL;
    document.getElementById('uploadPreview').style.display = 'block';
    // Gửi ảnh lên server để phân tích nếu cần
    analyzeImage(dataURL);
}

function handleUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('uploadPreview').src = e.target.result;
            document.getElementById('uploadPreview').style.display = 'block';
            // Gửi ảnh lên server để phân tích nếu cần
            analyzeImage(e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

let stats = {
    total: 0,
    mask: 0,
    incorrect: 0,
    nomask: 0
};
let sessionStats = [];

// Giả lập phân tích ảnh (có thể thay bằng AI thực tế)
function analyzeImage(dataURL) {
    let result = ['Đeo khẩu trang đúng', 'Không đeo khẩu trang', 'Đeo khẩu trang sai'];
    let idx = Math.floor(Math.random() * result.length);
    let res = result[idx];
    alert('Kết quả phân tích: ' + res);
    stats.total++;
    if (res === 'Đeo khẩu trang đúng') stats.mask++;
    else if (res === 'Đeo khẩu trang sai') stats.incorrect++;
    else stats.nomask++;
    updateStatsPanel();
    sessionStats.push({type: 'Ảnh tải lên', result: res, time: new Date().toLocaleTimeString()});
    saveHistory('Ảnh tải lên', res);
}

let videoAnalysisInterval;
function analyzeVideoRealtime() {
    videoAnalysisInterval = setInterval(function() {
        // Giả lập nhận diện nhiều người trong một khung hình
        let people = Math.floor(Math.random() * 4) + 1; // 1-4 người
        for (let i = 0; i < people; i++) {
            let result = ['Đeo khẩu trang đúng', 'Không đeo khẩu trang', 'Đeo khẩu trang sai'];
            let idx = Math.floor(Math.random() * result.length);
            let res = result[idx];
            stats.total++;
            if (res === 'Đeo khẩu trang đúng') stats.mask++;
            else if (res === 'Đeo khẩu trang sai') stats.incorrect++;
            else stats.nomask++;
            updateStatsPanel();
            sessionStats.push({type: 'Video', result: res, time: new Date().toLocaleTimeString()});
            if (res !== 'Đeo khẩu trang đúng') {
                showAlert('Cảnh báo: ' + res);
            }
        }
    }, 3000);
}
function stopAnalyzeVideo() {
    clearInterval(videoAnalysisInterval);
    showSessionStats();
}
function updateStatsPanel() {
    document.getElementById('totalPeople').innerText = stats.total;
    document.getElementById('maskCount').innerText = stats.mask;
    document.getElementById('incorrectMaskCount').innerText = stats.incorrect;
    document.getElementById('noMaskCount').innerText = stats.nomask;
    let rate = stats.total ? Math.round((stats.mask / stats.total) * 100) : 0;
    document.getElementById('complianceRate').innerText = rate + '%';
}
function showSessionStats() {
    let sessionDiv = document.getElementById('sessionStats');
    sessionDiv.innerHTML = '<h4>Kết quả giám sát vừa kết thúc</h4>';
    if (sessionStats.length === 0) {
        sessionDiv.innerHTML += '<div>Không có dữ liệu giám sát.</div>';
        return;
    }
    let mask = 0, nomask = 0, incorrect = 0;
    sessionStats.forEach(item => {
        sessionDiv.innerHTML += `<div class='session-item'><span>${item.time}</span> - <b>${item.type}</b>: ${item.result}</div>`;
        if (item.result === 'Đeo khẩu trang đúng') mask++;
        else if (item.result === 'Đeo khẩu trang sai') incorrect++;
        else nomask++;
    });
    sessionDiv.innerHTML += `<div style='margin-top:12px;'><b>Phân tích tổng kết:</b></div>`;
    sessionDiv.innerHTML += `<div>✅ Đeo khẩu trang đúng: <b>${mask}</b></div>`;
    sessionDiv.innerHTML += `<div>⚠️ Đeo khẩu trang sai: <b>${incorrect}</b></div>`;
    sessionDiv.innerHTML += `<div>❌ Không đeo khẩu trang: <b>${nomask}</b></div>`;
    if (incorrect > 0 || nomask > 0) {
        sessionDiv.innerHTML += `<div style='color:#d32f2f; margin-top:10px;'><b>🚨 Cảnh báo: Phát hiện ${incorrect + nomask} trường hợp không tuân thủ!</b></div>`;
    } else {
        sessionDiv.innerHTML += `<div style='color:#388e3c; margin-top:10px;'><b>✅ Tất cả đều tuân thủ!</b></div>`;
    }
    sessionStats = [];
}

// Thêm âm thanh cảnh báo, lưu lịch sử giám sát vào server qua API, cập nhật các hàm liên quan.
function playAlertSound() {
    const audio = new Audio('https://cdn.pixabay.com/audio/2022/10/16/audio_12b6b1b2b2.mp3');
    audio.play();
}

function showAlert(msg) {
    let alertsList = document.getElementById('alertsList');
    let div = document.createElement('div');
    div.className = 'alert-item';
    div.innerHTML = `<div>${msg}</div><div class="alert-time">${new Date().toLocaleTimeString()}</div>`;
    alertsList.prepend(div);
    playAlertSound();
}

function saveHistory(type, result) {
    fetch('/save_history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time: new Date().toLocaleString(), type, result })
    });
}

window.onload = function() {
    getCameras();
    document.querySelector('.header').classList.add('animate-header');
    document.querySelector('.stats-panel').classList.add('animate-panel');
};
