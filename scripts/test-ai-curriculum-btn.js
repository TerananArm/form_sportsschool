// Native fetch
// const fetch = require('node-fetch');

async function testAiBtn() {
    console.log("Testing AI Curriculum Button Logic...");

    const payload = {
        department: 'คอมพิวเตอร์ธุรกิจ',
        classLevel: 'ปวช. 1/1'
    };

    try {
        const res = await fetch('http://localhost:3000/api/ai-curriculum', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log("Status:", res.status);
        const json = await res.json();
        console.log("Response:", JSON.stringify(json, null, 2));

        if (json.recommendedIds && Array.isArray(json.recommendedIds)) {
            console.log(`✅ Success! Received ${json.recommendedIds.length} recommendations.`);
        } else {
            console.log("❌ Failed: Structure is invalid (Expected recommendedIds array).");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

testAiBtn();
