import { chromium } from 'playwright';

(async () => {
  console.log('🔍 Testing X-axis Trailing Zero Fix\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1400, height: 900 });
  
  console.log('📊 Loading AAPL page...');
  await page.goto('http://localhost:3004/assets/AAPL/_');
  await page.waitForTimeout(4000);
  
  console.log('📸 Taking screenshot...');
  await page.screenshot({ path: 'xaxis-test-final.png', fullPage: true });
  
  console.log('\n✅ Screenshot saved: xaxis-test-final.png');
  console.log('\n📋 Please verify:');
  console.log('   1. ECharts X-axis has NO trailing "0"');
  console.log('   2. Last label should be a quarter like "Q3 \'24"');
  console.log('   3. All labels are horizontal and properly formatted\n');
  
  await page.waitForTimeout(5000);
  await browser.close();
  
  console.log('✅ Test complete!');
})();
