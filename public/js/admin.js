document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const generateBtn = document.getElementById('generateBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const generatedCode = document.getElementById('generatedCode');
    const scannerLink = document.getElementById('scannerLink');
    const activeCodesList = document.getElementById('activeCodesList');
    const terminal = document.getElementById('terminal');
    const totalCodesEl = document.getElementById('totalCodes');
    const activeCodesEl = document.getElementById('activeCodes');
    const totalScansEl = document.getElementById('totalScans');
    const recentScansEl = document.getElementById('recentScans');
    
    // Socket.io connection
    const socket = io();
    
    // State
    let accessCodes = [];
    
    // Event Listeners
    generateBtn.addEventListener('click', generateAccessCode);
    copyLinkBtn.addEventListener('click', copyScannerLink);
    
    // Socket events
    socket.on('scan-activity', (data) => {
        addLogEntry(data.message, data.type);
    });
    
    // Functions
    function generateAccessCode() {
        const duration = parseInt(document.getElementById('accessDuration').value);
        const note = document.getElementById('adminNote').value;
        const gameId = document.getElementById('megaId').value;
        
        if (!gameId) {
            alert('Sila masukkan MEGA ID terlebih dahulu');
            return;
        }
        
        fetch('/api/access-codes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                note,
                duration,
                megaId: gameId
            })
        })
        .then(response => response.json())
        .then(data => {
            // Update UI
            generatedCode.textContent = data.code;
            scannerLink.value = `${window.location.origin}/scanner?code=${data.code}`;
            
            // Add to local list and update UI
            accessCodes.push(data);
            updateActiveCodesList();
            
            // Add log entry
            addLogEntry(`Kod akses dijana: ${data.code} untuk MEGA ID: ${gameId}`, 'success');
            
            // Update stats
            updateStats();
        })
        .catch(error => {
            console.error('Error:', error);
            addLogEntry('Ralat semasa menjana kod akses', 'error');
        });
    }
    
    function copyScannerLink() {
        if (!scannerLink.value) {
            alert('Tiada pautan scanner untuk disalin');
            return;
        }
        
        scannerLink.select();
        document.execCommand('copy');
        alert('Pautan berjaya disalin!');
        
        addLogEntry('Pautan scanner disalin ke clipboard', 'info');
    }
    
    function updateActiveCodesList() {
        fetch('/api/access-codes')
        .then(response => response.json())
        .then(data => {
            accessCodes = data;
            
            if (accessCodes.length === 0) {
                activeCodesList.innerHTML = '<div class="empty-state">Tiada kod akses aktif</div>';
                return;
            }
            
            let html = '';
            const now = new Date();
            
            accessCodes.forEach((item) => {
                if (!item.active) return;
                
                const expiresAt = new Date(item.expiresAt);
                const remainingTime = Math.max(0, expiresAt - now);
                const minutes = Math.floor(remainingTime / 60000);
                const seconds = Math.floor((remainingTime % 60000) / 1000);
                
                html += `
                    <div class="active-code-item">
                        <div class="active-code-header">
                            <span class="access-code">${item.code}</span>
                            <span class="countdown">${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}</span>
                        </div>
                        <div class="active-code-details">
                            <div>MEGA ID: ${item.megaId}</div>
                            <div>Nota: ${item.note || 'Tiada nota'}</div>
                            <div>Digunakan: ${item.usedCount} kali</div>
                        </div>
                        <div class="active-code-actions">
                            <button class="cyber-btn cyber-btn-danger" onclick="revokeAccessCode('${item._id}')">
                                <i class="fas fa-ban"></i> Tamatkan
                            </button>
                        </div>
                    </div>
                `;
            });
            
            activeCodesList.innerHTML = html;
        })
        .catch(error => {
            console.error('Error:', error);
            addLogEntry('Ralat semasa memuatkan kod akses', 'error');
        });
    }
    
    function updateStats() {
        fetch('/api/stats')
        .then(response => response.json())
        .then(data => {
            totalCodesEl.textContent = data.totalCodes;
            activeCodesEl.textContent = data.activeCodes;
            totalScansEl.textContent = data.totalScans;
            
            // Update recent scans
            if (data.recentScans && data.recentScans.length > 0) {
                let html = '';
                data.recentScans.forEach(scan => {
                    html += `
                        <div class="recent-scan-item">
                            <div class="scan-megaid">${scan.megaId}</div>
                            <div class="scan-details">
                                <span class="scan-winrate">${scan.overallWinRate}%</span>
                                <span class="scan-time">${new Date(scan.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    `;
                });
                recentScansEl.innerHTML = html;
            } else {
                recentScansEl.innerHTML = '<div class="empty-state">Tiada scan lagi</div>';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            addLogEntry('Ralat semasa memuatkan statistik', 'error');
        });
    }
    
    function addLogEntry(message, type = 'info') {
        const now = new Date();
        const time = `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
        
        const newEntry = document.createElement('div');
        newEntry.className = `terminal-line terminal-${type}`;
        newEntry.textContent = `${time} ${message}`;
        
        terminal.appendChild(newEntry);
        terminal.scrollTop = terminal.scrollHeight;
    }
    
    // Make revokeAccessCode available globally
    window.revokeAccessCode = function(id) {
        if (confirm('Adakah anda pasti ingin menamatkan kod akses ini?')) {
            fetch(`/api/access-codes/${id}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                addLogEntry(`Kod akses ditamatkan: ${id}`, 'success');
                updateActiveCodesList();
                updateStats();
            })
            .catch(error => {
                console.error('Error:', error);
                addLogEntry('Ralat semasa menamatkan kod akses', 'error');
            });
        }
    };
    
    // Initialize
    updateActiveCodesList();
    updateStats();
    
    // Periodically update active codes list and stats
    setInterval(() => {
        updateActiveCodesList();
        updateStats();
    }, 30000);
});
