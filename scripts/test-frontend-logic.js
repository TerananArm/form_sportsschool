const fs = require('fs');

async function testFrontendLogic() {
    console.log("--- Simulating Frontend Comparison ---");

    // 1. Fetch Class Levels (like frontend options.levels)
    const levelsRes = await fetch('http://localhost:3000/api/dashboard/data?type=class_levels');
    const levels = await levelsRes.json();
    console.log(`Fetched ${levels.length} Class Levels.`);

    // 2. Fetch Curriculum (like frontend allCurriculum)
    const curRes = await fetch('http://localhost:3000/api/dashboard/data?type=curriculum');
    const allCurriculum = await curRes.json();
    console.log(`Fetched ${allCurriculum.length} Curriculum Rules.`);

    // Find the class we care about (Department ID 3)
    const targetLevel = levels.find(l => l.departmentId === 3 && (l.level === 'Pwc. 1/1' || l.level.includes('1/1')));

    if (!targetLevel) {
        console.error("❌ Target Class Level (Dept 3) NOT FOUND in options.levels!");
        console.log("Available Levels:", levels.map(l => `${l.level} (${l.department_name}, ID=${l.departmentId})`));
        return;
    }

    console.log("\nTarget Level Object:", JSON.stringify(targetLevel, null, 2));
    const levelName = targetLevel.level;
    const departmentName = targetLevel.department_name || '';

    // Simulate the check
    console.log(`\nChecking for: Level="${levelName}" AND Dept="${departmentName}"`);

    const matches = allCurriculum.filter(c => c.level === levelName && c.department === departmentName);
    console.log(`Found ${matches.length} matches.`);

    if (matches.length > 0) {
        console.log("✅ CHECK PASSED: The frontend SHOULD see this.");
        console.log("Match Sample:", matches[0]);
    } else {
        console.error("❌ CHECK FAILED: The frontend sees NO rules.");
        console.log("Why? let's look at available curriculum for this level:");
        const similar = allCurriculum.filter(c => c.level === levelName);
        console.log("Entries with same Level Name:", similar.map(s => `Level="${s.level}", Dept="${s.department}"`));
    }
}

testFrontendLogic().catch(console.error);
