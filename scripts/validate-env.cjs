#!/usr/bin/env node

/**
 * Script para validar se as variáveis de ambiente estão configuradas corretamente
 * Uso: node scripts/validate-env.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Validando Configuração de Variáveis de Ambiente\n');
console.log('=' .repeat(60));

// Verificar se .env existe
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

console.log('\n📁 Verificando arquivos de ambiente:');
const envExists = fs.existsSync(envPath);
const envExampleExists = fs.existsSync(envExamplePath);

console.log(`   .env.example: ${envExampleExists ? '✅ Existe' : '❌ Não encontrado'}`);
console.log(`   .env: ${envExists ? '✅ Existe' : '⚠️  Não encontrado (será usado modo local)'}`);

if (!envExists) {
  console.log('\n⚠️  Arquivo .env não encontrado');
  console.log('💡 Para sincronização multi-dispositivo:');
  console.log('   1. Execute: cp .env.example .env');
  console.log('   2. Edite .env com suas credenciais do Supabase');
  console.log('   3. Reinicie o servidor de desenvolvimento');
  console.log('\n📖 Consulte ENVIRONMENT_SETUP.md para mais detalhes');
  console.log('\n' + '=' .repeat(60));
  console.log('\n');
  process.exit(0);
}

// Ler .env se existir
const envContent = fs.readFileSync(envPath, 'utf-8');
const hasPlaceholder = envContent.includes('your_supabase_project_url_here') || 
                       envContent.includes('your_supabase_anon_key_here');

if (hasPlaceholder) {
  console.log('\n⚠️  Arquivo .env contém valores de placeholder');
  console.log('💡 Substitua os valores de placeholder pelas suas credenciais reais do Supabase');
  console.log('\n📚 Como obter as credenciais:');
  console.log('   1. Acesse https://app.supabase.com');
  console.log('   2. Selecione seu projeto');
  console.log('   3. Vá em Settings > API');
  console.log('   4. Copie "Project URL" e "anon public" key');
} else {
  console.log('\n✅ Arquivo .env configurado com credenciais');
  
  const lines = envContent.split('\n');
  const urlLine = lines.find(l => l.startsWith('VITE_SUPABASE_URL='));
  const keyLine = lines.find(l => l.startsWith('VITE_SUPABASE_ANON_KEY='));
  
  if (urlLine && keyLine) {
    const url = urlLine.split('=')[1]?.trim();
    const key = keyLine.split('=')[1]?.trim();
    
    if (url && url.length > 20 && key && key.length > 20) {
      console.log('   URL configurada: ' + url.substring(0, 30) + '...');
      console.log('   Chave configurada: ' + key.substring(0, 20) + '...');
    }
  }
}

console.log('\n💡 Dicas:');
console.log('   • O arquivo .env é ignorado pelo Git (não será commitado)');
console.log('   • Para produção, configure as variáveis no painel da Vercel');
console.log('   • Reinicie o servidor após modificar o .env');
console.log('   • Use ENVIRONMENT_SETUP.md como referência completa');

console.log('\n' + '=' .repeat(60));

if (envExists && !hasPlaceholder) {
  console.log('\n🎉 Configuração parece estar correta!');
  console.log('🚀 Inicie o servidor com: npm run dev');
}

console.log('\n');
