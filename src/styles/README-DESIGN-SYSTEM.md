# 🎨 BitAcademy Design System

Sistema de design unificado para a plataforma BitAcademy - Calculadora de Gerenciamento de Risco.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Design Tokens](#design-tokens)
3. [Componentes](#componentes)
4. [Utilitários](#utilitários)
5. [Padrões de Uso](#padrões-de-uso)
6. [Responsividade](#responsividade)
7. [Acessibilidade](#acessibilidade)

## 🎯 Visão Geral

O BitAcademy Design System estabelece uma linguagem visual consistente e moderna baseada em:

- **Glassmorphism**: Efeitos de vidro com blur e transparência
- **Gradientes dinâmicos**: Cores vibrantes e transições suaves  
- **Tipografia fluida**: Escala responsiva baseada em viewport
- **Animações sutis**: Micro-interações para melhor UX
- **Acessibilidade**: Suporte completo para usuários com necessidades especiais

## 🎨 Design Tokens

### Tipografia

```css
/* Tamanhos de fonte fluidos */
--font-size-xs: clamp(0.75rem, 0.7rem + 0.2vw, 0.875rem);    /* 12-14px */
--font-size-sm: clamp(0.875rem, 0.8rem + 0.3vw, 1rem);      /* 14-16px */
--font-size-base: clamp(1rem, 0.9rem + 0.4vw, 1.125rem);     /* 16-18px */
--font-size-lg: clamp(1.125rem, 1rem + 0.5vw, 1.25rem);      /* 18-20px */
--font-size-xl: clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);      /* 20-24px */
--font-size-2xl: clamp(1.5rem, 1.3rem + 0.8vw, 1.875rem);    /* 24-30px */
--font-size-3xl: clamp(1.875rem, 1.6rem + 1vw, 2.25rem);     /* 30-36px */
--font-size-4xl: clamp(2.25rem, 2rem + 1.2vw, 3rem);         /* 36-48px */

/* Pesos de fonte */
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;
```

### Espaçamento

```css
/* Sistema de espaçamento baseado em 4px */
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-5: 1.25rem;    /* 20px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
```

### Cores e Gradientes

```css
/* Gradientes principais */
--gradient-primary: linear-gradient(135deg, var(--accent-color) 0%, #0084ff 100%);
--gradient-success: linear-gradient(135deg, var(--success-color) 0%, #00d084 100%);
--gradient-warning: linear-gradient(135deg, var(--warning-color) 0%, #ff8c00 100%);
--gradient-error: linear-gradient(135deg, var(--error-color) 0%, #ff4757 100%);

/* Gradientes de texto */
--gradient-text-primary: linear-gradient(135deg, var(--accent-color), var(--success-color));
--gradient-text-rainbow: linear-gradient(90deg, #ff0000, var(--accent-color), var(--success-color), var(--warning-color));

/* Glassmorphism */
--gradient-bg-glass: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%);
```

### Sombras e Elevações

```css
/* Sombras padrão */
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Sombras coloridas */
--shadow-primary: 0 8px 30px rgba(59, 130, 246, 0.3);
--shadow-success: 0 8px 30px rgba(34, 197, 94, 0.3);

/* Sombras glassmorphism */
--shadow-glass: 0 20px 60px rgba(0, 0, 0, 0.1), 0 1px 0 rgba(255, 255, 255, 0.1) inset;
--shadow-glass-hover: 0 30px 80px rgba(0, 0, 0, 0.15), 0 1px 0 rgba(255, 255, 255, 0.2) inset;
```

## 🧱 Componentes

### Cards

```html
<!-- Card básico -->
<div class="card">
  <h3>Título do Card</h3>
  <p>Conteúdo do card com glassmorphism</p>
</div>

<!-- Card com variantes -->
<div class="card card--primary">Primary Card</div>
<div class="card card--success">Success Card</div>
<div class="card card--sm">Card Pequeno</div>
<div class="card card--lg">Card Grande</div>
```

### Botões

```html
<!-- Botões com variantes -->
<button class="btn btn--primary">Botão Principal</button>
<button class="btn btn--success">Botão Sucesso</button>
<button class="btn btn--warning">Botão Aviso</button>
<button class="btn btn--error">Botão Erro</button>
<button class="btn btn--ghost">Botão Ghost</button>

<!-- Tamanhos de botão -->
<button class="btn btn--primary btn--sm">Pequeno</button>
<button class="btn btn--primary">Normal</button>
<button class="btn btn--primary btn--lg">Grande</button>

<!-- Botão com loading -->
<button class="btn btn--primary" disabled>
  <span class="loading-spinner loading-spinner--sm"></span>
  Carregando...
</button>
```

### Inputs

```html
<!-- Input básico -->
<input type="text" class="input" placeholder="Digite aqui...">

<!-- Input com variantes -->
<input type="text" class="input input--success" placeholder="Válido">
<input type="text" class="input input--error" placeholder="Erro">

<!-- Tamanhos de input -->
<input type="text" class="input input--sm" placeholder="Pequeno">
<input type="text" class="input" placeholder="Normal">
<input type="text" class="input input--lg" placeholder="Grande">
```

### Badges

```html
<!-- Badges com variantes -->
<span class="badge badge--primary">Primário</span>
<span class="badge badge--success">Sucesso</span>
<span class="badge badge--warning">Aviso</span>
<span class="badge badge--error">Erro</span>
```

### Loading States

```html
<!-- Spinners -->
<div class="loading-spinner"></div>
<div class="loading-spinner loading-spinner--sm"></div>
<div class="loading-spinner loading-spinner--lg"></div>

<!-- Pulse indicator -->
<div class="pulse-dot"></div>
```

## 🛠 Utilitários

### Layout

```html
<!-- Flexbox -->
<div class="flex items-center justify-between gap-4">
  <span>Item 1</span>
  <span>Item 2</span>
</div>

<!-- Grid -->
<div class="grid grid-cols-auto gap-6">
  <div class="card">Item 1</div>
  <div class="card">Item 2</div>
  <div class="card">Item 3</div>
</div>

<!-- Grid responsivo -->
<div class="grid grid-cols-4 gap-4">
  <!-- Automaticamente vira 1 coluna em mobile -->
</div>
```

### Tipografia

```html
<!-- Tamanhos de texto -->
<h1 class="text-4xl font-extrabold text-gradient">Título Principal</h1>
<h2 class="text-2xl font-bold text-primary">Subtítulo</h2>
<p class="text-base text-secondary">Texto normal</p>
<small class="text-sm text-placeholder">Texto pequeno</small>

<!-- Texto com gradiente -->
<h1 class="text-3xl font-bold text-gradient">
  Texto com Gradiente
</h1>
```

### Espaçamento

```html
<!-- Padding -->
<div class="p-6">Padding grande</div>
<div class="p-4">Padding médio</div>
<div class="p-2">Padding pequeno</div>

<!-- Margin -->
<div class="mb-8">Margin bottom grande</div>
<div class="mb-4">Margin bottom médio</div>

<!-- Gap em containers -->
<div class="flex gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## 📐 Padrões de Uso

### Hierarquia Visual

```html
<!-- Estrutura típica de página -->
<div class="card card--lg">
  <!-- Header -->
  <header class="mb-8">
    <h1 class="text-4xl font-extrabold text-gradient mb-3">
      🎯 Título da Página
    </h1>
    <p class="text-lg text-secondary">
      Descrição da funcionalidade
    </p>
  </header>
  
  <!-- Content Grid -->
  <div class="grid grid-cols-auto gap-6">
    <div class="card">
      <h3 class="text-xl font-bold mb-4">Seção 1</h3>
      <!-- Conteúdo -->
    </div>
    <div class="card">
      <h3 class="text-xl font-bold mb-4">Seção 2</h3>
      <!-- Conteúdo -->
    </div>
  </div>
</div>
```

### Formulários

```html
<form class="grid gap-6">
  <!-- Campo de input -->
  <div>
    <label class="text-sm font-semibold text-secondary mb-2 block">
      Nome Completo
    </label>
    <input type="text" class="input" placeholder="Digite seu nome...">
  </div>
  
  <!-- Campo com erro -->
  <div>
    <label class="text-sm font-semibold text-secondary mb-2 block">
      Email
    </label>
    <input type="email" class="input input--error" placeholder="seu@email.com">
    <p class="text-sm text-error mt-1">Email é obrigatório</p>
  </div>
  
  <!-- Botões -->
  <div class="flex gap-4 justify-end">
    <button type="button" class="btn btn--ghost">Cancelar</button>
    <button type="submit" class="btn btn--primary">Salvar</button>
  </div>
</form>
```

### Métricas e Cards de Dados

```html
<div class="grid grid-cols-auto gap-4">
  <!-- Card de métrica -->
  <div class="card card--primary">
    <div class="flex items-center justify-between mb-4">
      <div class="text-3xl">📊</div>
      <div class="badge badge--success">+12%</div>
    </div>
    <h3 class="text-sm font-semibold text-secondary mb-2">
      TOTAL DE TRADES
    </h3>
    <div class="text-3xl font-extrabold text-gradient mb-1">
      1,847
    </div>
    <p class="text-sm text-placeholder">
      Esta semana
    </p>
  </div>
</div>
```

## 📱 Responsividade

O design system inclui breakpoints automáticos:

- **Desktop**: Layout completo com grids multi-coluna
- **Tablet (≤768px)**: Grids colapsam para 1-2 colunas
- **Mobile (≤480px)**: Layout de coluna única com padding reduzido

```css
/* Exemplo de responsividade automática */
.grid-cols-auto {
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

/* Em mobile, automaticamente vira 1 coluna */
@media (max-width: 768px) {
  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: 1fr;
  }
}
```

## ♿ Acessibilidade

### Movimento Reduzido

```css
/* Usuários que preferem movimento reduzido */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus States

```html
<!-- Foco visível para navegação por teclado -->
<button class="btn btn--primary focus-visible">
  Botão Acessível
</button>
```

### Screen Readers

```html
<!-- Conteúdo apenas para leitores de tela -->
<span class="sr-only">Informação adicional para leitores de tela</span>
```

## 🎯 Exemplos Práticos

### Dashboard Card

```html
<div class="card card--lg">
  <header class="flex items-center justify-between mb-6">
    <h2 class="text-2xl font-bold text-primary">
      📈 Analytics Dashboard
    </h2>
    <div class="flex gap-2">
      <span class="pulse-dot"></span>
      <span class="text-sm text-success font-semibold">
        Online
      </span>
    </div>
  </header>
  
  <div class="grid grid-cols-auto gap-4 mb-6">
    <div class="card card--sm">
      <div class="text-2xl mb-2">👥</div>
      <div class="text-xl font-bold text-gradient">42</div>
      <div class="text-sm text-secondary">Usuários</div>
    </div>
    <!-- Mais métricas... -->
  </div>
  
  <div class="flex gap-3">
    <button class="btn btn--primary btn--sm">
      Ver Detalhes
    </button>
    <button class="btn btn--ghost btn--sm">
      Exportar
    </button>
  </div>
</div>
```

### Form Modal

```html
<div class="card card--lg">
  <h2 class="text-2xl font-bold text-gradient mb-6">
    ⚙️ Novo Cálculo de Risco
  </h2>
  
  <form class="grid gap-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-sm font-semibold text-secondary mb-2 block">
          Preço de Entrada
        </label>
        <input type="number" class="input" placeholder="0.00">
      </div>
      <div>
        <label class="text-sm font-semibold text-secondary mb-2 block">
          Stop Loss
        </label>
        <input type="number" class="input" placeholder="0.00">
      </div>
    </div>
    
    <div class="flex gap-3 justify-end mt-6">
      <button type="button" class="btn btn--ghost">
        Cancelar
      </button>
      <button type="submit" class="btn btn--primary">
        🚀 Calcular
      </button>
    </div>
  </form>
</div>
```

## 🔧 Personalização

Para personalizar o design system, modifique as variáveis CSS em `design-system.css`:

```css
:root {
  /* Personalizar cores */
  --accent-color: #your-primary-color;
  --success-color: #your-success-color;
  
  /* Personalizar espaçamento */
  --space-4: 1.2rem; /* Aumentar espaçamento base */
  
  /* Personalizar tipografia */
  --font-family-primary: 'Sua-Fonte', sans-serif;
}
```

---

## 📚 Recursos Adicionais

- **Tema Escuro**: Automaticamente suportado via `[data-theme="dark"]`
- **Impressão**: Estilos otimizados para impressão
- **Performance**: CSS otimizado com custom properties
- **Manutenibilidade**: Tokens centralizados para fácil manutenção

---

**Desenvolvido para BitAcademy** 🚀  
*Sistema de design moderno, acessível e responsivo*