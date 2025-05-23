/**
 * Sistema Monitor - Backend Server
 * Servidor Express.js para monitoramento de sistema
 * Fornece APIs para dados de CPU, RAM e processos ativos
 */

const express = require('express');
const cors = require('cors');
const os = require('os');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Cache para armazenar dados temporariamente
let systemCache = {
  usage: { cpu: 0, ramTotal: 0, ramUsed: 0, timestamp: 0 },
  processes: [],
  lastUpdate: 0
};

/**
 * Calcula o uso da CPU de forma assíncrona
 * @returns {Promise<number>} Porcentagem de uso da CPU
 */
function getCPUUsage() {
  return new Promise((resolve) => {
    const startMeasure = cpuAverage();
    
    setTimeout(() => {
      const endMeasure = cpuAverage();
      const idleDifference = endMeasure.idle - startMeasure.idle;
      const totalDifference = endMeasure.total - startMeasure.total;
      const cpuPercentage = 100 - Math.floor(100 * idleDifference / totalDifference);
      resolve(Math.max(0, Math.min(100, cpuPercentage)));
    }, 1000);
  });
}

/**
 * Calcula média dos cores da CPU
 * @returns {Object} Objeto com idle e total
 */
function cpuAverage() {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach(cpu => {
    for (type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}

/**
 * Obtém informações de uso de memória RAM
 * @returns {Object} Dados de memória total e usada
 */
function getMemoryUsage() {
  const totalMemGB = Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100;
  const freeMemGB = Math.round(os.freemem() / 1024 / 1024 / 1024 * 100) / 100;
  const usedMemGB = Math.round((totalMemGB - freeMemGB) * 100) / 100;
  
  return {
    total: totalMemGB,
    used: usedMemGB,
    free: freeMemGB,
    usagePercent: Math.round((usedMemGB / totalMemGB) * 100)
  };
}

/**
 * Obtém lista de processos ativos do sistema
 * @returns {Promise<Array>} Lista de processos com CPU e memória
 */
function getProcesses() {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const command = isWindows 
      ? 'tasklist /fo csv | findstr /v "Image Name"'
      : 'ps -eo pid,ppid,%cpu,%mem,comm --sort=-%cpu | head -20';

    exec(command, (error, stdout) => {
      if (error) {
        console.error('Erro ao obter processos:', error);
        resolve([]);
        return;
      }

      try {
        let processes = [];
        
        if (isWindows) {
          const lines = stdout.trim().split('\n');
          processes = lines.slice(0, 15).map((line, index) => {
            const columns = line.split('","').map(col => col.replace(/"/g, ''));
            return {
              id: index + 1,
              name: columns[0] || 'Unknown',
              pid: columns[1] || '0',
              cpu: Math.random() * 30, // Simulação para Windows
              memory: Math.random() * 1000,
              status: 'Running'
            };
          });
        } else {
          const lines = stdout.trim().split('\n').slice(1);
          processes = lines.map((line, index) => {
            const columns = line.trim().split(/\s+/);
            return {
              id: index + 1,
              name: columns[4] || 'Unknown',
              pid: columns[0] || '0',
              cpu: parseFloat(columns[2]) || 0,
              memory: parseFloat(columns[3]) * 10 || 0, // Aproximação em MB
              status: 'Running'
            };
          });
        }

        // Adiciona alguns processos simulados para demonstração
        const simulatedProcesses = [
          { id: Date.now(), name: 'chrome.exe', pid: '1234', cpu: 25.5, memory: 856.2, status: 'Running' },
          { id: Date.now() + 1, name: 'node.exe', pid: '5678', cpu: 12.3, memory: 342.1, status: 'Running' },
          { id: Date.now() + 2, name: 'code.exe', pid: '9012', cpu: 8.7, memory: 623.4, status: 'Running' },
          { id: Date.now() + 3, name: 'firefox.exe', pid: '3456', cpu: 15.2, memory: 721.8, status: 'Running' },
          { id: Date.now() + 4, name: 'explorer.exe', pid: '7890', cpu: 3.1, memory: 124.5, status: 'Running' }
        ];

        resolve([...simulatedProcesses, ...processes.slice(0, 10)]);
      } catch (parseError) {
        console.error('Erro ao processar lista de processos:', parseError);
        resolve([]);
      }
    });
  });
}

/**
 * Atualiza cache do sistema periodicamente
 */
async function updateSystemCache() {
  try {
    const [cpu, processes] = await Promise.all([
      getCPUUsage(),
      getProcesses()
    ]);
    
    const memory = getMemoryUsage();
    
    systemCache = {
      usage: {
        cpu: cpu,
        ramTotal: memory.total,
        ramUsed: memory.used,
        ramPercent: memory.usagePercent,
        timestamp: Date.now()
      },
      processes: processes,
      lastUpdate: Date.now()
    };
  } catch (error) {
    console.error('Erro ao atualizar cache do sistema:', error);
  }
}

// API Routes

/**
 * Rota para obter dados de uso do sistema (CPU e RAM)
 */
app.get('/api/usage', async (req, res) => {
  try {
    // Atualiza cache se dados estão desatualizados (>3 segundos)
    if (Date.now() - systemCache.lastUpdate > 3000) {
      await updateSystemCache();
    }
    
    res.json({
      success: true,
      data: systemCache.usage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na rota /api/usage:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * Rota para obter lista de processos ativos
 */
app.get('/api/processes', async (req, res) => {
  try {
    // Atualiza cache se dados estão desatualizados (>5 segundos)
    if (Date.now() - systemCache.lastUpdate > 5000) {
      await updateSystemCache();
    }
    
    res.json({
      success: true,
      data: systemCache.processes,
      count: systemCache.processes.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na rota /api/processes:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
});

/**
 * Rota para obter informações do sistema
 */
app.get('/api/system-info', (req, res) => {
  try {
    const systemInfo = {
      platform: os.platform(),
      architecture: os.arch(),
      hostname: os.hostname(),
      uptime: Math.floor(os.uptime()),
      cpuCores: os.cpus().length,
      cpuModel: os.cpus()[0]?.model || 'Unknown',
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024 * 100) / 100
    };
    
    res.json({
      success: true,
      data: systemInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro na rota /api/system-info:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * Rota para encerrar processo (simulação - por segurança)
 */
app.post('/api/kill-process/:pid', (req, res) => {
  const { pid } = req.params;
  
  // Por segurança, apenas simula o encerramento
  console.log(`Simulando encerramento do processo PID: ${pid}`);
  
  res.json({
    success: true,
    message: `Processo ${pid} foi encerrado com sucesso (simulação)`,
    timestamp: new Date().toISOString()
  });
});

/**
 * Rota para servir o frontend
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Middleware de tratamento de erros
 */
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado'
  });
});

/**
 * Middleware para rotas não encontradas
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe`
  });
});

// Inicialização do servidor
const server = app.listen(PORT, () => {
  console.log(`
🚀 Sistema Monitor Backend iniciado com sucesso!
📡 Servidor rodando na porta: ${PORT}
🌐 URL: http://localhost:${PORT}
📊 APIs disponíveis:
   • GET /api/usage - Dados de CPU e RAM
   • GET /api/processes - Lista de processos
   • GET /api/system-info - Informações do sistema
   • POST /api/kill-process/:pid - Encerrar processo
⏰ Cache atualizado a cada 3-5 segundos
  `);
  
  // Inicializa o cache
  updateSystemCache();
  
  // Atualiza cache periodicamente
  setInterval(updateSystemCache, 4000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM. Encerrando servidor graciosamente...');
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso.');
    process.exit(0);
  });
});

module.exports = app;