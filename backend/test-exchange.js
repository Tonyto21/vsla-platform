const exchangeService = require('./src/services/exchangeRateService');

async function testExchangeRate() {
  console.log('Testing Exchange Rate Service...\n');
  
  try {
    // Get current rate
    const rate = await exchangeService.getCurrentRate();
    console.log(`Current exchange rate: 1 USD = ${rate} LRD\n`);
    
    // Test conversions
    const usdAmount = 100;
    const lrdAmount = 18500;
    
    const usdToLrd = await exchangeService.convertAmount(usdAmount, 'USD', 'LRD');
    console.log(`${usdAmount} USD = ${await exchangeService.formatAmount(usdToLrd, 'LRD')}`);
    
    const lrdToUsd = await exchangeService.convertAmount(lrdAmount, 'LRD', 'USD');
    console.log(`${await exchangeService.formatAmount(lrdAmount, 'LRD')} = $${lrdToUsd.toFixed(2)} USD`);
    
    // Test formatting
    console.log('\nFormatting examples:');
    console.log(await exchangeService.formatAmount(1234.56, 'USD'));
    console.log(await exchangeService.formatAmount(1234.56, 'LRD'));
    
    console.log('\n✅ Exchange rate service is working!');
  } catch (error) {
    console.error('❌ Error testing exchange rate service:', error);
  }
}

testExchangeRate();