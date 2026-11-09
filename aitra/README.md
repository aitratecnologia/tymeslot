# Tymeslot da Aitra

Versão própria do [Tymeslot](https://github.com/Tymeslot/tymeslot) usada em
https://cal.aitra.pt. Segue a `main` do projeto original e aplica por cima os
patches da Aitra. Não contribuímos de volta: só recebemos atualizações.

## Remotes

| Remote     | Repositório                       | Uso                         |
|------------|-----------------------------------|-----------------------------|
| `origin`   | `aitratecnologia/tymeslot` (privado) | a nossa versão (`main`)  |
| `upstream` | `Tymeslot/tymeslot`               | só leitura (push desligado) |

Num clone novo:

```sh
git remote add upstream https://github.com/Tymeslot/tymeslot.git
git remote set-url --push upstream DISABLED
```

## Receber atualizações

```sh
aitra/sync-upstream.sh      # merge de upstream/main na nossa main
```

Usamos merge (não rebase) para nunca reescrever a `main` partilhada. Os
patches da Aitra ficam como commits normais; se um conflito aparecer, é num
ficheiro listado em [Patches](#patches).

## Build e deploy

```sh
aitra/build.sh              # imagem registry.aitra.pt/tymeslot:<data>-<sha>
```

O build corre no build server (`ssh cool-builder`, BuildKit remoto) a partir do commit já
enviado para o GitHub, alvo `release` do `Dockerfile.docker` (Postgres
embutido, como a imagem oficial). Depois, no Coolify, troca-se a `image:` do
serviço para a tag nova e reinicia-se.

Antes de pôr em produção: `aitra/test.sh` corre a suite no build server.

Nada de IPs, credenciais ou IDs internos neste repositório: é público.
Os scripts leem o host do `~/.ssh/config` e o token do `gh`.

## Patches

Cada patch é um commit com prefixo `aitra:` na mensagem
(`git log --grep '^aitra:' --oneline`).

| Patch | Ficheiros | Porquê |
|-------|-----------|--------|
| Atualizar/apagar eventos no calendário onde a reunião foi marcada | `lib/tymeslot/integrations/calendar/runtime/client_manager.ex` (+ teste) | O original cria o evento no calendário do tipo de reunião, mas atualiza/apaga no calendário de marcação por defeito da integração. Com iCloud isto dá 404 + 412 e a reunião fica por sincronizar (incidente de 27/10/2026). |
| Marca Aitra Cal | `priv/static/images/brand/*`, `priv/static/favicon.ico`, `core_components/brand.ex`, layouts (`live_title`, `og:site_name`), `error_html/404`, rodapé dos emails, `aitra/brand.exs` + 1 linha no `Dockerfile.docker` | Trocar o nome e o logo do Tymeslot (exigido pela política de marca deles para versões modificadas). Os `.po` ficam iguais ao upstream: o `brand.exs` troca "Tymeslot" por "Aitra Cal" nas traduções durante o build. Nome, cor e logo dos emails configuram-se em Admin → Email. |
| Tema visual do painel (claro e escuro) | `assets/css/aitra/*` (novo), `assets/js/aitra/*` (novo, + teste), `priv/static/fonts/aitra/*` (Manrope, OFL), 1 linha em `assets/css/app.css`, 1 linha em `assets/js/app.js` | Redesenho do painel sem tocar nos templates do upstream: tokens da Identidade Visual v2 (petróleo #075B67, petróleo escuro #08343B na sidebar e painéis, menta #37C5B0 só em superfícies pequenas com texto petróleo escuro, névoa #F1F7F7, grafite #161616, fonte Manrope; igual à landing aitratecnologia) e overrides de classes existentes. Tema escuro com `light-dark()`, segue o sistema; o botão no topo (injetado por `theme.js`) força claro/escuro. A página de marcação tem folhas próprias e não muda. Se um merge mudar classes do painel, conferir os seletores em `shell.css`/`components.css`. As páginas de login/registo (`auth.css`) perdem o vídeo em aguarela: fundo névoa, canto aberto e barra do kit, cartão branco sólido. Logos e favicon vêm do kit v2 (`01_Logotipos`: Aitra_Cal bicolor/branco, viewBox recortado à arte). |
| Semgrep | `.github/workflows/semgrep.yml`, `.semgrepignore`, `aitra/semgrep.sh` | SAST além do que o upstream já corre (sobelow, credo, mix_audit, gitleaks): Elixir, JS, Dockerfiles, workflows e segredos. Resultados em Security → Code scanning; o job só falha com achados ERROR. Local: `aitra/semgrep.sh`. |
