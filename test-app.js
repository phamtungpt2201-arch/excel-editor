import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 5000 });
    // inject some data
    await page.evaluate(async () => {
       const db = new window.Dexie('ExcelLocalDB');
       db.version(2).stores({
          projects: '++id, createdAt',
          records: '++id, projectId',
          metadata: '++id, [projectId+key]'
       });
       await db.projects.add({ name: 'Test', createdAt: Date.now() });
       await db.records.add({ projectId: 1, col1: 'hello', col2: 'world' });
       await db.metadata.add({ projectId: 1, key: 'headers', value: ['col1', 'col2'] });
    });
    
    // reload to see what happens
    await page.reload({ waitUntil: 'networkidle0' });
    
    // check errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('BROWSER ERROR:', msg.text());
      }
    });

    const mainHTML = await page.$eval('.app-main', el => el.innerHTML).catch(() => 'none');
    console.log('Main HTML:', mainHTML);
    const vtableHTML = await page.$eval('.table-scroll-container', el => el.innerHTML).catch(() => 'none');
    console.log('VTable HTML:', vtableHTML);

  } catch (e) {
    console.log('Error:', e.message);
  }
  
  await browser.close();
})();
