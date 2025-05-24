# 🖥️ Sistema Monitor - Dashboard Profissional

Um sistema completo e profissional para monitoramento de atividades e processos do sistema operacional em tempo real, com interface moderna e responsiva.

## 🚀 Características Principais

- **Monitoramento em Tempo Real**: CPU, RAM e processos ativos
- **Interface Moderna**: Design responsivo com Tailwind CSS
- **Gráficos Dinâmicos**: Visualizações em tempo real com Chart.js
- **Modo Dark/Light**: Toggle entre temas
- **Alertas Visuais**: Destaque para processos pesados
- **Exportação CSV**: Relatórios de processos
- **API RESTful**: Backend escalável com Node.js
- **Experiência Profissional**: Pronto para portfólio

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Plataforma de desenvolvimento
- **Express.js** - Framework web
- **OS Module** - Informações do sistema operacional
- **Child Process** - Execução de comandos do sistema
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **HTML5** - Estrutura semântica
- **Tailwind CSS** - Framework CSS utilitário
- **Chart.js** - Biblioteca de gráficos
- **Lucide Icons** - Ícones modernos
- **Vanilla JavaScript** - Funcionalidades dinâmicas

## 📁 Estrutura do Projeto

```
sistema-monitor/
├── backend/
│   ├── server.js              # Servidor principal
│   ├── package.json           # Dependências backend
│   └── public/                # Arquivos estáticos
│       └── index.html         # Interface principal
├── README.md                  # Documentação
└── LICENSE                    # Licença MIT
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 16+ instalado
- NPM ou Yarn
- Terminal/Prompt de comando

### 1. Clone ou baixe o projeto
```bash
git clone https://github.com/juanmmendes/monitor-sistema.git
cd sistema-monitor
```

### 2. Instale as dependências do backend
```bash
cd backend
npm install
```

### 3. Inicie o servidor
```bash
npm start
```
