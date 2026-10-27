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
