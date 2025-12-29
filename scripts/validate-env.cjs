#!/usr/bin/env node

/**
 * Script para validar se as variáveis de ambiente estão configuradas corretamente
 * Este script é para DESENVOLVEDORES e MANTENEDORES do sistema.
 * Usuários finais não precisam executar este script.
 * 
 * Uso: npm run validate-env
 */

const fs = require('fs');
const path = require('path');

// Constants for validation
const MIN_URL_LENGTH = 20;
const MIN_KEY_LENGTH = 20;
const PLACEHOLDER_PATTERNS = ['your_supabase_project_url_here', 'your_supabase_anon_key_here'];

console.log('\n🔍 Validando Configuração de Variáveis de Ambiente\n');
console.log('='.repeat(60));
console.warn('\n⚠️  NOTA: Este script é para DESENVOLVEDORES/MANTENEDORES');
console.log('    Usuários finais não precisam configurar nada!');
console.log('');

// Verificar se .env existe
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

console.log('📁 Verificando arquivos de ambiente:');
const envExists = fs.existsSync(envPath);
const envExampleExists = fs.existsSync(envExamplePath);

console.log(`   .env.example: ${envExampleExists ? '✅ Existe' : '❌ Não encontrado'}`);
console.log(`   .env: ${envExists ? '✅ Existe' : '⚠️  Não encontrado'}`);

if (!envExists) {
  console.log('\n⚠️  Arquivo .env não encontrado');
  console.log('');
  console.log('👤 Se você é um USUÁRIO FINAL:');
  console.log('   → Você não precisa deste arquivo!');
  console.log('   → Acesse o site normalmente, ele já está configurado.');
  console.log('');
  console.log('🔧 Se você é um DESENVOLVEDOR/MANTENEDOR:');
  console.log('   1. Execute: cp .env.example .env');
  console.log('   2. Configure o Supabase (veja DEVELOPER_SETUP.md)');
  console.log('   3. Edite .env com suas credenciais do Supabase');
  console.log('   4. Reinicie o servidor de desenvolvimento');
  console.log('');
  console.log('📖 Consulte DEVELOPER_SETUP.md para instruções completas');
  console.log('\n' + '='.repeat(60));
  console.log('\n');
  process.exit(0);
}

// Ler .env se existir
const envContent = fs.readFileSync(envPath, 'utf-8');

// Check for any placeholder patterns
const hasPlaceholder = PLACEHOLDER_PATTERNS.some(pattern => envContent.includes(pattern));

if (hasPlaceholder) {
  console.log('\n⚠️  Arquivo .env contém valores de placeholder');
  console.log('');
  console.log('🔧 Para DESENVOLVEDORES:');
  console.log('   Substitua os valores de placeholder pelas suas credenciais reais do Supabase');
  console.log('');
  console.log('📚 Como obter as credenciais:');
  console.log('   1. Acesse https://app.supabase.com');
  console.log('   2. Selecione seu projeto (ou crie um novo)');
  console.log('   3. Vá em Settings > API');
  console.log('   4. Copie "Project URL" e "anon public" key');
  console.log('');
  console.log('📖 Consulte DEVELOPER_SETUP.md para o guia completo');
} else {
  console.log('\n✅ Arquivo .env configurado com credenciais');
  
  const lines = envContent.split('\n');
  const urlLine = lines.find(l => l.startsWith('VITE_SUPABASE_URL='));
  const keyLine = lines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY='));
  
  if (urlLine && keyLine) {
    const url = urlLine.split('=')[1]?.trim();
    const key = keyLine.split('=')[1]?.trim();
    
    if (url && url.length > MIN_URL_LENGTH && key && key.length > MIN_KEY_LENGTH) {
      console.log('   URL configurada: ' + url.substring(0, 30) + '...');
      console.log('   Chave configurada: ' + key.substring(0, 20) + '...');
    }
  }
}

console.log('\n💡 Dicas para Desenvolvedores:');
console.log('   • O arquivo .env é ignorado pelo Git (não será commitado)');
console.log('   • Para produção, configure as variáveis no painel da Vercel');
console.log('   • Após configurar em produção, todos os usuários podem acessar');
console.log('   • Reinicie o servidor após modificar o .env');
console.log('   • Use DEVELOPER_SETUP.md como referência completa');

console.log('\n' + '='.repeat(60));

if (envExists && !hasPlaceholder) {
  console.log('\n🎉 Configuração parece estar correta!');
  console.log('🚀 Inicie o servidor com: npm run dev');
}

console.log('\n');
