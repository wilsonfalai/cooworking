# Feature Specification: Scalar API Documentation

**Feature Branch**: `001-scalar-api-docs`
**Created**: 2026-04-09
**Status**: Done
**Input**: User description: "Instalar Scalar para documentação dos endpoints do backend. Acesso interno apenas (equipe), não público. Possibilidade futura de expor endpoints públicos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visualizar documentação da API (Priority: P1)

Como desenvolvedor da equipe interna, quero acessar uma interface web com a documentação de todos os endpoints da API para que eu possa entender e testar as rotas disponíveis sem precisar ler o código.

**Why this priority**: É o objetivo principal da feature — ter visibilidade dos endpoints existentes.

**Independent Test**: Acessar `/api/docs` no navegador e ver todos os endpoints listados com seus parâmetros, DTOs e respostas.

**Acceptance Scenarios**:

1. **Given** o servidor está rodando, **When** acesso `/api/docs` no navegador, **Then** vejo a interface Scalar com todos os endpoints documentados.
2. **Given** estou na interface Scalar, **When** olho a listagem, **Then** vejo os endpoints agrupados por módulo (auth, organizations, locations, members).

---

### User Story 2 - Testar endpoints pela interface (Priority: P1)

Como desenvolvedor, quero poder enviar requisições diretamente pela interface do Scalar para testar os endpoints sem precisar de ferramentas externas como curl ou Postman.

**Why this priority**: Testar direto na interface economiza tempo e reduz atrito no desenvolvimento.

**Independent Test**: Selecionar um endpoint, preencher os parâmetros e enviar a requisição, recebendo a resposta na interface.

**Acceptance Scenarios**:

1. **Given** estou na interface Scalar no endpoint `POST /api/auth/login`, **When** preencho email e password e clico em enviar, **Then** recebo a resposta com o access token.
2. **Given** tenho um token JWT, **When** configuro o token na autenticação do Scalar, **Then** posso testar endpoints protegidos.

---

### User Story 3 - Proteger acesso à documentação (Priority: P2)

Como dono do SaaS, quero que a documentação da API seja acessível apenas em ambiente de desenvolvimento, para que endpoints não fiquem expostos publicamente em produção.

**Why this priority**: Segurança — documentação interna não deve ser pública por padrão.

**Independent Test**: Em ambiente de produção (NODE_ENV=production), a rota `/api/docs` não deve estar disponível (ou deve requerer autenticação).

**Acceptance Scenarios**:

1. **Given** NODE_ENV=development, **When** acesso `/api/docs`, **Then** a documentação é exibida normalmente.
2. **Given** NODE_ENV=production, **When** acesso `/api/docs`, **Then** recebo 404 ou a rota não existe.

---

### Edge Cases

- O que acontece se um endpoint não tem decorators do Swagger? → Não aparece na documentação.
- Como ficam os endpoints com parâmetros de rota nested (`:orgId`)? → Devem aparecer com o path completo e campo para preencher o parâmetro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Sistema MUST instalar `@nestjs/swagger` e `@scalar/nestjs-api-reference` no backend.
- **FR-002**: Sistema MUST gerar documentação OpenAPI automaticamente a partir dos controllers e DTOs existentes.
- **FR-003**: Sistema MUST servir a interface Scalar na rota `/api/docs`.
- **FR-004**: Sistema MUST agrupar endpoints por tag/módulo (auth, organizations, locations, members).
- **FR-005**: Sistema MUST suportar autenticação Bearer JWT na interface do Scalar.
- **FR-006**: Sistema MUST desabilitar a documentação em produção por padrão (configurável via variável de ambiente).
- **FR-007**: Sistema MUST decorar os DTOs existentes com `@ApiProperty()` para que campos apareçam na documentação.

### Key Entities

- **OpenAPI Spec**: Documento JSON/YAML gerado automaticamente pelo NestJS Swagger.
- **Scalar UI**: Interface web que renderiza a spec OpenAPI.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Todos os endpoints existentes (auth, organizations, locations, members) aparecem na documentação.
- **SC-002**: É possível testar qualquer endpoint autenticado diretamente pela interface Scalar.
- **SC-003**: Em produção, a rota `/api/docs` não está acessível.
- **SC-004**: Novos endpoints adicionados ao NestJS aparecem automaticamente na documentação sem configuração extra.

## Assumptions

- O NestJS já possui suporte nativo ao Swagger via `@nestjs/swagger`.
- O Scalar possui plugin oficial para NestJS (`@scalar/nestjs-api-reference`).
- Os DTOs existentes usam `class-validator` e podem ser decorados com `@ApiProperty()`.
- A documentação será acessada apenas por desenvolvedores da equipe em ambiente local ou staging.
