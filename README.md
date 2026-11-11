# AchouNoIF V2

Aplicativo para registrar objetos encontrados no IFPE e permitir que alunos solicitem a devolução.

- `backend/`: API Node.js/Express, MySQL e Firebase Admin.
- `frontend/`: aplicativo React Native com Expo.

## Requisitos

- Node.js 22.13 ou superior.
- MySQL Server e MySQL Workbench (ou outro cliente MySQL).
- Expo Go no celular para abrir o app.
- Para usar o celular na rede local, computador e celular precisam estar na mesma rede e o celular deve conseguir acessar a porta 3000 do computador.

## Primeira configuração no computador

Clone o repositório do GitHub e abra um PowerShell na pasta do projeto. Não envie arquivos `.env`, credenciais Firebase Admin nem senhas para o GitHub. Esses arquivos são ignorados pelo `.gitignore`; confirme também que eles não foram incluídos anteriormente no histórico do repositório.

### 1. Criar o banco

No MySQL Workbench, abra e execute `frontend/bancoPP3.sql`. Esse script cria o banco `achounoif`, as tabelas, as categorias iniciais e o registro da conta fixa da equipe.

Se o banco já existir e você estiver atualizando uma instalação antiga, não rode o script de criação sem antes avaliar os dados existentes. Use as migrações necessárias em `backend/` e `frontend/`:

- `backend/migracao_solicitacoes.sql`
- `backend/migracao_funcionario_fixo.sql`
- `frontend/migracao_categorias.sql`

### 2. Configurar o backend

No PowerShell:

```powershell
cd backend
npm ci
```

Crie `backend/.env` manualmente (esse arquivo não vem do GitHub) com as configurações locais:

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SENHA_DO_MYSQL_NESTE_COMPUTADOR
DB_NAME=achounoif
FIXED_EMPLOYEE_EMAIL=funcionario@jaboatao
FIXED_EMPLOYEE_PASSWORD=SENHA_ATUAL_DA_CONTA_DA_EQUIPE
STAFF_TOKEN_SECRET=CHAVE_LONGA_E_ALEATORIA
```

Use a senha atual da conta fixa da equipe para manter o mesmo acesso. `STAFF_TOKEN_SECRET` deve ser uma chave longa e aleatória; não compartilhe nem publique o `.env`. Se essa for uma instalação nova, defina uma senha para a conta fixa e guarde-a em local seguro.

O backend também precisa das credenciais do Firebase Admin para validar logins de alunos. Coloque o arquivo de credenciais em `backend/serviceAccountKey.json` (ele é ignorado pelo Git) ou configure `FIREBASE_SERVICE_ACCOUNT_JSON` no `.env`. Não use nem publique uma chave de serviço de outra pessoa ou organização sem autorização.

Inicie a API, deixando essa janela do PowerShell aberta:

```powershell
npm start
```

No próprio computador, confira no navegador:

```text
http://localhost:3000/health
```

A resposta esperada inclui `"ok":true` e `"banco":"conectado"`.

### 3. Configurar o endereço do backend no app

Descubra o IPv4 do computador conectado à rede da escola com:

```powershell
ipconfig
```

Use o endereço IPv4 do adaptador que está conectado à mesma rede do celular. No computador, crie ou edite `frontend/.env`:

```env
EXPO_PUBLIC_API_URL=http://IP_DO_COMPUTADOR:3000
```

Por exemplo (IP fictício), se o IPv4 mostrado na escola for `192.168.1.25`:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.25:3000
```

O IP pode mudar ao trocar de rede; atualize esse valor quando necessário. Se o MySQL estiver instalado no mesmo computador que o backend, mantenha `DB_HOST=127.0.0.1`: esse endereço é para o backend encontrar o MySQL local. O celular usa o IPv4 do computador apenas para acessar a API.

### 4. Iniciar o app no Expo Go

Em uma segunda janela do PowerShell:

```powershell
cd frontend
npm ci
npx expo start --lan
```

Leia o QR code com o Expo Go. Se você alterou `frontend/.env` depois de iniciar o Expo, pare o servidor Expo e inicie novamente para carregar o novo endereço.

## Instalar no Android sem Expo Go

Para gerar um APK que fica instalado no celular como um app normal, use o EAS Build. É preciso ter uma conta Expo; a instalação direta do APK não exige publicar o app na Play Store.

Faça a configuração inicial uma vez, em um PowerShell:

```powershell
cd frontend
npm ci
npm install --global eas-cli
eas login
eas build:configure
```

Entre na sua conta Expo quando solicitado e aceite criar ou vincular o projeto. O identificador Android já está configurado em `frontend/app.json`.

Antes de gerar o APK, configure o endereço da API para a rede onde o app será usado. Primeiro inicie o backend no computador da escola e confira o IPv4 dele com `ipconfig`. Depois, ainda na pasta `frontend`, execute (trocando pelo IPv4 atual):

```powershell
eas env:set --name EXPO_PUBLIC_API_URL --value http://IP_DO_COMPUTADOR:3000 --environment preview --visibility plaintext
```

Gere o APK:

```powershell
eas build --platform android --profile preview
```

Quando a compilação terminar, abra o link do APK no celular Android, baixe o arquivo e toque nele para instalar. Se o Android pedir, autorize o navegador a instalar apps dessa fonte. O app instalado acessa o backend somente quando o computador servidor e o celular estão conectados a uma rede que permita comunicação entre eles.

O endereço da API fica embutido no APK durante a compilação. Se o IP do computador mudar, atualize a variável `EXPO_PUBLIC_API_URL` no ambiente `preview` do EAS e gere outro APK. Uma mudança no `frontend/.env` depois da compilação não altera o app já instalado.

No iPhone não se instala APK. A instalação de um app iOS fora do Expo Go exige uma compilação iOS e configuração de distribuição da Apple, normalmente pelo TestFlight.

## Procedimento quando chegar à escola

1. Conecte o computador e o celular à rede da escola.
2. Inicie o MySQL Server no computador que contém o banco.
3. Confira o IPv4 atual com `ipconfig` e atualize `frontend/.env` se ele mudou.
4. Inicie o backend na pasta `backend` com `npm start` e mantenha a janela aberta.
5. No navegador do celular, abra `http://IP_DO_COMPUTADOR:3000/health`. Confirme `"ok":true` e `"banco":"conectado"`.
6. Inicie o Expo na pasta `frontend` com `npx expo start --lan` e abra o QR code no Expo Go.

Se `/health` abrir no computador, mas não no celular, a rede pode estar impedindo comunicação entre dispositivos ou bloqueando a porta 3000. Nesse caso, teste uma rede permitida pelos responsáveis pela escola ou peça à equipe de TI para liberar o acesso local do celular ao computador. O túnel do Expo entrega o app, mas não torna automaticamente a API na porta 3000 acessível ao celular.

## Autenticação e permissões

- Alunos entram com Firebase Authentication e enviam solicitações de devolução.
- Funcionários e administradores podem cadastrar itens e analisar as solicitações.
- A conta fixa da equipe é configurada no `backend/.env`; o registro inicial dela é incluído em `frontend/bancoPP3.sql`.
- O backend associa as contas dos alunos aos registros da tabela `usuarios` pelo `firebase_uid`.

## Rotas principais

- `GET /health`: verifica conexão com o MySQL.
- `GET /itens` e `GET /categorias`: consulta pública.
- `POST /itens`, `PUT /itens/:id` e `DELETE /itens/:id`: equipe.
- `POST /solicitacoes` e `GET /solicitacoes/minhas`: aluno autenticado.
- `GET /solicitacoes` e `PUT /solicitacoes/:id`: equipe analisa e aprova ou recusa pedidos.

## Fotos

As fotos ficam em `backend/uploads/` no computador que executa a API. A pasta é ignorada pelo Git, exceto pelo arquivo `.gitkeep`; portanto, fotos enviadas localmente não são transferidas pelo GitHub. Faça cópia dessa pasta se precisar manter imagens entre computadores.

## Observações

- O arquivo `frontend/src/config/api.js` usa `EXPO_PUBLIC_API_URL`; não é necessário alterar o código para trocar o IP.
- As credenciais Firebase usadas pelo app e as credenciais Firebase Admin do backend são configurações diferentes. As credenciais Admin são privadas e não devem ir para o GitHub.
- O projeto não implementa notificações de aprovação.
