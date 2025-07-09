// Script para testar sincronização
const puppeteer = require('puppeteer');

async function testSync() {
  try {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Interceptar logs do console
    page.on('console', msg => {
      console.log('BROWSER LOG:', msg.text());
    });
    
    // Ir para a página
    await page.goto('http://localhost:3000');
    
    // Aguardar carregamento
    await page.waitForTimeout(3000);
    
    // Verificar se há logs
    const logs = await page.evaluate(() => {
      return window.tradingViewLogs || [];
    });
    
    console.log('CAPTURED LOGS:', logs);
    
    await browser.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testSync();