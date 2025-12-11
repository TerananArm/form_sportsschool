// Native fetch
// const fetch = require('node-fetch');

async function testApiDirect() {
    console.log("Testing API with 'คอมพิวเตอร์ธุรกิจ' and 'ปวช. 1/1'");

    // Exact payload derived from script output
    const payload = {
        term: '1/2567',
        department: 'คอมพิวเตอร์ธุรกิจ',
        classLevel: 'ปวช. 1/1'
    };

    const res = await fetch('http://localhost:3000/api/ai-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const json = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(json, null, 2));
}

testApiDirect();
