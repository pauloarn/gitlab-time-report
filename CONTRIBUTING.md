# Guia de Contribuição

## Mensagens de Commit

Este projeto usa [Conventional Commits](https://www.conventionalcommits.org/) para padronizar as mensagens de commit. Todas as mensagens são validadas automaticamente pelo [commitlint](https://commitlint.js.org/).

### Formato

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Tipos de Commit

- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Mudanças na documentação
- **style**: Mudanças de formatação (espaços, vírgulas, etc.)
- **refactor**: Refatoração de código (sem mudança de funcionalidade)
- **perf**: Melhorias de performance
- **test**: Adição ou correção de testes
- **build**: Mudanças no sistema de build
- **ci**: Mudanças na configuração de CI/CD
- **chore**: Outras mudanças (dependências, configurações, etc.)

### Exemplos

✅ **Válidos:**
```bash
feat: add token input component
fix(api): handle GitLab API errors
docs: update README with commit guidelines
refactor(services): improve GitLab service structure
feat(hooks): add useTimeLogs hook
fix(ui): correct button styling
chore: update dependencies
```

❌ **Inválidos:**
```bash
Added new feature
fix bug
FEAT: add component
feat:Add component
feat: add component.
```

### Regras

- Tipo deve estar em minúsculas
- Tipo não pode estar vazio
- Assunto não pode estar vazio
- Assunto não deve terminar com ponto
- Máximo de 100 caracteres no header
- Use o escopo quando fizer sentido (ex: `feat(ui):`, `fix(api):`)

## Hooks do Git

### Pre-commit

Antes de cada commit, o ESLint é executado automaticamente. Se houver erros, o commit será bloqueado.

Para pular o hook (não recomendado):
```bash
git commit --no-verify -m "feat: your message"
```

### Commit-msg

A mensagem do commit é validada automaticamente. Se não seguir o formato Conventional Commits, o commit será bloqueado.

## Workflow Recomendado

1. **Fazer mudanças no código**
   ```bash
   git add .
   ```

2. **Fazer commit com mensagem válida**
   ```bash
   git commit -m "feat: add new feature"
   ```

3. **Se o lint falhar, corrigir e tentar novamente**
   ```bash
   pnpm lint:fix
   git add .
   git commit -m "feat: add new feature"
   ```

## Dicas

- Use commits pequenos e focados
- Escreva mensagens claras e descritivas
- Use o escopo quando fizer sentido
- Seja consistente com o estilo do projeto

