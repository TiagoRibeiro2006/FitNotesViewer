# FitNotes Viewer

V1 simples para carregar um backup `.fitnotes` (SQLite), analisá-lo no backend e mostrar um resumo no browser.

## Stack

- Frontend: Vue 3 + Vite + JavaScript
- Backend: ASP.NET Core 8 Web API
- Leitura SQLite: Microsoft.Data.Sqlite

## Como funciona

1. O utilizador escolhe um ficheiro `.fitnotes`.
2. O frontend envia-o por `multipart/form-data` para `POST /api/fitnotes/analyze`.
3. A API valida a extensão e o cabeçalho SQLite.
4. O ficheiro é guardado apenas num ficheiro temporário.
5. A API abre a base de dados em modo read-only e lê um resumo.
6. O ficheiro temporário é apagado no `finally`.

## Executar localmente

### Backend

É necessário .NET 8 SDK.

```bash
cd backend
dotnet restore
dotnet run
```

Por omissão, o perfil local usa `http://localhost:5080`.

### Frontend

É necessário Node.js 18+.

```bash
cd frontend
npm install
npm run dev
```

Abre o endereço indicado pelo Vite, normalmente `http://localhost:5173`.

## Configuração do frontend

Cria `frontend/.env` se quiseres alterar a API:

```env
VITE_API_URL=http://localhost:5080
```

Em produção, define `VITE_API_URL` para o URL público do backend.

## Endpoint

### POST `/api/fitnotes/analyze`

Form data:

- `file`: ficheiro `.fitnotes`

Resposta exemplo:

```json
{
  "fileName": "FitNotes_Backup.fitnotes",
  "totalSets": 4003,
  "totalExercises": 88,
  "firstWorkoutDate": "2024-01-01",
  "lastWorkoutDate": "2026-08-06",
  "topExercises": [
    { "name": "Bench Press", "sets": 120 }
  ]
}
```

## Deploy

O repositório já inclui:

- `backend/Dockerfile` para alojar a API num serviço com Docker.
- `render.yaml` como configuração inicial para Render.
- `frontend/.env.example` para a variável `VITE_API_URL`.

A base de dados `.fitnotes` não é guardada permanentemente.
