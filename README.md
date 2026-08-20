# FitNotes Viewer

Aplicação simples para importar backups `.fitnotes` (SQLite) e consultar os exercícios por dia.

## Stack

- Frontend: Vue 3 + Vite + JavaScript
- Backend: ASP.NET Core 8 Web API
- SQLite: Microsoft.Data.Sqlite

## V2

- Uma única página/home.
- Upload de ficheiro `.fitnotes`.
- Depois do upload, os dados ficam guardados apenas no `localStorage` do dispositivo/browser.
- Ao abrir a aplicação novamente, começa sempre no dia atual.
- Botão `←` para o dia anterior e `→` para o dia seguinte.
- Mostra apenas os exercícios e o número de séries desse dia.
- Manifest configurado com `display: standalone` para melhorar a experiência ao adicionar ao ecrã principal.

## Privacidade

O `.fitnotes` é enviado à API apenas para leitura, guardado temporariamente, aberto em modo read-only e apagado no fim. O servidor não mantém o backup. A cópia dos dados usada pela interface fica apenas no armazenamento local do browser/app.

## Executar localmente

### Backend

```bash
cd backend
dotnet restore
dotnet run
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Por omissão, o frontend usa `http://localhost:5080` como API. Em produção define:

```env
VITE_API_URL=https://fitnotes-viewer-api.onrender.com
```

## Deploy atual

- Frontend: Cloudflare Pages
- Backend: Render

Depois de fazer `git push`, os serviços ligados ao repositório podem fazer redeploy automaticamente.
