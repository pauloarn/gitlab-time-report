# GitLab Time Report - Docker Setup

Este projeto está configurado para rodar em containers Docker com otimizações para produção.

## 🚀 Quick Start

### Opção 1: Deploy no Render (Recomendado)

Este projeto está configurado para deploy automático no Render. Para configurar:

1. Conecte seu repositório Git ao Render
2. Configure como **Static Site** ou **Web Service** (usando Docker)
3. O Render detectará automaticamente o Dockerfile e fará o build

### Opção 2: Usando Docker Compose

```bash
# Build e start do container
docker-compose up -d

# Para parar
docker-compose down
```

### Opção 3: Comandos Docker manuais

```bash
# Build da imagem
docker build -t gitlab-time-report:latest .

# Executar o container
docker run -d --name gitlab-time-report-app -p 8080:80 --restart unless-stopped gitlab-time-report:latest
```

## 📋 Comandos Úteis

### Gerenciamento do Container

```bash
# Ver logs do container
docker logs gitlab-time-report-app

# Parar o container
docker stop gitlab-time-report-app

# Remover o container
docker rm gitlab-time-report-app

# Ver status dos containers
docker ps

# Acessar o container (para debug)
docker exec -it gitlab-time-report-app sh
```

### Gerenciamento da Imagem

```bash
# Listar imagens
docker images

# Remover imagem
docker rmi gitlab-time-report:latest

# Forçar rebuild (sem cache)
docker build --no-cache -t gitlab-time-report:latest .
```

## 🌐 Acesso à Aplicação

- **URL Principal**: http://localhost:8080
- **Health Check**: http://localhost:8080/health

## 🏗️ Arquitetura

O projeto utiliza um **multi-stage build** para otimizar o tamanho da imagem final:

### Stage 1: Build
- **Base**: `node:18-alpine`
- **Função**: Instalar dependências e buildar a aplicação React/Vite
- **Output**: Arquivos estáticos em `/app/dist`

### Stage 2: Production
- **Base**: `nginx:stable-alpine`
- **Função**: Servir os arquivos estáticos com Nginx otimizado
- **Porta**: 80 (mapeada para 8080 no host)

## ⚙️ Configurações

### Nginx
- Configuração otimizada para SPA (Single Page Application)
- Compressão gzip habilitada
- Headers de segurança configurados
- Cache otimizado para assets estáticos
- Suporte a React Router (fallback para index.html)

### Docker
- Multi-stage build para reduzir tamanho da imagem
- Cache de dependências npm otimizado
- Health check configurado
- Restart policy: `unless-stopped`

## 🔧 Personalização

### Alterar Porta
```bash
# Exemplo: usar porta 3000
docker run -d --name gitlab-time-report-app -p 3000:80 gitlab-time-report:latest
```

### Variáveis de Ambiente
```bash
docker run -d --name gitlab-time-report-app -p 8080:80 \
  -e NODE_ENV=production \
  gitlab-time-report:latest
```

### Configuração Customizada do Nginx
1. Edite o arquivo `nginx.conf`
2. Rebuild a imagem: `docker build -t gitlab-time-report:latest .`
3. Restart o container

## 🐛 Troubleshooting

### Container não inicia
```bash
# Verificar logs
docker logs gitlab-time-report-app

# Verificar se a porta está em uso
netstat -tulpn | grep 8080
```

### Erro de build
```bash
# Limpar cache do Docker
docker builder prune

# Rebuild sem cache
docker build --no-cache -t gitlab-time-report:latest .
```

### Problemas de permissão (Linux/Mac)
```bash
# Verificar permissões dos arquivos
ls -la
```

## 📦 Arquivos Importantes

- `Dockerfile` - Configuração do container
- `nginx.conf` - Configuração do servidor web
- `docker-compose.yml` - Orquestração do container
- `render.yaml` - Configuração automática para Render
- `.dockerignore` - Arquivos excluídos do build

## 🚀 Deploy no Render

### Configuração para Render

**Opção 1: Configuração Automática (Recomendado)**
- O arquivo `render.yaml` já está configurado
- Basta conectar seu repositório ao Render
- A configuração será aplicada automaticamente

**Opção 2: Configuração Manual**
1. **Conecte seu repositório**:
   - Vá para [render.com](https://render.com)
   - Conecte seu repositório Git

2. **Configure o serviço**:
   - **Tipo**: Web Service (para usar Docker)
   - **Build Command**: `docker build -t gitlab-time-report .`
   - **Start Command**: `docker run -p $PORT:80 gitlab-time-report`
   - **Port**: 80 (ou deixe o Render definir automaticamente)

3. **Variáveis de Ambiente**:
   ```
   NODE_ENV=production
   ```

4. **Health Check**:
   - **Path**: `/health`

5. **Deploy automático**:
   - O Render fará deploy automático a cada push para a branch principal
   - Builds são otimizados e cacheados automaticamente

### Vantagens do Render
- ✅ Deploy automático via Git
- ✅ SSL/HTTPS automático
- ✅ CDN global
- ✅ Monitoramento integrado
- ✅ Logs em tempo real
- ✅ Rollback fácil

## 🔒 Segurança

- Headers de segurança configurados no Nginx
- Container roda como usuário não-root
- Imagem base Alpine Linux (menor superfície de ataque)
- Health check para monitoramento

## 📈 Performance

- Compressão gzip habilitada
- Cache de assets estáticos otimizado
- Multi-stage build reduz tamanho da imagem
- Nginx configurado para alta performance 